'use client'

import { motion } from 'framer-motion'
import { Server, Brain, ShoppingCart, TrendingUp, Bug, DollarSign, Megaphone, Zap, Cloud, Globe, Database, Cpu } from 'lucide-react'

// 节点位置配置 - 设备Gateway增加间距，业务模块更分散
const nodes = {
  // 设备和Gateway左右排列（底部）- 增加间距
  device1: { x: 280, y: 520, label: 'Mac mini M4', color: '#00F0FF' },
  gateway1: { x: 470, y: 520, label: 'Gateway', color: '#FFFF00' },
  device2: { x: 650, y: 520, label: 'Mac mini M2 Pro', color: '#00FF66' },
  gateway2: { x: 840, y: 520, label: 'Gateway', color: '#FFFF00' },
  device3: { x: 1020, y: 520, label: 'MacBook Pro', color: '#FF00FF' },
  gateway3: { x: 1210, y: 520, label: 'Gateway', color: '#FFFF00' },
  
  // Redis 队列（中间偏右）
  redis: { x: 1000, y: 300, label: 'Redis 队列', color: '#DC382D' },
  
  // 大模型 Gateway（中间偏左）
  aiGateway: { x: 500, y: 300, label: 'AI Gateway', color: '#9D00FF' },
  
  // AI 服务供应商（左上）- 阿里云下移一行
  aliyun: { x: 80, y: 130, label: '阿里云', color: '#FF6A00' },
  openrouter: { x: 230, y: 50, label: 'OpenRouter', color: '#00D4AA' },
  xai: { x: 380, y: 50, label: 'xAI', color: '#1DA1F2' },
  ollama: { x: 530, y: 50, label: 'Ollama', color: '#00FFCC' },
  
  // 业务模块（右上）- 更分散，充分利用右侧空间
  ecommerceMonitor: { x: 750, y: 50, label: '电商监控', color: '#FF9F43' },
  crawler: { x: 950, y: 50, label: '爬虫模块', color: '#A55EEA' },
  finance: { x: 1150, y: 50, label: '财务模块', color: '#26DE81' },
  ecommerceOps2: { x: 1350, y: 50, label: '电商运营', color: '#00D4AA' },
  ecommerceOps: { x: 850, y: 220, label: '电商运营', color: '#FF6B6B' },
  ads: { x: 1250, y: 300, label: '数字广告', color: '#4ECDC4' },
}

// 曲线连接配置
const connections = [
  // 设备和Gateway双向交互 - 上下两条单向箭头（适中偏移量）
  { from: 'device1', to: 'gateway1', color: '#00F0FF', offsetY: -12 },
  { from: 'gateway1', to: 'device1', color: '#FFFF00', offsetY: 12 },
  { from: 'device2', to: 'gateway2', color: '#00FF66', offsetY: -12 },
  { from: 'gateway2', to: 'device2', color: '#FFFF00', offsetY: 12 },
  { from: 'device3', to: 'gateway3', color: '#FF00FF', offsetY: -12 },
  { from: 'gateway3', to: 'device3', color: '#FFFF00', offsetY: 12 },
  
  // Gateway 到 Redis（曲线）
  { from: 'gateway1', to: 'redis', color: '#FFFF00', curve: true },
  { from: 'gateway2', to: 'redis', color: '#FFFF00', curve: false },
  { from: 'gateway3', to: 'redis', color: '#FFFF00', curve: true },
  
  // Gateway 到 AI Gateway（曲线）
  { from: 'gateway1', to: 'aiGateway', color: '#9D00FF', curve: true },
  { from: 'gateway2', to: 'aiGateway', color: '#9D00FF', curve: false },
  { from: 'gateway3', to: 'aiGateway', color: '#9D00FF', curve: true },
  
  // AI Gateway 到供应商
  { from: 'aiGateway', to: 'aliyun', color: '#FF6A00', curve: true },
  { from: 'aiGateway', to: 'openrouter', color: '#00D4AA', curve: false },
  { from: 'aiGateway', to: 'xai', color: '#1DA1F2', curve: true },
  { from: 'aiGateway', to: 'ollama', color: '#00FFCC', curve: false },
  
  // Redis 到业务模块
  { from: 'redis', to: 'ecommerceMonitor', color: '#FF9F43', curve: true },
  { from: 'redis', to: 'crawler', color: '#A55EEA', curve: true },
  { from: 'redis', to: 'finance', color: '#26DE81', curve: true },
  { from: 'redis', to: 'ecommerceOps2', color: '#00D4AA', curve: true },
  { from: 'redis', to: 'ecommerceOps', color: '#FF6B6B', curve: true },
  { from: 'redis', to: 'ads', color: '#4ECDC4', curve: true },
]

