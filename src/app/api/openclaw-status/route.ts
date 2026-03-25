import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const execAsync = promisify(exec)

interface SecurityAuditItem {
  level: 'critical' | 'warn' | 'info'
  title: string
  description: string
  fix: string
}

interface OpenClawStatus {
  version: string
  latestVersion: string | null
  gateway: {
    mode: string
    address: string
    bindMode: string
    port: number
    reachable: boolean
    connectLatencyMs: number
  }
  service: {
    status: string
    pid: number | null
    label: string
  }
  securityAudit: {
    critical: number
    warn: number
    info: number
    details: SecurityAuditItem[]
  }
  channels: {
    name: string
    enabled: boolean
    status: string
  }[]
  sessions: {
    active: number
    contextTokens: number
    recent: {
      agentId: string
      model: string
      age: number
      contextTokens: number
    } | null
  }
  agents: {
    defaultId: string
    count: number
    totalSessions: number
  }
  dashboard: string
  health: 'healthy' | 'warning' | 'error' | 'unknown'
  rpc: {
    ok: boolean
    url: string
  }
  os: {
    platform: string
    label: string
  }
}

// 从 openclaw.json 读取配置
function readOpenClawConfig() {
  const configPath = join(homedir(), '.openclaw', 'openclaw.json')
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }
  return null
}

// 解析 openclaw status --all --deep --json 输出
function parseStatusJson(json: Record<string, unknown>): Partial<OpenClawStatus> {
  const result: Partial<OpenClawStatus> = {
    channels: [],
    securityAudit: { critical: 0, warn: 0, info: 0, details: [] },
    sessions: { active: 0, contextTokens: 0, recent: null },
    agents: { defaultId: 'main', count: 0, totalSessions: 0 },
    health: 'unknown'
  }

  // 版本
  if (json.runtimeVersion) {
    result.version = json.runtimeVersion as string
  }

  // Gateway 信息
  if (json.gateway && typeof json.gateway === 'object') {
    const gw = json.gateway as Record<string, unknown>
    result.gateway = {
      mode: (gw.mode as string) || 'local',
      address: (gw.url as string) || '',
      bindMode: (gw.mode as string) || 'local',
      port: 18789,
      reachable: (gw.reachable as boolean) ?? false,
      connectLatencyMs: (gw.connectLatencyMs as number) || 0
    }

    // RPC 信息
    result.rpc = {
      ok: (gw.reachable as boolean) ?? false,
      url: (gw.url as string) || ''
    }

    // 从 self 获取更多信息
    if (gw.self && typeof gw.self === 'object') {
      const self = gw.self as Record<string, unknown>
      result.os = {
        platform: (self.platform as string) || 'unknown',
        label: (self.platform as string) || 'unknown'
      }
    }
  }

  // Gateway Service 状态
  if (json.gatewayService && typeof json.gatewayService === 'object') {
    const gs = json.gatewayService as Record<string, unknown>
    const runtimeShort = (gs.runtimeShort as string) || ''
    const isRunning = runtimeShort.includes('running')
    const pidMatch = runtimeShort.match(/pid (\d+)/)
    
    result.service = {
      status: isRunning ? 'running' : 'stopped',
      pid: pidMatch ? parseInt(pidMatch[1]) : null,
      label: (gs.label as string) || 'unknown'
    }
  }

  // Sessions 信息
  if (json.sessions && typeof json.sessions === 'object') {
    const sessions = json.sessions as Record<string, unknown>
    const defaults = sessions.defaults as Record<string, unknown> || {}
    
    result.sessions = {
      active: (sessions.count as number) || 0,
      contextTokens: (defaults.contextTokens as number) || 0,
      recent: null
    }

    // 获取最近的会话
    if (sessions.recent && Array.isArray(sessions.recent) && sessions.recent.length > 0) {
      const recent = sessions.recent[0] as Record<string, unknown>
      result.sessions.recent = {
        agentId: (recent.agentId as string) || 'main',
        model: (recent.model as string) || 'unknown',
        age: (recent.age as number) || 0,
        contextTokens: (recent.contextTokens as number) || 0
      }
    }
  }

  // Agents 信息
  if (json.agents && typeof json.agents === 'object') {
    const agents = json.agents as Record<string, unknown>
    const agentList = (agents.agents as Array<Record<string, unknown>>) || []
    
    result.agents = {
      defaultId: (agents.defaultId as string) || 'main',
      count: agentList.length,
      totalSessions: (agents.totalSessions as number) || 0
    }
  }

  // Channel Summary
  if (json.channelSummary && Array.isArray(json.channelSummary)) {
    const channelLines = json.channelSummary as string[]
    let currentChannel = ''
    
    channelLines.forEach(line => {
      const channelMatch = line.match(/^(\w+): configured/)
      if (channelMatch) {
        currentChannel = channelMatch[1]
        result.channels!.push({
          name: currentChannel,
          enabled: true,
          status: 'configured'
        })
      }
    })
  }

  // Health 状态 - 优先使用 health.ok 字段
  if (json.health && typeof json.health === 'object') {
    const health = json.health as Record<string, unknown>
    if (health.ok === true) {
      result.health = 'healthy'
    } else {
      result.health = 'error'
    }
  }

  // Security Audit
  if (json.securityAudit && typeof json.securityAudit === 'object') {
    const audit = json.securityAudit as Record<string, unknown>
    if (audit.summary && typeof audit.summary === 'object') {
      const summary = audit.summary as Record<string, unknown>
      result.securityAudit = {
        critical: (summary.critical as number) || 0,
        warn: (summary.warn as number) || 0,
        info: (summary.info as number) || 0,
        details: []
      }
    }

    // 解析详细信息 - 使用 findings 字段
    if (audit.findings && Array.isArray(audit.findings)) {
      const findings = audit.findings as Array<Record<string, unknown>>
      result.securityAudit!.details = findings.map(finding => ({
        level: (finding.severity as 'critical' | 'warn' | 'info') || 'info',
        title: (finding.title as string) || '',
        description: (finding.detail as string) || '',
        fix: (finding.remediation as string) || ''
      }))
    }
  }

  // 如果没有 health 字段，根据 gateway 状态设置健康状态
  if (result.health === 'unknown') {
    if (result.gateway?.reachable) {
      result.health = 'healthy'
    } else {
      result.health = 'error'
    }
  }

  return result
}

