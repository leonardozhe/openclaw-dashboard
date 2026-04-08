'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { LottieLobster } from '@/components/lottie-lobster'
import { ContactsPanel } from '@/components/contact-card'
import { DeviceMonitor } from '@/components/device-monitor'
import { SystemStatusCards } from '@/components/system-status-cards'
import { ToastNotifications } from '@/components/toast-notifications'
import { SettingsModal } from '@/components/settings-modal'
import { AgentProfileModal } from '@/components/agent-profile-modal'
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
import { useRef } from 'react'
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
  const websocketTerminalRef = useRef<{ sendChatMessage: (channelId: string, text: string) => boolean; channels: Channel[]; selectedChannel: string; setSelectedChannel: (channel: string) => void }>(null)
  const [isSleeping, setIsSleeping] = useState(false)
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
    const savedMessages = localStorage.getItem('openclaw-chat-messages')
    const savedAssistantId = localStorage.getItem('openclaw-chat-assistant')
    const savedTitle = localStorage.getItem('openclaw-custom-title')
    const savedLogo = localStorage.getItem('openclaw-custom-logo')
    const savedLobsterCount = localStorage.getItem('openclaw-lobster-count')
    const savedTeamName = localStorage.getItem('openclaw-team-name')
    const savedUnit = localStorage.getItem('openclaw-unit')
    const savedAvatarStyle = localStorage.getItem('openclaw-avatar-style')
    const savedEffects = localStorage.getItem('openclaw-effects')
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        // 使用 setTimeout 避免在 effect 中直接调用 setState
        setTimeout(() => setMessages(parsed), 0)
      } catch (e) {
        console.error('Failed to parse saved messages:', e)
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
    if (messages.length > 0) {
      localStorage.setItem('openclaw-chat-messages', JSON.stringify(messages))
    }
    localStorage.setItem('openclaw-chat-assistant', currentAssistant.id)
  }, [messages, currentAssistant.id])
  
  // 睡眠计时器
  useEffect(() => {
    if (isVoiceMode || messages.length > 0 || isChatOpen) {
      const wakeTimer = setTimeout(() => {
        setIsSleeping(false)
      }, 0)
      return () => clearTimeout(wakeTimer)
    }
    
    const timer = setTimeout(() => {
      setIsSleeping(true)
    }, 10000)
    
    return () => clearTimeout(timer)
  }, [isVoiceMode, messages, isChatOpen])
  
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
  
  // 监听 WebSocket 聊天消息事件
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const { channelId, text, payload } = event.detail
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
  }, [])
  
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

          {/* OpenClaw 智能终端 */}
          <div className="px-4 py-3">
            <SmartTerminal ref={websocketTerminalRef} />
          </div>
          
          {/* OpenClaw 聊天框 - 在终端下方 */}
          <div className="px-4 pb-3">
            <div className="rounded-xl overflow-hidden border" style={{
              background: 'rgba(15, 15, 25, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              {/* 聊天头部 - 频道选择器 */}
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-bold text-white">OpenClaw 聊天</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedChatChannel}
                    onChange={(e) => setSelectedChatChannel(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    {chatChannels.length > 0 ? (
                      chatChannels.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.nameZh || ch.name} ({ch.id})
                        </option>
                      ))
                    ) : (
                      <option value="main">主频道 (main)</option>
                    )}
                  </select>
                </div>
              </div>
              
              {/* 聊天消息列表 - 默认最小化高度 */}
              <div className="h-48 overflow-y-auto px-4 py-3 space-y-3" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.2) rgba(0,0,0,0.1)'
              }}>
                {chatMessages.length === 0 && !isAIThinking ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>暂无消息</p>
                      <p className="text-xs mt-1">在上方选择频道，输入消息后按回车发送</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-lg border ${
                            msg.isUser
                              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-white'
                              : 'bg-black/40 border-green-500/50 text-green-100'
                          }`}
                          style={{
                            boxShadow: msg.isUser ? '0 0 20px rgba(6, 182, 212, 0.3)' : '0 0 20px rgba(34, 197, 94, 0.2)'
                          }}
                        >
                          <p className="text-sm font-mono">{msg.text}</p>
                          <p className={`text-xs mt-1 font-mono ${msg.isUser ? 'text-cyan-300/70' : 'text-green-400/70'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* AI 思考动画 - 绿色黑客风格 */}
                    {isAIThinking && (
                      <motion.div
                        className="flex items-end gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                          <img
                            src="/openclaw.png"
                            alt="OpenClaw"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="px-4 py-2 rounded-lg border border-green-500/50 bg-black/40" style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)' }}>
                          <div className="flex gap-1">
                            <motion.span
                              className="w-2 h-2 rounded-full bg-green-400"
                              animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span
                              className="w-2 h-2 rounded-full bg-green-400"
                              animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.span
                              className="w-2 h-2 rounded-full bg-green-400"
                              animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
              
              {/* 聊天输入框 */}
              <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input')
                    if (input?.value?.trim()) {
                      handleSendChatMessage(input.value.trim())
                      input.value = ''
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="输入消息，按回车发送..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition-opacity"
                  >
                    发送
                  </button>
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
    </main>
  )
}
