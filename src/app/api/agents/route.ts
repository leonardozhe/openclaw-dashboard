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

export async function GET() {
  try {
    const homeDir = homedir()
    const sessionsPath = join(homeDir, '.openclaw', 'agents', 'main', 'sessions', 'sessions.json')
    
    if (!existsSync(sessionsPath)) {
      return NextResponse.json({
        activeAgents: 0,
        sessions: [],
        message: 'No sessions found'
      })
    }
    
    const sessionsContent = readFileSync(sessionsPath, 'utf-8')
    const sessionsData: SessionsData = JSON.parse(sessionsContent)
    
    // 统计活跃的 session 数量
    const sessionKeys = Object.keys(sessionsData)
    const sessions = sessionKeys.map(key => {
      const session = sessionsData[key]
      return {
        key,
        sessionId: session.sessionId,
        updatedAt: session.updatedAt,
        chatType: session.chatType,
        lastChannel: session.lastChannel,
        origin: session.origin?.label || 'unknown',
        provider: session.origin?.provider || 'unknown',
      }
    })
    
    // 过滤出最近活跃的 session（24小时内更新过）
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const activeSessions = sessions.filter(s => s.updatedAt > oneDayAgo)
    
    return NextResponse.json({
      activeAgents: activeSessions.length,
      totalSessions: sessions.length,
      sessions: activeSessions,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error reading OpenClaw sessions:', error)
    return NextResponse.json({
      activeAgents: 0,
      sessions: [],
      error: 'Failed to read OpenClaw sessions'
    }, { status: 500 })
  }
}