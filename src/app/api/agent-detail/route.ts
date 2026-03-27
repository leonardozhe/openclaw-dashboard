import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

// Agent 详细信息接口
interface AgentDetail {
  id: string
  name: string
  identityName: string
  identityEmoji: string
  model: string
  workspace: string
  isDefault: boolean
  bindings: number
  routes: string[]
  soul: {
    profile: string
    alsoAllow: string[]
    web: {
      search: {
        enabled: boolean
        provider: string
      }
    }
    exec: {
      security: string
    }
  } | null
  tools: {
    name: string
    description: string
    category: string
  }[]
  skills: {
    name: string
    level: number
    description: string
  }[]
  models: {
    primary: string
    available: string[]
  }
  sessions: {
    total: number
    active: number
    lastActive: number | null
  }
  plugins: {
    name: string
    version: string
    enabled: boolean
  }[]
}

// 从命令输出中提取 JSON（忽略插件日志等干扰）
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
    
    // 找到 JSON 开始
    if (jsonStart === -1 && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
      jsonStart = i
    }
    
    if (jsonStart !== -1) {
      jsonLines.push(line)
      
      // 解析括号计数
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
      
      // JSON 完整
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

// 从配置中提取工具列表
function extractToolsFromSoul(soul: AgentDetail['soul']): AgentDetail['tools'] {
  const tools: AgentDetail['tools'] = []
  
  if (!soul) return tools
  
  const profileTools: Record<string, string[]> = {
    'full': ['文件操作', '代码执行', '网络搜索', '浏览器控制', '终端命令'],
    'coding': ['文件操作', '代码执行', '终端命令'],
    'minimal': ['基础对话'],
    'messaging': ['消息发送', '文件读取']
  }
  
  const profile = soul.profile || 'full'
  const baseTools = profileTools[profile] || profileTools['full']
  
  baseTools.forEach(tool => {
    tools.push({
      name: tool,
      description: getToolDescription(tool),
      category: getToolCategory(tool)
    })
  })
  
  if (soul.alsoAllow && soul.alsoAllow.length > 0) {
    const feishuTools = soul.alsoAllow.filter(t => t.startsWith('feishu_'))
    if (feishuTools.length > 0) {
      tools.push({
        name: '飞书集成',
        description: `已启用 ${feishuTools.length} 个飞书工具`,
        category: '集成'
      })
    }
  }
  
  if (soul.web?.search?.enabled) {
    tools.push({
      name: '网络搜索',
      description: `使用 ${soul.web.search.provider} 进行网络搜索`,
      category: '搜索'
    })
  }
  
  if (soul.exec?.security) {
    tools.push({
      name: '命令执行',
      description: `安全级别: ${soul.exec.security}`,
      category: '系统'
    })
  }
  
  return tools
}

function getToolDescription(tool: string): string {
  const descriptions: Record<string, string> = {
    '文件操作': '读取、写入、编辑文件',
    '代码执行': '运行代码和脚本',
    '网络搜索': '搜索互联网信息',
    '浏览器控制': '自动化浏览器操作',
    '终端命令': '执行终端命令',
    '基础对话': '基本对话能力',
    '消息发送': '发送消息到各渠道',
    '文件读取': '读取文件内容'
  }
  return descriptions[tool] || tool
}

function getToolCategory(tool: string): string {
  if (['文件操作', '文件读取'].includes(tool)) return '文件'
  if (['代码执行', '终端命令'].includes(tool)) return '开发'
  if (['网络搜索', '浏览器控制'].includes(tool)) return '网络'
  if (['消息发送', '基础对话'].includes(tool)) return '通信'
  return '其他'
}

function extractSkillsFromSoul(soul: AgentDetail['soul']): AgentDetail['skills'] {
  const skills: AgentDetail['skills'] = []
  
  if (!soul) return skills
  
  const profile = soul.profile || 'full'
  
  skills.push({
    name: '编程开发',
    level: profile === 'coding' ? 95 : profile === 'full' ? 85 : 60,
    description: '代码编写、调试、重构'
  })
  
  skills.push({
    name: '文件管理',
    level: profile === 'minimal' ? 40 : 80,
    description: '文件读写、编辑、搜索'
  })
  
  if (soul.web?.search?.enabled) {
    skills.push({
      name: '信息检索',
      level: 90,
      description: '网络搜索、信息整合'
    })
  }
  
  const feishuTools = soul.alsoAllow?.filter(t => t.startsWith('feishu_')) || []
  if (feishuTools.length > 0) {
    skills.push({
      name: '飞书办公',
      level: Math.min(95, 50 + feishuTools.length * 2),
      description: `已集成 ${feishuTools.length} 个飞书功能`
    })
  }
  
  if (soul.exec?.security === 'full') {
    skills.push({
      name: '系统操作',
      level: 85,
      description: '终端命令、系统管理'
    })
  }
  
  return skills
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('id') || 'main'
    
    // 获取 agent 列表信息
    let agentInfo: Record<string, unknown> | null = null
    try {
      const { stdout } = await execAsync('openclaw agents list --json 2>/dev/null', { timeout: 10000 })
      const json = extractJsonFromOutput(stdout)
      if (Array.isArray(json)) {
        agentInfo = json.find((a: { id: string }) => a.id === agentId) || null
      }
    } catch (error) {
      console.error('Failed to get agent list:', error)
    }
    
    // 获取 tools 配置（OpenClaw 使用 tools 而不是 soul）
    let toolsConfig: AgentDetail['soul'] = null
    try {
      const { stdout } = await execAsync('openclaw config get tools --json 2>/dev/null', { timeout: 5000 })
      const json = extractJsonFromOutput(stdout)
      if (json && typeof json === 'object' && 'profile' in json) {
        toolsConfig = json as AgentDetail['soul']
      }
    } catch (error) {
      console.error('Failed to get tools config:', error)
    }
    
    // 获取模型配置
    let models: AgentDetail['models'] = { primary: 'unknown', available: [] }
    try {
      const { stdout } = await execAsync('openclaw config get agents.defaults --json 2>/dev/null', { timeout: 5000 })
      const json = extractJsonFromOutput(stdout)
      if (json && typeof json === 'object') {
        const config = json as Record<string, unknown>
        models = {
          primary: (config.model as Record<string, string>)?.primary || 'unknown',
          available: Object.keys((config.models as Record<string, unknown>) || {}).map(m => m.split('/')[1] || m)
        }
      }
    } catch (error) {
      console.error('Failed to get models config:', error)
    }
    
    // 获取会话统计
    let sessions: AgentDetail['sessions'] = { total: 0, active: 0, lastActive: null }
    try {
      const homeDir = homedir()
      const sessionsPath = join(homeDir, '.openclaw', 'agents', agentId, 'sessions', 'sessions.json')
      
      if (existsSync(sessionsPath)) {
        const sessionsContent = readFileSync(sessionsPath, 'utf-8')
        const sessionsData = JSON.parse(sessionsContent)
        const sessionKeys = Object.keys(sessionsData)
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000
        
        const recentSessions = sessionKeys.filter(key => {
          const session = sessionsData[key]
          return session.updatedAt > oneDayAgo
        })
        
        const lastActiveSession = sessionKeys.reduce((latest: number | null, key) => {
          const session = sessionsData[key]
          if (!latest || session.updatedAt > latest) {
            return session.updatedAt
          }
          return latest
        }, null)
        
        sessions = {
          total: sessionKeys.length,
          active: recentSessions.length,
          lastActive: lastActiveSession
        }
      }
    } catch (error) {
      console.error('Failed to get sessions:', error)
    }
    
    // 获取插件信息
    const plugins: AgentDetail['plugins'] = [
      { name: 'memory-lancedb-pro', version: '1.1.0-beta.10', enabled: true },
      { name: 'openclaw-lark', version: 'latest', enabled: toolsConfig?.alsoAllow?.some((t: string) => t.startsWith('feishu_')) || false }
    ]
    
    // 提取工具和技能
    const tools = extractToolsFromSoul(toolsConfig)
    const skills = extractSkillsFromSoul(toolsConfig)
    
    const detail: AgentDetail = {
      id: (agentInfo?.id as string) || agentId,
      name: (agentInfo?.identityName as string) || agentId,
      identityName: (agentInfo?.identityName as string) || agentId,
      identityEmoji: (agentInfo?.identityEmoji as string) || '🦞',
      model: (agentInfo?.model as string) || models.primary,
      workspace: (agentInfo?.workspace as string) || '',
      isDefault: (agentInfo?.isDefault as boolean) || false,
      bindings: (agentInfo?.bindings as number) || 0,
      routes: (agentInfo?.routes as string[]) || [],
      soul: toolsConfig,
      tools,
      skills,
      models,
      sessions,
      plugins
    }
    
    return NextResponse.json(detail)
  } catch (error) {
    console.error('Error fetching agent detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent detail' },
      { status: 500 }
    )
  }
}