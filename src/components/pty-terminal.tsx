'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal as TerminalIcon, Maximize2, Minimize2, X, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ptyApi, isTauri } from '@/lib/tauri-pty'

// xterm.js 相关导入
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface PtyTerminalProps {
  sessionId?: string
  initialCommand?: string // 启动后自动执行的命令，如 'openclaw'
  onClose?: () => void
  className?: string
}

// 终端主题配置
const TERMINAL_THEME = {
  background: '#0a0a0f',
  foreground: '#e4e4e7',
  cursor: '#22d3ee',
  cursorAccent: '#0a0a0f',
  selectionBackground: '#22d3ee40',
  black: '#18181b',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#22d3ee',
  white: '#f4f4f5',
  brightBlack: '#27272a',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#facc15',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#67e8f9',
  brightWhite: '#ffffff',
}

// 创建终端实例的辅助函数
function createTerminalInstance(container: HTMLDivElement): { term: Terminal; fitAddon: FitAddon } {
  const term = new Terminal({
    theme: TERMINAL_THEME,
    fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
    fontSize: 14,
    lineHeight: 1.2,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 10000,
    allowProposedApi: true,
  })

  const fitAddon = new FitAddon()
  const webLinksAddon = new WebLinksAddon()

  term.loadAddon(fitAddon)
  term.loadAddon(webLinksAddon)
  term.open(container)
  fitAddon.fit()

  return { term, fitAddon }
}

