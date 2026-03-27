import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

interface VectorMemoryStatus {
  enabled: boolean
  pluginInstalled: boolean
  pluginEnabled: boolean
  embeddingModel: string | null
  embeddingProvider: string | null
  embeddingAvailable: boolean
  autoCapture: boolean
  autoRecall: boolean
}

export async function GET() {
  try {
    const configPath = join(homedir(), '.openclaw', 'openclaw.json')
    
    if (!existsSync(configPath)) {
      return NextResponse.json({
        enabled: false,
        pluginInstalled: false,
        pluginEnabled: false,
        embeddingModel: null,
        embeddingProvider: null,
        embeddingAvailable: false,
        autoCapture: false,
        autoRecall: false
      })
    }
    
    const content = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content)
    
    // 检查插件配置
    const plugins = config.plugins || {}
    const memoryPlugin = plugins.entries?.['memory-lancedb-pro'] || {}
    const pluginEnabled = memoryPlugin.enabled === true
    
    // 检查 memory 插槽是否配置
    const memorySlot = plugins.slots?.memory === 'memory-lancedb-pro'
    
    // 获取嵌入式模型配置
    const embeddingConfig = memoryPlugin.config?.embedding || {}
    const embeddingModel = embeddingConfig.model || null
    const embeddingProvider = embeddingConfig.provider || null
    const embeddingBaseUrl = embeddingConfig.baseURL || null
    
    // 检测嵌入式模型是否可用
    let embeddingAvailable = false
    if (embeddingBaseUrl && embeddingModel) {
      try {
        // 如果是 Ollama，检查模型是否运行
        if (embeddingBaseUrl.includes('localhost:11434')) {
          const response = await fetch('http://localhost:11434/api/tags', {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          })
          if (response.ok) {
            const data = await response.json()
            const models = data.models || []
            // 检查模型是否已下载（不需要正在运行）
            embeddingAvailable = models.some((m: { name: string }) => 
              m.name.includes(embeddingModel.replace('nomic-embed-text', 'nomic'))
            )
          }
        } else {
          // 其他提供商，假设可用
          embeddingAvailable = true
        }
      } catch {
        embeddingAvailable = false
      }
    }
    
    // 获取自动捕获和召回配置
    const autoCapture = memoryPlugin.config?.autoCapture === true
    const autoRecall = memoryPlugin.config?.autoRecall === true
    
    // 判断向量记忆是否完全启用
    const enabled = pluginEnabled && memorySlot && embeddingAvailable
    
    return NextResponse.json({
      enabled,
      pluginInstalled: true,
      pluginEnabled,
      embeddingModel,
      embeddingProvider,
      embeddingAvailable,
      autoCapture,
      autoRecall
    })
  } catch (error) {
    console.error('Error checking vector memory status:', error)
    return NextResponse.json({
      enabled: false,
      pluginInstalled: false,
      pluginEnabled: false,
      embeddingModel: null,
      embeddingProvider: null,
      embeddingAvailable: false,
      autoCapture: false,
      autoRecall: false
    }, { status: 500 })
  }
}