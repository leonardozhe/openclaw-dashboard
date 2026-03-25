'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Activity, Zap, Users, Server, Brain, ArrowUp, ArrowDown, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { contacts } from '@/lib/utils'

type LogStatus = '完成' | '错误' | '等待' | '重试'

interface LogEntry {
  id: number
  logId: string
  timestamp: Date
  status: LogStatus
  model: string
  shrimpName: string
  shrimpTitle: string
  task: string
  isTempWorker?: boolean
}

// 生成随机订单号
function genOrderId(): string {
  return '#' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
}

// 生成隐私ID
function genPrivacyId(): string {
  const id = Math.floor(Math.random() * 10000).toString()
  return id.slice(0, 2) + '****' + id.slice(-2)
}

// 生成站点编号
function genSiteNo(): string {
  const types = ['美妆竞品', '3C竞品', '服装竞品', '家居竞品', '宠物竞品']
  const type = types[Math.floor(Math.random() * types.length)]
  const no = Math.floor(Math.random() * 20) + 1
  return `${type} ${no.toString().padStart(2, '0')}号站点`
}

// 生成临时工编号
function genTempWorkerId(): string {
  return Math.floor(Math.random() * 1000).toString().padStart(3, '0')
}

// 根据职位生成对应任务 - 真实业务关联
function getTaskByTitle(title: string): string {
  const taskMap: Record<string, string[]> = {
    'CEO · 创始人': [
      '战略决策审批通过',
      '投资人会议纪要已发',
      '团队周报汇总完成',
    ],
    'AI 算法工程师': [
      'API 响应优化完成',
      '数据处理流程更新',
      '缓存命中率优化至 94%',
      '服务监控告警配置',
    ],
    '数据安全专家': [
      '加密成交记录已存档',
      '安全漏洞扫描完成',
      '权限合规检查通过',
      '数据脱敏处理完成',
    ],
    '数据分析师': [
      '销售数据日报生成完成',
      '用户行为分析报告已发',
      '转化漏斗数据更新',
      'ROI 分析：今日 2.3',
    ],
    '跨境电商运营': [
      `订单接收成功 ${genOrderId()}`,
      `订单处理中 ${genOrderId()}`,
      `产品上传成功 - ASIN: B0${Math.floor(Math.random() * 10000000)}`,
      '产品上传失败 - 图片尺寸不符',
      '店铺评分更新 4.8 ⭐',
    ],
    '供应链经理': [
      `订单自动订货 ${genOrderId()}`,
      '库存预警：SKU-2834 仅剩 12 件',
      '供应商发货确认',
      '物流状态更新：清关中',
      `订单失败 ${genOrderId()} - 库存不足`,
    ],
    '海外营销专家': [
      `Facebook 广告启动 (${genPrivacyId()})`,
      `Facebook 广告关闭 (${genPrivacyId()})`,
      `Facebook 广告效果好 - ROAS 3.2 (${genPrivacyId()})`,
      `Facebook 广告效果不佳 - ROAS 0.8 (${genPrivacyId()})`,
      `Facebook 账户欠费 (${genPrivacyId()})`,
      'Google Ads 广告启动',
      'Google Ads 账户异常 - 需验证',
      'TikTok 投放优化 - CTR 提升 15%',
    ],
    '内容运营专家': [
      '爆款内容发布 - 播放量 10w+',
      '内容生成完成 - 50 篇',
      '视频脚本撰写完成',
      '社媒排期更新',
    ],
    '选品经理': [
      `Shopify ${genSiteNo()}发现新品`,
      '爬虫抓取竞品数据完成',
      '市场趋势调研报告已发',
      '新品潜力评分：A+ (85分)',
    ],
    'UI/UX 设计师': [
      '界面原型设计完成',
      '用户体验优化 - 首页转化 +5%',
      '品牌视觉更新已上线',
    ],
    '前端工程师': [
      '前端开发进度：Feature-284 已完成',
      '前端开发进度：Bug-1892 修复中',
      '页面性能优化 - LCP 降至 1.2s',
      '组件库更新至 v2.3.0',
    ],
    '后端工程师': [
      '后端开发报错 - 数据库连接超时',
      '后端开发报错 - Redis 内存不足',
      'API 接口优化完成',
      '服务部署成功 - v1.8.2',
    ],
    '客服经理': [
      '客服处理完成 - 工单 #28374',
      '投诉处理完成 - 退款已发',
      '客服数据更新',
      `订单失败自动邮件召回 ${genOrderId()}`,
      '多语言支持新增：葡萄牙语',
    ],
    '财务经理': [
      '财务报表生成完成',
      '跨境支付处理成功 - $12,340',
      '税务合规审核通过',
      '成本分析：本月降低 8%',
    ],
    'HR 经理': [
      '人才招聘面试 3 人',
      '员工培训计划已发',
      '绩效考核汇总完成',
      '团队建设活动报名中',
    ],
  }
  
  const tasks = taskMap[title] || ['日常事务处理']
  return tasks[Math.floor(Math.random() * tasks.length)]
}

