import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Cron 任务接口
interface CronJob {
  id: string
  name: string
  schedule: string
  scheduleHuman: string
  enabled: boolean
  lastRun: string | null
  nextRun: string | null
  command: string
  agent?: string
  channel?: string
  target?: string
}

// 解析 cron 表达式为人类可读格式
function parseCronSchedule(schedule: string): string {
  const parts = schedule.split(' ')
  if (parts.length !== 5) return schedule
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  
  // 常见模式
  if (minute === '*' && hour === '*') return '每分钟'
  if (minute === '0' && hour === '*') return '每小时'
  if (minute === '0' && hour !== '*') return `每天 ${hour}:00`
  if (minute.startsWith('*/') && hour === '*') return `每 ${minute.slice(2)} 分钟`
  if (minute === '0' && hour.startsWith('*/')) return `每 ${hour.slice(2)} 小时`
  
  // 每天特定时间
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `每天 ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
  }
  
  // 每周特定时间
  if (dayOfWeek !== '*' && dayOfWeek !== '*') {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `每${days[parseInt(dayOfWeek)]} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
  }
  
  return schedule
}

// 从命令输出中提取 JSON
function extractJsonFromOutput(output: string): unknown {
  const lines = output.split('\n')
  let jsonStart = -1
  const jsonLines: string[] = []
  let braceCount = 0
  let inString = false
  let escape = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    if (jsonStart === -1 && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
      jsonStart = i
    }
    
    if (jsonStart !== -1) {
      jsonLines.push(line)
      
      for (const char of line) {
        if (escape) {
          escape = false
          continue
        }
        if (char === '\\') {
          escape = true
          continue
        }
        if (char === '"') {
          inString = !inString
        } else if (!inString) {
          if (char === '{' || char === '[') braceCount++
          else if (char === '}' || char === ']') braceCount--
        }
      }
      
      if (braceCount === 0 && jsonLines.length > 0) {
        break
      }
    }
  }
  
  if (jsonLines.length === 0) return null
  
  try {
    return JSON.parse(jsonLines.join('\n'))
  } catch {
    return null
  }
}

export async function GET() {
  try {
    let jobs: CronJob[] = []
    
    try {
      const { stdout } = await execAsync('openclaw cron list --json --all 2>/dev/null', { timeout: 15000 })
      const json = extractJsonFromOutput(stdout)
      
      if (json && typeof json === 'object' && 'jobs' in json) {
        const data = json as { jobs: Record<string, unknown>[] }
        jobs = data.jobs.map((job): CronJob => {
          const schedule = (job.cron as string) || ''
          return {
            id: (job.id as string) || '',
            name: (job.name as string) || '未命名任务',
            schedule: schedule,
            scheduleHuman: parseCronSchedule(schedule),
            enabled: (job.enabled as boolean) ?? true,
            lastRun: job.lastRun ? new Date(job.lastRun as string).toISOString() : null,
            nextRun: job.nextRun ? new Date(job.nextRun as string).toISOString() : null,
            command: (job.command as string) || (job.message as string) || '',
            agent: job.agent as string | undefined,
            channel: job.channel as string | undefined,
            target: job.target as string | undefined
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch cron jobs:', error)
    }
    
    return NextResponse.json({
      jobs,
      total: jobs.length,
      enabled: jobs.filter(j => j.enabled).length,
      disabled: jobs.filter(j => !j.enabled).length
    })
  } catch (error) {
    console.error('Error in cron API:', error)
    return NextResponse.json(
      { jobs: [], total: 0, enabled: 0, disabled: 0, error: 'Failed to fetch cron jobs' },
      { status: 500 }
    )
  }
}