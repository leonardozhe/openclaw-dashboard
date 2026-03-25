'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'

export function VoiceVisualizer() {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(32).fill(0))
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  // 开始监听麦克风
  const startListening = useCallback(async () => {
    try {
      setError(null)
      
      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      streamRef.current = stream
      
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioContextRef.current = audioContext
      
      // 创建分析器
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 64 // 32 个频率段
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser
      
      // 连接麦克风到分析器
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source
      
      setIsListening(true)
      
      // 开始分析音频
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const analyze = () => {
        analyser.getByteFrequencyData(dataArray)
        
        // 将 0-255 转换为 0-1
        const levels = Array.from(dataArray).map(v => v / 255)
        setAudioLevels(levels)
        
        // 检测是否有语音（平均音量超过阈值）
        const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length
        setIsSpeaking(avgLevel > 0.1)
        
        animationRef.current = requestAnimationFrame(analyze)
      }
      
      analyze()
      
    } catch (err) {
      console.error('麦克风访问失败:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('请允许麦克风访问权限')
        } else if (err.name === 'NotFoundError') {
          setError('未找到麦克风设备')
        } else {
          setError('麦克风访问失败')
        }
      }
      setIsListening(false)
    }
  }, [])

  // 停止监听
  const stopListening = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    analyserRef.current = null
    setIsListening(false)
    setIsSpeaking(false)
    setAudioLevels(Array(32).fill(0))
  }, [])

  // 切换监听状态
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return (
    <motion.div
      className="p-4 rounded-lg cursor-pointer"
      style={{ 
        background: 'rgba(0, 240, 255, 0.05)', 
        border: `1px solid ${isSpeaking ? 'rgba(0, 255, 102, 0.3)' : 'rgba(0, 240, 255, 0.1)'}` 
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={toggleListening}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ 
              background: isListening ? (isSpeaking ? '#00FF66' : '#FFAA00') : '#FF4040',
              boxShadow: isListening 
                ? (isSpeaking ? '0 0 8px #00FF66' : '0 0 8px #FFAA00') 
                : '0 0 8px #FF4040'
            }}
            animate={{ 
              scale: isSpeaking ? [1, 1.3, 1] : 1,
              opacity: isSpeaking ? [1, 0.7, 1] : 1
            }}
            transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          />
          <span className="text-xs text-white/50">语音日志记录</span>
        </div>
        <span className="text-xs font-mono" style={{
          color: isListening
            ? (isSpeaking ? '#00FF66' : '#FFAA00')
            : '#FF4040'
        }}>
          {error || (isListening
            ? (isSpeaking ? '智能记录中...' : '准备中...')
            : '点击开始录音')}
        </span>
      </div>

      {/* 波形可视化 */}
      <div className="flex items-end justify-center gap-0.5 h-12">
        {audioLevels.map((level, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full"
            style={{
              background: isListening && isSpeaking
                ? `linear-gradient(to top, #00FF66, #00F0FF)` 
                : isListening 
                  ? `linear-gradient(to top, #FFAA00, #FF6600)`
                  : 'rgba(255,255,255,0.1)',
              boxShadow: isListening && isSpeaking 
                ? '0 0 4px rgba(0, 255, 102, 0.5)' 
                : isListening 
                  ? '0 0 4px rgba(255, 170, 0, 0.5)'
                  : 'none'
            }}
            animate={{
              height: `${Math.max(4, level * 48)}px`,
            }}
            transition={{ duration: 0.05, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* 频率指示器 */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/30">20Hz</span>
          <div className="flex-1 h-0.5 mx-2" style={{ 
            background: isListening 
              ? 'linear-gradient(90deg, rgba(0,240,255,0.3), rgba(0,255,102,0.3))' 
              : 'rgba(255,255,255,0.1)' 
          }} />
          <span className="text-[10px] text-white/30">20kHz</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/50">音量</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => {
              // 计算当前音量等级 (1-5)
              const avgLevel = audioLevels.reduce((a, b) => a + b, 0) / audioLevels.length
              const volumeLevel = Math.ceil(avgLevel * 5)
              const isActive = isListening && n <= volumeLevel
              
              return (
                <motion.div
                  key={n}
                  className="w-1.5 h-3 rounded-sm"
                  style={{
                    background: isActive
                      ? (isSpeaking ? '#00FF66' : '#00F0FF')
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: isActive
                      ? (isSpeaking ? '0 0 4px #00FF66' : '0 0 4px #00F0FF')
                      : 'none'
                  }}
                  animate={{
                    opacity: isActive ? [0.7, 1, 0.7] : 0.3,
                    scale: isActive ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: isActive ? Infinity : 0,
                    delay: n * 0.05
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}