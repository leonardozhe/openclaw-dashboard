import { NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

interface SessionInfo {
  sessionId: string
  updatedAt: number
  systemSent?: boolean
  abortedLastRun?: boolean
  chatType?: string
  lastChannel?: string
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
      
      if (!existsSync(sessionsPath)) {
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
            const isPermanent = sessionId === agentName
            const chatType: 'temporary' | 'permanent' = isPermanent ? 'permanent' : 'temporary'
            
            agents.push({
              id: key,
              name: agentName,
              status,
              lastActive: session.updatedAt,
              channel: session.lastChannel || session.origin?.surface || 'unknown',
              origin: session.origin?.label || 'unknown',
              provider: session.origin?.provider || 'unknown',
              chatType
            })
          }
        }
      } catch {
        // 忽略读取错误，继续处理其他 agent
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