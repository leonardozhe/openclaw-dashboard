'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { LottieLobster } from '@/components/lottie-lobster'
import { ContactsPanel } from '@/components/contact-card'
import { DeviceMonitor } from '@/components/device-monitor'
import { ActivityLog } from '@/components/activity-log'
import { SystemStatusCards } from '@/components/system-status-cards'
import { NetworkArchitecture } from '@/components/network-architecture'
import { ToastNotifications } from '@/components/toast-notifications'
import {
  ParticleBackground,
  AIGlow,
  SoundWaves,
  SparkleEffect,
  CelebrationEffect,
  ScanlineEffect
} from '@/components/voice-animations'
import { ChatInput, MessageList } from '@/components/chat-input'
import { contacts, Contact, Message, getAIResponse, cn } from '@/lib/utils'

export default function Home() {
  // 状态
  const [currentAssistant, setCurrentAssistant] = useState<Contact>(contacts[0])
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isSleeping, setIsSleeping] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [celebrationTrigger, setCelebrationTrigger] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false) // 默认关闭聊天框
  const [isAIThinking, setIsAIThinking] = useState(false) // AI 思考状态
  
  // 从 localStorage 加载聊天记录
  useEffect(() => {
    const savedMessages = localStorage.getItem('openclaw-chat-messages')
    const savedAssistantId = localStorage.getItem('openclaw-chat-assistant')
    
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
  
  // 选择联系人
  const handleSelectContact = useCallback((contact: Contact) => {
    setCurrentAssistant(contact)
    setMessages([])
    localStorage.removeItem('openclaw-chat-messages')
    setIsSleeping(false)
    setIsAnimating(true)
    setIsChatOpen(true) // 选择联系人时打开聊天框
    setTimeout(() => setIsAnimating(false), 1000)
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
  
  // 切换语音模式
  const handleToggleVoiceMode = useCallback(() => {
    setIsVoiceMode(prev => !prev)
    if (!isVoiceMode) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }
  }, [isVoiceMode])

  return (
    <main className="animated-bg min-h-screen text-white overflow-hidden relative">
      {/* 扫描线效果 */}
      <ScanlineEffect />
      
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
                <Image
                  src="/openclaw.png"
                  alt="OpenClaw Logo"
                  width={120}
                  height={120}
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <h1 className="text-3xl font-extrabold text-gradient glitch" data-text="YSK小龙虾工作监控系统">
                YSK小龙虾工作监控系统
              </h1>
            </motion.div>
            
            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 飞书连接状态 */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-400">飞书</span>
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#00FF66',
                    boxShadow: '0 0 6px #00FF66'
                  }}
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs text-green-400">已连接</span>
              </div>
              
              {/* WhatsApp连接状态 */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-400">WhatsApp</span>
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#00FF66',
                    boxShadow: '0 0 6px #00FF66'
                  }}
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <span className="text-xs text-green-400">已连接</span>
              </div>
              
              {/* Telegram连接状态 */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-400">Telegram</span>
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#00FF66',
                    boxShadow: '0 0 6px #00FF66'
                  }}
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
                <span className="text-xs text-green-400">已连接</span>
              </div>
            </motion.div>
          </header>
          
          {/* 系统状态卡片 */}
          <SystemStatusCards />
          
          {/* 网络架构图 - 默认显示 */}
          {!isChatOpen && (
            <motion.div
              className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 w-[98%] max-w-[1500px] h-[75%]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <NetworkArchitecture />
            </motion.div>
          )}
          
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
                      src={currentAssistant.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${currentAssistant.id}`}
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
                              src={currentAssistant.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${currentAssistant.id}`}
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
          
          {/* 底部滚动日志 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-52 border-t"
            style={{
              background: 'rgba(8, 8, 12, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.06)'
            }}
          >
            <ActivityLog />
          </div>
        </div>
        
        {/* 右侧联系人面板 */}
        <ContactsPanel
          contacts={contacts}
          activeContactId={currentAssistant.id}
          onSelectContact={handleSelectContact}
          onStatusChange={handleStatusChange}
        />
      </div>
      
      {/* 右下角弹窗通知 */}
      <ToastNotifications />
    </main>
  )
}
