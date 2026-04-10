import { NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// 从 SOUL.md 文件中提取 agent 信息
interface SoulInfo {
  alias: string | null
  bio: string | null
  slug: string | null
}

function extractAgentInfoFromSoul(soulPath: string): SoulInfo {
  const result: SoulInfo = { alias: null, bio: null, slug: null }
  
  try {
    if (!existsSync(soulPath)) {
      return result
    }
    
    const soulContent = readFileSync(soulPath, 'utf-8')
    
    // 1. 从标题提取 alias（# SOUL.md - XXX）
    const titleMatch = soulContent.match(/^#\s*SOUL\.md\s*-\s*(.+)$/m)
    if (titleMatch && titleMatch[1]) {
      result.alias = titleMatch[1].trim().replace(/\s*🐱.*$/, '').replace(/\s*\(.*\)$/, '')
    }
    
    // 2. 从描述提取 bio（_XXX_ 格式的第一段）
    const descMatch = soulContent.match(/^_([^_]+)_/m)
    if (descMatch && descMatch[1]) {
      result.bio = descMatch[1].trim()
    }
    
    // 3. 从名字字段提取 slug
    const nameMatch = soulContent.match(/-\s*\*\*名字\*\*:\s*(.+)/)
    if (nameMatch && nameMatch[1]) {
      result.slug = nameMatch[1].trim()
    }
    
  } catch {
    // 忽略错误
  }
  
  return result
}

// 从 HEARTBEAT.md 提取周期任务
function extractHeartbeatTasks(hbPath: string): string[] {
  try {
    if (!existsSync(hbPath)) {
      return []
    }
    
    const hbContent = readFileSync(hbPath, 'utf-8')
    const tasks: string[] = []
    
    // 匹配任务列表项（- [ ] 或 - [x]）
    const taskMatches = hbContent.match(/-\s*\[[ x]\]\s*(.+)/g)
    if (taskMatches) {
      taskMatches.forEach(match => {
        const task = match.replace(/-\s*\[[ x]\]\s*/, '').trim()
        if (task && !task.startsWith('[')) {
          tasks.push(task)
        }
      })
    }
    
    return tasks
  } catch {
    return []
  }
}

interface SessionInfo {
  sessionId: string
  updatedAt: number
  systemSent?: boolean
  abortedLastRun?: boolean
  chatType?: string
  lastChannel?: string
  alias?: string  // Agent 的别名
  origin?: {
    label: string
    provider: string
    surface: string
    chatType: string
  }
}

interface SessionsData {
  [key: string]: SessionInfo
}

// Agent 信息接口
interface AgentInfo {
  id: string
  name: string
  alias?: string  // Agent 的别名（显示用）
  slug?: string   // Agent 的 slug 名字（显示在别名下方）
  bio?: string    // Agent 的简介
  status: 'online' | 'busy' | 'away' | 'offline'
  lastActive: number
  channel: string
  origin: string
  provider: string
  chatType: 'temporary' | 'permanent'  // 临时或永久会话
}

export async function GET() {
  try {
    const homeDir = homedir()
    const agentsDir = join(homeDir, '.openclaw', 'agents')
    
    // 检查 agents 目录是否存在
    if (!existsSync(agentsDir)) {
      return NextResponse.json({
        activeAgents: 0,
        agents: [],
        message: 'No agents found'
      })
    }
    
    // 获取所有 agent 目录
    const agentDirs = readdirSync(agentsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    const agents: AgentInfo[] = []
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    
    // 遍历每个 agent 目录
    for (const agentName of agentDirs) {
      const sessionsPath = join(agentsDir, agentName, 'sessions', 'sessions.json')
      
      // 如果 sessions.json 不存在，也显示该 agent（状态为 offline）
      if (!existsSync(sessionsPath)) {
        // 尝试从 SOUL.md 文件中提取更多信息
        const soulPath = join(agentsDir, agentName, 'SOUL.md')
        const soulInfo = extractAgentInfoFromSoul(soulPath)
        
        // 根据 agent 名称提供友好的默认显示
        const isMainAgent = agentName === 'main'
        const defaultChannel = isMainAgent ? '终端' : '未知渠道'
        const defaultOrigin = isMainAgent ? 'OpenClaw' : '未知来源'
        
        agents.push({
          id: `agent:${agentName}:${agentName}`,
          name: agentName,
          alias: soulInfo.alias || undefined,
          slug: soulInfo.slug || undefined,
          bio: soulInfo.bio || undefined,
          status: 'offline',
          lastActive: 0,
          channel: defaultChannel,
          origin: defaultOrigin,
          provider: 'OpenClaw',
          chatType: 'permanent'
        })
        continue
      }
      
      try {
        const sessionsContent = readFileSync(sessionsPath, 'utf-8')
        const sessionsData: SessionsData = JSON.parse(sessionsContent)
        
        // 获取该 agent 的所有 session
        const sessionKeys = Object.keys(sessionsData)
        
        for (const key of sessionKeys) {
          const session = sessionsData[key]
          
          // 只处理最近 24 小时内活跃的 session
          if (session.updatedAt > oneDayAgo) {
            // 计算状态：5分钟内为 online，1小时内为 busy，24小时内为 away
            const minutesAgo = (now - session.updatedAt) / 60000
            let status: 'online' | 'busy' | 'away' | 'offline' = 'online'
            if (minutesAgo < 5) {
              status = 'online'
            } else if (minutesAgo < 60) {
              status = 'busy'
            } else {
              status = 'away'
            }
            
            // 判断会话类型：根据 key 格式判断
            // key 格式: agent:agentId:sessionId
            // 如果 sessionId 与 agentId 相同（如 agent:main:main），则是永久会话
            const keyParts = key.split(':')
            const sessionId = keyParts[2] // key 的第三部分
            const agentId = keyParts[1] // key 的第二部分
            // 永久会话：sessionId === agentId（如 main:main 或其他 agent:agent）
            const isPermanent = sessionId === agentId
            const chatType: 'temporary' | 'permanent' = isPermanent ? 'permanent' : 'temporary'
            
            // 尝试从 SOUL.md 文件中提取更多信息
            const soulPath = join(agentsDir, agentName, 'SOUL.md')
            const soulInfo = extractAgentInfoFromSoul(soulPath)
            
            agents.push({
              id: key,
              name: agentName,
              alias: session.alias || soulInfo.alias || undefined,
              slug: soulInfo.slug || undefined,
              bio: soulInfo.bio || undefined,
              status,
              lastActive: session.updatedAt,
              channel: session.lastChannel || session.origin?.surface || 'unknown',
              origin: session.origin?.label || 'unknown',
              provider: session.origin?.provider || 'unknown',
              chatType
            })
          }
        }
      } catch (e) {
        // 忽略读取错误，添加一个 offline 状态的 agent
        console.error(`Error reading sessions for ${agentName}:`, e)
        // 尝试从 SOUL.md 文件中提取更多信息
        const soulPath = join(agentsDir, agentName, 'SOUL.md')
        const soulInfo = extractAgentInfoFromSoul(soulPath)
        
        agents.push({
          id: `agent:${agentName}:${agentName}`,
          name: agentName,
          alias: soulInfo.alias || undefined,
          slug: soulInfo.slug || undefined,
          bio: soulInfo.bio || undefined,
          status: 'offline',
          lastActive: 0,
          channel: 'unknown',
          origin: 'unknown',
          provider: 'unknown',
          chatType: 'permanent'
        })
      }
    }
    
    // 按最后活跃时间排序
    agents.sort((a, b) => b.lastActive - a.lastActive)
    
    return NextResponse.json({
      activeAgents: agents.length,
      agents,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error reading OpenClaw agents:', error)
    return NextResponse.json({
      activeAgents: 0,
      agents: [],
      error: 'Failed to read OpenClaw agents'
    }, { status: 500 })
  }
}