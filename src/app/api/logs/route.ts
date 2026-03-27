import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

// 日志条目接口
interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  source?: string
  agent?: string
  channel?: string
  raw: string
}

// 解析日志级别
function parseLogLevel(line: string): LogEntry['level'] {
  if (line.includes('ERROR') || line.includes('error') || line.includes('ERR')) return 'error'
  if (line.includes('WARN') || line.includes('warn') || line.includes('WARNING')) return 'warn'
  if (line.includes('DEBUG') || line.includes('debug')) return 'debug'
  return 'info'
}

// 解析时间戳
function parseTimestamp(line: string): string {
  // 尝试匹配 ISO 时间戳
  const isoMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  if (isoMatch) return isoMatch[0]
  
  // 尝试匹配常见日志格式
  const dateMatch = line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
  if (dateMatch) return dateMatch[0]
  
  return new Date().toISOString()
}

// 解析日志来源
function parseSource(line: string): string | undefined {
  const match = line.match(/\[([^\]]+)\]/)
  return match ? match[1] : undefined
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const level = searchParams.get('level') // filter by level if provided
    
    let logs: LogEntry[] = []
    
    // 方法1: 尝试从 openclaw logs 命令获取
    try {
      const { stdout } = await execAsync(`openclaw logs --limit ${limit} --json 2>/dev/null`, { timeout: 10000 })
      
      if (stdout.trim()) {
        const lines = stdout.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            // 尝试解析 JSON 格式的日志
            const parsed = JSON.parse(line)
            logs.push({
              timestamp: parsed.timestamp || parsed.time || new Date().toISOString(),
              level: parsed.level || parseLogLevel(line),
              message: parsed.message || parsed.msg || line,
              source: parsed.source || parsed.component,
              agent: parsed.agent,
              channel: parsed.channel,
              raw: line
            })
          } catch {
            // 非 JSON 格式，直接解析
            if (line.trim()) {
              logs.push({
                timestamp: parseTimestamp(line),
                level: parseLogLevel(line),
                message: line,
                source: parseSource(line),
                raw: line
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs via CLI:', error)
    }
    
    // 方法2: 如果 CLI 失败，尝试直接读取日志文件
    if (logs.length === 0) {
      try {
        const homeDir = homedir()
        const logPaths = [
          join(homeDir, '.openclaw', 'logs', 'gateway.log'),
          join(homeDir, '.openclaw', 'gateway.log'),
          join(homeDir, '.openclaw', 'logs', 'openclaw.log')
        ]
        
        for (const logPath of logPaths) {
          if (existsSync(logPath)) {
            const content = readFileSync(logPath, 'utf-8')
            const lines = content.split('\n').slice(-limit)
            
            for (const line of lines) {
              if (line.trim()) {
                logs.push({
                  timestamp: parseTimestamp(line),
                  level: parseLogLevel(line),
                  message: line,
                  source: parseSource(line),
                  raw: line
                })
              }
            }
            break
          }
        }
      } catch (error) {
        console.error('Failed to read log files:', error)
      }
    }
    
    // 按级别过滤
    if (level && ['debug', 'info', 'warn', 'error'].includes(level)) {
      logs = logs.filter(log => log.level === level)
    }
    
    // 统计
    const stats = {
      total: logs.length,
      error: logs.filter(l => l.level === 'error').length,
      warn: logs.filter(l => l.level === 'warn').length,
      info: logs.filter(l => l.level === 'info').length,
      debug: logs.filter(l => l.level === 'debug').length
    }
    
    return NextResponse.json({
      logs,
      stats,
      limit
    })
  } catch (error) {
    console.error('Error in logs API:', error)
    return NextResponse.json(
      { logs: [], stats: { total: 0, error: 0, warn: 0, info: 0, debug: 0 }, error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}