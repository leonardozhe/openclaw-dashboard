import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 联系人数据类型
export interface Contact {
  id: string
  name: string
  title: string
  bio: string
  skills: string[]
  status: 'online' | 'busy' | 'away' | 'offline'
  color: string
  avatar?: string
  isDefault?: boolean
  unreadCount?: number
}

// DiceBear Bottts 头像生成函数
function getDiceBearAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}`
}

// 联系人数据 - AI + 跨境电商海洋战队 🦞
export const contacts: Contact[] = [
  {
    id: 'openclaw',
    name: '龙虾船长',
    title: 'CEO · 创始人',
    bio: 'OpenClaw 掌舵人，统领 AI 与跨境电商双引擎战略',
    skills: ['战略规划', '团队管理', '资源整合'],
    status: 'online',
    color: '#00F0FF',
    avatar: getDiceBearAvatar('openclaw'),
    isDefault: true
  },
  {
    id: 'aibobster',
    name: 'AI小波龙',
    title: 'AI 算法工程师',
    bio: '大模型调教专家，让 AI 比龙虾还聪明',
    skills: ['LLM', '机器学习', 'NLP'],
    status: 'online',
    color: '#00FF66',
    avatar: getDiceBearAvatar('aibobster')
  },
  {
    id: 'pipixia',
    name: '加密皮皮虾',
    title: '数据安全专家',
    bio: '数据加密大师，保护每一条数据像虾壳一样坚固',
    skills: ['数据加密', '隐私保护', '安全审计'],
    status: 'online',
    color: '#FF00FF',
    avatar: getDiceBearAvatar('pipixia')
  },
  {
    id: 'datalobster',
    name: '数据大龙虾',
    title: '数据分析师',
    bio: '跨境数据侦探，从海量数据中挖掘黄金',
    skills: ['数据分析', 'BI可视化', '用户画像'],
    status: 'online',
    color: '#9D00FF',
    avatar: getDiceBearAvatar('datalobster')
  },
  {
    id: 'operationcrab',
    name: '运营小螃蟹',
    title: '跨境电商运营',
    bio: '横着走遍全球市场，亚马逊、TikTok、独立站通吃',
    skills: ['平台运营', '店铺管理', '活动策划'],
    status: 'online',
    color: '#FFFF00',
    avatar: getDiceBearAvatar('operationcrab')
  },
  {
    id: 'supplychain',
    name: '供应链大虾',
    title: '供应链经理',
    bio: '从工厂到仓库，让每一件商品准时到达',
    skills: ['供应链管理', '采购', '物流优化'],
    status: 'away',
    color: '#FF6600',
    avatar: getDiceBearAvatar('supplychain')
  },
  {
    id: 'marketshrimp',
    name: '营销小龙虾',
    title: '海外营销专家',
    bio: 'Facebook、Google、TikTok 投放达人，ROI 翻倍不是梦',
    skills: ['海外投放', 'SEO', '社媒营销'],
    status: 'online',
    color: '#FF0080',
    avatar: getDiceBearAvatar('marketshrimp')
  },
  {
    id: 'contentlobster',
    name: '内容大龙虾',
    title: '内容运营专家',
    bio: 'AI + 人工协作，批量生产爆款内容',
    skills: ['内容创作', 'AIGC', '视频制作'],
    status: 'busy',
    color: '#00CED1',
    avatar: getDiceBearAvatar('contentlobster')
  },
  {
    id: 'productshrimp',
    name: '选品小虾米',
    title: '选品经理',
    bio: '爆款探测器，用 AI 预测下一个百万单品',
    skills: ['市场调研', '竞品分析', 'AI选品'],
    status: 'online',
    color: '#7B68EE',
    avatar: getDiceBearAvatar('productshrimp')
  },
  {
    id: 'designlobster',
    name: '设计大龙虾',
    title: 'UI/UX 设计师',
    bio: '让产品界面像龙虾壳一样炫酷，用户体验丝滑',
    skills: ['UI设计', 'UX优化', '品牌设计'],
    status: 'online',
    color: '#FF69B4',
    avatar: getDiceBearAvatar('designlobster')
  },
  {
    id: 'frontendshrimp',
    name: '前端小龙虾',
    title: '前端工程师',
    bio: 'React、Vue、Next.js 样样精通，页面丝滑如水',
    skills: ['React', 'TypeScript', '性能优化'],
    status: 'online',
    color: '#32CD32',
    avatar: getDiceBearAvatar('frontendshrimp')
  },
  {
    id: 'backendlobster',
    name: '后端大龙虾',
    title: '后端工程师',
    bio: '微服务架构师，让系统稳定如磐石',
    skills: ['Node.js', 'Python', '分布式'],
    status: 'away',
    color: '#4169E1',
    avatar: getDiceBearAvatar('backendlobster')
  },
  {
    id: 'customerxshrimp',
    name: '客服小虾米',
    title: '客服经理',
    bio: 'AI 客服 + 人工服务，24小时响应全球客户',
    skills: ['客户服务', 'AI客服', '多语言'],
    status: 'online',
    color: '#20B2AA',
    avatar: getDiceBearAvatar('customerxshrimp')
  },
  {
    id: 'fancelobster',
    name: '财务大龙虾',
    title: '财务经理',
    bio: '跨境支付、税务合规，让每一分钱清清楚楚',
    skills: ['财务分析', '税务筹划', '跨境支付'],
    status: 'offline',
    color: '#DAA520',
    avatar: getDiceBearAvatar('fancelobster')
  },
  {
    id: 'hrshrimp',
    name: '人事小虾米',
    title: 'HR 经理',
    bio: '人才捕手，网罗全球跨境电商精英',
    skills: ['招聘', '培训', '团队建设'],
    status: 'online',
    color: '#CD853F',
    avatar: getDiceBearAvatar('hrshrimp')
  }
]

// 消息类型
export interface Message {
  id: string
  text: string
  type: 'user' | 'ai'
  timestamp: number
}

// AI 回复生成 - Web3 风格
export function getAIResponse(input: string, assistantName: string): string {
  const responses: Record<string, string> = {
    [`${assistantName}你好`]: `GM! ${assistantName} 已上线，节点同步完成。🦞⛓️`,
    '今天gas怎么样': '扫描 Gas Oracle 中... 当前 Base Fee 适中，适合交互！⛽',
    '帮我审计合约': '安全审计模块已激活。请提供合约地址或代码。🔍🛡️',
    '最近有什么空投': '链上监控中... 检测到几个潜在机会，记得 DYOR！🎁',
    '什么是DeFi': 'DeFi (去中心化金融) 是构建在区块链上的开放金融协议，无需许可即可参与。📊',
    '帮我写个合约': 'Solidity 编译器就绪。请描述你需要的合约功能？📝⚙️',
    '市场行情': '获取链上数据中... 记住：WAGMI，但要谨慎投资！📈',
    '讲个笑话': 'Error 404: Not your keys, not your jokes. 😄⚡'
  }
  
  return responses[input] || `📡 信号已接收。${assistantName} 正在处理你的请求... ⛓️🦞`
}