'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Server, Brain, Cpu, HardDrive, ArrowDown, ArrowUp, Zap, Clock, Users } from 'lucide-react'
import { VoiceVisualizer } from './voice-visualizer'

interface DeviceData {
  id: string
  name: string
  type: 'server' | 'ai'
  status: 'online' | 'warning' | 'offline'
  cpu: number
  memory: number
  network: { in: number; out: number }
  extra?: string
}

interface AIData {
  id: string
  name: string
  status: 'online' | 'busy' | 'offline'
  responseTime: number
  requestsPerHour: number  // 每小时请求数
  queueLength: number
}

// 初始化服务器数据 - 网络流量 1-10 MB/s
const initialServers: DeviceData[] = [
  { id: 'srv-1', name: 'Mac mini M4', type: 'server', status: 'online', cpu: 35, memory: 52, network: { in: 2.1, out: 1.5 }, extra: '32GB Unified' },
  { id: 'srv-2', name: 'Mac mini M2 Pro', type: 'server', status: 'online', cpu: 42, memory: 68, network: { in: 3.2, out: 2.1 }, extra: '32GB Unified' },
  { id: 'srv-3', name: 'MacBook Pro A1398', type: 'server', status: 'online', cpu: 28, memory: 45, network: { in: 1.8, out: 1.2 }, extra: '16GB DDR3' },
]

// 初始化 AI 模型数据 - GLM-5 每小时 320-400 次请求 (原 40%)
// 按比例: GLM-5 70%, Gemini 20%, Claude 10%
const initialAIModels: AIData[] = [
  { id: 'ai-1', name: 'GLM-5', status: 'online', responseTime: 40, requestsPerHour: 360, queueLength: 12 },
  { id: 'ai-2', name: 'Claude Sonnet 4.6', status: 'online', responseTime: 160, requestsPerHour: 52, queueLength: 8 },
  { id: 'ai-3', name: 'Gemini 3 Flash Proview', status: 'online', responseTime: 165, requestsPerHour: 104, queueLength: 10 },
]

