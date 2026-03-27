import { NextResponse } from 'next/server'

interface OllamaModel {
  name: string
  model: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    parameter_size: string
    quantization_level: string
  }
}

interface OllamaRunningModel {
  name: string
  model: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    parameter_size: string
    quantization_level: string
  }
  size_vram: number
}

interface OllamaTagsResponse {
  models: OllamaModel[]
}

interface OllamaPsResponse {
  models: OllamaRunningModel[]
}

export async function GET() {
  try {
    // 尝试多个可能的 Ollama 主机地址
    const possibleHosts = [
      process.env.OLLAMA_HOST,
      'http://localhost:11434',
      'http://127.0.0.1:11434',
      'http://host.docker.internal:11434'
    ].filter(Boolean) as string[]
    
    let downloadedModels: OllamaModel[] = []
    let runningModels: OllamaRunningModel[] = []
    let connectedHost: string | null = null
    
    // 尝试连接到 Ollama
    for (const host of possibleHosts) {
      try {
        const tagsResponse = await fetch(`${host}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3秒超时
        })
        if (tagsResponse.ok) {
          const tagsData: OllamaTagsResponse = await tagsResponse.json()
          downloadedModels = tagsData.models || []
          connectedHost = host
          break
        }
      } catch {
        // 继续尝试下一个地址
      }
    }
    
    // 如果成功连接，获取正在运行的模型
    if (connectedHost) {
      try {
        const psResponse = await fetch(`${connectedHost}/api/ps`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        })
        if (psResponse.ok) {
          const psData: OllamaPsResponse = await psResponse.json()
          runningModels = psData.models || []
        }
      } catch {
        // 忽略错误
      }
    }
    
    const isRunning = runningModels.length > 0 || downloadedModels.length > 0
    
    return NextResponse.json({
      isRunning,
      downloadedCount: downloadedModels.length,
      runningCount: runningModels.length,
      downloadedModels: downloadedModels.map(m => ({
        name: m.name,
        size: m.size,
        family: m.details?.family,
        parameterSize: m.details?.parameter_size
      })),
      runningModels: runningModels.map(m => ({
        name: m.name,
        size: m.size,
        sizeVram: m.size_vram,
        family: m.details?.family,
        parameterSize: m.details?.parameter_size
      })),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching Ollama status:', error)
    return NextResponse.json({
      isRunning: false,
      downloadedCount: 0,
      runningCount: 0,
      downloadedModels: [],
      runningModels: [],
      error: 'Failed to connect to Ollama'
    })
  }
}