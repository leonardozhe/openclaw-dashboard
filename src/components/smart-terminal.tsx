'use client'

import { useState, useEffect } from 'react'
import { Terminal as TerminalIcon, Monitor, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PtyTerminal } from '@/components/pty-terminal'
import { WebsocketTerminal } from '@/components/websocket-terminal'
import { isTauri } from '@/lib/tauri-pty'

interface SmartTerminalProps {
  className?: string
}

export function SmartTerminal({ className = '' }: SmartTerminalProps) {
  const tauriEnv = isTauri()
  
  return (
    <div className={className}>
      {/* 默认使用 WebSocket 终端（浏览器和 Tauri 都可用） */}
      {/* PTY 终端仅在 Tauri 环境中可用 */}
      {tauriEnv ? (
        <PtyTerminal sessionId="openclaw-main" initialCommand="openclaw tui" onClose={() => {}} />
      ) : (
        <WebsocketTerminal />
      )}
    </div>
  )
}