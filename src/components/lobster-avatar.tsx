'use client'

import { motion } from 'framer-motion'

interface LobsterAvatarProps {
  color?: string
  size?: number
  className?: string
  isSleeping?: boolean
  isListening?: boolean
}

export function LobsterAvatar({ 
  color = '#FF6B35', 
  size = 100, 
  className = '',
  isSleeping = false,
  isListening = false
}: LobsterAvatarProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* 身体主体 */}
        <motion.ellipse 
          cx="60" 
          cy="70" 
          rx="32" 
          ry="38" 
          fill={color}
          animate={{ 
            scaleY: isListening ? [1, 1.02, 1] : 1 
          }}
          transition={{ 
            duration: 0.5, 
            repeat: isListening ? Infinity : 0 
          }}
        />
        
        {/* 身体高光 */}
        <ellipse cx="55" cy="60" rx="20" ry="25" fill="white" opacity="0.15" />
        
        {/* 身体纹理线条 */}
        <path d="M40 55 Q60 50 80 55" stroke={color} strokeOpacity="0.6" strokeWidth="2" fill="none"/>
        <path d="M38 70 Q60 65 82 70" stroke={color} strokeOpacity="0.6" strokeWidth="2" fill="none"/>
        <path d="M40 85 Q60 80 80 85" stroke={color} strokeOpacity="0.6" strokeWidth="2" fill="none"/>
        
        {/* 头部 */}
        <motion.ellipse 
          cx="60" 
          cy="38" 
          rx="25" 
          ry="22" 
          fill={color}
          animate={{ 
            rotate: isSleeping ? [0, 2, 0, -2, 0] : 0 
          }}
          transition={{ 
            duration: 2, 
            repeat: isSleeping ? Infinity : 0 
          }}
        />
        
        {/* 头部高光 */}
        <ellipse cx="55" cy="32" rx="15" ry="12" fill="white" opacity="0.15" />
        
        {/* 眼睛 */}
        <motion.g
          animate={{ 
            scaleY: isSleeping ? 0.2 : 1 
          }}
          transition={{ duration: 0.3 }}
        >
          <circle cx="48" cy="35" r="10" fill="white" />
          <motion.circle 
            cx="48" 
            cy="35" 
            r="5" 
            fill="#1A1A2E"
            animate={{
              cx: isListening ? [48, 50, 48] : 48
            }}
            transition={{
              duration: 1,
              repeat: isListening ? Infinity : 0
            }}
          />
          <circle cx="50" cy="33" r="2" fill="white" />
          
          <circle cx="72" cy="35" r="10" fill="white" />
          <motion.circle 
            cx="72" 
            cy="35" 
            r="5" 
            fill="#1A1A2E"
            animate={{
              cx: isListening ? [72, 70, 72] : 72
            }}
            transition={{
              duration: 1,
              repeat: isListening ? Infinity : 0
            }}
          />
          <circle cx="74" cy="33" r="2" fill="white" />
        </motion.g>
        
        {/* 触角 */}
        <motion.path 
          d="M42 20 Q30 8 25 2" 
          stroke={color} 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round"
          animate={{
            d: isListening 
              ? "M42 20 Q28 5 22 -2" 
              : "M42 20 Q30 8 25 2"
          }}
          transition={{
            duration: 0.5,
            repeat: isListening ? Infinity : 0,
            repeatType: "reverse"
          }}
        />
        <motion.path 
          d="M78 20 Q90 8 95 2" 
          stroke={color} 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round"
          animate={{
            d: isListening 
              ? "M78 20 Q92 5 98 -2" 
              : "M78 20 Q90 8 95 2"
          }}
          transition={{
            duration: 0.5,
            repeat: isListening ? Infinity : 0,
            repeatType: "reverse"
          }}
        />
        
        {/* 触角尖端小球 */}
        <circle cx="25" cy="2" r="3" fill={color} />
        <circle cx="95" cy="2" r="3" fill={color} />
        
        {/* 大钳子 - 左 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, -8, 0, 8, 0] : [0, -5, 0]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity
          }}
          style={{ transformOrigin: '28px 65px' }}
        >
          <ellipse cx="18" cy="60" rx="12" ry="8" fill={color} />
          <ellipse cx="8" cy="52" rx="10" ry="12" fill={color} />
          <ellipse cx="8" cy="52" rx="7" ry="9" fill={color} opacity="0.8" />
          <path d="M0 42 Q-2 38 2 35 Q6 40 4 45" fill={color} />
          <path d="M0 62 Q-2 66 2 69 Q6 64 4 59" fill={color} />
          <ellipse cx="6" cy="50" rx="4" ry="5" fill="white" opacity="0.2" />
        </motion.g>
        
        {/* 大钳子 - 右 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, 8, 0, -8, 0] : [0, 5, 0]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity
          }}
          style={{ transformOrigin: '92px 65px' }}
        >
          <ellipse cx="102" cy="60" rx="12" ry="8" fill={color} />
          <ellipse cx="112" cy="52" rx="10" ry="12" fill={color} />
          <ellipse cx="112" cy="52" rx="7" ry="9" fill={color} opacity="0.8" />
          <path d="M120 42 Q122 38 118 35 Q114 40 116 45" fill={color} />
          <path d="M120 62 Q122 66 118 69 Q114 64 116 59" fill={color} />
          <ellipse cx="114" cy="50" rx="4" ry="5" fill="white" opacity="0.2" />
        </motion.g>
        
        {/* 腿部 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, 2, 0, -2, 0] : 0
          }}
          transition={{
            duration: 0.4,
            repeat: Infinity
          }}
          style={{ transformOrigin: '60px 85px' }}
        >
          <path d="M35 85 Q25 100 20 110" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M42 92 Q35 108 32 118" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M78 92 Q85 108 88 118" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M85 85 Q95 100 100 110" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </motion.g>
        
        {/* 尾巴 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, 3, 0, -3, 0] : 0
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity
          }}
          style={{ transformOrigin: '60px 105px' }}
        >
          <path d="M50 105 Q45 115 40 120 Q60 112 60 120 Q60 112 80 120 Q75 115 70 105" fill={color} />
          <path d="M55 108 Q52 114 48 118" stroke={color} strokeOpacity="0.6" strokeWidth="2" fill="none" />
          <path d="M65 108 Q68 114 72 118" stroke={color} strokeOpacity="0.6" strokeWidth="2" fill="none" />
        </motion.g>
        
        {/* 嘴巴 */}
        <motion.path 
          d={isSleeping ? "M52 50 Q60 47 68 50" : "M52 50 Q60 56 68 50"} 
          stroke="#1A1A2E" 
          strokeWidth="2.5" 
          fill="none" 
          strokeLinecap="round"
        />
        
        {/* 腮红 */}
        <circle cx="38" cy="45" r="5" fill="#FFB6C1" opacity="0.5" />
        <circle cx="82" cy="45" r="5" fill="#FFB6C1" opacity="0.5" />
      </svg>
      
      {/* 睡觉 ZZZ */}
      {isSleeping && (
        <>
          <motion.span
            className="absolute text-lg font-bold"
            style={{ top: -10, right: -5, color: '#00F0FF' }}
            animate={{
              opacity: [0, 1, 0],
              y: [0, -10, -20],
              rotate: [-10, 10, -10]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0
            }}
          >
            Z
          </motion.span>
          <motion.span
            className="absolute text-base font-bold"
            style={{ top: -25, right: -15, color: '#FF00FF' }}
            animate={{
              opacity: [0, 1, 0],
              y: [0, -10, -20],
              rotate: [-10, 10, -10]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5
            }}
          >
            Z
          </motion.span>
          <motion.span
            className="absolute text-sm font-bold"
            style={{ top: -40, right: -25, color: '#FFFF00' }}
            animate={{
              opacity: [0, 1, 0],
              y: [0, -10, -20],
              rotate: [-10, 10, -10]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1
            }}
          >
            Z
          </motion.span>
        </>
      )}
    </div>
  )
}