export function PtyTerminal({
  sessionId = 'default',
  initialCommand,
  onClose,
  className = ''
}: PtyTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const unlistenRefs = useRef<(() => void)[]>([])
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const mountedRef = useRef(false)
  
  // 在渲染时直接检查 Tauri 环境（不是在 effect 中）
  const tauriEnv = isTauri()
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(tauriEnv ? null : 'PTY 终端仅在 Tauri 桌面应用中可用')
  const [isReady, setIsReady] = useState(!tauriEnv)

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setTimeout(() => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit()
      }
    }, 100)
  }

  // 初始化终端
  useEffect(() => {
    // 如果不是 Tauri 环境，不初始化
    if (!tauriEnv) return

    mountedRef.current = true

    // 等待 DOM ready
    const timer = setTimeout(async () => {
      if (!terminalRef.current || !mountedRef.current) return
      
      try {
        // 创建终端实例
        const { term, fitAddon } = createTerminalInstance(terminalRef.current)
        xtermRef.current = term
        fitAddonRef.current = fitAddon

        // 监听终端输入
        term.onData((data) => {
          ptyApi.write(sessionId, data).catch(console.error)
        })

        // 监听终端大小变化
        term.onResize(({ cols, rows }) => {
          ptyApi.resize(sessionId, cols, rows).catch(console.error)
        })

        // 使用 ResizeObserver 监听容器大小变化
        resizeObserverRef.current = new ResizeObserver(() => {
          if (fitAddonRef.current && xtermRef.current) {
            fitAddonRef.current.fit()
          }
        })
        resizeObserverRef.current.observe(terminalRef.current)

        // 设置事件监听器
        const unlistenOutput = await ptyApi.onOutput((output) => {
          if (output.session_id === sessionId && xtermRef.current) {
            xtermRef.current.write(output.data)
          }
        })
        if (!mountedRef.current) return
        unlistenRefs.current.push(unlistenOutput)

        const unlistenError = await ptyApi.onError((err) => {
          if (err.session_id === sessionId && mountedRef.current) {
            setError(err.error)
            setIsConnected(false)
          }
        })
        if (!mountedRef.current) return
        unlistenRefs.current.push(unlistenError)

        const unlistenExit = await ptyApi.onExit((exitSessionId) => {
          if (exitSessionId === sessionId && mountedRef.current) {
            setIsConnected(false)
            if (xtermRef.current) {
              xtermRef.current.write('\r\n\x1b[33m[终端已退出]\x1b[0m\r\n')
            }
          }
        })
        if (!mountedRef.current) return
        unlistenRefs.current.push(unlistenExit)

        // 创建 PTY 会话
        await ptyApi.createSession(sessionId, term.cols, term.rows)
        if (!mountedRef.current) return
        
        setIsConnected(true)
        setError(null)

        // 如果有初始命令，执行它
        if (initialCommand) {
          await ptyApi.write(sessionId, initialCommand + '\r')
        }

        setIsReady(true)
      } catch (e) {
        if (!mountedRef.current) return
        setError(`连接失败: ${e}`)
        setIsConnected(false)
        setIsReady(true)
      }
    }, 50) // 短延迟确保 DOM ready

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      
      // 清理 ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      
      // 清理事件监听器
      for (const unlisten of unlistenRefs.current) {
        unlisten()
      }
      unlistenRefs.current = []

      // 关闭 PTY 会话
      ptyApi.closeSession(sessionId).catch(console.warn)

      // 销毁 xterm
      if (xtermRef.current) {
        xtermRef.current.dispose()
        xtermRef.current = null
      }
    }
  }, [sessionId, initialCommand, tauriEnv])

  // 重连
  const reconnect = async () => {
    if (!tauriEnv) return
    
    // 清理现有连接
    for (const unlisten of unlistenRefs.current) {
      unlisten()
    }
    unlistenRefs.current = []

    try {
      await ptyApi.closeSession(sessionId)
    } catch (e) {
      console.warn('Failed to close PTY session:', e)
    }

    if (xtermRef.current) {
      xtermRef.current.dispose()
      xtermRef.current = null
    }

    setError(null)
    setIsConnected(false)
    setIsReady(false)

    // 重新初始化
    if (terminalRef.current && mountedRef.current) {
      try {
        const { term, fitAddon } = createTerminalInstance(terminalRef.current)
        xtermRef.current = term
        fitAddonRef.current = fitAddon

        term.onData((data) => {
          ptyApi.write(sessionId, data).catch(console.error)
        })

        // 设置事件监听器
        const unlistenOutput = await ptyApi.onOutput((output) => {
          if (output.session_id === sessionId && xtermRef.current) {
            xtermRef.current.write(output.data)
          }
        })
        unlistenRefs.current.push(unlistenOutput)

        const unlistenError = await ptyApi.onError((err) => {
          if (err.session_id === sessionId) {
            setError(err.error)
            setIsConnected(false)
          }
        })
        unlistenRefs.current.push(unlistenError)

        const unlistenExit = await ptyApi.onExit((exitSessionId) => {
          if (exitSessionId === sessionId) {
            setIsConnected(false)
            if (xtermRef.current) {
              xtermRef.current.write('\r\n\x1b[33m[终端已退出]\x1b[0m\r\n')
            }
          }
        })
        unlistenRefs.current.push(unlistenExit)

        await ptyApi.createSession(sessionId, term.cols, term.rows)
        setIsConnected(true)
        setError(null)

        if (initialCommand) {
          await ptyApi.write(sessionId, initialCommand + '\r')
        }
      } catch (e) {
        setError(`连接失败: ${e}`)
        setIsConnected(false)
      }
    }
    
    setIsReady(true)
  }

  return (
    <motion.div
      className={`
        ${isFullscreen 
          ? 'fixed inset-0 z-50 bg-black/95 backdrop-blur-xl' 
          : 'relative'
        }
        ${className}
      `}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 终端头部 */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-zinc-200">
            PTY 终端
          </span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-zinc-500">
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!tauriEnv && (
            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
              仅桌面版可用
            </span>
          )}
          
          {error && (
            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
              {error}
            </span>
          )}

          <button
            onClick={reconnect}
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-200"
            title="重新连接"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-200"
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-red-400"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 终端容器 */}
      <div 
        ref={terminalRef}
        className={`
          ${isFullscreen ? 'h-[calc(100vh-48px)]' : 'h-[400px]'}
          bg-[#0a0a0f] p-2 overflow-hidden
        `}
        style={{ 
          contain: 'strict',
        }}
      />

      {/* 非Tauri环境提示 */}
      <AnimatePresence>
        {!tauriEnv && isReady && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="text-center p-8 max-w-md">
              <TerminalIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-200 mb-2">
                PTY 终端需要桌面应用
              </h3>
              <p className="text-zinc-400 mb-4">
                真正的 PTY 终端仅在 Tauri 桌面应用中可用。
                请下载 MeetClaw 桌面版以获得完整的终端体验。
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
              >
                关闭
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}