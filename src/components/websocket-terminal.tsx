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
  category: 'status' | 'agent' | 'channel' | 'gateway' | 'memory' | 'system' | 'help'
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
        id: Date.now().toString(),
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
    const reconnectInterval = 5000 // 5秒重连间隔

    const connect = async () => {
      setIsLoading(true)
      setConnectionStatus('connecting')

      // 先从 API 获取 Gateway 认证信息和设备信息
      let deviceInfo: {
        deviceId?: string
        clientId?: string
        clientMode?: string
        platform?: string
        token?: string
        scopes?: string[]
      } = {}
      let gatewayPort = 18789
      let gatewayToken: string | null = null
      
      try {
        // 获取 Gateway 配置（包含 gateway.auth.token）
        const deviceResponse = await fetch('/api/gateway-device')
        if (deviceResponse.ok) {
          const deviceData = await deviceResponse.json()
          
          // Gateway token 用于 WebSocket 认证
          gatewayToken = deviceData.gatewayToken
          gatewayPort = deviceData.gatewayPort || 18789
          
          if (deviceData.success && deviceData.device) {
            deviceInfo = {
              deviceId: deviceData.device.deviceId,
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
        // 使用 localhost 而不是 127.0.0.1，因为 Control UI 需要 secure context
        // localhost 被浏览器视为安全上下文，而 127.0.0.1 不是
        const wsUrl = `ws://localhost:${gatewayPort}`
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('Connected to OpenClaw WebSocket:', wsUrl)
          addTerminalLine(`✓ 已连接到 OpenClaw 服务 (${wsUrl})`, 'system')
        }

        // 保存设备信息和 Gateway token 供 onmessage 使用
        const capturedDeviceInfo = deviceInfo
        const capturedGatewayToken = gatewayToken

        ws.onmessage = (event) => {
          try {
            const message = event.data
            // 尝试解析为 JSON 响应
            const jsonData = JSON.parse(message)

            // 根据OpenClaw协议处理不同类型的消息
            if (jsonData.event === "connect.challenge") {
              // 收到挑战后立即发送连接请求
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
                device?: {
                  id: string;
                };
                auth?: {
                  token: string;
                };
              }

              // 使用 Gateway token 进行认证（来自 gateway.auth.token）
              // 这是 WebSocket 连接所需的认证，与设备配对 token 不同
              const authToken = capturedGatewayToken || capturedDeviceInfo.token || ''

              // 使用已配对设备的信息，如果没有则使用默认配置
              const clientId = capturedDeviceInfo.clientId || "gateway-client"  // 根据OpenClaw协议要求使用"gateway-client"
              const clientMode = capturedDeviceInfo.clientMode || "cli"         // 根据OpenClaw协议要求使用"cli"
              const platform = capturedDeviceInfo.platform || "darwin"          // 使用实际平台标识

              // 获取设备ID，优先使用已配对的设备ID，否则从本地存储获取
              let deviceId: string | null = capturedDeviceInfo.deviceId || null
              if (!deviceId) {
                deviceId = localStorage.getItem('openclaw-device-id') || null
              }

              // 如果没有 Gateway token，提示用户
              if (!authToken) {
                addTerminalLine('⚠️ 未找到 Gateway 认证 token', 'system')
                addTerminalLine('💡 请检查 ~/.openclaw/openclaw.json 中的 gateway.auth.token', 'system')
                addTerminalLine('💡 或运行 openclaw dashboard 获取带 token 的链接', 'system')
              } else {
                addTerminalLine(`✓ 使用 Gateway token 进行认证`, 'system')
              }

              // 获取或创建稳定的 instanceId（保存在 localStorage）
              let instanceId = localStorage.getItem('openclaw-instance-id')
              if (!instanceId) {
                instanceId = `meetclaw-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
                localStorage.setItem('openclaw-instance-id', instanceId)
              }

              // 尝试使用最广泛的权限请求
              const connectParams: ConnectParams = {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: clientId,
                  displayName: "MeetClaw Terminal",
                  version: "1.0.0",
                  platform: platform,
                  mode: clientMode,
                  instanceId: instanceId
                },
                role: "operator", // operator 角色
                scopes: [
                  "operator.read",   // 读取权限
                  "operator.write",  // 写入权限
                  "operator.admin"   // 管理权限 (需要这个才能访问 channels)
                ],
                userAgent: navigator.userAgent || "MeetClaw-Terminal/1.0",
                locale: "zh-CN",
                device: deviceId ? {
                  id: deviceId
                } : undefined,
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

              ws.send(JSON.stringify(connectMsg))
            } else if (jsonData.type === "res" && jsonData.id?.startsWith("conn-")) {
              // 处理连接响应
              if (jsonData.ok) {
                setIsConnected(true)
                setIsLoading(false)
                setConnectionStatus('connected')
                addTerminalLine('✅ 连接认证成功！', 'system')

                // 显示连接响应中的权限信息
                const grantedScopes = jsonData.payload?.grantedScopes || []
                if (grantedScopes.length > 0) {
                  addTerminalLine(`📋 授权范围: ${grantedScopes.join(', ')}`, 'system')

                  // 检查是否有足够的权限执行命令
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
                    addTerminalLine('⚠️ 缺少写入权限，执行修改操作的命令将被拒绝', 'system');
                  }

                  // 存储权限信息供后续命令使用
                  localStorage.setItem('openclaw-permissions', JSON.stringify({
                    read: hasReadPermission,
                    write: hasWritePermission,
                    scopes: grantedScopes
                  }));
                }
                
                // 显示服务器信息
                if (jsonData.payload?.server?.version) {
                  addTerminalLine(`🖥️ 服务器版本: ${jsonData.payload.server.version}`, 'system')
                }

                // 如果响应中包含认证token，保存到localStorage
                if (jsonData.payload?.authToken) {
                  localStorage.setItem('openclaw-auth-token', jsonData.payload.authToken)
                }
                // 如果响应中包含设备ID，保存到localStorage
                if (jsonData.payload?.deviceId) {
                  localStorage.setItem('openclaw-device-id', jsonData.payload.deviceId)
                }
              } else {
                addTerminalLine(`❌ 连接失败: ${jsonData.error?.message || '未知错误'}`, 'error')
                setConnectionStatus('error')

                // 如果是设备认证错误，提示用户
                if (jsonData.error?.code?.includes('DEVICE') || jsonData.error?.message?.includes('device')) {
                  addTerminalLine('💡 提示: 可能需要在OpenClaw界面中批准此设备', 'system')
                } else if (jsonData.error?.code === "NOT_PAIRED") {
                  addTerminalLine('💡 提示: 设备未配对，请在OpenClaw界面中确认配对', 'system')
                }

                // 关闭WebSocket连接，避免无效重连
                ws.close()
                return
              }
            } else if (jsonData.type === "event") {
              // 处理事件消息，过滤掉高频事件
              if (jsonData.event === "tick") {
                // 心跳事件，只更新时间戳，不在终端显示
                // console.log('Tick event received')
              } else if (jsonData.event === "health") {
                // 高频健康检查事件，只记录在控制台，不在终端显示
                console.log('Health event received:', jsonData)
              } else if (jsonData.event === "presence") {
                // 高频在线状态事件，只记录在控制台，不在终端显示
                console.log('Presence event received:', jsonData)
              } else {
                // 显示其他类型的事件
                addTerminalLine(`${jsonData.event}: ${JSON.stringify(jsonData.payload, null, 2)}`, 'output')
              }
            } else if (jsonData.type === "res") {
              // 处理命令响应
              if (jsonData.ok) {
                addTerminalLine(JSON.stringify(jsonData.payload, null, 2), 'output')
              } else {
                addTerminalLine(`❌ 错误: ${jsonData.error?.message || '未知错误'}`, 'error')
              }
            } else {
              // 显示其他消息
              addTerminalLine(JSON.stringify(jsonData, null, 2), 'output')
            }
          } catch (e) {
            // 如果不是 JSON，直接显示文本
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
          console.log('Disconnected from OpenClaw WebSocket:', event.code, event.reason)
          setIsConnected(false)
          setIsLoading(false)

          // 根据关闭代码决定是否重连
          // 1000 表示正常关闭，1001 表示终端离开页面
          // 1008 表示 Policy Violation (设备身份验证失败)
          if (event.code === 1000 || event.code === 1001) {
            setConnectionStatus('disconnected')
            addTerminalLine('连接已正常关闭', 'system')
          } else if (event.code === 1008) {
            // Policy Violation - 设备身份验证失败
            setConnectionStatus('error')
            addTerminalLine('❌ 认证失败 (1008): Policy Violation', 'error')
            addTerminalLine(`原因: ${event.reason || 'device identity required'}`, 'error')
            addTerminalLine('', 'system')
            addTerminalLine('🔧 解决方案:', 'system')
            addTerminalLine('1. 打开 OpenClaw Web 控制面板 (http://127.0.0.1:18789)', 'system')
            addTerminalLine('2. 在设备列表中找到待批准的设备', 'system')
            addTerminalLine('3. 点击 "Approve" 批准此设备', 'system')
            addTerminalLine('4. 或检查 ~/.openclaw/devices/paired.json 是否有正确的设备信息', 'system')
            addTerminalLine('', 'system')
            addTerminalLine('💡 正在清除本地缓存并尝试重新配对...', 'system')
            
            // 清除本地缓存（包括 instanceId，以便生成新的设备身份）
            localStorage.removeItem('openclaw-auth-token')
            localStorage.removeItem('openclaw-device-id')
            localStorage.removeItem('openclaw-instance-id')
            
            // 等待更长时间后重连，给用户时间去批准设备
            if (reconnectTimeout) clearTimeout(reconnectTimeout)
            reconnectTimeout = setTimeout(connect, 10000) // 10秒后重连
          } else {
            // 其他非正常关闭，尝试重连
            setConnectionStatus('connecting')
            addTerminalLine(`连接已断开 (code: ${event.code})，${reconnectInterval/1000}秒后尝试重连...`, 'error')

            if (reconnectTimeout) clearTimeout(reconnectTimeout)
            reconnectTimeout = setTimeout(connect, reconnectInterval)
          }
        }

        wsRef.current = ws
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error)
        setIsLoading(false)
        setConnectionStatus('error')
        addTerminalLine('❌ 无法建立WebSocket连接', 'error')

        // 尝试重连
        if (reconnectTimeout) clearTimeout(reconnectTimeout)
        reconnectTimeout = setTimeout(connect, reconnectInterval)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) {
        // 正常关闭连接，避免不必要的重连
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

    // 检查权限
    const permissionsStr = localStorage.getItem('openclaw-permissions');
    let hasReadPermission = true; // 默认允许，如果无法确定权限
    let hasWritePermission = true; // 默认允许，如果无法确定权限

    if (permissionsStr) {
      try {
        const permissions = JSON.parse(permissionsStr);
        hasReadPermission = permissions.read || false;
        hasWritePermission = permissions.write || false;
      } catch (e) {
        console.warn('Could not parse permissions:', e);
      }
    }

    // 根据命令类型检查所需权限
    const isWriteCommand = command.includes('create') || command.includes('delete') || command.includes('update') || command.includes('set') || command.includes('modify');

    if (isWriteCommand && !hasWritePermission) {
      addTerminalLine(`⚠️ 权限不足: 当前连接不允许执行修改操作 "${command}"`, 'error');
      addTerminalLine('💡 提示: 请使用具有管理员权限的账户重新配对设备', 'system');
      return;
    }

    if (!hasReadPermission && !isWriteCommand) {
      addTerminalLine(`⚠️ 权限不足: 当前连接不允许执行读取操作 "${command}"`, 'error');
      addTerminalLine('💡 提示: 请使用具有读取权限的账户重新配对设备', 'system');
      return;
    }

    // 生成唯一的命令ID
    const generateId = () => `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 根据OpenClaw协议构造命令
    let commandMsg;

    // 对不同类型的命令使用适当的格式
    if (command === 'status' || command === 'version' || command === 'help') {
      commandMsg = {
        type: "req",
        method: "gateway.status",
        id: generateId(),
        params: {}
      }
    } else if (command === 'agents' || command.startsWith('agents')) {
      commandMsg = {
        type: "req",
        method: "agents.list",
        id: generateId(),
        params: {}
      }
    } else if (command === 'channels' || command.startsWith('channels')) {
      // channels 命令需要 admin 权限
      commandMsg = {
        type: "req",
        method: "channels.status",
        id: generateId(),
        params: {}
      }
    } else if (command === 'gateway' || command.startsWith('gateway')) {
      commandMsg = {
        type: "req",
        method: "gateway.status",
        id: generateId(),
        params: {}
      }
    } else if (command.startsWith('memory')) {
      commandMsg = {
        type: "req",
        method: "memory.stats",
        id: generateId(),
        params: {}
      }
    } else if (command === 'logs') {
      commandMsg = {
        type: "req",
        method: "logs.query",
        id: generateId(),
        params: { limit: 20 }
      }
    } else {
      // 对于其他命令，尝试作为会话消息发送到 Agent
      commandMsg = {
        type: "req",
        method: "sessions.send",
        id: generateId(),
        params: {
          sessionId: "agent:main:main",  // 默认 Agent 会话
          content: command
        }
      }
    }

    addTerminalLine(`$ ${command}`, 'input')
    wsRef.current.send(JSON.stringify(commandMsg))
  }

  // 处理回车发送命令
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (inputCommand.trim()) {
        sendCommand(inputCommand.trim())
        setInputCommand('')
      }
    } else if (e.key === 'ArrowUp') {
      // TODO: 实现命令历史记录
    }
  }

  // 执行预设命令
  const executeCommand = (cmd: string) => {
    if (connectionStatus !== 'connected') {
      addTerminalLine('WebSocket 连接未就绪', 'error')
      return
    }

    // 检查权限
    const permissionsStr = localStorage.getItem('openclaw-permissions');
    let hasReadPermission = true; // 默认允许，如果无法确定权限
    let hasWritePermission = true; // 默认允许，如果无法确定权限

    if (permissionsStr) {
      try {
        const permissions = JSON.parse(permissionsStr);
        hasReadPermission = permissions.read || false;
        hasWritePermission = permissions.write || false;
      } catch (e) {
        console.warn('Could not parse permissions:', e);
      }
    }

    // 根据命令类型检查所需权限
    const isWriteCommand = cmd.includes('create') || cmd.includes('delete') || cmd.includes('update') || cmd.includes('set') || cmd.includes('modify');

    if (isWriteCommand && !hasWritePermission) {
      addTerminalLine(`⚠️ 权限不足: 当前连接不允许执行修改操作 "${cmd}"`, 'error');
      addTerminalLine('💡 提示: 请使用具有管理员权限的账户重新配对设备', 'system');
      return;
    }

    if (!hasReadPermission && !isWriteCommand) {
      addTerminalLine(`⚠️ 权限不足: 当前连接不允许执行读取操作 "${cmd}"`, 'error');
      addTerminalLine('💡 提示: 请使用具有读取权限的账户重新配对设备', 'system');
      return;
    }

    setInputCommand(cmd)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
      sendCommand(cmd)
    }, 100)
  }

  // 清空终端
  const clearTerminal = () => {
    setTerminalLines([
      { id: '1', content: '终端已清空', timestamp: Date.now(), type: 'system' },
      { id: '2', content: '欢迎使用 OpenClaw TUI 终端', timestamp: Date.now(), type: 'system' },
      { id: '3', content: '键入 "help" 查看可用命令', timestamp: Date.now(), type: 'system' }
    ])
  }

  // 复制终端内容
  const copyTerminalContent = () => {
    const content = terminalLines.map(line => line.content).join('\n')
    navigator.clipboard.writeText(content)
    addTerminalLine('终端内容已复制到剪贴板', 'system')
  }

  // 重新连接
  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  // 清除缓存并重新连接
  const clearCacheAndReconnect = () => {
    // 清除保存的认证信息
    localStorage.removeItem('openclaw-auth-token')
    localStorage.removeItem('openclaw-device-id')
    addTerminalLine('🗑️ 已清除本地缓存', 'system')
    addTerminalLine('🔄 正在重新连接...', 'system')
    
    // 关闭当前连接，触发重连
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  // 预设命令
  const presetCommands: OpenClawCommand[] = [
    { command: 'status', description: '查看服务整体状态', category: 'status' },
    { command: 'agents', description: '查看所有活跃的 Agents', category: 'agent' },
    { command: 'channels', description: '查看所有通信通道', category: 'channel' },
    { command: 'gateway status', description: '查看网关服务状态', category: 'gateway' },
    { command: 'memory stats', description: '查看记忆系统统计', category: 'memory' },
    { command: 'version', description: '查看 OpenClaw 版本', category: 'system' },
    { command: 'logs', description: '查看最新日志', category: 'system' },
    { command: 'help', description: '显示所有可用命令', category: 'help' },
  ]

  // 按类别分组命令
  const groupedCommands = presetCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, OpenClawCommand[]>)

  // 自动滚动到底部
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLines])

  // 连接状态颜色
  const statusColors = {
    disconnected: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' },
    connecting: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    connected: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
    error: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' }
  }

  const status = statusColors[connectionStatus]

  return (
    <motion.div
      className={`rounded-xl overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50' : 'w-full max-w-4xl mx-auto'
      }`}
      style={{
        background: 'rgba(15, 15, 25, 0.95)',
        border: `1px solid ${status.border.replace('border-', '')}`,
        boxShadow: `0 0 60px ${status.bg.replace('bg-', '').replace('/20', '')}30, inset 0 1px 0 rgba(255,255,255,0.05)`
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 终端标题栏 */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-move"
        style={{
          background: `${status.bg}`,
          borderBottom: `1px solid ${status.border}`
        }}
      >
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-4 h-4" style={{ color: status.text }} />
          <span className="font-medium" style={{ color: status.text }}>OpenClaw TUI 终端</span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'animate-pulse' : ''
              }`}
              style={{ background: status.text.replace('text-', '') }}
            />
            <span className="text-xs capitalize" style={{ color: status.text }}>
              {connectionStatus === 'connected' ? '已连接' :
               connectionStatus === 'connecting' ? '连接中' :
               connectionStatus === 'error' ? '错误' : '未连接'}
            </span>
            {isLoading && (
              <RefreshCw className="w-3 h-3 animate-spin" style={{ color: status.text }} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reconnect}
            disabled={connectionStatus === 'connecting' || isLoading}
            className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
            title="重新连接"
          >
            <RefreshCw className={`w-4 h-4 ${connectionStatus === 'connecting' || isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={clearCacheAndReconnect}
            disabled={connectionStatus === 'connecting' || isLoading}
            className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
            title="清除缓存并重新连接"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={isMinimized ? '展开' : '最小化'}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: isMinimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16L2 16L2 20L6 20L6 16ZM18 8L22 8L22 4L18 4L18 8ZM18 20L22 20L22 16L18 16L18 20ZM6 4L2 4L2 8L6 8L6 4Z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8L4 4L8 4M4 16L4 20L8 20M20 8L20 4L16 4M20 16L20 20L16 20" />
              )}
            </svg>
          </button>

          <button
            onClick={clearTerminal}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="清空终端"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 最小化后的占位符 */}
      <AnimatePresence>
        {isMinimized ? (
          <motion.div
            className="p-4 text-center text-gray-500 cursor-pointer"
            onClick={() => setIsMinimized(false)}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            终端已最小化，点击展开...
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* 终端内容区域 */}
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
              style={{ maxHeight: '300px', minHeight: '200px' }}
            >
              {terminalLines.map((line) => (
                <motion.div
                  key={line.id}
                  className="mb-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <span className={
                    line.type === 'input' ? 'text-green-400' :
                    line.type === 'error' ? 'text-red-400' :
                    line.type === 'system' ? 'text-blue-400' :
                    'text-gray-300'
                  }>
                    {line.content}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* 预设命令区域 - 按类别组织 */}
            <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-xs text-gray-400 mb-2">快速命令:</div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="mr-4">
                    <div className="text-xs text-gray-500 mb-1 capitalize">{category}:</div>
                    <div className="flex flex-wrap gap-1">
                      {cmds.map((cmd, index) => (
                        <motion.button
                          key={index}
                          className="px-2 py-1 rounded text-xs flex items-center gap-1"
                          style={{
                            background: connectionStatus === 'connected' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${connectionStatus === 'connected' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                            color: connectionStatus === 'connected' ? '#00F0FF' : '#00F0FF80',
                            cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed'
                          }}
                          whileHover={connectionStatus === 'connected' ? {
                            background: 'rgba(0, 240, 255, 0.1)',
                            borderColor: 'rgba(0, 240, 255, 0.3)'
                          } : {}}
                          whileTap={connectionStatus === 'connected' ? { scale: 0.95 } : {}}
                          onClick={() => {
                            if (connectionStatus === 'connected') {
                              executeCommand(cmd.command)
                            }
                          }}
                          title={connectionStatus === 'connected' ? cmd.description : '等待连接...'}
                          disabled={connectionStatus !== 'connected'}
                        >
                          <Play className="w-2.5 h-2.5" />
                          {cmd.command}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 输入区域 */}
            <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputCommand}
                    onChange={(e) => setInputCommand(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入命令 (e.g. status, agents, help)..."
                    className="w-full pl-8 pr-4 py-2 bg-transparent border-none outline-none text-green-400 font-mono"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px'
                    }}
                    disabled={connectionStatus !== 'connected'}
                  />
                </div>
                <button
                  onClick={() => {
                    if (inputCommand.trim()) {
                      sendCommand(inputCommand.trim())
                      setInputCommand('')
                    }
                  }}
                  disabled={!inputCommand.trim() || connectionStatus !== 'connected'}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: connectionStatus === 'connected' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.1)',
                    border: connectionStatus === 'connected' ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                    color: connectionStatus === 'connected' ? '#00F0FF' : 'rgba(255,255,255,0.5)'
                  }}
                  title="发送命令"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={copyTerminalContent}
                  className="px-3 py-2 rounded-lg flex items-center gap-1.5"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#00F0FF'
                  }}
                  title="复制内容"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}