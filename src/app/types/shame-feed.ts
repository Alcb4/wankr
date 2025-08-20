export interface ShameTransaction {
  hash: string
  from: string
  to: string
  amount: number
  message?: string
  timestamp: number
  blockNumber: number
  netProtocolMessageId?: string
  isCorrelated: boolean
  fromDisplayName?: string
  toDisplayName?: string
  judgment?: number
  fromSource?: 'farcaster' | 'basenames' | 'shortened'
  toSource?: 'farcaster' | 'basenames' | 'shortened'
  isNew?: boolean
}

export interface NetProtocolMessage {
  id: string
  text: string
  topic: string
  data: string
  timestamp: number
  sender: string
}

export interface ShameFeedStats {
  totalTransactions: number
  totalShameDelivered: number
  uniqueShamers: number
  uniqueShamed: number
  lastUpdate: string
  averageJudgment: number
}

export interface ShameFeedData {
  transactions: ShameTransaction[]
  stats: ShameFeedStats
}

export interface LocalStorageConfig {
  prefix: string
  ttl: number // Time to live in milliseconds
  maxEntries: number
}
