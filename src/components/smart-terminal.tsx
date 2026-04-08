'use client'

import { forwardRef, ForwardedRef } from 'react'
import { WebsocketTerminal, Channel } from '@/components/websocket-terminal'

interface SmartTerminalProps {
  className?: string
}

interface WebsocketTerminalRef {
  sendChatMessage: (channelId: string, text: string) => boolean
  channels: Channel[]
  selectedChannel: string
  setSelectedChannel: (channel: string) => void
}

export const SmartTerminal = forwardRef<WebsocketTerminalRef, SmartTerminalProps>(({ className = '' }, ref) => {
  return (
    <div className={className}>
      {/* 聊天功能需要 WebSocket 终端，所以始终使用 WebsocketTerminal */}
      {/* PTY 终端仅用于纯本地终端场景，不支持聊天 */}
      <WebsocketTerminal ref={ref as ForwardedRef<WebsocketTerminalRef>} />
    </div>
  )
})

SmartTerminal.displayName = 'SmartTerminal'