// 服务器卡片
function ServerCard({ device, index }: { device: DeviceData; index: number }) {
  const [data, setData] = useState(device)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() - 0.5) * 15)),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 8)),
        network: {
          in: Math.max(1, Math.min(10, prev.network.in + (Math.random() - 0.5) * 0.5)),
          out: Math.max(0.5, Math.min(5, prev.network.out + (Math.random() - 0.5) * 0.3))
        }
      }))
    }, 2500 + index * 300)
    
    return () => clearInterval(interval)
  }, [index])

  const statusColor = {
    online: '#00FF66',
    warning: '#FFAA00',
    offline: '#FF4040'
  }[data.status]

  return (
    <motion.div
      className="relative p-3 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(15, 15, 25, 0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 0 20px ${statusColor}10`
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* 数据流动画 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
            style={{ top: `${25 + i * 25}%`, left: '-100%', width: '200%' }}
            animate={{ x: ['0%', '100%'] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* 头部 */}
      <div className="relative flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,240,255,0.1)' }}>
          <Server className="w-5 h-5" style={{ color: '#00F0FF' }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white/90 truncate block">{data.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span className="text-xs text-white/40">{data.extra}</span>
          </div>
        </div>
      </div>

      {/* CPU & Memory */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div className="flex justify-between items-center text-xs mb-0.5">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-white/40" />
              <span className="text-white/40">CPU</span>
            </div>
            <span className="font-mono text-xs" style={{ color: data.cpu > 70 ? '#FFAA00' : '#00FF66' }}>{data.cpu.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: data.cpu > 70 ? '#FFAA00' : '#00FF66' }} animate={{ width: `${data.cpu}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center text-xs mb-0.5">
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-white/40" />
              <span className="text-white/40">MEM</span>
            </div>
            <span className="font-mono text-xs" style={{ color: data.memory > 80 ? '#FF4040' : '#00F0FF' }}>{data.memory.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: data.memory > 80 ? '#FF4040' : '#00F0FF' }} animate={{ width: `${data.memory}%` }} />
          </div>
        </div>
      </div>

      {/* Network */}
      <div className="flex gap-3 text-xs font-mono">
        <div className="flex items-center gap-1">
          <ArrowDown className="w-3 h-3" style={{ color: '#00FF66' }} />
          <span className="text-white/50">{data.network.in.toFixed(1)} MB/s</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowUp className="w-3 h-3" style={{ color: '#FF00FF' }} />
          <span className="text-white/50">{data.network.out.toFixed(1)} MB/s</span>
        </div>
      </div>
    </motion.div>
  )
}

// AI 模型卡片
function AICard({ model, index }: { model: AIData; index: number }) {
  const [data, setData] = useState(model)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        // GLM-5 (index 0) 延迟 40ms 左右，其他 160ms 左右
        const baseResponseTime = index === 0 ? 40 : 160
        const newResponseTime = baseResponseTime + (Math.random() - 0.5) * 20
        
        // 队列保持在 7-20 范围
        const newQueue = Math.max(7, Math.min(20, prev.queueLength + Math.floor((Math.random() - 0.4) * 3)))
        
        return {
          ...prev,
          responseTime: newResponseTime,
          requestsPerHour: Math.max(50, Math.min(1500, prev.requestsPerHour + Math.floor((Math.random() - 0.5) * 50))),
          queueLength: newQueue
        }
      })
    }, 2000 + index * 400)
    
    return () => clearInterval(interval)
  }, [index])

  const statusColor = {
    online: '#00FF66',
    busy: '#FFAA00',
    offline: '#FF4040'
  }[data.status]

  return (
    <motion.div
      className="relative p-3 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(15, 15, 25, 0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 0 20px ${statusColor}10`
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
    >
      {/* 脉冲动画背景 */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{ background: `radial-gradient(circle at 50% 50%, ${statusColor} 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* 头部 */}
      <div className="relative flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,0,255,0.1)' }}>
          <Brain className="w-5 h-5" style={{ color: '#FF00FF' }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white/90 truncate block">{data.name}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span className="text-xs text-white/40 capitalize">{data.status === 'online' ? '就绪' : data.status === 'busy' ? '繁忙' : '离线'}</span>
          </div>
        </div>
      </div>

      {/* 指标 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0, 240, 255, 0.08)' }}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock className="w-2.5 h-2.5 text-white/40" />
            <span className="text-xs text-white/40">延迟</span>
          </div>
          <div className="font-mono text-sm" style={{ color: data.responseTime > 200 ? '#FFAA00' : '#00F0FF' }}>{data.responseTime.toFixed(0)}ms</div>
        </div>
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0, 255, 102, 0.08)' }}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Zap className="w-2.5 h-2.5 text-white/40" />
            <span className="text-xs text-white/40">请求</span>
          </div>
          <div className="font-mono text-sm text-green-400">{data.requestsPerHour}/h</div>
        </div>
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255, 0, 255, 0.08)' }}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="w-2.5 h-2.5 text-white/40" />
            <span className="text-xs text-white/40">队列</span>
          </div>
          <div className="font-mono text-sm" style={{ color: data.queueLength > 10 ? '#FFAA00' : '#FF00FF' }}>{data.queueLength}</div>
        </div>
      </div>
    </motion.div>
  )
}

export function DeviceMonitor() {
  const [servers] = useState(initialServers)
  const [aiModels] = useState(initialAIModels)

  return (
    <div className="w-80 flex flex-col gap-4 p-4 overflow-y-auto">
      {/* AI 大模型 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: '#FF00FF' }} />
            AI 大模型
          </h3>
          <div className="flex gap-1">
            {aiModels.map((m, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: { online: '#00FF66', busy: '#FFAA00', offline: '#FF4040' }[m.status] }} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {aiModels.map((model, index) => (
            <AICard key={model.id} model={model} index={index} />
          ))}
        </div>
      </div>

      {/* 服务器 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Server className="w-4 h-4" style={{ color: '#00F0FF' }} />
            服务器
          </h3>
          <div className="flex gap-1">
            {servers.map((s, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: { online: '#00FF66', warning: '#FFAA00', offline: '#FF4040' }[s.status] }} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {servers.map((device, index) => (
            <ServerCard key={device.id} device={device} index={index} />
          ))}
        </div>
      </div>

      {/* 语音拾音动画 */}
      <VoiceVisualizer />
    </div>
  )
}