// 临时工相关任务
function getTempWorkerTask(): { task: string; isOnline: boolean; isOffline: boolean; isComplete: boolean } {
  const tempId = genTempWorkerId()
  const rand = Math.random()
  
  if (rand < 0.35) {
    return { task: `临时小龙虾 编号 ${tempId} 上线`, isOnline: true, isOffline: false, isComplete: false }
  } else if (rand < 0.65) {
    return { task: `临时小龙虾 编号 ${tempId} 下线`, isOnline: false, isOffline: true, isComplete: false }
  } else {
    return { task: `临时小龙虾 编号 ${tempId} 完成任务关闭`, isOnline: false, isOffline: false, isComplete: true }
  }
}

// 根据任务内容判断状态
function getStatusByTask(task: string): LogStatus {
  if (task.includes('失败') || task.includes('报错') || task.includes('异常') || task.includes('欠费')) {
    return Math.random() > 0.3 ? '错误' : '重试'
  }
  if (task.includes('处理中') || task.includes('优化') || task.includes('进行') || task.includes('中')) {
    return Math.random() > 0.5 ? '等待' : '完成'
  }
  // 大部分任务完成
  const rand = Math.random()
  if (rand < 0.7) return '完成'
  if (rand < 0.85) return '等待'
  return '重试'
}

// 生成随机日志ID
function generateLogId(): string {
  return Math.floor(Math.random() * 100000).toString().padStart(5, '0')
}

// 生成随机日志
// 全局龙虾数量变化回调
let shrimpCountChangeCallback: ((change: number) => void) | null = null

export function setShrimpCountChangeCallback(callback: (change: number) => void) {
  shrimpCountChangeCallback = callback
}

function generateLogEntry(id: number): LogEntry {
  const models = ['GLM-5', 'Claude', 'Gemini']
  
  // 30% 概率生成临时工任务
  if (Math.random() < 0.3) {
    const tempTask = getTempWorkerTask()
    const model = models[Math.floor(Math.random() * models.length)]
    
    // 通知龙虾数量变化
    if (shrimpCountChangeCallback) {
      if (tempTask.isOnline) {
        shrimpCountChangeCallback(1)
      } else if (tempTask.isOffline) {
        shrimpCountChangeCallback(-1)
      }
    }
    
    return {
      id,
      logId: generateLogId(),
      timestamp: new Date(),
      status: tempTask.isOnline ? '完成' : tempTask.isOffline ? '等待' : '完成',
      model,
      shrimpName: '系统调度',
      shrimpTitle: '临时工管理',
      task: tempTask.task,
      isTempWorker: true,
    }
  }
  
  // 从联系人列表中随机选择一只虾
  const randomContact = contacts[Math.floor(Math.random() * contacts.length)]
  
  // 根据职位生成对应任务
  const task = getTaskByTitle(randomContact.title)
  
  // 根据任务内容智能判断状态
  const status = getStatusByTask(task)
  
  const model = models[Math.floor(Math.random() * models.length)]

  return {
    id,
    logId: generateLogId(),
    timestamp: new Date(),
    status,
    model,
    shrimpName: randomContact.name,
    shrimpTitle: randomContact.title,
    task,
  }
}

