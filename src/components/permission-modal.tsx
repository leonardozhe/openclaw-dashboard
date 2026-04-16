'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PermissionModalProps {
  onAccept: () => void
  onDecline: () => void
}

export function PermissionModal({ onAccept, onDecline }: PermissionModalProps) {
  // 使用懒初始化检查用户是否已经同意过
  const [hasAgreed, setHasAgreed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ysk-permission-agreed') === 'true'
    }
    return false
  })

  const handleAccept = () => {
    localStorage.setItem('ysk-permission-agreed', 'true')
    setHasAgreed(true)
    onAccept()
  }

  const handleDecline = () => {
    onDecline()
  }

  return (
    <AnimatePresence>
      {!hasAgreed && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(15, 15, 25, 0.95)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)'
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* 顶部装饰条 */}
            <div 
              className="h-1 w-full"
              style={{
                background: 'linear-gradient(90deg, #00F0FF, #FF00FF, #00F0FF)'
              }}
            />
            
            {/* 内容区域 */}
            <div className="p-6">
              {/* 标题 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 240, 255, 0.1)' }}>
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">使用许可声明</h2>
              </div>

              {/* 许可说明 */}
              <div className="space-y-4 text-sm">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(0, 240, 255, 0.05)' }}>
                  <p className="text-cyan-400 font-semibold mb-1">YSK - OpenClaw Dashboard v1.2 Beta</p>
                  <p className="text-gray-300">本软件由 YSK 团队开发，专为 YSK 会员粉丝设计。</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-medium">📋 许可条款</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✅</span>
                      <span><strong className="text-white">免费使用</strong> - YSK 会员粉丝可以免费使用本软件的所有功能</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">❌</span>
                      <span><strong className="text-white">禁止商用</strong> - 不得将本软件用于任何商业用途</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">❌</span>
                      <span><strong className="text-white">禁止转售</strong> - 不得转售、分发或作为商业服务的一部分</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">❌</span>
                      <span><strong className="text-white">禁止修改</strong> - 不得修改源代码后重新发布</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 165, 0, 0.1)', border: '1px solid rgba(255, 165, 0, 0.3)' }}>
                  <p className="text-orange-400 text-xs">
                    ⚠️ 注意：本软件基于 MIT 许可证开源，但附加了上述使用限制。违反许可条款可能导致法律责任。
                  </p>
                </div>
              </div>

              {/* 按钮区域 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDecline}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#9CA3AF'
                  }}
                >
                  拒绝并退出
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #00F0FF, #0080FF)',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                  }}
                >
                  我已阅读并同意
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
