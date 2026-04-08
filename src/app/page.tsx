'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { LottieLobster } from '@/components/lottie-lobster'
import { ContactsPanel } from '@/components/contact-card'
import { DeviceMonitor } from '@/components/device-monitor'
import { SystemStatusCards } from '@/components/system-status-cards'
import { ToastNotifications } from '@/components/toast-notifications'
import { SettingsModal } from '@/components/settings-modal'
import { AgentProfileModal } from '@/components/agent-profile-modal'
import { WebsocketTerminalRef } from '@/components/smart-terminal'
import {
  ParticleBackground,
  AIGlow,
  SoundWaves,
  SparkleEffect,
  CelebrationEffect,
  ScanlineEffect,
  MatrixRainEffect,
  FloatingParticlesEffect,
  GlitchEffect
} from '@/components/voice-animations'
import { ChatInput, MessageList } from '@/components/chat-input'
import { SmartTerminal } from '@/components/smart-terminal'
import { WebsocketTerminal, Channel } from '@/components/websocket-terminal'
import { contacts, Contact, Message, getAIResponse, cn } from '@/lib/utils'

// Channel 数据类型
interface ChannelData {
  id: string
  name: string
  nameZh: string
  nameEn: string
  icon: string
  enabled: boolean
  configured: boolean
}