// 节点组件
function Node({ x, y, label, color, icon: Icon, size = 'normal', isLobster = false, subtitle }: {
  x: number
  y: number
  label: string
  color: string
  icon: React.ElementType
  size?: 'small' | 'normal' | 'large'
  isLobster?: boolean
  subtitle?: string
}) {
  const sizes = {
    small: { w: 60, h: 60, iconSize: 24 },
    normal: { w: 80, h: 80, iconSize: 32 },
    large: { w: 100, h: 100, iconSize: 40 }
  }
  const { w, h, iconSize } = sizes[size]
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* 节点背景 */}
      <motion.rect
        x={x - w/2}
        y={y - h/2}
        width={w}
        height={h}
        rx="12"
        fill={`${color}15`}
        stroke={`${color}60`}
        strokeWidth="2"
        whileHover={{ scale: 1.05 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
      
      {/* 图标 */}
      <foreignObject x={x - iconSize/2} y={y - iconSize/2} width={iconSize} height={iconSize}>
        {isLobster ? (
          <span style={{ fontSize: iconSize * 0.9, lineHeight: 1 }}>🦞</span>
        ) : (
          <Icon style={{ color, width: iconSize, height: iconSize }} />
        )}
      </foreignObject>
      
      {/* 标签 */}
      <text
        x={x}
        y={y + h/2 + 20}
        textAnchor="middle"
        fill="#9CA3AF"
        fontSize="12"
        fontFamily="system-ui"
        fontWeight="500"
      >
        {label}
      </text>
      
      {/* 副标题 */}
      {subtitle && (
        <text
          x={x}
          y={y + h/2 + 36}
          textAnchor="middle"
          fill="#6B7280"
          fontSize="10"
          fontFamily="system-ui"
        >
          {subtitle}
        </text>
      )}
    </motion.g>
  )
}

// 曲线流动连接线组件
function FlowLine({ from, to, color, delay = 0, curve = false, offsetY = 0 }: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  color: string
  delay?: number
  curve?: boolean
  offsetY?: number
}) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const unitX = dx / length
  const unitY = dy / length
  
  // 固定Y轴偏移（用于水平连接的上下分布）
  const startX = from.x + unitX * 50
  const startY = from.y + unitY * 50 + offsetY
  const endX = to.x - unitX * 50
  const endY = to.y - unitY * 50 + offsetY
  
  // 曲线控制点
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  const curveOffset = curve ? 40 : 0
  const ctrlX = midX - unitY * curveOffset
  const ctrlY = midY + unitX * curveOffset
  
  const pathD = curve
    ? `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`
    : `M ${startX} ${startY} L ${endX} ${endY}`
  
  return (
    <g>
      {/* 静态底层线 */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.15"
      />
      
      {/* 流动虚线 */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="10 15"
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: -50 }}
        transition={{
          duration: 1.8,
          delay,
          repeat: Infinity,
          ease: 'linear'
        }}
        opacity="0.7"
      />
      
      {/* 箭头 */}
      <polygon
        points={`${endX},${endY} ${endX - unitX * 10 - unitY * 5},${endY - unitY * 10 + unitX * 5} ${endX - unitX * 10 + unitY * 5},${endY - unitY * 10 - unitX * 5}`}
        fill={color}
        opacity="0.5"
      />
    </g>
  )
}

// 主组件
export function NetworkArchitecture() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1500 580"
        className="max-w-[1500px]"
      >
        {/* 定义渐变和滤镜 */}
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(255, 255, 0, 0.02)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        
        {/* 背景 */}
        <rect x="0" y="0" width="1500" height="580" fill="url(#bgGlow)" />
        
        {/* 网格 */}
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
        </pattern>
        <rect width="1500" height="580" fill="url(#grid)" />
        
        
        {/* 连接线 */}
        {connections.map((conn, i) => (
          <FlowLine
            key={i}
            from={nodes[conn.from as keyof typeof nodes]}
            to={nodes[conn.to as keyof typeof nodes]}
            color={conn.color}
            delay={i * 0.05}
            curve={conn.curve}
            offsetY={conn.offsetY || 0}
          />
        ))}
        
        {/* 设备节点 */}
        <Node {...nodes.device1} icon={Server} size="normal" />
        <Node {...nodes.device2} icon={Server} size="normal" />
        <Node {...nodes.device3} icon={Server} size="normal" />
        
        {/* Gateway 节点 - 龙虾图标 */}
        <Node {...nodes.gateway1} icon={Zap} size="normal" isLobster />
        <Node {...nodes.gateway2} icon={Zap} size="normal" isLobster />
        <Node {...nodes.gateway3} icon={Zap} size="normal" isLobster />
        
        {/* Redis 节点 */}
        <Node {...nodes.redis} icon={Database} size="normal" />
        
        {/* AI Gateway 节点 */}
        <Node {...nodes.aiGateway} icon={Cpu} size="normal" />
        
        {/* AI 服务供应商 - 放大 */}
        <Node {...nodes.aliyun} icon={Cloud} size="normal" />
        <Node {...nodes.openrouter} icon={Globe} size="normal" />
        <Node {...nodes.xai} icon={Brain} size="normal" />
        <Node {...nodes.ollama} icon={Cpu} size="normal" />
        
        {/* 业务模块 - 6个模块 */}
        <Node {...nodes.ecommerceMonitor} icon={TrendingUp} size="normal" />
        <Node {...nodes.crawler} icon={Bug} size="normal" />
        <Node {...nodes.finance} icon={DollarSign} size="normal" />
        <Node {...nodes.ecommerceOps2} icon={ShoppingCart} size="normal" />
        <Node {...nodes.ecommerceOps} icon={ShoppingCart} size="normal" />
        <Node {...nodes.ads} icon={Megaphone} size="normal" />
      </svg>
    </div>
  )
}