'use client'

import { motion } from 'framer-motion'
import Lottie from 'lottie-react'
import { useMemo } from 'react'

// Lottie 动画数据类型
interface LottieAnimationData {
  v: string
  fr: number
  ip: number
  op: number
  w: number
  h: number
  nm: string
  ddd: number
  assets: unknown[]
  layers: unknown[]
}

// Lottie 动画数据 - 可爱的龙虾动画
const getLobsterAnimation = (): LottieAnimationData => ({
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 90,
  "w": 300,
  "h": 300,
  "nm": "Cute Lobster",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Body",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [0], "e": [3] },
            { "t": 15, "s": [3], "e": [-3] },
            { "t": 30, "s": [-3], "e": [3] },
            { "t": 45, "s": [3], "e": [0] },
            { "t": 60, "s": [0] }
          ]
        },
        "p": { "a": 0, "k": [150, 160, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [100, 100, 100], "e": [102, 98, 100] },
            { "t": 15, "s": [102, 98, 100], "e": [98, 102, 100] },
            { "t": 30, "s": [98, 102, 100], "e": [102, 98, 100] },
            { "t": 45, "s": [102, 98, 100], "e": [100, 100, 100] },
            { "t": 60, "s": [100, 100, 100] }
          ]
        }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [100, 80] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.95, 0.25, 0.2, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Body Shape"
        }
      ]
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Left Claw",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [-20], "e": [-35] },
            { "t": 10, "s": [-35], "e": [-20] },
            { "t": 20, "s": [-20], "e": [-35] },
            { "t": 30, "s": [-35], "e": [-20] },
            { "t": 45, "s": [-20] }
          ]
        },
        "p": { "a": 0, "k": [85, 130, 0] },
        "a": { "a": 0, "k": [0, 30, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [45, 55] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.98, 0.35, 0.25, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Claw Shape"
        }
      ]
    },
    {
      "ddd": 0,
      "ind": 3,
      "ty": 4,
      "nm": "Right Claw",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { 
          "a": 1, 
          "k": [
            { "t": 5, "s": [20], "e": [35] },
            { "t": 15, "s": [35], "e": [20] },
            { "t": 25, "s": [20], "e": [35] },
            { "t": 35, "s": [35], "e": [20] },
            { "t": 45, "s": [20] }
          ]
        },
        "p": { "a": 0, "k": [215, 130, 0] },
        "a": { "a": 0, "k": [0, 30, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [45, 55] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.98, 0.35, 0.25, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Claw Shape"
        }
      ]
    },
    {
      "ddd": 0,
      "ind": 4,
      "ty": 4,
      "nm": "Eyes",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [150, 140, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [20, 24] },
              "p": { "a": 0, "k": [-25, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [1, 1, 1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Left Eye White"
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [20, 24] },
              "p": { "a": 0, "k": [25, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [1, 1, 1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Right Eye White"
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [10, 12] },
              "p": { "a": 0, "k": [-25, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Left Pupil"
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [10, 12] },
              "p": { "a": 0, "k": [25, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Right Pupil"
        }
      ]
    }
  ]
})

// 睡眠动画
const getSleepAnimation = (): LottieAnimationData => ({
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 60,
  "w": 300,
  "h": 300,
  "nm": "Sleeping Lobster",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Body",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [150, 160, 0], "e": [150, 165, 0] },
            { "t": 30, "s": [150, 165, 0], "e": [150, 160, 0] },
            { "t": 60, "s": [150, 160, 0] }
          ]
        },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [100, 80] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.85, 0.22, 0.18, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Body Shape"
        }
      ]
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Closed Eyes",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [150, 140, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "rc",
              "s": { "a": 0, "k": [18, 4] },
              "p": { "a": 0, "k": [-25, 0] },
              "r": { "a": 0, "k": 2 }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Left Eye"
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "rc",
              "s": { "a": 0, "k": [18, 4] },
              "p": { "a": 0, "k": [25, 0] },
              "r": { "a": 0, "k": 2 }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Right Eye"
        }
      ]
    }
  ]
})

