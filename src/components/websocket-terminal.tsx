'use client'

import { useState, useEffect, useRef } from 'react'
import { Terminal as TerminalIcon, Play, Square, Copy, Download, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TerminalLine {
  id: string
  content: string
  timestamp: number
  type: 'input' | 'output' | 'system' | 'error'
}

interface OpenClawCommand {
  command: string
  description: string
  category: 'status' | 'config' | 'session' | 'model' | 'agent' | 'channel' | 'node' | 'memory' | 'logs' | 'cron' | 'skills' | 'device' | 'update' | 'system' | 'help'
}

export function WebsocketTerminal() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [inputCommand, setInputCommand] = useState('')
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() => {
    const initialLines: TerminalLine[] = [
      { id: '1', content: '欢迎使用 OpenClaw TUI 终端', timestamp: Date.now(), type: 'system' },
      { id: '2', content: '正在连接到 OpenClaw 服务...', timestamp: Date.now(), type: 'system' },
      { id: '3', content: '键入 "help" 查看可用命令', timestamp: Date.now(), type: 'system' }
    ];
    return initialLines;
  })
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [availableCommands, setAvailableCommands] = useState<OpenClawCommand[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 添加终端行
  const addTerminalLine = (content: string, type: 'input' | 'output' | 'system' | 'error' = 'output') => {
    setTerminalLines(prev => {
      const newLine: TerminalLine = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content,
        timestamp: Date.now(),
        type
      }
      // 限制历史记录数量
      if (prev.length > 100) {
        return [...prev.slice(-99), newLine]
      }
      return [...prev, newLine]
    })
  }

  // WebSocket 连接管理
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null
    const reconnectInterval = 5000 // 5 秒重连间隔

    const connect = async () => {
      setIsLoading(true)
      setConnectionStatus('connecting')

      // 先从 API 获取 Gateway 认证信息和设备信息
      let deviceInfo: {
        deviceId?: string
        instanceId?: string
        publicKey?: string  // 关键：公钥用于设备身份验证
        privateKey?: string  // 私钥用于挑战响应签名
        clientId?: string
        clientMode?: string
        platform?: string
        token?: string
        scopes?: string[]
      } = {}
      let gatewayPort = 18789
      let gatewayToken: string | null = null
      let gatewayTlsEnabled = false
      let gatewayAuthMode: string = 'token' // none, token, password, trusted-proxy

      try {
        const deviceResponse = await fetch('/api/gateway-device')
        if (deviceResponse.ok) {
          const deviceData = await deviceResponse.json()
          gatewayAuthMode = deviceData.gatewayAuthMode || 'token'
          gatewayToken = deviceData.gatewayToken
          gatewayPort = deviceData.gatewayPort || 18789
          gatewayTlsEnabled = deviceData.gatewayTlsEnabled || false

          if (deviceData.success && deviceData.device) {
            deviceInfo = {
              deviceId: deviceData.device.deviceId,
              instanceId: deviceData.device.instanceId,
              publicKey: deviceData.device.publicKey,  // 获取公钥
              privateKey: deviceData.device.privateKey,  // 获取私钥用于签名
              clientId: deviceData.device.clientId,
              clientMode: deviceData.device.clientMode,
              platform: deviceData.device.platform,
              token: deviceData.device.token,
              scopes: deviceData.device.scopes
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch device/config info:', e)
      }

      try {
        let wsProtocol = 'ws://';

        if (window.location.protocol === 'https:' && gatewayTlsEnabled) {
          wsProtocol = 'wss://';
        } else if (gatewayTlsEnabled && window.location.protocol === 'http:') {
          console.log('注意：页面通过 HTTP 访问，但 OpenClaw 启用了 TLS.');
          wsProtocol = 'ws://';
        } else if (!gatewayTlsEnabled) {
          wsProtocol = 'ws://';
        }

        const wsUrl = `${wsProtocol}${window.location.hostname}:${gatewayPort}`;
        console.log(`尝试连接到：${wsUrl}`);
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('Connected to OpenClaw WebSocket:', wsUrl)
          addTerminalLine(`✓ 已连接到 OpenClaw 服务 (${wsUrl})`, 'system')
        }

        const capturedDeviceInfo = deviceInfo
        const capturedGatewayToken = gatewayToken

        // 使用 deviceId 作为稳定的 instanceId
        let instanceId: string
        if (capturedDeviceInfo.deviceId) {
          instanceId = capturedDeviceInfo.deviceId
          console.log('使用已配对设备的 deviceId 作为 instanceId:', instanceId.substring(0, 12) + '...')
        } else {
          instanceId = localStorage.getItem('openclaw-instance-id') || `meetclaw-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
          localStorage.setItem('openclaw-instance-id', instanceId)
          console.log('生成新的 instanceId:', instanceId)
        }
        const capturedInstanceId = instanceId

        ws.onmessage = async (event) => {
          try {
            const message = event.data
            // 调试：打印所有原始消息
            console.log('RAW WebSocket message:', message)
            const jsonData = JSON.parse(message)
            console.log('Parsed message:', JSON.stringify(jsonData, null, 2))

            // 尝试多种可能的消息格式
            const messageType = jsonData.event || jsonData.type || jsonData.method
            
            if (messageType === "connect.challenge" || messageType === "challenge") {
              addTerminalLine('收到连接挑战，正在发送认证信息...', 'system')

              interface ConnectParams {
                minProtocol: number;
                maxProtocol: number;
                client: {
                  id: string;
                  displayName: string;
                  version: string;
                  platform: string;
                  mode: string;
                  instanceId: string;
                };
                role: string;
                scopes: string[];
                userAgent: string;
                locale: string;
                auth?: {
                  token: string;
                };
              }

              const clientId = capturedDeviceInfo.clientId || "gateway-client"
              const clientMode = capturedDeviceInfo.clientMode || "backend"
              const platform = capturedDeviceInfo.platform || "darwin"

              // 关键简化：Gateway auth mode 为 "token" 时，只需要提供 token 即可认证
              // 不需要设备签名（device signature）
              let authToken: string | undefined = undefined
              
              // 优先使用 gateway token（来自 openclaw.json），其次使用设备 token（来自 paired.json）
              authToken = capturedGatewayToken || capturedDeviceInfo.token || undefined
              
              if (authToken) {
                if (capturedGatewayToken && capturedDeviceInfo.token) {
                  addTerminalLine(`✓ 使用 Gateway token 进行认证`, 'system')
                  addTerminalLine(`✓ 设备 token 也可用`, 'system')
                } else if (capturedGatewayToken) {
                  addTerminalLine(`✓ 使用 Gateway token 进行认证`, 'system')
                } else {
                  addTerminalLine(`✓ 使用设备 token 进行认证`, 'system')
                }
              } else {
                addTerminalLine('⚠️ 未找到认证 token', 'error')
                addTerminalLine('💡 请检查 ~/.openclaw/openclaw.json 中的 gateway.auth.token', 'system')
              }

              addTerminalLine(`✓ 客户端 ID: ${clientId}`, 'system')
              addTerminalLine(`✓ 客户端模式：${clientMode}`, 'system')

              // 简化的 connect 参数 - 不需要 device 签名
              // 使用设备已批准的 scopes
              const deviceApprovedScopes = capturedDeviceInfo.scopes || ["operator.read"]
              
              const connectParams: ConnectParams = {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: clientId,
                  displayName: "MeetClaw Terminal",
                  version: "1.0.0",
                  platform: platform,
                  mode: clientMode,
                  instanceId: capturedInstanceId
                },
                role: "operator",
                scopes: deviceApprovedScopes,
                userAgent: navigator.userAgent || "MeetClaw-Terminal/1.0",
                locale: "zh-CN",
                // Token 认证模式：只需要 auth.token，不需要 device 签名
                auth: authToken ? {
                  token: authToken
                } : undefined
              }

              const connectMsg = {
                type: "req",
                id: `conn-${Date.now()}`,
                method: "connect",
                params: connectParams
              }

              // 调试：打印发送的 connect 消息
              console.log('=== 发送 connect 请求 ===')
              console.log('connectMsg:', JSON.stringify(connectMsg, null, 2))
              console.log('auth.token:', connectParams.auth?.token?.substring(0, 20) + '...')

              ws.send(JSON.stringify(connectMsg))
            } else if (jsonData.type === "res" && jsonData.id?.startsWith("conn-")) {
              if (jsonData.ok) {
                setIsConnected(true)
                setIsLoading(false)
                setConnectionStatus('connected')
                addTerminalLine('✅ 连接认证成功！', 'system')

                const grantedScopes = jsonData.payload?.grantedScopes || []
                if (grantedScopes.length > 0) {
                  addTerminalLine(`📋 授权范围：${grantedScopes.join(', ')}`, 'system')

                  const hasWritePermission = grantedScopes.includes('operator.write') || grantedScopes.includes('operator.admin');
                  const hasReadPermission = grantedScopes.includes('operator.read') || grantedScopes.includes('operator.write') || grantedScopes.includes('operator.admin');

                  if (hasReadPermission) {
                    addTerminalLine('✅ 具备读取权限', 'system');
                  } else {
                    addTerminalLine('⚠️ 缺少读取权限，部分命令可能无法执行', 'system');
                  }

                  if (hasWritePermission) {
                    addTerminalLine('✅ 具备写入权限', 'system');
                  } else {
                    addTerminalLine('⚠️ 缺少写入权限，聊天和修改操作将被拒绝', 'system');
                  }

                  localStorage.setItem('openclaw-permissions', JSON.stringify({
                    read: hasReadPermission,
                    write: hasWritePermission,
                    scopes: grantedScopes
                  }));
                }

                if (jsonData.payload?.server?.version) {
                  addTerminalLine(`🖥️ 服务器版本：${jsonData.payload.server.version}`, 'system')
                }

                if (jsonData.payload?.authToken) {
                  localStorage.setItem('openclaw-auth-token', jsonData.payload.authToken)
                }
                if (jsonData.payload?.deviceId) {
                  localStorage.setItem('openclaw-device-id', jsonData.payload.deviceId)
                }
                if (capturedInstanceId) {
                  localStorage.setItem('openclaw-instance-id', capturedInstanceId)
                }
              } else {
                addTerminalLine(`❌ 连接失败：${jsonData.error?.message || '未知错误'}`, 'error')
                setConnectionStatus('error')
                setIsLoading(false)

                if (jsonData.error?.code?.includes('DEVICE') || jsonData.error?.message?.includes('device')) {
                  addTerminalLine('💡 提示：可能需要在 OpenClaw 界面中批准此设备', 'system')
                } else if (jsonData.error?.code === "NOT_PAIRED") {
                  addTerminalLine('💡 提示：设备未配对，请在 OpenClaw 界面中确认配对', 'system')
                }

                ws.close()
                return
              }
            } else if (jsonData.type === "event") {
              if (jsonData.event === "tick") {
                // 心跳事件
              } else if (jsonData.event === "health") {
                console.log('Health event received:', jsonData)
              } else if (jsonData.event === "presence") {
                console.log('Presence event received:', jsonData)
              } else {
                addTerminalLine(`${jsonData.event}: ${JSON.stringify(jsonData.payload, null, 2)}`, 'output')
              }
            } else if (jsonData.type === "res") {
              if (jsonData.ok) {
                addTerminalLine(JSON.stringify(jsonData.payload, null, 2), 'output')
              } else {
                addTerminalLine(`❌ 错误：${jsonData.error?.message || '未知错误'}`, 'error')
              }
            } else {
              addTerminalLine(JSON.stringify(jsonData, null, 2), 'output')
            }
          } catch (e) {
            addTerminalLine(event.data, 'output')
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setIsLoading(false)
          setConnectionStatus('error')
          addTerminalLine('⚠️ WebSocket 连接发生错误', 'error')
        }

        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          setIsConnected(false)
          setIsLoading(false)
          setConnectionStatus('disconnected')

          if (event.code === 1000 || event.code === 1001) {
            addTerminalLine('连接已正常关闭', 'system')
          } else if (event.code === 1008) {
            addTerminalLine('❌ 认证失败 (1008): Policy Violation', 'error')
            addTerminalLine(`原因：${event.reason || 'device identity required'}`, 'error')
            addTerminalLine('', 'system')
            addTerminalLine('🔧 解决方案:', 'system')
            addTerminalLine('1. 打开 OpenClaw 控制面板 (http://127.0.0.1:18789)', 'system')
            addTerminalLine('2. 检查 "Pending Devices" 或 "Paired Devices"', 'system')
            addTerminalLine('3. 确保设备已批准并具有 operator.write 权限', 'system')
            addTerminalLine('', 'system')
            addTerminalLine('💡 已配对设备 ID: ' + (capturedDeviceInfo.deviceId?.substring(0, 16) + '...' || '未知'), 'system')
            addTerminalLine('💡 点击刷新按钮重新尝试连接', 'system')
          } else {
            addTerminalLine(`连接已断开 (code: ${event.code})`, 'error')
            if (event.reason) {
              addTerminalLine(`原因：${event.reason}`, 'error')
            }
            addTerminalLine('请检查 OpenClaw 服务是否正在运行', 'system')
          }
        }

        wsRef.current = ws
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error)
        setIsLoading(false)
        setConnectionStatus('error')
        addTerminalLine('❌ 无法建立 WebSocket 连接', 'error')

        if (reconnectTimeout) clearTimeout(reconnectTimeout)
        reconnectTimeout = setTimeout(connect, reconnectInterval)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount')
      }
    }
  }, [])

  // 发送命令
  const sendCommand = (command: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addTerminalLine('WebSocket 连接未就绪', 'error')
      return
    }

    const permissionsStr = localStorage.getItem('openclaw-permissions');
    let hasReadPermission = true;
    let hasWritePermission = true;

    if (permissionsStr) {
      try {
        const permissions = JSON.parse(permissionsStr);
        hasReadPermission = permissions.read || false;
        hasWritePermission = permissions.write || false;
      } catch (e) {
        console.warn('Could not parse permissions:', e);
      }
    }

    const isWriteCommand = command.includes('create') || command.includes('delete') ||
                           command.includes('update') || command.includes('set') ||
                           command.includes('modify') || command.includes('patch') ||
                           command.includes('apply') || command.includes('restart') ||
                           command.includes('approve') || command.includes('revoke') ||
                           command.includes('enable') || command.includes('disable') ||
                           command.includes('install') || command.includes('abort');

    if (isWriteCommand && !hasWritePermission) {
      addTerminalLine(`⚠️ 权限不足：当前连接不允许执行修改操作 "${command}"`, 'error');
      addTerminalLine('💡 提示：请使用具有管理员权限的账户重新配对设备', 'system');
      return;
    }

    if (!hasReadPermission && !isWriteCommand) {
      addTerminalLine(`⚠️ 权限不足：当前连接不允许执行读取操作 "${command}"`, 'error');
      addTerminalLine('💡 提示：请使用具有读取权限的账户重新配对设备', 'system');
      return;
    }

    const generateId = () => `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const parseCommandArgs = (cmd: string): { method: string; params: Record<string, unknown> } => {
      const parts = cmd.trim().split(/\s+/)
      const baseCmd = parts[0].toLowerCase()
      const args = parts.slice(1)

      switch (baseCmd) {
        // === 状态与健康检查 ===
        case 'status':
        case 'gateway':
          return { method: 'gateway.status', params: {} }

        case 'health':
          return { method: 'health', params: {} }

        case 'version':
          return { method: 'gateway.status', params: {} }

        // === 配置管理 ===
        case 'config':
          if (args[0] === 'get') {
            return {
              method: 'config.get',
              params: args[1] ? { path: args[1] } : {}
            }
          } else if (args[0] === 'set') {
            if (args.length < 3) {
              addTerminalLine('❌ 用法：config.set <path> <value>', 'error')
              return { method: '', params: {} }
            }
            let value: string | number | boolean | object = args[2]
            try {
              value = JSON.parse(args.slice(2).join(' '))
            } catch (e) {
              // 保持为字符串
            }
            return {
              method: 'config.set',
              params: { path: args[1], value }
            }
          } else if (args[0] === 'list') {
            return { method: 'config.list', params: {} }
          } else {
            return { method: 'config.get', params: {} }
          }

        // === 会话管理 ===
        case 'sessions':
          if (args[0] === 'list') {
            return { method: 'sessions.list', params: {} }
          } else if (args[0] === 'get') {
            return {
              method: 'sessions.get',
              params: args[1] ? { sessionId: args[1] } : {}
            }
          } else {
            return { method: 'sessions.list', params: {} }
          }

        // === 通道管理 ===
        case 'channels':
          if (args[0] === 'status') {
            return { method: 'channels.status', params: {} }
          } else if (args[0] === 'list') {
            return { method: 'channels.list', params: {} }
          } else if (args[0] === 'get') {
            return {
              method: 'channels.get',
              params: args[1] ? { channelId: args[1] } : {}
            }
          } else {
            return { method: 'channels.status', params: {} }
          }

        // === 内存管理 ===
        case 'memory':
          if (args[0] === 'status') {
            return { method: 'memory.status', params: {} }
          } else if (args[0] === 'get') {
            return {
              method: 'memory.get',
              params: args[1] ? { key: args[1] } : {}
            }
          } else if (args[0] === 'set') {
            if (args.length < 3) {
              addTerminalLine('❌ 用法：memory.set <key> <value>', 'error')
              return { method: '', params: {} }
            }
            return {
              method: 'memory.set',
              params: { key: args[1], value: args.slice(2).join(' ') }
            }
          } else if (args[0] === 'delete') {
            return {
              method: 'memory.delete',
              params: args[1] ? { key: args[1] } : {}
            }
          } else {
            return { method: 'memory.status', params: {} }
          }

        // === 日志管理 ===
        case 'logs':
          if (args[0] === 'get') {
            return {
              method: 'logs.get',
              params: {
                limit: args[1] ? parseInt(args[1]) : 50,
                level: args.find(a => a.startsWith('level='))?.split('=')[1] as string || undefined
              }
            }
          } else {
            return {
              method: 'logs.get',
              params: { limit: 50 }
            }
          }

        // === 聊天 ===
        case 'chat':
          if (args[0] === 'send') {
            return {
              method: 'chat.send',
              params: {
                channelId: args[1] || 'default',
                text: args.slice(2).join(' ')
              }
            }
          } else {
            return {
              method: 'chat.send',
              params: {
                channelId: 'default',
                text: args.join(' ')
              }
            }
          }

        // === 定时任务 ===
        case 'cron':
          if (args[0] === 'list') {
            return { method: 'cron.list', params: {} }
          } else if (args[0] === 'get') {
            return {
              method: 'cron.get',
              params: args[1] ? { cronId: args[1] } : {}
            }
          } else {
            return { method: 'cron.list', params: {} }
          }

        // === 技能管理 ===
        case 'skills':
          if (args[0] === 'list') {
            return { method: 'skills.list', params: {} }
          } else if (args[0] === 'get') {
            return {
              method: 'skills.get',
              params: args[1] ? { skillId: args[1] } : {}
            }
          } else {
            return { method: 'skills.list', params: {} }
          }

        // === 设备管理 ===
        case 'devices':
          if (args[0] === 'list') {
            return { method: 'devices.list', params: {} }
          } else if (args[0] === 'get') {
            return {
              method: 'devices.get',
              params: args[1] ? { deviceId: args[1] } : {}
            }
          } else if (args[0] === 'approve') {
            return {
              method: 'devices.approve',
              params: args[1] ? { requestId: args[1] } : {}
            }
          } else if (args[0] === 'revoke') {
            return {
              method: 'devices.revoke',
              params: args[1] ? { deviceId: args[1] } : {}
            }
          } else {
            return { method: 'devices.list', params: {} }
          }

        // === 执行命令 ===
        case 'exec':
          return {
            method: 'exec',
            params: {
              command: args.join(' ')
            }
          }

        // === 更新管理 ===
        case 'update':
          if (args[0] === 'check') {
            return { method: 'update.check', params: {} }
          } else if (args[0] === 'apply') {
            return { method: 'update.apply', params: {} }
          } else {
            return { method: 'update.check', params: {} }
          }

        // === 帮助 ===
        case 'help':
          const helpText = `
OpenClaw Gateway WebSocket API 帮助

可用命令:
  status / gateway     - 查看网关状态
  health              - 健康检查
  version             - 查看版本

  config get [path]   - 获取配置
  config set <path> <value> - 设置配置
  config list         - 列出配置

  sessions list       - 列出会话
  sessions get <id>   - 获取会话详情

  channels status     - 查看通道状态
  channels list       - 列出通道
  channels get <id>   - 获取通道详情

  memory status       - 查看内存状态
  memory get <key>    - 获取内存值
  memory set <key> <value> - 设置内存值
  memory delete <key> - 删除内存值

  logs get [limit]    - 获取日志

  chat send <channel> <text> - 发送消息

  cron list           - 列出定时任务
  cron get <id>       - 获取定时任务详情

  skills list         - 列出技能
  skills get <id>     - 获取技能详情

  devices list        - 列出设备
  devices get <id>    - 获取设备详情
  devices approve <id> - 批准设备
  devices revoke <id>  - 撤销设备

  exec <command>      - 执行命令

  update check        - 检查更新
  update apply        - 应用更新

  help                - 显示此帮助信息
`.trim()
          addTerminalLine(helpText, 'output')
          return { method: '', params: {} }

        // === 默认 ===
        default:
          addTerminalLine(`❌ 未知命令：${baseCmd}`, 'error')
          addTerminalLine('输入 "help" 查看可用命令', 'system')
          return { method: '', params: {} }
      }
    }

    const { method, params } = parseCommandArgs(command)

    if (!method) {
      return
    }

    const commandId = generateId()
    const commandMessage = {
      type: "req",
      id: commandId,
      method: method,
      params: params
    }

    addTerminalLine(`$ ${command}`, 'input')
    console.log('Sending command:', commandMessage)
    wsRef.current.send(JSON.stringify(commandMessage))
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputCommand.trim()) {
      executeCommand(inputCommand.trim())
      setInputCommand('')
    }
  }

  const executeCommand = (cmd: string) => {
    sendCommand(cmd)
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }, 100)
  }

  const clearTerminal = () => {
    setTerminalLines([])
  }

  const copyTerminalContent = () => {
    const content = terminalLines.map(line => line.content).join('\n')
    navigator.clipboard.writeText(content)
    addTerminalLine('✅ 终端内容已复制到剪贴板', 'system')
  }

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User requested reconnect')
    }
    setTerminalLines([])
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const clearCacheAndReconnect = () => {
    localStorage.removeItem('openclaw-auth-token')
    localStorage.removeItem('openclaw-device-id')
    localStorage.removeItem('openclaw-instance-id')
    localStorage.removeItem('openclaw-permissions')
    reconnect()
  }

  const presetCommands = [
    { command: 'status', description: '网关状态', category: 'status' },
    { command: 'health', description: '健康检查', category: 'status' },
    { command: 'version', description: '版本信息', category: 'status' },
    { command: 'config list', description: '配置列表', category: 'config' },
    { command: 'channels status', description: '通道状态', category: 'channel' },
    { command: 'channels list', description: '通道列表', category: 'channel' },
    { command: 'sessions list', description: '会话列表', category: 'session' },
    { command: 'memory status', description: '内存状态', category: 'memory' },
    { command: 'logs get 50', description: '最近日志', category: 'logs' },
    { command: 'devices list', description: '设备列表', category: 'device' },
    { command: 'skills list', description: '技能列表', category: 'skills' },
    { command: 'cron list', description: '定时任务', category: 'cron' },
    { command: 'help', description: '帮助信息', category: 'help' },
  ]

  const groupedCommands = presetCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, typeof presetCommands>)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLines])

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence>
        {isMinimized ? (
          <motion.div
            className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-800/90 transition-colors"
            onClick={() => setIsMinimized(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TerminalIcon className="w-6 h-6 text-cyan-400" />
          </motion.div>
        ) : (
          <motion.div
            className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl"
            style={{ width: '800px', maxHeight: '600px' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-gray-200">OpenClaw Terminal</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  isConnected ? 'bg-green-900/50 text-green-400' :
                  connectionStatus === 'connecting' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {connectionStatus === 'connected' ? '已连接' :
                   connectionStatus === 'connecting' ? '连接中...' :
                   connectionStatus === 'error' ? '错误' : '未连接'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={reconnect}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                  title="重新连接"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
                </button>
                <button
                  onClick={clearCacheAndReconnect}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                  title="清除缓存并重新连接"
                >
                  <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                  title="最小化"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 终端内容区 */}
            <div
              ref={terminalRef}
              className="p-4 font-mono text-sm text-gray-100 overflow-y-auto"
              style={{ height: '400px' }}
            >
              {terminalLines.map((line) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`mb-1 whitespace-pre-wrap ${
                    line.type === 'input' ? 'text-cyan-400' :
                    line.type === 'system' ? 'text-yellow-400' :
                    line.type === 'error' ? 'text-red-400' :
                    'text-gray-300'
                  }`}
                >
                  {line.type === 'input' && <span className="text-green-400 mr-2">$</span>}
                  {line.content}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-yellow-400"
                >
                  正在连接...
                </motion.div>
              )}
            </div>

            {/* 命令输入区 */}
            <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50">
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-mono">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isConnected ? "输入命令..." : "等待连接..."}
                  disabled={!isConnected}
                  className="flex-1 bg-transparent border-none outline-none text-gray-100 font-mono text-sm"
                />
              </div>
            </div>

            {/* 预设命令区 */}
            <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/30 rounded-b-lg">
              <div className="flex flex-wrap gap-2">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="flex flex-wrap gap-1 items-center">
                    <span className="text-xs text-gray-500 uppercase">{category}:</span>
                    {cmds.map((cmd, index) => (
                      <motion.button
                        key={index}
                        onClick={() => executeCommand(cmd.command)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                        title={cmd.description}
                      >
                        {cmd.command}
                      </motion.button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
