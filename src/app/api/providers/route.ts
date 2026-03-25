import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// 测量到 baseUrl 的延迟
async function measureLatency(baseUrl: string): Promise<number | null> {
  if (!baseUrl) return null
  
  try {
    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时
    
    // 尝试访问 baseUrl 的根路径或 /models 端点
    const testUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    
    await fetch(`${testUrl}/models`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(() => {
      // 如果 HEAD 失败，尝试 GET
      return fetch(testUrl, {
        method: 'GET',
        signal: controller.signal
      }).catch(() => null)
    })
    
    clearTimeout(timeoutId)
    const latency = Date.now() - startTime
    return latency
  } catch {
    return null
  }
}

interface Model {
  id: string
  name: string
  api: string
  reasoning?: boolean
  input?: string[]
  contextWindow?: number
  maxTokens?: number
}

interface Provider {
  baseUrl?: string
  apiKey?: string
  api?: string
  models: Model[]
}

interface AgentDefaults {
  model?: {
    primary: string
  }
  models?: Record<string, object>
  contextTokens?: number
}

interface OpenClawConfig {
  models?: {
    mode?: string
    providers?: Record<string, Provider>
  }
  agents?: {
    defaults?: AgentDefaults
  }
}

// 厂商信息配置
interface VendorInfo {
  id: string
  nameEn: string
  nameZh: string
  icon: string
  baseUrl: string
  keywords: string[]
}

// 厂商信息映射表
const VENDOR_INFO: Record<string, VendorInfo> = {
  'openai': {
    id: 'openai',
    nameEn: 'OpenAI',
    nameZh: 'OpenAI',
    icon: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    keywords: ['openai']
  },
  'anthropic': {
    id: 'anthropic',
    nameEn: 'Anthropic',
    nameZh: 'Anthropic (Claude)',
    icon: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    keywords: ['anthropic', 'claude']
  },
  'google': {
    id: 'google',
    nameEn: 'Google AI / Gemini',
    nameZh: '谷歌 Gemini',
    icon: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keywords: ['google', 'gemini', 'vertex']
  },
  'azure': {
    id: 'azure',
    nameEn: 'Microsoft Azure OpenAI',
    nameZh: '微软 Azure OpenAI',
    icon: 'azure',
    baseUrl: 'https://{resource}.openai.azure.com',
    keywords: ['azure']
  },
  'deepseek': {
    id: 'deepseek',
    nameEn: 'DeepSeek',
    nameZh: '深度求索',
    icon: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    keywords: ['deepseek']
  },
  'doubao': {
    id: 'doubao',
    nameEn: 'ByteDance Volcano Engine',
    nameZh: '字节 豆包',
    icon: 'doubao',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    keywords: ['doubao', 'volcengine', 'volcano']
  },
  'qwen': {
    id: 'qwen',
    nameEn: 'Alibaba Tongyi (Qwen)',
    nameZh: '阿里 通义千问',
    icon: 'qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    keywords: ['qwen', 'tongyi', 'alibaba', 'dashscope']
  },
  'groq': {
    id: 'groq',
    nameEn: 'Groq',
    nameZh: 'Groq',
    icon: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keywords: ['groq']
  },
  'together': {
    id: 'together',
    nameEn: 'Together AI',
    nameZh: 'Together AI',
    icon: 'together',
    baseUrl: 'https://api.together.xyz/v1',
    keywords: ['together']
  },
  'fireworks': {
    id: 'fireworks',
    nameEn: 'Fireworks AI',
    nameZh: 'Fireworks AI',
    icon: 'fireworks',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    keywords: ['fireworks']
  },
  'mistral': {
    id: 'mistral',
    nameEn: 'Mistral AI',
    nameZh: 'Mistral AI',
    icon: 'mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    keywords: ['mistral']
  },
  'siliconflow': {
    id: 'siliconflow',
    nameEn: 'SiliconFlow',
    nameZh: '硅基流动',
    icon: 'siliconflow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    keywords: ['siliconflow', 'silicon']
  },
  'huggingface': {
    id: 'huggingface',
    nameEn: 'Hugging Face Inference',
    nameZh: 'Hugging Face',
    icon: 'huggingface',
    baseUrl: 'https://api-inference.huggingface.co/v1',
    keywords: ['huggingface', 'hf']
  },
  'openrouter': {
    id: 'openrouter',
    nameEn: 'OpenRouter',
    nameZh: 'OpenRouter',
    icon: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keywords: ['openrouter']
  },
  'cerebras': {
    id: 'cerebras',
    nameEn: 'Cerebras',
    nameZh: 'Cerebras',
    icon: 'cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    keywords: ['cerebras']
  },
  'perplexity': {
    id: 'perplexity',
    nameEn: 'Perplexity AI',
    nameZh: 'Perplexity',
    icon: 'perplexity',
    baseUrl: 'https://api.perplexity.ai',
    keywords: ['perplexity']
  },
  // 兼容旧配置
  'bailian': {
    id: 'bailian',
    nameEn: 'Alibaba Bailian',
    nameZh: '阿里百炼',
    icon: 'qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    keywords: ['bailian']
  },
  'moonshot': {
    id: 'moonshot',
    nameEn: 'Moonshot AI',
    nameZh: '月之暗面 (Kimi)',
    icon: 'moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    keywords: ['moonshot', 'kimi']
  },
  'zhipu': {
    id: 'zhipu',
    nameEn: 'Zhipu AI',
    nameZh: '智谱 AI',
    icon: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    keywords: ['zhipu', 'glm']
  },
  'minimax': {
    id: 'minimax',
    nameEn: 'MiniMax',
    nameZh: 'MiniMax',
    icon: 'minimax',
    baseUrl: 'https://api.minimax.chat/v1',
    keywords: ['minimax']
  },
  'kimi': {
    id: 'kimi',
    nameEn: 'Moonshot AI (Kimi)',
    nameZh: '月之暗面 (Kimi)',
    icon: 'moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    keywords: ['kimi', 'moonshot']
  }
}

// 模型名称映射表 - 将模型 ID 转换为友好的显示名称
const MODEL_NAME_MAP: Record<string, string> = {
  // OpenAI
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-4': 'GPT-4',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'o1': 'o1',
  'o1-mini': 'o1 Mini',
  'o1-preview': 'o1 Preview',
  
  // Anthropic/Claude
  'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
  'claude-3.5-haiku': 'Claude 3.5 Haiku',
  'claude-3-opus': 'Claude 3 Opus',
  'claude-3-sonnet': 'Claude 3 Sonnet',
  'claude-3-haiku': 'Claude 3 Haiku',
  
  // Google/Gemini
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-pro': 'Gemini Pro',
  
  // DeepSeek
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-coder': 'DeepSeek Coder',
  'deepseek-reasoner': 'DeepSeek Reasoner',
  
  // Qwen/通义千问
  'qwen3.5-plus': 'Qwen 3.5 Plus',
  'qwen3.5-turbo': 'Qwen 3.5 Turbo',
  'qwen3-max': 'Qwen 3 Max',
  'qwen3-coder-plus': 'Qwen 3 Coder Plus',
  'qwen3-coder-next': 'Qwen 3 Coder Next',
  'qwen2.5-max': 'Qwen 2.5 Max',
  'qwen2.5-plus': 'Qwen 2.5 Plus',
  'qwen2.5-turbo': 'Qwen 2.5 Turbo',
  'qwen-vl-max': 'Qwen VL Max',
  'qwen-vl-plus': 'Qwen VL Plus',
  
  // 豆包
  'doubao-pro-32k': 'Doubao Pro 32K',
  'doubao-pro-128k': 'Doubao Pro 128K',
  'doubao-lite-32k': 'Doubao Lite 32K',
  'doubao-lite-128k': 'Doubao Lite 128K',
  
  // Moonshot/Kimi
  'moonshot-v1-8k': 'Moonshot V1 8K',
  'moonshot-v1-32k': 'Moonshot V1 32K',
  'moonshot-v1-128k': 'Moonshot V1 128K',
  'kimi-k2.5': 'Kimi K2.5',
  'kimi-latest': 'Kimi Latest',
  
  // 智谱
  'glm-4-plus': 'GLM-4 Plus',
  'glm-4': 'GLM-4',
  'glm-4-air': 'GLM-4 Air',
  'glm-4-flash': 'GLM-4 Flash',
  'glm-4v': 'GLM-4V',
  'glm-5': 'GLM-5',
  'glm-4.7': 'GLM-4.7',
  
  // MiniMax
  'MiniMax-M2.5': 'MiniMax M2.5',
  'abab6.5-chat': 'ABAB 6.5 Chat',
  'abab6.5s-chat': 'ABAB 6.5S Chat',
  'abab5.5-chat': 'ABAB 5.5 Chat',
  
  // Mistral
  'mistral-large-latest': 'Mistral Large',
  'mistral-medium-latest': 'Mistral Medium',
  'mistral-small-latest': 'Mistral Small',
  'codestral-latest': 'Codestral',
  
  // Groq
  'llama-3.3-70b-versatile': 'Llama 3.3 70B',
  'llama-3.1-8b-instant': 'Llama 3.1 8B',
  'mixtral-8x7b-32768': 'Mixtral 8x7B',
  
  // SiliconFlow
  'Qwen/Qwen2.5-72B-Instruct': 'Qwen 2.5 72B',
  'Qwen/Qwen2.5-32B-Instruct': 'Qwen 2.5 32B',
  'deepseek-ai/DeepSeek-V2.5': 'DeepSeek V2.5',
  
  // 其他
  'llama-3.3-70b': 'Llama 3.3 70B',
  'llama-3.2-90b': 'Llama 3.2 90B',
}

// 获取模型友好名称
function getModelDisplayName(modelId: string, modelName?: string): string {
  // 如果有映射，使用映射名称
  if (MODEL_NAME_MAP[modelId]) {
    return MODEL_NAME_MAP[modelId]
  }
  
  // 如果配置中有 name 且与 id 不同，使用配置的 name
  if (modelName && modelName !== modelId) {
    return modelName
  }
  
  // 尝试美化模型 ID
  // 移除日期后缀 (如 -2026-01-23)
  let displayName = modelId.replace(/-\d{4}-\d{2}-\d{2}$/, '')
  
  // 首字母大写，替换连字符为空格
  displayName = displayName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  
  return displayName
}

// 根据 baseUrl 识别厂商
function identifyVendorByBaseUrl(baseUrl: string): VendorInfo | null {
  const normalizedUrl = baseUrl.toLowerCase().replace(/\/$/, '')
  for (const vendor of Object.values(VENDOR_INFO)) {
    const vendorBaseUrl = vendor.baseUrl.toLowerCase().replace(/\/$/, '')
    if (normalizedUrl.includes(vendorBaseUrl) || vendorBaseUrl.includes(normalizedUrl)) {
      return vendor
    }
  }
  return null
}

// 根据 providerId 获取厂商信息
function getVendorInfo(providerId: string, baseUrl?: string): VendorInfo {
  // 先尝试通过 providerId 查找
  if (VENDOR_INFO[providerId]) {
    return VENDOR_INFO[providerId]
  }
  
  // 尝试通过关键词匹配
  const lowerId = providerId.toLowerCase()
  for (const vendor of Object.values(VENDOR_INFO)) {
    if (vendor.keywords.some(kw => lowerId.includes(kw) || kw.includes(lowerId))) {
      return vendor
    }
  }
  
  // 如果有 baseUrl，尝试通过 baseUrl 识别
  if (baseUrl) {
    const identified = identifyVendorByBaseUrl(baseUrl)
    if (identified) {
      return identified
    }
  }
  
  // 返回默认值
  return {
    id: providerId,
    nameEn: providerId.charAt(0).toUpperCase() + providerId.slice(1),
    nameZh: providerId.charAt(0).toUpperCase() + providerId.slice(1),
    icon: 'default',
    baseUrl: baseUrl || '',
    keywords: [providerId]
  }
}

export async function GET() {
  try {
    const homeDir = homedir()
    const configPath = join(homeDir, '.openclaw', 'openclaw.json')
    
    if (!existsSync(configPath)) {
      return NextResponse.json({
        providers: [],
        error: 'OpenClaw config not found'
      })
    }
    
    const configContent = readFileSync(configPath, 'utf-8')
    const config: OpenClawConfig = JSON.parse(configContent)
    
    const providers: {
      id: string
      name: string
      nameEn: string
      nameZh: string
      icon: string
      baseUrl: string
      latency: number | null
      models: {
        id: string
        name: string
        inUse: boolean
      }[]
      hasApiKey: boolean
      activated: boolean
      contextTokens?: number
    }[] = []
    
    // 获取当前使用的模型
    const primaryModel = config.agents?.defaults?.model?.primary || ''
    const usedModels = Object.keys(config.agents?.defaults?.models || {})
    
    // 解析供应商
    if (config.models?.providers) {
      // 并行测量所有供应商的延迟
      const providerEntries = Object.entries(config.models.providers)
      const latencyPromises = providerEntries.map(async ([, provider]) => {
        const providerBaseUrl = (provider as Provider).baseUrl || ''
        return measureLatency(providerBaseUrl)
      })
      
      const latencies = await Promise.all(latencyPromises)
      
      for (let i = 0; i < providerEntries.length; i++) {
        const [providerId, provider] = providerEntries[i]
        const providerBaseUrl = (provider as Provider).baseUrl || ''
        const vendorInfo = getVendorInfo(providerId, providerBaseUrl)
        const hasApiKey = !!(provider as Provider).apiKey
        
        // 检查该供应商下是否有模型在使用
        const providerModels = (provider as Provider).models || []
        
        const models = providerModels.map(model => ({
          id: model.id,
          name: getModelDisplayName(model.id, model.name),
          inUse: usedModels.includes(`${providerId}/${model.id}`) || primaryModel === `${providerId}/${model.id}`
        }))
        
        // 供应商已激活：有 API Key 且有模型配置
        const activated = hasApiKey && models.length > 0
        
        providers.push({
          id: providerId,
          name: vendorInfo.nameZh, // 默认中文名称
          nameEn: vendorInfo.nameEn,
          nameZh: vendorInfo.nameZh,
          icon: vendorInfo.icon,
          baseUrl: providerBaseUrl || vendorInfo.baseUrl,
          latency: latencies[i],
          models,
          hasApiKey,
          activated,
          contextTokens: config.agents?.defaults?.contextTokens || 0
        })
      }
    }
    
    return NextResponse.json({
      providers,
      primaryModel,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error reading OpenClaw config:', error)
    return NextResponse.json({
      providers: [],
      error: 'Failed to read OpenClaw config'
    }, { status: 500 })
  }
}