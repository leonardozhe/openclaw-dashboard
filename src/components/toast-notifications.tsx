'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Wifi, UserPlus, UserMinus, X, Cpu, Clock } from 'lucide-react'

type ToastType = 'warning' | 'info' | 'success' | 'error'

interface Toast {
  id: number
  type: ToastType
  title: string
  message: string
  icon: React.ElementType
  duration?: number
}

const toastMessages: Omit<Toast, 'id'>[] = [
  {
    type: 'warning',
    title: 'CPU 占用较高',
    message: 'Mac mini M2 Pro CPU 使用率达到 68%，建议关注',
    icon: Cpu,
  },
  {
    type: 'warning',
    title: '网络延迟波动',
    message: '网络延迟波动较大，当前延迟 45ms',
    icon: Wifi,
  },
  {
    type: 'success',
    title: '小龙虾加入工作序列',
    message: 'Crawler-01 已加入工作队列，开始执行爬取任务',
    icon: UserPlus,
  },
  {
    type: 'info',
    title: '小龙虾退出工作序列',
    message: 'Monitor-03 完成任务，已退出工作队列',
    icon: UserMinus,
  },
  {
    type: 'warning',
    title: '内存使用较高',
    message: 'Mac mini M2 Pro 内存使用率达到 72%，请关注',
    icon: AlertTriangle,
  },
  {
    type: 'info',
    title: '任务执行完成',
    message: '电商监控任务执行完成，共处理 156 条数据',
    icon: Clock,
  },
]

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const typeStyles = {
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: 'text-amber-400',
      glow: '0 0 20px rgba(245, 158, 11, 0.3)',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      glow: '0 0 20px rgba(59, 130, 246, 0.3)',
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-400',
      glow: '0 0 20px rgba(34, 197, 94, 0.3)',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      glow: '0 0 20px rgba(239, 68, 68, 0.3)',
    },
  }

  const style = typeStyles[toast.type]
  const Icon = toast.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`relative flex items-start gap-3 p-4 rounded-xl backdrop-blur-md border ${style.bg} ${style.border}`}
      style={{ boxShadow: style.glow }}
    >
      <div className={`p-1.5 rounded-lg ${style.bg}`}>
        <Icon className={`w-4 h-4 ${style.icon}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white/90">{toast.title}</h4>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{toast.message}</p>
      </div>
      
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
      </button>
      
      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-white/30 rounded-full"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: toast.duration || 5000, ease: 'linear' }}
      />
    </motion.div>
  )
}

export function ToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [nextId, setNextId] = useState(0)

  // 添加 toast 的方法，供外部调用
  const addToast = useCallback((toast?: Omit<Toast, 'id'>) => {
    // 如果没有传入 toast，则随机选择一个
    const randomMessage = toast || toastMessages[Math.floor(Math.random() * toastMessages.length)]
    const newToast: Toast = {
      ...randomMessage,
      id: nextId,
      duration: randomMessage.duration || 5000,
    }
    
    setToasts(prev => [...prev.slice(-2), newToast]) // 最多显示3条
    setNextId(prev => prev + 1)
    
    // 自动关闭
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id))
    }, newToast.duration || 5000)
  }, [nextId])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // 随机弹窗已禁用，保留组件供后续使用
  // useEffect(() => {
  //   const initialTimeout = setTimeout(() => {
  //     addToast()
  //   }, 5000)
  //   const interval = setInterval(() => {
  //     addToast()
  //   }, 30000 + Math.random() * 20000)
  //   return () => {
  //     clearTimeout(initialTimeout)
  //     clearInterval(interval)
  //   }
  // }, [addToast])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}