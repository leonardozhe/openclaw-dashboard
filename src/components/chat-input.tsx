'use client'

import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff } from 'lucide-react'
import { Message } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (text: string) => void
  isVoiceMode: boolean
  onToggleVoiceMode: () => void
  isDisabled?: boolean
}

export function ChatInput({ onSendMessage, isVoiceMode, onToggleVoiceMode, isDisabled = false }: ChatInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isDisabled) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-1.5 rounded-xl transition-all duration-200"
        style={{
          background: 'rgba(15, 15, 20, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isDisabled ? "AI 正在思考..." : "输入消息..."}
          disabled={isDisabled}
          className="flex-1 bg-transparent px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none rounded-lg transition-all disabled:opacity-50"
        />
        
        <motion.button
          type="submit"
          disabled={isDisabled}
          className="p-2.5 rounded-lg transition-all disabled:opacity-50"
          style={{
            background: isDisabled ? 'rgba(100, 100, 100, 0.5)' : 'linear-gradient(135deg, #00F0FF 0%, #00FF66 100%)',
            boxShadow: isDisabled ? 'none' : '0 0 12px rgba(0, 240, 255, 0.25)'
          }}
          whileHover={isDisabled ? {} : { scale: 1.02 }}
          whileTap={isDisabled ? {} : { scale: 0.98 }}
        >
          <Send className="w-4 h-4 text-black relative z-10" />
        </motion.button>
        
        <motion.button
          type="button"
          disabled={isDisabled}
          className="p-2.5 rounded-lg transition-all disabled:opacity-50"
          style={{
            background: isVoiceMode
              ? 'linear-gradient(135deg, #FF0040 0%, #FF0080 100%)'
              : 'linear-gradient(135deg, #FF00FF 0%, #9D00FF 100%)',
            boxShadow: isVoiceMode
              ? '0 0 16px rgba(255, 0, 64, 0.35)'
              : '0 0 12px rgba(255, 0, 255, 0.25)'
          }}
          onClick={onToggleVoiceMode}
          whileHover={isDisabled ? {} : { scale: 1.02 }}
          whileTap={isDisabled ? {} : { scale: 0.98 }}
          animate={isVoiceMode && !isDisabled ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1.5, repeat: isVoiceMode && !isDisabled ? Infinity : 0 }}
        >
          {isVoiceMode ? (
            <MicOff className="w-4 h-4 text-white relative z-10" />
          ) : (
            <Mic className="w-4 h-4 text-white relative z-10" />
          )}
        </motion.button>
      </form>
    </div>
  )
}

// DiceBear Bottts 头像生成器
function getDiceBearAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}`
}

// 消息列表组件
interface MessageListProps {
  messages: Message[]
  assistantName?: string
  assistantColor?: string
}

export function MessageList({ messages, assistantName = 'OpenClaw', assistantColor = '#00F0FF' }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div
      ref={listRef}
      className="max-w-2xl mx-auto mb-4 max-h-40 overflow-y-auto space-y-3"
    >
      {messages.map((msg, index) => (
        <motion.div
          key={msg.id}
          className={`flex items-end gap-2 ${
            msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'
          }`}
          initial={{ opacity: 0, y: 20, x: msg.type === 'user' ? 20 : -20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {/* 头像 */}
          <motion.div
            className={`flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ${
              msg.type === 'user' ? 'ml-2' : 'mr-2'
            }`}
            style={{
              boxShadow: msg.type === 'user'
                ? '0 0 10px rgba(0, 240, 255, 0.5)'
                : `0 0 10px ${assistantColor}50`
            }}
            whileHover={{ scale: 1.1 }}
          >
            {msg.type === 'user' ? (
              // 用户头像
              <img
                src={getDiceBearAvatar('user')}
                alt="用户"
                className="w-full h-full object-cover"
              />
            ) : (
              // AI 头像 - 基于助手名称生成
              <img
                src={getDiceBearAvatar(assistantName.toLowerCase())}
                alt={assistantName}
                className="w-full h-full object-cover"
              />
            )}
          </motion.div>
          
          {/* 消息气泡 */}
          <div
            className={`p-3 max-w-xs ${
              msg.type === 'user'
                ? 'message-bubble-user text-right'
                : 'message-bubble-ai text-left'
            }`}
            style={msg.type !== 'user' ? { borderColor: `${assistantColor}40` } : {}}
          >
            {msg.text}
          </div>
        </motion.div>
      ))}
    </div>
  )
}