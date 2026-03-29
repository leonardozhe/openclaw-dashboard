/**
 * Tauri PTY Terminal API
 * 用于在 Tauri 桌面应用中创建真正的 PTY 终端
 */

// 检查是否在 Tauri 环境中运行
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

// PTY 会话接口
export interface PtySession {
  sessionId: string
  cols: number
  rows: number
}

// 终端输出事件
export interface TerminalOutput {
  session_id: string
  data: string
}

// 终端错误事件
export interface TerminalError {
  session_id: string
  error: string
}

// PTY API 封装
export const ptyApi = {
  /**
   * 创建新的 PTY 会话
   */
  async createSession(sessionId: string, cols: number = 80, rows: number = 24): Promise<void> {
    if (!isTauri()) {
      throw new Error('PTY only available in Tauri environment')
    }
    
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('create_pty_session', { sessionId, cols, rows })
  },

  /**
   * 向 PTY 写入数据
   */
  async write(sessionId: string, data: string): Promise<void> {
    if (!isTauri()) {
      throw new Error('PTY only available in Tauri environment')
    }
    
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('write_to_pty', { sessionId, data })
  },

  /**
   * 调整 PTY 大小
   */
  async resize(sessionId: string, cols: number, rows: number): Promise<void> {
    if (!isTauri()) {
      throw new Error('PTY only available in Tauri environment')
    }
    
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('resize_pty', { sessionId, cols, rows })
  },

  /**
   * 关闭 PTY 会话
   */
  async closeSession(sessionId: string): Promise<void> {
    if (!isTauri()) {
      throw new Error('PTY only available in Tauri environment')
    }
    
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('close_pty_session', { sessionId })
  },

  /**
   * 监听终端输出
   */
  async onOutput(callback: (output: TerminalOutput) => void): Promise<() => void> {
    if (!isTauri()) {
      throw new Error('PTY only available in Tauri environment')
    }
    
    const { listen } = await import('@tauri-apps/api/event')
    const unlisten = await listen<TerminalOutput>('terminal-output', (event) => {
      callback(event.payload)
    })
    return unlisten
  },

  /**
   * 监听终端错误
   */
  async onError(callback: (error: TerminalError) => void): Promise<() => void> {
    if (!isTauri()) {
      throw new Error('PTY only available in Tauri environment')
    }
    
    const { listen } = await import('@tauri-apps/api/event')
    const unlisten = await listen<TerminalError>('terminal-error', (event) => {
      callback(event.payload)
    })
    return unlisten
  },

  /**
   * 监听终端退出
   */
  async onExit(callback: (sessionId: string) => void): Promise<() => void> {
    if (!isTauri()) {
      throw new Error('PTY only available in Tauri environment')
    }
    
    const { listen } = await import('@tauri-apps/api/event')
    const unlisten = await listen<string>('terminal-exit', (event) => {
      callback(event.payload)
    })
    return unlisten
  },

  /**
   * 检查 OpenClaw 是否已安装
   */
  async checkOpenClawInstalled(): Promise<boolean> {
    if (!isTauri()) {
      return false
    }
    
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<boolean>('check_openclaw_installed')
  },

  /**
   * 执行 OpenClaw 命令（非交互式）
   */
  async executeOpenClawCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
    if (!isTauri()) {
      throw new Error('PTY only available in Tauri environment')
    }
    
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke('execute_openclaw_command', { command })
  }
}