// 语音模式动画 - 更活跃
const getListeningAnimation = (): LottieAnimationData => ({
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 30,
  "w": 300,
  "h": 300,
  "nm": "Listening Lobster",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Body",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [0], "e": [5] },
            { "t": 7, "s": [5], "e": [-5] },
            { "t": 15, "s": [-5], "e": [5] },
            { "t": 22, "s": [5], "e": [0] },
            { "t": 30, "s": [0] }
          ]
        },
        "p": { "a": 0, "k": [150, 160, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [100, 100, 100], "e": [105, 95, 100] },
            { "t": 7, "s": [105, 95, 100], "e": [95, 105, 100] },
            { "t": 15, "s": [95, 105, 100], "e": [105, 95, 100] },
            { "t": 22, "s": [105, 95, 100], "e": [100, 100, 100] },
            { "t": 30, "s": [100, 100, 100] }
          ]
        }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [100, 80] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.95, 0.25, 0.2, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Body Shape"
        }
      ]
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Left Claw Active",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [-20], "e": [-45] },
            { "t": 5, "s": [-45], "e": [-20] },
            { "t": 10, "s": [-20], "e": [-45] },
            { "t": 15, "s": [-45], "e": [-20] },
            { "t": 20, "s": [-20], "e": [-45] },
            { "t": 25, "s": [-45], "e": [-20] },
            { "t": 30, "s": [-20] }
          ]
        },
        "p": { "a": 0, "k": [85, 130, 0] },
        "a": { "a": 0, "k": [0, 30, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [45, 55] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.98, 0.35, 0.25, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Claw Shape"
        }
      ]
    },
    {
      "ddd": 0,
      "ind": 3,
      "ty": 4,
      "nm": "Right Claw Active",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [20], "e": [45] },
            { "t": 5, "s": [45], "e": [20] },
            { "t": 10, "s": [20], "e": [45] },
            { "t": 15, "s": [45], "e": [20] },
            { "t": 20, "s": [20], "e": [45] },
            { "t": 25, "s": [45], "e": [20] },
            { "t": 30, "s": [20] }
          ]
        },
        "p": { "a": 0, "k": [215, 130, 0] },
        "a": { "a": 0, "k": [0, 30, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [45, 55] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.98, 0.35, 0.25, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Claw Shape"
        }
      ]
    },
    {
      "ddd": 0,
      "ind": 4,
      "ty": 4,
      "nm": "Big Eyes",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [150, 140, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { 
          "a": 1, 
          "k": [
            { "t": 0, "s": [100, 100, 100], "e": [110, 110, 100] },
            { "t": 15, "s": [110, 110, 100], "e": [100, 100, 100] },
            { "t": 30, "s": [100, 100, 100] }
          ]
        }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [24, 28] },
              "p": { "a": 0, "k": [-25, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [1, 1, 1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Left Eye White"
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [24, 28] },
              "p": { "a": 0, "k": [25, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [1, 1, 1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Right Eye White"
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [12, 14] },
              "p": { "a": 0, "k": [-25, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Left Pupil"
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "s": { "a": 0, "k": [12, 14] },
              "p": { "a": 0, "k": [25, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 }
            }
          ],
          "nm": "Right Pupil"
        }
      ]
    }
  ]
})

interface LottieLobsterProps {
  isSleeping?: boolean
  isListening?: boolean
  color?: string
  size?: number
  className?: string
}

export function LottieLobster({ 
  isSleeping = false, 
  isListening = false,
  color = '#00F0FF',
  size = 280,
  className = ''
}: LottieLobsterProps) {
  // 使用 useMemo 避免每次渲染都创建新对象
  const animationData = useMemo(() => {
    if (isSleeping) {
      return getSleepAnimation()
    }
    if (isListening) {
      return getListeningAnimation()
    }
    return getLobsterAnimation()
  }, [isSleeping, isListening])

  return (
    <motion.div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 霓虹光晕效果 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          filter: 'blur(20px)'
        }}
        animate={{
          scale: isListening ? [1, 1.2, 1] : 1,
          opacity: isListening ? [0.5, 0.8, 0.5] : 0.5
        }}
        transition={{
          duration: 1.5,
          repeat: isListening ? Infinity : 0
        }}
      />
      
      {/* Lottie 动画 */}
      <Lottie 
        animationData={animationData}
        loop={true}
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* 状态指示器 */}
      {isListening && (
        <motion.div
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={{ 
              background: `linear-gradient(135deg, ${color}40, ${color}20)`,
              border: `1px solid ${color}60`,
              color: color
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🎤
            </motion.span>
            正在聆听...
          </div>
        </motion.div>
      )}
      
    </motion.div>
  )
}

export default LottieLobster