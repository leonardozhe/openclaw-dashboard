'use client'

import { useState } from 'react'
import { Terminal as TerminalIcon, Monitor, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PtyTerminal } from '@/components/pty-terminal'
import { WebsocketTerminal } from '@/components/websocket-terminal'
import { isTauri } from '@/lib/tauri-pty'

interface SmartTerminalProps {
  className?: string
}

export function SmartTerminal({ className = '' }: SmartTerminalProps) {
  const [showTerminal, setShowTerminal] = useState(false)
  const [terminalType, setTerminalType] = useState<'auto' | 'pty' | 'websocket'>('auto')
  
  const tauriEnv = isTauri()
  
  // 根据环境和用户选择决定使用哪种终端
  const getTerminalComponent = () => {
    if (terminalType === 'pty' && tauriEnv) {
      return <PtyTerminal sessionId="openclaw-main" initialCommand="openclaw" onClose={() => setShowTerminal(false)} />
    }
    if (terminalType === 'websocket') {
      return <WebsocketTerminal />
    }
    // 自动模式：Tauri 环境用 PTY，Web 环境用 WebSocket
    if (tauriEnv) {
      return <PtyTerminal sessionId="openclaw-main" initialCommand="openclaw" onClose={() => setShowTerminal(false)} />
    }
    return <WebsocketTerminal />
  }

  const currentTerminalLabel = () => {
    if (terminalType === 'pty') return 'PTY 终端'
    if (terminalType === 'websocket') return 'WebSocket 终端'
    return tauriEnv ? 'PTY 终端 (自动)' : 'WebSocket 终端 (自动)'
  }

  return (
    <div className={className}>
      {/* 终端选择器 */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 rounded-t-lg border border-zinc-800/50 border-b-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-zinc-200">OpenClaw 终端</span>
          <span className="text-xs text-zinc-500">({currentTerminalLabel()})</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 终端类型切换 */}
          {tauriEnv && (
            <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
              <button
                onClick={() => setTerminalType('auto')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  terminalType === 'auto' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="自动选择"
              >
                自动
              </button>
              <button
                onClick={() => setTerminalType('pty')}
                className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  terminalType === 'pty' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="PTY 终端 (桌面版)"
              >
                <Monitor className="w-3 h-3" />
                PTY
              </button>
              <button
                onClick={() => setTerminalType('websocket')}
                className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  terminalType === 'websocket' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="WebSocket 终端 (Web版)"
              >
                <Globe className="w-3 h-3" />
                WS
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showTerminal 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/50'
            }`}
          >
            {showTerminal ? '隐藏终端' : '显示终端'}
          </button>
        </div>
      </div>

      {/* 终端内容 */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {getTerminalComponent()}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 未显示时的提示 */}
      {!showTerminal && (
        <div className="px-4 py-3 bg-zinc-900/30 rounded-b-lg border border-zinc-800/50 border-t-0">
          <div className="text-xs text-zinc-500 text-center">
            {tauriEnv 
              ? '点击"显示终端"启动 PTY 终端，可直接运行 openclaw 命令和交互式 TUI'
              : '点击"显示终端"通过 WebSocket 连接到 OpenClaw 服务'
            }
          </div>
        </div>
      )}
    </div>
  )
}