export async function GET() {
  try {
    let statusData: Partial<OpenClawStatus> = {}
    const config = readOpenClawConfig()
    
    try {
      // 使用 openclaw status --all --deep --json 获取完整状态
      const { stdout } = await execAsync('openclaw status --all --deep --json', { timeout: 15000 })
      const jsonOutput = JSON.parse(stdout)
      statusData = parseStatusJson(jsonOutput)
    } catch (error) {
      console.error('Failed to get status from JSON:', error)
      
      // 回退到 gateway status --deep --json
      try {
        const { stdout } = await execAsync('openclaw gateway status --deep --json', { timeout: 10000 })
        const jsonOutput = JSON.parse(stdout)
        
        // 解析 gateway status JSON
        if (jsonOutput.service) {
          statusData.service = {
            status: jsonOutput.service.runtime?.status || 'unknown',
            pid: jsonOutput.service.runtime?.pid || null,
            label: jsonOutput.service.label || 'unknown'
          }
        }
        
        if (jsonOutput.gateway) {
          statusData.gateway = {
            mode: jsonOutput.gateway.bindMode || 'local',
            address: jsonOutput.gateway.probeUrl || '',
            bindMode: jsonOutput.gateway.bindMode || 'local',
            port: jsonOutput.gateway.port || 18789,
            reachable: jsonOutput.rpc?.ok || false,
            connectLatencyMs: 0
          }
        }
        
        if (jsonOutput.health) {
          statusData.health = jsonOutput.health.healthy ? 'healthy' : 'error'
        }
        
        if (jsonOutput.rpc) {
          if (statusData.gateway) {
            statusData.gateway.reachable = jsonOutput.rpc.ok
          }
        }
      } catch {
        // 如果命令执行失败，尝试从配置文件读取基本信息
        if (config) {
          statusData = {
            version: config.version || 'unknown',
            gateway: {
              mode: config.gateway?.mode || 'local',
              address: 'ws://127.0.0.1:18789',
              bindMode: 'local',
              port: config.gateway?.port || 18789,
              reachable: false,
              connectLatencyMs: 0
            },
            channels: Object.entries(config.channels || {})
              .filter(([, enabled]) => enabled)
              .map(([name]) => ({ name, enabled: true, status: 'unknown' })),
            health: 'unknown'
          }
        }
      }
    }
    
    // 从配置文件补充版本信息
    if (!statusData.version && config?.version) {
      statusData.version = config.version
    }
    
    // 从配置文件补充 channels
    if ((!statusData.channels || statusData.channels.length === 0) && config?.channels) {
      statusData.channels = Object.entries(config.channels)
        .filter(([, enabled]) => enabled)
        .map(([name]) => ({ name, enabled: true, status: 'configured' }))
    }
    
    // 生成 Dashboard URL
    const authToken = config?.gateway?.auth?.token || ''
    const port = statusData.gateway?.port || config?.gateway?.port || 18789
    
    if (!statusData.dashboard) {
      statusData.dashboard = `http://localhost:${port}/`
    }
    
    // 如果有令牌，添加到 dashboard URL
    if (authToken && statusData.dashboard) {
      try {
        const url = new URL(statusData.dashboard)
        url.searchParams.set('token', authToken)
        statusData.dashboard = url.toString()
      } catch {
        // URL 解析失败，保持原样
      }
    }
    
    const response: OpenClawStatus = {
      version: statusData.version || 'unknown',
      latestVersion: null,
      gateway: statusData.gateway || { mode: 'unknown', address: '', bindMode: '', port: 18789, reachable: false, connectLatencyMs: 0 },
      service: statusData.service || { status: 'unknown', pid: null, label: 'unknown' },
      securityAudit: statusData.securityAudit || { critical: 0, warn: 0, info: 0, details: [] },
      channels: statusData.channels || [],
      sessions: statusData.sessions || { active: 0, contextTokens: 0, recent: null },
      agents: statusData.agents || { defaultId: 'main', count: 0, totalSessions: 0 },
      dashboard: statusData.dashboard || '',
      health: statusData.health || 'unknown',
      rpc: statusData.rpc || { ok: false, url: '' },
      os: statusData.os || { platform: 'unknown', label: 'unknown' }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching OpenClaw status:', error)
    return NextResponse.json(
      {
        version: 'error',
        latestVersion: null,
        gateway: { mode: 'error', address: '', bindMode: '', port: 18789, reachable: false, connectLatencyMs: 0 },
        service: { status: 'error', pid: null, label: 'error' },
        securityAudit: { critical: 0, warn: 0, info: 0, details: [] },
        channels: [],
        sessions: { active: 0, contextTokens: 0, recent: null },
        agents: { defaultId: 'main', count: 0, totalSessions: 0 },
        dashboard: '',
        health: 'error' as const,
        rpc: { ok: false, url: '' },
        os: { platform: 'unknown', label: 'unknown' }
      },
      { status: 500 }
    )
  }
}