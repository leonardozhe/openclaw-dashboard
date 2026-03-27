'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Cpu, Wrench, Zap, MessageSquare, Settings, FileText, Database, Globe, Terminal, Mail, Search, Server, Activity, Brain } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface AgentDetail {
  id: string
  name: string
  identityName: string
  identityEmoji: string
  model: string
  workspace: string
  isDefault: boolean
  bindings: number
  routes: string[]
  soul: {
    profile: string
    alsoAllow: string[]
    web: {
      search: {
        enabled: boolean
        provider: string
      }
    }
    exec: {
      security: string
    }
  } | null
  tools: {
    name: string
    description: string
    category: string
  }[]
  skills: {
    name: string
    level: number
    description: string
  }[]
  models: {
    primary: string
    available: string[]
  }
  sessions: {
    total: number
    active: number
    lastActive: number | null
  }
  plugins: {
    name: string
    version: string
    enabled: boolean
  }[]
}

interface AgentProfileModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  agentName: string
  avatarUrl: string
}

// 炫酷的 Loading 动画组件
function CoolLoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center h-80 gap-6">
      {/* 中心旋转环 */}
      <div className="relative w-24 h-24">
        {/* 外环 */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#00F0FF',
            borderRightColor: '#00F0FF',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        {/* 中环 */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#00FF66',
            borderLeftColor: '#00FF66',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        {/* 内环 */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{
            border: '2px solid transparent',
            borderBottomColor: '#A855F7',
            borderRightColor: '#A855F7',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {/* 中心点 */}
        <motion.div
          className="absolute inset-8 rounded-full bg-gradient-to-r from-cyan-400 to-green-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* 脉冲效果 */}
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-400/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>

      {/* 加载文字 */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          className="flex items-center gap-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-lg font-medium text-white/80">正在加载 Agent 信息</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2 }}
            className="text-cyan-400"
          >
            ...
          </motion.span>
        </motion.div>

        {/* 进度点 */}
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* 背景装饰粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/40"
            style={{
              left: `${10 + (i * 7)}%`,
              top: `${20 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// 技能进度条组件
function SkillBar({ name, level, description }: { name: string; level: number; description: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-white/80">{name}</span>
        <span className="text-xs text-cyan-400">{level}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #00F0FF, #00FF66)'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-white/40 mt-1">{description}</p>
    </div>
  )
}

// 工具卡片组件
function ToolCard({ name, description, category }: { name: string; description: string; category: string }) {
  const categoryColors: Record<string, string> = {
    '文件': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    '开发': 'from-green-500/20 to-green-600/20 border-green-500/30',
    '网络': 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    '通信': 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    '搜索': 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
    '系统': 'from-red-500/20 to-red-600/20 border-red-500/30',
    '集成': 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
    '其他': 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    '文件': <FileText className="w-4 h-4" />,
    '开发': <Terminal className="w-4 h-4" />,
    '网络': <Globe className="w-4 h-4" />,
    '通信': <Mail className="w-4 h-4" />,
    '搜索': <Search className="w-4 h-4" />,
    '系统': <Server className="w-4 h-4" />,
    '集成': <Database className="w-4 h-4" />,
    '其他': <Wrench className="w-4 h-4" />,
  }

  return (
    <motion.div
      className={`p-3 rounded-lg border bg-gradient-to-br ${categoryColors[category] || categoryColors['其他']}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-white/60">{categoryIcons[category] || <Wrench className="w-4 h-4" />}</span>
        <span className="text-sm font-medium text-white/90">{name}</span>
      </div>
      <p className="text-xs text-white/50">{description}</p>
    </motion.div>
  )
}

// 格式化最后活跃时间
function formatLastActive(timestamp: number | null): string {
  if (!timestamp) return '未知'
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

// 自定义 hook 来处理数据获取
function useAgentDetail(isOpen: boolean, agentId: string) {
  const [detail, setDetail] = useState<AgentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastActiveText, setLastActiveText] = useState('未知')
  const hasFetched = useRef(false)
  const loadingRef = useRef(false)
  
  // 使用 useSyncExternalStore 模式来处理副作用
  useEffect(() => {
    // 清理函数
    let cancelled = false
    
    if (isOpen && !hasFetched.current && !loadingRef.current) {
      loadingRef.current = true
      
      // 使用 queueMicrotask 延迟执行，避免在 effect 中直接调用 setState
      queueMicrotask(() => {
        if (cancelled) return
        
        hasFetched.current = true
        setIsLoading(true)
        
        // 提取 agent ID（格式: agent:agentId:sessionId）
        const actualAgentId = agentId.includes(':') ? agentId.split(':')[1] : agentId
        
        fetch(`/api/agent-detail?id=${actualAgentId}`)
          .then(res => res.json())
          .then(data => {
            if (!cancelled) {
              setDetail(data)
              setLastActiveText(formatLastActive(data.sessions?.lastActive || null))
            }
          })
          .catch(error => {
            console.error('Failed to fetch agent detail:', error)
          })
          .finally(() => {
            if (!cancelled) {
              setIsLoading(false)
              loadingRef.current = false
            }
          })
      })
    }
    
    // 关闭时重置
    if (!isOpen) {
      hasFetched.current = false
      loadingRef.current = false
    }
    
    return () => {
      cancelled = true
    }
  }, [isOpen, agentId])
  
  return { detail, isLoading, lastActiveText }
}

export function AgentProfileModal({ isOpen, onClose, agentId, agentName, avatarUrl }: AgentProfileModalProps) {
  const { detail, isLoading, lastActiveText } = useAgentDetail(isOpen, agentId)
  const [activeTab, setActiveTab] = useState<'soul' | 'tools' | 'skills'>('soul')
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 背景遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* 弹窗内容 */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 100px rgba(0, 240, 255, 0.03)'
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>

            {isLoading ? (
              <CoolLoadingAnimation />
            ) : detail ? (
              <div className="overflow-auto max-h-[80vh]">
                {/* 头部信息 */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    {/* 头像 */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-xl overflow-hidden ring-2 ring-cyan-400/30">
                        <img
                          src={avatarUrl}
                          alt={detail.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-sm">
                        {detail.identityEmoji}
                      </div>
                    </div>
                    
                    {/* 基本信息 */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {detail.identityName || detail.name}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-4 h-4" />
                          {detail.model.split('/')[1] || detail.model}
                        </span>
                        {detail.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                            默认
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {detail.sessions.active} 活跃会话
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          最后活跃: {lastActiveText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 标签页 */}
                <div className="flex border-b border-white/10">
                  {[
                    { id: 'soul', label: '灵魂', icon: <Brain className="w-4 h-4" /> },
                    { id: 'tools', label: '工具', icon: <Wrench className="w-4 h-4" /> },
                    { id: 'skills', label: '技能', icon: <Zap className="w-4 h-4" /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 内容区域 */}
                <div className="p-6">
                  {/* 灵魂配置 */}
                  {activeTab === 'soul' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Profile */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white/60">灵魂档案</span>
                          <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                            {detail.soul?.profile || 'full'}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">
                          {detail.soul?.profile === 'full' && '完整能力模式：具备所有工具和能力'}
                          {detail.soul?.profile === 'coding' && '编程模式：专注于代码开发和调试'}
                          {detail.soul?.profile === 'minimal' && '精简模式：仅具备基础对话能力'}
                          {detail.soul?.profile === 'messaging' && '消息模式：专注于消息发送和接收'}
                        </p>
                      </div>

                      {/* 模型信息 */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-white/80">模型配置</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50">主模型</span>
                            <span className="text-xs text-cyan-400">{detail.models.primary}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50">可用模型</span>
                            <span className="text-xs text-white/70">{detail.models.available.length} 个</span>
                          </div>
                        </div>
                      </div>

                      {/* 插件 */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Settings className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-white/80">插件</span>
                        </div>
                        <div className="space-y-2">
                          {detail.plugins.map(plugin => (
                            <div key={plugin.name} className="flex items-center justify-between">
                              <span className="text-xs text-white/70">{plugin.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-white/40">v{plugin.version}</span>
                                <div className={`w-2 h-2 rounded-full ${plugin.enabled ? 'bg-green-400' : 'bg-gray-500'}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 会话统计 */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-white/80">会话统计</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-cyan-400">{detail.sessions.total}</div>
                            <div className="text-xs text-white/40">总会话</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-400">{detail.sessions.active}</div>
                            <div className="text-xs text-white/40">活跃会话</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-400">{detail.bindings}</div>
                            <div className="text-xs text-white/40">绑定数</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* 工具列表 */}
                  {activeTab === 'tools' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-3"
                    >
                      {detail.tools.length > 0 ? (
                        detail.tools.map((tool, index) => (
                          <ToolCard key={index} {...tool} />
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-white/40">
                          暂无工具信息
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* 技能列表 */}
                  {activeTab === 'skills' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      {detail.skills.length > 0 ? (
                        detail.skills.map((skill, index) => (
                          <SkillBar key={index} {...skill} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-white/40">
                          暂无技能信息
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-white/40">
                无法获取详情
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}