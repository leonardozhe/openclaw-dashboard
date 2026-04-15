'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CopyButtonProps {
  text: string
}

export function CopyButton({ text }: CopyButtonProps) {
  const [showToast, setShowToast] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10"
        title="复制内容"
      >
        <svg className="w-3.5 h-3.5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500/90 text-white rounded-lg text-sm font-medium z-50"
          >
            ✓ 已复制到剪贴板
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