// 大型小龙虾组件（用于主显示）- 基于参考图片设计
export function LobsterMain({ 
  color = '#FF6B35',
  isSleeping = false,
  isListening = false,
  isAnimating = false
}: { 
  color?: string
  isSleeping?: boolean
  isListening?: boolean
  isAnimating?: boolean
}) {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 1, opacity: 1 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: isSleeping ? [0, 5, 0, 5, 0] : [0, -15, 0]
      }}
      transition={{
        duration: isSleeping ? 2 : 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg viewBox="0 0 300 320" className="w-56 h-56 md:w-72 md:h-72">
        {/* 定义渐变 */}
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="highlightGrad" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.25" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* 尾巴扇 - 最后层 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, 5, 0, -5, 0] : 0
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity
          }}
          style={{ transformOrigin: '150px 280px' }}
        >
          <path d="M100 280 Q80 300 70 320 Q150 290 150 320 Q150 290 230 320 Q220 300 200 280" 
            fill={`url(#bodyGrad)`} />
          <path d="M120 285 Q105 300 95 315" stroke={color} strokeOpacity="0.4" strokeWidth="3" fill="none" />
          <path d="M150 288 Q150 305 150 318" stroke={color} strokeOpacity="0.4" strokeWidth="3" fill="none" />
          <path d="M180 285 Q195 300 205 315" stroke={color} strokeOpacity="0.4" strokeWidth="3" fill="none" />
        </motion.g>
        
        {/* 腿部 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, 3, 0, -3, 0] : 0
          }}
          transition={{
            duration: 0.4,
            repeat: Infinity
          }}
          style={{ transformOrigin: '150px 220px' }}
        >
          {/* 左腿 */}
          <path d="M85 220 Q55 260 40 290" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M100 235 Q75 275 65 305" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
          {/* 右腿 */}
          <path d="M215 220 Q245 260 260 290" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M200 235 Q225 275 235 305" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
        </motion.g>
        
        {/* 身体主体 - 分节 */}
        <motion.g
          animate={{ 
            scaleY: isListening ? [1, 1.01, 1] : 1 
          }}
          transition={{ 
            duration: 0.5, 
            repeat: isListening ? Infinity : 0 
          }}
        >
          {/* 身体底部 */}
          <ellipse cx="150" cy="230" rx="55" ry="40" fill={`url(#bodyGrad)`} />
          <ellipse cx="145" cy="225" rx="35" ry="25" fill="url(#highlightGrad)" />
          
          {/* 身体中部 */}
          <ellipse cx="150" cy="180" rx="60" ry="50" fill={`url(#bodyGrad)`} />
          <ellipse cx="145" cy="170" rx="40" ry="30" fill="url(#highlightGrad)" />
          
          {/* 身体纹理 */}
          <path d="M95 160 Q150 145 205 160" stroke={color} strokeOpacity="0.4" strokeWidth="4" fill="none"/>
          <path d="M90 190 Q150 175 210 190" stroke={color} strokeOpacity="0.4" strokeWidth="4" fill="none"/>
          <path d="M95 220 Q150 205 205 220" stroke={color} strokeOpacity="0.4" strokeWidth="4" fill="none"/>
        </motion.g>
        
        {/* 头部 */}
        <motion.ellipse 
          cx="150" 
          cy="105" 
          rx="65" 
          ry="55" 
          fill={`url(#bodyGrad)`}
          animate={{ 
            rotate: isSleeping ? [0, 2, 0, -2, 0] : 0 
          }}
          transition={{ 
            duration: 2, 
            repeat: isSleeping ? Infinity : 0 
          }}
        />
        
        {/* 头部高光 */}
        <ellipse cx="135" cy="90" rx="40" ry="35" fill="url(#highlightGrad)" />
        
        {/* 大钳子 - 左 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, -12, 0, 12, 0] : [0, -6, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity
          }}
          style={{ transformOrigin: '70px 160px' }}
        >
          {/* 钳子臂 */}
          <ellipse cx="45" cy="150" rx="30" ry="20" fill={color} />
          <ellipse cx="40" cy="148" rx="18" ry="12" fill="url(#highlightGrad)" />
          
          {/* 钳子主体 */}
          <ellipse cx="20" cy="115" rx="30" ry="40" fill={color} />
          <ellipse cx="20" cy="115" rx="20" ry="30" fill={color} opacity="0.85" />
          
          {/* 钳子尖端 - 上 */}
          <path d="M-5 80 Q-15 60 5 45 Q25 70 15 95" fill={color} />
          {/* 钳子尖端 - 下 */}
          <path d="M-5 150 Q-15 170 5 185 Q25 160 15 135" fill={color} />
          
          {/* 钳子高光 */}
          <ellipse cx="15" cy="110" rx="12" ry="18" fill="white" opacity="0.15" />
          <path d="M5 90 Q15 85 25 90" stroke="white" strokeOpacity="0.2" strokeWidth="3" fill="none" />
        </motion.g>
        
        {/* 大钳子 - 右 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, 12, 0, -12, 0] : [0, 6, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity
          }}
          style={{ transformOrigin: '230px 160px' }}
        >
          {/* 钳子臂 */}
          <ellipse cx="255" cy="150" rx="30" ry="20" fill={color} />
          <ellipse cx="260" cy="148" rx="18" ry="12" fill="url(#highlightGrad)" />
          
          {/* 钳子主体 */}
          <ellipse cx="280" cy="115" rx="30" ry="40" fill={color} />
          <ellipse cx="280" cy="115" rx="20" ry="30" fill={color} opacity="0.85" />
          
          {/* 钳子尖端 - 上 */}
          <path d="M305 80 Q315 60 295 45 Q275 70 285 95" fill={color} />
          {/* 钳子尖端 - 下 */}
          <path d="M305 150 Q315 170 295 185 Q275 160 285 135" fill={color} />
          
          {/* 钳子高光 */}
          <ellipse cx="285" cy="110" rx="12" ry="18" fill="white" opacity="0.15" />
          <path d="M295 90 Q285 85 275 90" stroke="white" strokeOpacity="0.2" strokeWidth="3" fill="none" />
        </motion.g>
        
        {/* 眼睛 */}
        <motion.g
          animate={{ 
            scaleY: isSleeping ? 0.2 : 1 
          }}
          transition={{ duration: 0.3 }}
        >
          {/* 左眼 */}
          <circle cx="120" cy="95" r="22" fill="white" />
          <motion.circle 
            cx="120" 
            cy="95" 
            r="11" 
            fill="#1A1A2E"
            animate={{
              cx: isListening ? [120, 124, 120] : 120
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
          <circle cx="124" cy="91" r="5" fill="white" />
          
          {/* 右眼 */}
          <circle cx="180" cy="95" r="22" fill="white" />
          <motion.circle 
            cx="180" 
            cy="95" 
            r="11" 
            fill="#1A1A2E"
            animate={{
              cx: isListening ? [180, 176, 180] : 180
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
          <circle cx="184" cy="91" r="5" fill="white" />
        </motion.g>
        
        {/* 触角 */}
        <motion.g
          animate={{
            rotate: isListening ? [0, 5, 0, -5, 0] : 0
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity
          }}
          style={{ transformOrigin: '150px 50px' }}
        >
          {/* 左触角 */}
          <motion.path 
            d="M100 55 Q65 25 45 5" 
            stroke={color} 
            strokeWidth="8" 
            fill="none" 
            strokeLinecap="round"
            animate={{
              d: isListening 
                ? "M100 55 Q60 20 35 -10" 
                : "M100 55 Q65 25 45 5"
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <circle cx="45" cy="5" r="8" fill={color} />
          <circle cx="42" cy="2" r="3" fill="white" opacity="0.3" />
          
          {/* 右触角 */}
          <motion.path 
            d="M200 55 Q235 25 255 5" 
            stroke={color} 
            strokeWidth="8" 
            fill="none" 
            strokeLinecap="round"
            animate={{
              d: isListening 
                ? "M200 55 Q240 20 265 -10" 
                : "M200 55 Q235 25 255 5"
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <circle cx="255" cy="5" r="8" fill={color} />
          <circle cx="258" cy="2" r="3" fill="white" opacity="0.3" />
        </motion.g>
        
        {/* 嘴巴 */}
        <motion.path 
          d={isSleeping ? "M130 130 Q150 125 170 130" : "M130 130 Q150 142 170 130"} 
          stroke="#1A1A2E" 
          strokeWidth="5" 
          fill="none" 
          strokeLinecap="round"
        />
        
        {/* 腮红 */}
        <circle cx="95" cy="115" r="12" fill="#FFB6C1" opacity="0.5" />
        <circle cx="205" cy="115" r="12" fill="#FFB6C1" opacity="0.5" />
      </svg>
      
      {/* 睡觉 ZZZ - 霓虹色 */}
      {isSleeping && (
        <div className="absolute top-0 right-0">
          <motion.span
            className="absolute text-2xl font-bold"
            style={{ top: -20, right: -10, color: '#00F0FF', textShadow: '0 0 10px #00F0FF' }}
            animate={{
              opacity: [0, 1, 0],
              y: [0, -10, -20],
              rotate: [-10, 10, -10]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0
            }}
          >
            Z
          </motion.span>
          <motion.span
            className="absolute text-xl font-bold"
            style={{ top: -40, right: -20, color: '#FF00FF', textShadow: '0 0 10px #FF00FF' }}
            animate={{
              opacity: [0, 1, 0],
              y: [0, -10, -20],
              rotate: [-10, 10, -10]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5
            }}
          >
            Z
          </motion.span>
          <motion.span
            className="absolute text-lg font-bold"
            style={{ top: -60, right: -30, color: '#FFFF00', textShadow: '0 0 10px #FFFF00' }}
            animate={{
              opacity: [0, 1, 0],
              y: [0, -10, -20],
              rotate: [-10, 10, -10]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1
            }}
          >
            Z
          </motion.span>
        </div>
      )}
    </motion.div>
  )
}