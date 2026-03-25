'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'

// 声波动画组件 - 赛博朋克风格
export function SoundWaves({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                border: `2px solid ${i % 2 === 0 ? 'rgba(0, 240, 255, 0.6)' : 'rgba(255, 0, 255, 0.6)'}`,
                boxShadow: i % 2 === 0 
                  ? '0 0 20px rgba(0, 240, 255, 0.3)' 
                  : '0 0 20px rgba(255, 0, 255, 0.3)'
              }}
              initial={{ width: 100, height: 100, opacity: 1 }}
              animate={{
                width: [100, 350],
                height: [100, 350],
                opacity: [1, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// AI 光环效果 - 赛博朋克
export function AIGlow({ isActive, color = '#00F0FF' }: { isActive: boolean; color?: string }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.6, 0.8, 0.6],
            scale: 1
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-52 h-52 md:w-72 md:h-72 rounded-full blur-3xl"
            style={{
              background: `conic-gradient(from 0deg, ${color}, #FF00FF, #FFFF00, #00F0FF, ${color})`
            }}
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 粒子背景 - 赛博朋克多色
export function ParticleBackground() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number; duration: number; color: string }>>([])

  useEffect(() => {
    const colors = ['#00F0FF', '#FF00FF', '#FFFF00', '#00FF66', '#9D00FF']
    const timer = setTimeout(() => {
      const newParticles = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 15 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)]
      }))
      setParticles(newParticles)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ 
            left: `${particle.x}%`,
            background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
            boxShadow: `0 0 10px ${particle.color}`
          }}
          initial={{ y: '100vh', opacity: 0 }}
          animate={{
            y: '-100vh',
            opacity: [0, 1, 1, 0],
            rotate: [0, 720]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  )
}

// 闪烁星星效果 - 霓虹色
export function SparkleEffect({ isActive }: { isActive: boolean }) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([])

  const createSparkle = useCallback(() => {
    if (!isActive) return
    const colors = ['#00F0FF', '#FF00FF', '#FFFF00', '#00FF66']
    const id = Date.now()
    const x = Math.random() * 100
    const y = Math.random() * 100
    const color = colors[Math.floor(Math.random() * colors.length)]
    setSparkles(prev => [...prev, { id, x, y, color }])
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== id))
    }, 1500)
  }, [isActive])

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(createSparkle, 200)
    return () => clearInterval(interval)
  }, [isActive, createSparkle])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute w-4 h-4"
            style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 180 }}
            exit={{ scale: 0, opacity: 0, rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <div 
              className="w-full h-full"
              style={{
                backgroundColor: sparkle.color,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                boxShadow: `0 0 10px ${sparkle.color}`
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// 入场动画包装器
export function EntranceAnimation({ 
  children, 
  isVisible,
  onComplete 
}: { 
  children: React.ReactNode
  isVisible: boolean
  onComplete?: () => void
}) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], rotate: [-180, 10, 0], opacity: 1 }}
          exit={{ scale: 0, rotate: 180, opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 语音按钮动画 - 赛博朋克
export function VoiceButton({ 
  isActive, 
  onClick 
}: { 
  isActive: boolean
  onClick: () => void 
}) {
  return (
    <motion.button
      className="p-3 rounded-xl transition-all relative overflow-hidden"
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, #FF0040 0%, #FF0080 100%)'
          : 'linear-gradient(135deg, #FF00FF 0%, #9D00FF 100%)',
        boxShadow: isActive 
          ? '0 0 20px rgba(255, 0, 64, 0.5), 0 0 40px rgba(255, 0, 128, 0.3)'
          : '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(157, 0, 255, 0.3)'
      }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
    >
      {/* 扫描线效果 */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent"
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {isActive ? (
        <motion.svg 
          className="w-6 h-6 text-white relative z-10" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </motion.svg>
      ) : (
        <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </motion.button>
  )
}

// 庆祝动画（用于消息发送后）- 赛博朋克
export function CelebrationEffect({ trigger }: { trigger: number }) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; randomX: number }>>([])

  useEffect(() => {
    if (trigger === 0) return
    
    const colors = ['#00F0FF', '#FF00FF', '#FFFF00', '#00FF66', '#9D00FF', '#FF0080']
    const newConfetti = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      x: 40 + Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      randomX: (Math.random() - 0.5) * 100
    }))
    
    const addTimer = setTimeout(() => {
      setConfetti(prev => [...prev, ...newConfetti])
    }, 0)
    
    const removeTimer = setTimeout(() => {
      setConfetti(prev => prev.filter(c => !newConfetti.find(n => n.id === c.id)))
    }, 2000)
    
    return () => {
      clearTimeout(addTimer)
      clearTimeout(removeTimer)
    }
  }, [trigger])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {confetti.map((c) => (
          <motion.div
            key={c.id}
            className="absolute w-2 h-2"
            style={{ 
              left: `${c.x}%`, 
              top: '50%',
              backgroundColor: c.color,
              boxShadow: `0 0 10px ${c.color}`,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
            }}
            initial={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              y: [0, -150, 100],
              opacity: [1, 1, 0],
              scale: [1, 0.5, 0],
              x: [0, c.randomX],
              rotate: [0, 360]
            }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// 扫描线效果
export function ScanlineEffect() {
  return (
    <motion.div
      className="fixed left-0 right-0 h-0.5 pointer-events-none z-50"
      style={{
        background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)',
        boxShadow: '0 0 10px #00F0FF'
      }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
  )
}