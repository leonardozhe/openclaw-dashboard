import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

interface ChannelConfig {
  enabled?: boolean
  botToken?: string
  token?: string
  dmPolicy?: string
  groupPolicy?: string
  streaming?: string
}

interface OpenClawConfig {
  channels?: Record<string, ChannelConfig>
}

// Channel 显示名称映射
const CHANNEL_INFO: Record<string, { nameZh: string; nameEn: string; icon: string }> = {
  telegram: { nameZh: 'Telegram', nameEn: 'Telegram', icon: 'telegram' },
  discord: { nameZh: 'Discord', nameEn: 'Discord', icon: 'discord' },
  feishu: { nameZh: '飞书', nameEn: 'Feishu', icon: 'feishu' },
  whatsapp: { nameZh: 'WhatsApp', nameEn: 'WhatsApp', icon: 'whatsapp' },
  slack: { nameZh: 'Slack', nameEn: 'Slack', icon: 'slack' },
  wechat: { nameZh: '微信', nameEn: 'WeChat', icon: 'wechat' },
  dingtalk: { nameZh: '钉钉', nameEn: 'DingTalk', icon: 'dingtalk' },
}

export async function GET() {
  try {
    const homeDir = homedir()
    const configPath = join(homeDir, '.openclaw', 'openclaw.json')
    
    if (!existsSync(configPath)) {
      return NextResponse.json({
        channels: [],
        error: 'OpenClaw config not found'
      })
    }
    
    const configContent = readFileSync(configPath, 'utf-8')
    const config: OpenClawConfig = JSON.parse(configContent)
    
    const channels: {
      id: string
      name: string
      nameZh: string
      nameEn: string
      icon: string
      enabled: boolean
      configured: boolean
    }[] = []
    
    // 解析 channels
    if (config.channels) {
      for (const [channelId, channelConfig] of Object.entries(config.channels)) {
        const info = CHANNEL_INFO[channelId] || { 
          nameZh: channelId, 
          nameEn: channelId, 
          icon: channelId.toLowerCase() 
        }
        
        const hasToken = !!(channelConfig.botToken || channelConfig.token)
        const isEnabled = channelConfig.enabled !== false
        
        channels.push({
          id: channelId,
          name: info.nameZh,
          nameZh: info.nameZh,
          nameEn: info.nameEn,
          icon: info.icon,
          enabled: isEnabled,
          configured: hasToken
        })
      }
    }
    
    return NextResponse.json({
      channels,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error reading OpenClaw config:', error)
    return NextResponse.json({
      channels: [],
      error: 'Failed to read OpenClaw config'
    }, { status: 500 })
  }
}