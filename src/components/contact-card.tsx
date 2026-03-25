'use client'

import { motion } from 'framer-motion'
import { Contact } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'

// 状态图标组件 - 带动画
function StatusIcon({ status }: { status: Contact['status'] }) {
  switch (status) {
    case 'online':
      // 工作中 - 齿轮旋转动画
      return (
        <motion.div
          className="w-5 h-5 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ADE80"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </motion.svg>
        </motion.div>
      )
    case 'busy':
      // 忙碌中 - 闪电脉冲动画
      return (
        <motion.div
          className="w-5 h-5 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="#F87171"
            stroke="#F87171"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </motion.svg>
        </motion.div>
      )
    case 'away':
      // 休息中 - 月亮呼吸动画
      return (
        <motion.div
          className="w-5 h-5 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="#FACC15"
            stroke="#FACC15"
            strokeWidth="1"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </motion.svg>
        </motion.div>
      )
    case 'offline':
      // 离线 - 等待/沙漏动画
      return (
        <motion.div
          className="w-5 h-5 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
          </motion.svg>
        </motion.div>
      )
    default:
      return null
  }
}

// 状态文字
function getStatusText(status: Contact['status']): string {
  switch (status) {
    case 'online': return '工作中'
    case 'busy': return '忙碌中'
    case 'away': return '休息中'
    case 'offline': return '等待'
    default: return ''
  }
}

interface ContactCardProps {
  contact: Contact
  isActive: boolean
  onClick: () => void
  index: number
}

export function ContactCard({ contact, isActive, onClick, index }: ContactCardProps) {
  const statusClass = {
    'online': 'status-online',
    'busy': 'status-busy',
    'away': 'status-away',
    'offline': 'status-offline'
  }[contact.status]

  return (
    <motion.div
      className={cn(
        'contact-card rounded-lg p-3 cursor-pointer',
        isActive && 'active'
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: 'easeOut'
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* 头像 */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-darker ring-1 ring-white/10">
            <img
              src={contact.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${contact.id}`}
              alt={contact.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* 状态指示器 */}
          <div
            className={cn('status-indicator', statusClass)}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: '2px solid #0a0a10'
            }}
          />
        </div>
        
        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-white/90 text-sm truncate">{contact.name}</h3>
            {/* 状态图标 */}
            <div className="flex items-center gap-1.5">
              <StatusIcon status={contact.status} />
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: contact.color }}
                />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-white/40 truncate">
              {contact.title}
            </p>
            <span className="text-[10px] text-white/30 flex-shrink-0">
              {getStatusText(contact.status)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 状态类型
type ContactStatus = Contact['status']

// 随机生成新状态
function getRandomStatus(currentStatus: ContactStatus): ContactStatus {
  const statuses: ContactStatus[] = ['online', 'busy', 'away', 'offline']
  // 权重：online 40%, busy 30%, away 20%, offline 10%
  const weights = [0.4, 0.3, 0.2, 0.1]
  
  // 随机决定是否保持当前状态（30%概率）
  if (Math.random() < 0.3) {
    return currentStatus
  }
  
  // 否则随机选择新状态
  let random = Math.random()
  for (let i = 0; i < statuses.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return statuses[i]
    }
  }
  return 'online'
}

// 联系人列表面板 - 简约专业风格
interface ContactsPanelProps {
  contacts: Contact[]
  activeContactId: string
  onSelectContact: (contact: Contact) => void
  onStatusChange?: (contactId: string, newStatus: ContactStatus) => void
}

export function ContactsPanel({ contacts: initialContacts, activeContactId, onSelectContact, onStatusChange }: ContactsPanelProps) {
  // 内部管理联系人状态
  const [contacts, setContacts] = useState<Contact[]>(() => initialContacts)
  
  // 随机时间切换状态
  useEffect(() => {
    // 为每个联系人设置独立的定时器
    const timers: NodeJS.Timeout[] = []
    
    contacts.forEach((contact, index) => {
      // 随机间隔：30秒到3分钟
      const randomInterval = (Math.floor(Math.random() * 150) + 30) * 1000
      
      const timer = setInterval(() => {
        setContacts(prev => {
          const newContacts = [...prev]
          const newStatus = getRandomStatus(newContacts[index].status)
          newContacts[index] = {
            ...newContacts[index],
            status: newStatus
          }
          // 通知父组件状态变化
          if (onStatusChange) {
            onStatusChange(newContacts[index].id, newStatus)
          }
          return newContacts
        })
      }, randomInterval)
      
      timers.push(timer)
    })
    
    return () => timers.forEach(t => clearInterval(t))
  }, []) // 只在挂载时设置一次
  
  const onlineCount = contacts.filter(c => c.status === 'online').length
  const totalCount = contacts.length
  
  return (
    <aside className="w-72 border-l flex flex-col" style={{
      background: 'rgba(8, 8, 12, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.06)'
    }}>
      {/* 面板标题 - 显示在线/总数 */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white/80 tracking-wide flex items-center gap-2">
            <span className="text-lg">🦞</span>
            海洋战队
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-green-400 font-medium">{onlineCount}</span>
            </span>
            <span className="text-white/30">/</span>
            <span className="text-white/50">{totalCount} 只虾</span>
          </div>
        </div>
      </div>
      
      {/* 联系人列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {contacts.map((contact, index) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            isActive={activeContactId === contact.id}
            onClick={() => onSelectContact(contact)}
            index={index}
          />
        ))}
      </div>
    </aside>
  )
}