export default function Home() {
  // 状态
  const [currentAssistant, setCurrentAssistant] = useState<Contact>(contacts[0])
  const [channels, setChannels] = useState<ChannelData[]>([])
  const [chatChannels, setChatChannels] = useState<Channel[]>([])
  const [selectedChatChannel, setSelectedChatChannel] = useState<string>('main')
  const [chatMessages, setChatMessages] = useState<{ id: string; channelId: string; text: string; isUser: boolean; timestamp: number }[]>([])
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const websocketTerminalRef = useRef<WebsocketTerminalRef>(null) // 使用 SmartTerminal 导出的类型
  const chatInputRef = useRef<HTMLInputElement>(null) // 聊天输入框 ref
  const messagesEndRef = useRef<HTMLDivElement>(null) // 消息列表底部 ref，用于自动滚屏
  const [isSleeping, setIsSleeping] = useState(false)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false) // Terminal 弹窗状态
  const [appVersion, setAppVersion] = useState('v2.0.0') // 应用版本号
  const [isAnimating, setIsAnimating] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [celebrationTrigger, setCelebrationTrigger] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false) // 默认关闭聊天框
  const [isAIThinking, setIsAIThinking] = useState(false) // AI 思考状态
  
  // Agent 个人信息弹窗状态
  const [isAgentProfileOpen, setIsAgentProfileOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [selectedAgentName, setSelectedAgentName] = useState('')
  const [selectedAgentAvatar, setSelectedAgentAvatar] = useState('')
  
  // 设置相关状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [customTitle, setCustomTitle] = useState('YSK小龙虾工作监控系统')
  const [customLogo, setCustomLogo] = useState('/openclaw.png')
  const [lobsterCount, setLobsterCount] = useState(5)
  const [teamName, setTeamName] = useState('海洋战队')
  const [unit, setUnit] = useState('只虾')
  const [avatarStyle, setAvatarStyle] = useState('bottts')
  const [effects, setEffects] = useState<string[]>(['scanline']) // 默认开启扫描线
  const [githubStars, setGithubStars] = useState<number | null>(null)
  
  // 从 localStorage 加载聊天记录和自定义设置
  useEffect(() => {
    const savedChatMessages = localStorage.getItem('openclaw-chat-messages')
    const savedAssistantId = localStorage.getItem('openclaw-chat-assistant')
    const savedTitle = localStorage.getItem('openclaw-custom-title')
    const savedLogo = localStorage.getItem('openclaw-custom-logo')
    const savedLobsterCount = localStorage.getItem('openclaw-lobster-count')
    const savedTeamName = localStorage.getItem('openclaw-team-name')
    const savedUnit = localStorage.getItem('openclaw-unit')
    const savedAvatarStyle = localStorage.getItem('openclaw-avatar-style')
    const savedEffects = localStorage.getItem('openclaw-effects')
    
    if (savedChatMessages) {
      try {
        const parsed = JSON.parse(savedChatMessages)
        // 使用 setTimeout 避免在 effect 中直接调用 setState
        setTimeout(() => setChatMessages(parsed), 0)
      } catch (e) {
        console.error('Failed to parse saved chat messages:', e)
      }
    }
    
    if (savedAssistantId) {
      const assistant = contacts.find(c => c.id === savedAssistantId)
      if (assistant) {
        setTimeout(() => setCurrentAssistant(assistant), 0)
      }
    }
    
    if (savedTitle) {
      setTimeout(() => setCustomTitle(savedTitle), 0)
    }
    
    if (savedLogo) {
      setTimeout(() => setCustomLogo(savedLogo), 0)
    }
    
    if (savedLobsterCount) {
      const count = parseInt(savedLobsterCount)
      if (!isNaN(count) && count >= 1 && count <= 20) {
        setTimeout(() => setLobsterCount(count), 0)
      }
    }
    
    if (savedTeamName) {
      setTimeout(() => setTeamName(savedTeamName), 0)
    }
    
    if (savedUnit) {
      setTimeout(() => setUnit(savedUnit), 0)
    }
    
    if (savedAvatarStyle) {
      setTimeout(() => setAvatarStyle(savedAvatarStyle), 0)
    }
    
    if (savedEffects) {
      try {
        const parsedEffects = JSON.parse(savedEffects)
        if (Array.isArray(parsedEffects)) {
          setTimeout(() => setEffects(parsedEffects), 0)
        }
      } catch (e) {
        console.error('Failed to parse saved effects:', e)
      }
    }
  }, [])
  
  // 保存聊天记录到 localStorage
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('openclaw-chat-messages', JSON.stringify(chatMessages))
    }
    localStorage.setItem('openclaw-chat-assistant', currentAssistant.id)
  }, [chatMessages, currentAssistant.id])
  
  // 睡眠计时器
  useEffect(() => {
    if (isVoiceMode || chatMessages.length > 0 || isChatOpen) {
      const wakeTimer = setTimeout(() => {
        setIsSleeping(false)
      }, 0)
      return () => clearTimeout(wakeTimer)
    }
    
    const timer = setTimeout(() => {
      setIsSleeping(true)
    }, 10000)
    
    return () => clearTimeout(timer)
  }, [isVoiceMode, chatMessages, isChatOpen])
  
  // 初始化加载 channels
  // 初始化加载 channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/channels')
        const data = await response.json()
        if (data.channels) {
          setChannels(data.channels)
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error)
      }
    }
    fetchChannels()
  }, [])
  
  // 获取 GitHub stars
  useEffect(() => {
    const fetchGithubStars = async () => {
      try {
        const response = await fetch('/api/github-stars')
        const data = await response.json()
        if (data.stars !== undefined) {
          setGithubStars(data.stars)
        }
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error)
      }
    }
    fetchGithubStars()
  }, [])
  
  // 选择联系人 - 打开 Agent 个人信息弹窗
  const handleSelectContact = useCallback((contact: Contact) => {
    setSelectedAgentId(contact.id)
    setSelectedAgentName(contact.name)
    setSelectedAgentAvatar(contact.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${contact.id}`)
    setIsAgentProfileOpen(true)
  }, [])
  
  // 处理联系人状态变化
  const handleStatusChange = useCallback((contactId: string, newStatus: Contact['status']) => {
    // 如果是当前选中的联系人，更新其状态
    if (currentAssistant.id === contactId) {
      setCurrentAssistant(prev => ({ ...prev, status: newStatus }))
    }
  }, [currentAssistant.id])
  
  // 发送消息
  const handleSendMessage = useCallback((text: string) => {
    setIsSleeping(false)
    setIsAIThinking(true) // 开始思考
    
    // 添加用户消息
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      type: 'user',
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMsg])
    
    // 模拟 AI 思考和回复 (2-4秒随机延迟)
    const thinkTime = 2000 + Math.random() * 2000
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(text, currentAssistant.name),
        type: 'ai',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, aiMsg])
      setIsAIThinking(false) // 结束思考
      setCelebrationTrigger(prev => prev + 1)
    }, thinkTime)
  }, [currentAssistant])
  
  // 发送聊天消息到 OpenClaw
  const handleSendChatMessage = useCallback((text: string) => {
    console.log('🔍 handleSendChatMessage 调用:', { text, selectedChatChannel })
    console.log('🔌 websocketTerminalRef:', websocketTerminalRef.current)
    
    if (!websocketTerminalRef.current) {
      console.warn('⚠️ websocketTerminalRef 为空')
      return
    }
    
    const success = websocketTerminalRef.current.sendChatMessage(selectedChatChannel, text)
    console.log('📤 sendChatMessage 返回:', success)
    
    if (success) {
      // 添加用户消息到聊天列表
      const userMsg = {
        id: Date.now().toString(),
        channelId: selectedChatChannel,
        text,
        isUser: true,
        timestamp: Date.now()
      }
      console.log('✅ 添加用户消息:', userMsg)
      setChatMessages(prev => [...prev, userMsg])
      // 显示 AI 思考状态
      console.log('💭 设置 AI 思考状态为 true')
      setIsAIThinking(true)
    } else {
      console.warn('⚠️ sendChatMessage 返回 false')
    }
  }, [selectedChatChannel])

  // 监听 WebSocket 聊天消息事件 - 修复：使用正确的依赖数组
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const { channelId, text, payload } = event.detail
      console.log('📨 收到聊天消息事件:', { channelId, text })
      if (!text) {
        console.warn('⚠️ 聊天消息为空:', payload)
        return
      }
      // 添加 AI 回复到聊天列表
      const aiMsg = {
        id: Date.now().toString(),
        channelId,
        text,
        isUser: false,
        timestamp: Date.now()
      }
      setChatMessages(prev => [...prev, aiMsg])
      // 关闭 AI 思考状态
      setIsAIThinking(false)
    }
    
    window.addEventListener('openclaw:chat:message', handleChatMessage as EventListener)
    return () => {
      window.removeEventListener('openclaw:chat:message', handleChatMessage as EventListener)
    }
  }, []) // 空依赖数组，确保事件监听器只绑定一次

  // 自动滚屏到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // 预制命令列表
  const presetCommands = [
    { label: '问候', text: '你好', color: 'cyan' },
    { label: '介绍', text: '请介绍一下你自己', color: 'green' },
    { label: '天气', text: '今天天气怎么样？', color: 'orange' },
    { label: '写诗', text: '帮我写一首诗', color: 'purple' },
    { label: '笑话', text: '讲个笑话', color: 'pink' },
    { label: '备份', text: '/backup 备份当前配置', color: 'blue', isCommand: true },
    { label: '重启', text: '/gateway restart 重启 Gateway', color: 'red', isCommand: true },
    { label: '压缩', text: '/context compress 压缩上下文', color: 'yellow', isCommand: true }
  ]

  // /命令自动补全
  const [commandInput, setCommandInput] = useState('')
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)

  const commandSuggestions = [
    { cmd: '/backup', desc: '备份当前配置', full: '/backup 备份当前配置' },
    { cmd: '/gateway restart', desc: '重启 Gateway', full: '/gateway restart 重启 Gateway' },
    { cmd: '/gateway stop', desc: '停止 Gateway', full: '/gateway stop 停止 Gateway' },
    { cmd: '/context compress', desc: '压缩上下文', full: '/context compress 压缩上下文' },
    { cmd: '/memory clear', desc: '清空记忆', full: '/memory clear 清空记忆' },
    { cmd: '/session reset', desc: '重置会话', full: '/session reset 重置会话' },
    { cmd: '/model list', desc: '列出模型', full: '/model list 列出可用模型' },
    { cmd: '/help', desc: '显示帮助', full: '/help 显示帮助信息' }
  ]

  const handleCommandInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCommandInput(value)
    if (value.startsWith('/')) {
      setShowCommandSuggestions(true)
      setSelectedCommandIndex(0)
    } else {
      setShowCommandSuggestions(false)
    }
  }

  const handleCommandSelect = (fullCommand: string) => {
    setCommandInput(fullCommand)
    setShowCommandSuggestions(false)
    chatInputRef.current?.focus()
  }

  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommandSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCommandIndex(prev => (prev + 1) % commandSuggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCommandIndex(prev => (prev - 1 + commandSuggestions.length) % commandSuggestions.length)
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        handleCommandSelect(commandSuggestions[selectedCommandIndex].full)
      } else if (e.key === 'Escape') {
        setShowCommandSuggestions(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (commandInput.trim()) {
        handleSendChatMessage(commandInput.trim())
        setCommandInput('')
      }
    }
  }
  
  // 监听频道加载事件
  useEffect(() => {
    const handleChannelsLoaded = (event: CustomEvent) => {
      const { channels: loadedChannels } = event.detail
      setChatChannels(loadedChannels)
    }
    
    window.addEventListener('openclaw:channels:loaded', handleChannelsLoaded as EventListener)
    return () => {
      window.removeEventListener('openclaw:channels:loaded', handleChannelsLoaded as EventListener)
    }
  }, [])
  
  // 同步频道选择到 WebSocket 终端
  useEffect(() => {
    if (websocketTerminalRef.current && websocketTerminalRef.current.setSelectedChannel) {
      websocketTerminalRef.current.setSelectedChannel(selectedChatChannel)
    }
  }, [selectedChatChannel])
  
  // 切换语音模式
  const handleToggleVoiceMode = useCallback(() => {
    setIsVoiceMode(prev => !prev)
    if (!isVoiceMode) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }
  }, [isVoiceMode])
  
  // 保存设置
  const handleSaveSettings = useCallback((title: string, logo: string, count: number, team: string, unitName: string, style: string, newEffects: string[]) => {
    setCustomTitle(title)
    setCustomLogo(logo)
    setLobsterCount(count)
    setTeamName(team)
    setUnit(unitName)
    setAvatarStyle(style)
    setEffects(newEffects)
    localStorage.setItem('openclaw-custom-title', title)
    localStorage.setItem('openclaw-custom-logo', logo)
    localStorage.setItem('openclaw-lobster-count', count.toString())
    localStorage.setItem('openclaw-team-name', team)
    localStorage.setItem('openclaw-unit', unitName)
    localStorage.setItem('openclaw-avatar-style', style)
    localStorage.setItem('openclaw-effects', JSON.stringify(newEffects))
  }, [])
  
  // 格式化 star 数量
  const formatStars = (stars: number): string => {
    if (stars >= 1000) {
      return `${(stars / 1000).toFixed(1)}k`
    }
    return stars.toString()
  }

  return (
    <main className="animated-bg min-h-screen text-white overflow-hidden relative">
      {/* 特效层 - 根据设置条件渲染 */}
      {effects.includes('scanline') && <ScanlineEffect />}
      {effects.includes('matrix') && <MatrixRainEffect />}
      {effects.includes('particles') && <FloatingParticlesEffect />}
      {effects.includes('glitch') && <GlitchEffect />}
      
      {/* 粒子背景 */}
      <ParticleBackground />
      
      {/* 网格背景 */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0" />
      
      {/* 主容器 */}
      <div className="relative z-10 flex h-screen">
        {/* 左侧设备监控 */}
        <div className="border-r flex flex-col" style={{
          background: 'rgba(8, 8, 12, 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.06)'
        }}>
          <DeviceMonitor />
        </div>
        
        {/* 中间区域 - 背景内容 */}
        <div className="flex-1 flex flex-col relative">
          {/* 顶部导航 */}
          <header className="flex items-center justify-between px-6 py-4">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-[120px] h-[120px] flex items-center justify-center cursor-pointer relative overflow-hidden"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {customLogo.startsWith('data:') ? (
                  <img
                    src={customLogo}
                    alt="Custom Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={customLogo}
                    alt="OpenClaw Logo"
                    width={120}
                    height={120}
                    className="w-full h-full object-contain"
                  />
                )}
              </motion.div>
              <h1
                className={`text-5xl font-extrabold text-gradient ${effects.includes('glitch') ? 'glitch' : ''}`}
                data-text={customTitle}
              >
                {customTitle}
              </h1>
            </motion.div>
            
            <motion.div
              className="flex flex-col items-end gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 顶部图标行 */}
              <div className="flex items-center gap-3">
                {/* 文档链接 */}
                <motion.a
                  href="https://docs.openclaw.ai/zh-CN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-white/5 transition-all cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="文档"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </motion.a>
                
                {/* 设置按钮 */}
                <motion.button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-white/5 transition-all cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="设置"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </motion.button>
                
                {/* GitHub 链接 */}
                <motion.a
                  href="https://github.com/leonardozhe/openclaw-dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-white/5 transition-all cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="GitHub"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  {githubStars !== null && (
                    <span className="text-xs text-gray-400 group-hover:text-white transition-colors flex items-center gap-0.5">
                      <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {formatStars(githubStars)}
                    </span>
                  )}
                </motion.a>
              </div>
              
              {/* Channel 状态行 */}
              <div className="flex items-center gap-6">
                {/* 动态显示激活的 Channel */}
                {channels.map((channel, index) => (
                  <div key={channel.id} className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-400">{channel.nameZh}</span>
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: channel.enabled && channel.configured ? '#00FF66' : '#FF4040',
                        boxShadow: `0 0 6px ${channel.enabled && channel.configured ? '#00FF66' : '#FF4040'}`
                      }}
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                    />
                    <span className={`text-xs ${channel.enabled && channel.configured ? 'text-green-400' : 'text-red-400'}`}>
                      {channel.enabled && channel.configured ? '已连接' : '未配置'}
                    </span>
                  </div>
                ))}
                
                {/* 如果没有配置任何 channel，显示提示 */}
                {channels.length === 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-400">暂无激活渠道</span>
                  </div>
                )}
              </div>
            </motion.div>
          </header>
          
          {/* 系统状态卡片 */}
          <SystemStatusCards />

          {/* OpenClaw 聊天框 - 最大化占据剩余空间 */}
          <div className="flex-1 px-4 pb-3 min-h-0">
            <div className="rounded-xl overflow-hidden border h-full flex flex-col" style={{
              background: 'rgba(15, 15, 25, 0.95)',
              borderColor: 'rgba(0, 240, 255, 0.2)',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)'
            }}>
              {/* 聊天头部 - 频道选择器和模型信息 */}
              <div className="px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0" style={{
                borderColor: 'rgba(0, 240, 255, 0.15)',
                background: 'rgba(0, 240, 255, 0.03)'
              }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0, 240, 255, 0.1)' }}>
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-xs font-bold text-white">OpenClaw 聊天</span>
                  </div>
                  <select
                    value={selectedChatChannel}
                    onChange={(e) => setSelectedChatChannel(e.target.value)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white/5 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    {chatChannels.length > 0 ? (
                      chatChannels.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.nameZh || ch.name}
                        </option>
                      ))
                    ) : (
                      <option value="main">主频道</option>
                    )}
                  </select>
                  {/* 模型信息显示 */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={{ background: 'rgba(157, 0, 255, 0.1)', color: '#9D00FF', border: '1px solid rgba(157, 0, 255, 0.2)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>AI 助手</span>
                  </div>
                </div>
                {/* 状态指示器 */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>在线</span>
                  </div>
                </div>
              </div>
              
              {/* 聊天消息列表 - 占据剩余空间 */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 240, 255, 0.3) rgba(0, 0, 0, 0.2)'
              }}>
                {chatMessages.length === 0 && !isAIThinking ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                        <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-base font-medium text-white">暂无消息</p>
                      <p className="text-xs mt-2 text-gray-500">选择频道后，输入消息或点击预制命令开始对话</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-xl border backdrop-blur-sm ${
                            msg.isUser
                              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border-cyan-400/40 text-white'
                              : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/40 text-green-50'
                          }`}
                          style={{
                            boxShadow: msg.isUser
                              ? '0 0 25px rgba(6, 182, 212, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                              : '0 0 20px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              msg.isUser
                                ? 'bg-gradient-to-r from-cyan-400 to-blue-400'
                                : 'bg-gradient-to-r from-green-400 to-emerald-400'
                            }`}>
                              {msg.isUser ? (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs font-medium ${msg.isUser ? 'text-cyan-300' : 'text-green-300'}`}>
                              {msg.isUser ? '你' : 'AI'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </motion.div>
                    ))}
                    {/* AI 思考动画 - 专业风格 */}
                    {isAIThinking && (
                      <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                          <div className="flex gap-1">
                            <motion.span
                              className="w-1.5 h-1.5 rounded-full bg-green-400"
                              animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span
                              className="w-1.5 h-1.5 rounded-full bg-green-400"
                              animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                            />
                            <motion.span
                              className="w-1.5 h-1.5 rounded-full bg-green-400"
                              animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                            />
                          </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border" style={{
                          background: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          boxShadow: '0 0 15px rgba(34, 197, 94, 0.1)'
                        }}>
                          <span className="text-xs text-green-300 font-medium">AI 正在思考...</span>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
                {/* 自动滚屏锚点 */}
                <div ref={messagesEndRef} />
              </div>
              
              {/* 预制命令按钮栏 */}
              <div className="px-4 py-2 border-t flex-shrink-0" style={{
                borderColor: 'rgba(0, 240, 255, 0.1)',
                background: 'rgba(0, 240, 255, 0.02)'
              }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 mr-2">快捷命令:</span>
                  {presetCommands.map((cmd, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSendChatMessage(cmd.text)}
                      className="px-2.5 py-1 rounded text-xs font-medium transition-all hover:scale-105"
                      style={{
                        background: `rgba(var(--${cmd.color}-rgb), 0.15)`,
                        color: `var(--${cmd.color})`,
                        border: `1px solid rgba(var(--${cmd.color}-rgb), 0.3)`
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {cmd.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* 聊天输入框 */}
              <div className="px-4 py-3 border-t flex-shrink-0 relative" style={{
                borderColor: 'rgba(0, 240, 255, 0.15)',
                background: 'rgba(0, 240, 255, 0.02)'
              }}>
                {/* /命令自动补全提示 */}
                {showCommandSuggestions && (
                  <div className="absolute bottom-full left-4 right-20 mb-2 rounded-lg border overflow-hidden shadow-lg z-10" style={{
                    background: 'rgba(15, 15, 25, 0.98)',
                    borderColor: 'rgba(0, 240, 255, 0.3)',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
                  }}>
                    {commandSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.cmd}
                        onClick={() => handleCommandSelect(suggestion.full)}
                        className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${
                          index === selectedCommandIndex
                            ? 'bg-cyan-500/20'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <span className="text-sm font-mono text-cyan-400">{suggestion.cmd}</span>
                          <span className="text-xs text-gray-500 ml-2">- {suggestion.desc}</span>
                        </div>
                        {index === selectedCommandIndex && (
                          <span className="text-xs text-gray-500">Tab 选择</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = e.currentTarget.querySelector<HTMLInputElement>('input')
                    if (input?.value?.trim()) {
                      handleSendChatMessage(input.value.trim())
                      input.value = ''
                      setCommandInput('')
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={handleCommandKeyDown}
                    placeholder="输入消息或 / 命令，按回车发送..."
                    disabled={isAIThinking}
                    className="flex-1 bg-white/5 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                  />
                  <motion.button
                    type="submit"
                    disabled={isAIThinking}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #00F0FF 0%, #00FF66 100%)',
                      boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                    }}
                    whileHover={{ scale: isAIThinking ? 1 : 1.02 }}
                    whileTap={{ scale: isAIThinking ? 1 : 0.98 }}
                  >
                    发送
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
          
          {/* 悬浮聊天框 - 点击头像时显示 */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[800px] rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(15, 15, 25, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: `0 0 60px rgba(0, 240, 255, 0.15), 0 0 100px rgba(255, 0, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)`
                }}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {/* 聊天头部 */}
                <div className="px-5 py-3 border-b flex items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{
                      border: `2px solid ${currentAssistant.color}`,
                      boxShadow: `0 0 20px ${currentAssistant.color}30`
                    }}
                  >
                    <img
                      src={currentAssistant.avatar || `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${currentAssistant.id}`}
                      alt={currentAssistant.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold truncate" style={{ color: currentAssistant.color }}>
                      {currentAssistant.name}
                    </h2>
                    <p className="text-xs text-gray-500 truncate">{currentAssistant.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* AI 思考状态 */}
                    {isAIThinking && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(0, 240, 255, 0.1)' }}>
                        <motion.div
                          className="w-2 h-2 rounded-full bg-cyan-400"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-xs text-cyan-400">思考中...</span>
                      </div>
                    )}
                    {/* 关闭按钮 */}
                    <motion.button
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      onClick={() => setIsChatOpen(false)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
                
                {/* 消息区域 - 扁平化 */}
                <div className="h-[280px] overflow-y-auto px-5 py-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="mb-3">
                        <LottieLobster
                          color={currentAssistant.color}
                          size={100}
                          isSleeping={isSleeping}
                          isListening={isVoiceMode}
                        />
                      </div>
                      <p className="text-sm font-semibold mb-1" style={{ color: currentAssistant.color }}>
                        {isSleeping ? '💤 休眠中...' : `GM! 我是 ${currentAssistant.name}`}
                      </p>
                      <p className="text-xs text-gray-500 mb-2 max-w-xs">
                        {currentAssistant.bio}
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {currentAssistant.skills.slice(0, 3).map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              background: `${currentAssistant.color}15`,
                              border: `1px solid ${currentAssistant.color}25`,
                              color: currentAssistant.color
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <MessageList
                        messages={messages}
                        assistantName={currentAssistant.name}
                        assistantColor={currentAssistant.color}
                        avatarStyle={avatarStyle}
                      />
                      {/* AI 思考动画 */}
                      {isAIThinking && (
                        <motion.div
                          className="flex items-end gap-2 mt-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: `1px solid ${currentAssistant.color}40` }}>
                            <img
                              src={currentAssistant.avatar || `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${currentAssistant.id}`}
                              alt={currentAssistant.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="flex gap-1">
                              <motion.span
                                className="w-2 h-2 rounded-full bg-gray-400"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              />
                              <motion.span
                                className="w-2 h-2 rounded-full bg-gray-400"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.span
                                className="w-2 h-2 rounded-full bg-gray-400"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
                
                {/* 底部输入区 */}
                <div className="px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isVoiceMode={isVoiceMode}
                    onToggleVoiceMode={handleToggleVoiceMode}
                    isDisabled={isAIThinking}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
        
        {/* 左下角版权和版本信息 + Terminal 按钮 */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
          <div className="flex flex-col text-xs text-gray-500">
            <span>© 2024 OpenClaw</span>
            <span>{appVersion}</span>
          </div>
          <motion.button
            onClick={() => setIsTerminalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
            style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#00F0FF'
            }}
            whileHover={{ scale: 1.05, background: 'rgba(0, 240, 255, 0.15)' }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Terminal</span>
          </motion.button>
        </div>
        
        {/* 右侧联系人面板 */}
        <ContactsPanel
          activeContactId={currentAssistant.id}
          onSelectContact={handleSelectContact}
          onStatusChange={handleStatusChange}
          teamName={teamName}
          unit={unit}
          avatarStyle={avatarStyle}
        />
      </div>
      
      {/* 右下角弹窗通知 */}
      <ToastNotifications />
      
      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTitle={customTitle}
        currentLogo={customLogo}
        currentLobsterCount={lobsterCount}
        currentTeamName={teamName}
        currentUnit={unit}
        currentAvatarStyle={avatarStyle}
        currentEffects={effects}
        onSave={handleSaveSettings}
      />
      
      {/* Agent 个人信息弹窗 */}
      <AgentProfileModal
        isOpen={isAgentProfileOpen}
        onClose={() => setIsAgentProfileOpen(false)}
        agentId={selectedAgentId}
        agentName={selectedAgentName}
        avatarUrl={selectedAgentAvatar}
      />
      
      {/* SmartTerminal - 隐藏渲染，仅提供 ref 给聊天功能使用 */}
      <div className="hidden">
        <SmartTerminal ref={websocketTerminalRef} />
      </div>
      
      {/* Terminal 弹窗 */}
      <AnimatePresence>
        {isTerminalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTerminalOpen(false)} />
            <motion.div
              className="relative w-full max-w-5xl h-[80vh] rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(15, 15, 25, 0.98)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                boxShadow: '0 0 60px rgba(0, 240, 255, 0.2)'
              }}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Terminal 头部 */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(0, 240, 255, 0.2)', background: 'rgba(0, 240, 255, 0.05)' }}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-white">OpenClaw Terminal</span>
                </div>
                <button
                  onClick={() => setIsTerminalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Terminal 内容 */}
              <div className="h-[calc(100%-52px)]">
                <SmartTerminal className="h-full" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