// 固定的初始日志数据 - 避免 SSR hydration 不匹配
const getFixedInitialLogs = (): LogEntry[] => {
  const now = new Date()
  return [
    { id: 0, logId: '00001', timestamp: now, shrimpName: '肥虾一号', shrimpTitle: '运营总监', task: '产品监控任务执行完成', status: '完成', model: 'GLM-5' },
    { id: 1, logId: '00002', timestamp: now, shrimpName: '肥虾二号', shrimpTitle: '数据分析', task: '竞品价格采集完成', status: '完成', model: 'Claude' },
    { id: 2, logId: '00003', timestamp: now, shrimpName: '肥虾三号', shrimpTitle: '客服专员', task: '订单处理中 #12345678', status: '完成', model: 'Gemini' },
    { id: 3, logId: '00004', timestamp: now, shrimpName: '肥虾四号', shrimpTitle: '内容运营', task: '产品上架优化完成', status: '完成', model: 'GLM-5' },
    { id: 4, logId: '00005', timestamp: now, shrimpName: '肥虾五号', shrimpTitle: '市场推广', task: '数据同步任务完成', status: '完成', model: 'Claude' },
    { id: 5, logId: '00006', timestamp: now, shrimpName: '肥虾六号', shrimpTitle: '财务助理', task: '报表生成成功', status: '完成', model: 'Gemini' },
    { id: 6, logId: '00007', timestamp: now, shrimpName: '临时工007', shrimpTitle: '临时工', task: '临时任务执行完成', status: '完成', model: 'GLM-5', isTempWorker: true },
    { id: 7, logId: '00008', timestamp: now, shrimpName: '肥虾八号', shrimpTitle: '仓储管理', task: '库存检查完成', status: '完成', model: 'Claude' },
  ]
}

export function ActivityLog() {
  const [mounted, setMounted] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const idRef = useRef(8)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 客户端挂载后才初始化数据
  useEffect(() => {
    setTimeout(() => {
      setMounted(true)
      setLogs(getFixedInitialLogs())
    }, 0)
  }, [])

  useEffect(() => {
    // 定期添加新日志
    const interval = setInterval(() => {
      const newLog = generateLogEntry(idRef.current++)
      setLogs(prev => {
        const updated = [...prev, newLog]
        // 保留最近 20 条
        return updated.slice(-20)
      })
    }, 3000 + Math.random() * 2000)

    return () => clearInterval(interval)
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const getStatusIcon = (status: LogStatus) => {
    switch (status) {
      case '完成': return <CheckCircle className="w-3 h-3" />
      case '错误': return <XCircle className="w-3 h-3" />
      case '等待': return <Clock className="w-3 h-3" />
      case '重试': return <RefreshCw className="w-3 h-3" />
    }
  }

  const getStatusColor = (status: LogStatus) => {
    switch (status) {
      case '完成': return '#00FF66'
      case '错误': return '#FF4040'
      case '等待': return '#FFAA00'
      case '重试': return '#00F0FF'
    }
  }

  // 格式化日期时间
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')
    return { date: `${year}/${month}/${day}`, time: `${hour}:${minute}:${second}` }
  }

  // 在客户端挂载前不渲染，避免水合错误
  if (!mounted) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-white/70">实时日志</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-white/30">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-white/70">实时日志</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs text-white/40">运行中</span>
        </div>
      </div>
      
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs scrollbar-thin"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const { date, time } = formatDateTime(log.timestamp)
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5"
              >
                <span className="text-white/40 flex-shrink-0">{date}</span>
                <span className="text-cyan-400/80 flex-shrink-0">{time}</span>
                <span className="text-white/20">|</span>
                <span className="text-yellow-400/80 text-[10px] flex-shrink-0 font-semibold">#{log.logId}</span>
                <span className="text-white/20">|</span>
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0"
                  style={{
                    color: getStatusColor(log.status)
                  }}
                >
                  {getStatusIcon(log.status)}
                  <span>{log.status}</span>
                </div>
                <span className="text-white/20">|</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] flex-shrink-0"
                  style={{
                    background: 'rgba(157, 0, 255, 0.15)',
                    color: '#B366FF'
                  }}
                >
                  {log.model}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] flex-shrink-0"
                  style={{
                    background: 'rgba(0, 240, 255, 0.1)',
                    color: '#00F0FF'
                  }}
                >
                  {log.shrimpName}
                </span>
                <span className="text-white/70 truncate">{log.task}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}