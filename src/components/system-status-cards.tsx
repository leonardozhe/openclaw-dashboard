'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Users, Database, Brain, Container, Clock, Activity } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

interface StatusCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  status: 'success' | 'warning' | 'error' | 'info'
  index: number
  isUpdating: boolean
}

function StatusCard({ icon, label, value, status, index, isUpdating }: StatusCardProps) {
  const statusColors = {
    success: { bg: 'rgba(0, 255, 102, 0.1)', border: 'rgba(0, 255, 102, 0.3)', color: '#00FF66' },
    warning: { bg: 'rgba(255, 170, 0, 0.1)', border: 'rgba(255, 170, 0, 0.3)', color: '#FFAA00' },
    error: { bg: 'rgba(255, 64, 64, 0.1)', border: 'rgba(255, 64, 64, 0.3)', color: '#FF4040' },
    info: { bg: 'rgba(0, 240, 255, 0.1)', border: 'rgba(0, 240, 255, 0.3)', color: '#00F0FF' },
  }
  
  const colors = statusColors[status]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative px-4 py-2.5 rounded-xl flex items-center gap-3 overflow-hidden"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* 流水灯边框效果 */}
      <AnimatePresence>
        {isUpdating && (
          <>
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 顶部流水灯 */}
              <motion.div
                className="absolute top-0 left-0 h-0.5 w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.color}, transparent)` }}
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.8, ease: 'linear', repeat: 2 }}
              />
              {/* 右侧流水灯 */}
              <motion.div
                className="absolute top-0 right-0 w-0.5 h-full"
                style={{ background: `linear-gradient(180deg, transparent, ${colors.color}, transparent)` }}
                initial={{ y: '-100%' }}
                animate={{ y: '100%' }}
                transition={{ duration: 0.8, ease: 'linear', repeat: 2, delay: 0.2 }}
              />
              {/* 底部流水灯 */}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.color}, transparent)` }}
                initial={{ x: '100%' }}
                animate={{ x: '-100%' }}
                transition={{ duration: 0.8, ease: 'linear', repeat: 2, delay: 0.4 }}
              />
              {/* 左侧流水灯 */}
              <motion.div
                className="absolute top-0 left-0 w-0.5 h-full"
                style={{ background: `linear-gradient(180deg, transparent, ${colors.color}, transparent)` }}
                initial={{ y: '100%' }}
                animate={{ y: '-100%' }}
                transition={{ duration: 0.8, ease: 'linear', repeat: 2, delay: 0.6 }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10"
        style={{ background: `${colors.color}20`, color: colors.color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
        <div className="text-lg font-bold truncate" style={{ color: colors.color }}>{value}</div>
      </div>
    </motion.div>
  )
}

export function SystemStatusCards() {
  const [mounted, setMounted] = useState(false)
  const [runningHours, setRunningHours] = useState('0.0')
  const [shrimpCount, setShrimpCount] = useState(35) // 默认 35 只
  const [updatingCards, setUpdatingCards] = useState<Set<number>>(new Set())
  const [cardValues, setCardValues] = useState({
    redisClients: 28, // Redis 连接客户端数量
    ollamaConnections: 5, // Ollama 连接数
    docker: 12,
    systemStatus: '一切正常',
  })
  
  // 客户端挂载后才执行动态更新
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 计算运行时间：从 2026年3月3日 17:00 开始（每10分钟更新）
  useEffect(() => {
    if (!mounted) return
    
    const startDate = new Date(2026, 2, 3, 17, 0, 0) // 3月3日 17:00
    
    const updateRunningTime = () => {
      const now = new Date()
      const diffMs = now.getTime() - startDate.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      const newHours = diffHours.toFixed(1)
      
      // 只有值变化时才更新并闪亮
      if (newHours !== runningHours) {
        setRunningHours(newHours)
        setUpdatingCards(prev => new Set(prev).add(4)) // card index 4 是运行时长
        setTimeout(() => {
          setUpdatingCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(4)
            return newSet
          })
        }, 1600)
      }
    }
    
    updateRunningTime()
    const interval = setInterval(updateRunningTime, 600000) // 每10分钟更新
    
    return () => clearInterval(interval)
  }, [runningHours, mounted])
  
  // 随机更新卡片值和流水灯效果（只有值真正变化才闪亮）
  useEffect(() => {
    const updateRandomCard = () => {
      const cardIndex = Math.floor(Math.random() * 5) // 0-4，排除运行时长
      
      let hasChanged = false
      
      if (cardIndex === 1) {
        // Redis 连接客户端数量
        const newClients = Math.floor(Math.random() * 20) + 20 // 20-39
        if (newClients !== cardValues.redisClients) {
          setCardValues(prev => ({ ...prev, redisClients: newClients }))
          hasChanged = true
        }
      } else if (cardIndex === 2) {
        // Ollama 状态
        const newConnections = Math.floor(Math.random() * 5) + 3 // 3-7
        if (newConnections !== cardValues.ollamaConnections) {
          setCardValues(prev => ({ ...prev, ollamaConnections: newConnections }))
          hasChanged = true
        }
      } else if (cardIndex === 3) {
        // Docker 容器数
        const dockerCount = Math.floor(Math.random() * 3) + 11 // 11-13
        if (dockerCount !== cardValues.docker) {
          setCardValues(prev => ({ ...prev, docker: dockerCount }))
          hasChanged = true
        }
      } else if (cardIndex === 4) {
        // 系统状态（映射到 card index 5）
        const statuses = ['一切正常', '运行稳定', '性能良好', '负载正常']
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
        if (newStatus !== cardValues.systemStatus) {
          setCardValues(prev => ({ ...prev, systemStatus: newStatus }))
          hasChanged = true
        }
      }
      
      // 只有值真正变化才显示流水灯
      if (hasChanged) {
        const displayIndex = cardIndex === 4 ? 5 : cardIndex // 系统状态是 index 5
        setUpdatingCards(prev => new Set(prev).add(displayIndex))
        setTimeout(() => {
          setUpdatingCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(displayIndex)
            return newSet
          })
        }, 1600)
      }
    }
    
    const interval = setInterval(updateRandomCard, 5000 + Math.random() * 4000)
    return () => clearInterval(interval)
  }, [cardValues])
  
  // 龙虾数量变化回调（从日志接收）
  const handleShrimpCountChange = useCallback((change: number) => {
    setShrimpCount(prev => {
      const newCount = Math.max(19, Math.min(48, prev + change))
      // 只有数量真正变化才闪亮
      if (newCount !== prev) {
        setUpdatingCards(prevSet => new Set(prevSet).add(0)) // index 0 是队列龙虾
        setTimeout(() => {
          setUpdatingCards(prevSet => {
            const newSet = new Set(prevSet)
            newSet.delete(0)
            return newSet
          })
        }, 1600)
      }
      return newCount
    })
  }, [])
  
  // 注册回调到 activity-log
  useEffect(() => {
    import('./activity-log').then(module => {
      if (module.setShrimpCountChangeCallback) {
        module.setShrimpCountChangeCallback(handleShrimpCountChange)
      }
    })
  }, [handleShrimpCountChange])
  
  // 随机波动龙虾数量（只有变化才闪亮）
  useEffect(() => {
    const interval = setInterval(() => {
      setShrimpCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2 // -2 到 2
        const newCount = Math.max(19, Math.min(48, prev + change))
        
        // 只有数量真正变化才闪亮
        if (newCount !== prev) {
          setUpdatingCards(prevSet => new Set(prevSet).add(0)) // index 0 是队列龙虾
          setTimeout(() => {
            setUpdatingCards(prevSet => {
              const newSet = new Set(prevSet)
              newSet.delete(0)
              return newSet
            })
          }, 1600)
        }
        
        return newCount
      })
    }, 8000)
    
    return () => clearInterval(interval)
  }, [])
  
  const cards: StatusCardProps[] = [
    {
      icon: <Users className="w-4 h-4" />,
      label: '队列龙虾',
      value: shrimpCount,
      status: shrimpCount >= 30 ? 'success' : shrimpCount >= 20 ? 'warning' : 'error',
      index: 0,
      isUpdating: updatingCards.has(0),
    },
    {
      icon: <Database className="w-4 h-4" />,
      label: 'Redis 连接',
      value: `${cardValues.redisClients} 客户端`,
      status: cardValues.redisClients >= 25 ? 'success' : 'warning',
      index: 1,
      isUpdating: updatingCards.has(1),
    },
    {
      icon: <Brain className="w-4 h-4" />,
      label: 'Ollama 连接',
      value: `${cardValues.ollamaConnections} 连接`,
      status: cardValues.ollamaConnections >= 4 ? 'success' : 'warning',
      index: 2,
      isUpdating: updatingCards.has(2),
    },
    {
      icon: <Container className="w-4 h-4" />,
      label: 'Docker 状态',
      value: `${cardValues.docker} 容器`,
      status: cardValues.docker >= 10 ? 'success' : 'warning',
      index: 3,
      isUpdating: updatingCards.has(3),
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: '运行时长',
      value: `${runningHours} h`,
      status: 'info',
      index: 4,
      isUpdating: updatingCards.has(4),
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: '系统状态',
      value: cardValues.systemStatus,
      status: 'success',
      index: 5,
      isUpdating: updatingCards.has(5),
    },
  ]
  
  return (
    <div className="grid grid-cols-6 gap-3 px-4 py-3">
      {cards.map((card) => (
        <StatusCard key={card.label} {...card} />
      ))}
    </div>
  )
}