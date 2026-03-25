// 聊天系统 - v0.75
// Chat System - NPC 对话/系统消息/本地聊天 (单机版)

/**
 * 消息类型
 */
export type MessageType = 'system' | 'npc' | 'broadcast' | 'mail' | 'combat' | 'reward' | 'tips';

/**
 * 消息优先级
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * 奖励物品
 */
export interface RewardItem {
  type: 'gold' | 'diamond' | 'exp' | 'stamina' | 'petFood' | 'petShard' | 'equipBox' | 'material' | 'artifact';
  amount: number;
  name: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  type: MessageType;
  priority: MessagePriority;
  sender: string;
  content: string;
  timestamp: number;
  /** 是否已读 */
  isRead: boolean;
  /** 是否重要 (置顶) */
  isImportant: boolean;
  /** 关联数据 (如奖励详情) */
  metadata?: Record<string, any>;
  /** 过期时间 (0=永不过期) */
  expiresAt: number;
}

/**
 * NPC 配置
 */
export interface NPCConfig {
  id: string;
  name: string;
  title: string;
  avatar: string;
  dialogues: DialogueLine[];
  relationship: number; // 好感度 0-100
}

/**
 * 对话行
 */
export interface DialogueLine {
  id: string;
  text: string;
  /** 触发条件 */
  condition?: { type: string; value: any };
  /** 选项 */
  options?: DialogueOption[];
  /** 奖励 */
  rewards?: RewardItem[];
}

/**
 * 对话选项
 */
export interface DialogueOption {
  text: string;
  nextDialogueId?: string;
  effect?: { type: string; value: any };
}

/**
 * 聊天系统状态
 */
export interface ChatState {
  playerId: string;
  /** 所有消息 */
  messages: ChatMessage[];
  /** 未读消息数 */
  unreadCount: number;
  /** 重要消息数 */
  importantCount: number;
  /** NPC 关系 */
  npcRelationships: Record<string, number>;
  /** 已解锁对话 */
  unlockedDialogues: string[];
  /** 消息设置 */
  settings: ChatSettings;
  /** 最后清理时间 */
  lastCleanupTime: number;
}

/**
 * 聊天设置
 */
export interface ChatSettings {
  showSystemMessages: boolean;
  showCombatMessages: boolean;
  showTipsMessages: boolean;
  autoCleanupDays: number; // 自动清理天数
  maxMessages: number; // 最大消息数
  priorityFilter: MessagePriority[]; // 优先级过滤
}

// ==================== NPC 配置 ====================

export const NPC_DATABASE: NPCConfig[] = [
  {
    id: 'npc_guide',
    name: '引导精灵',
    title: '新手引导',
    avatar: '🧚',
    relationship: 50,
    dialogues: [
      {
        id: 'greet_001',
        text: '欢迎来到梦幻放置！我是引导精灵，有什么问题都可以问我哦~',
        options: [
          { text: '游戏怎么玩？', nextDialogueId: 'howto_001' },
          { text: '有什么奖励？', nextDialogueId: 'reward_001' },
          { text: '再见', nextDialogueId: 'bye_001' },
        ],
      },
      {
        id: 'howto_001',
        text: '游戏很简单！培养角色、挑战关卡、收集宠物，即使离线也能获得收益哦！',
        options: [{ text: '明白了', nextDialogueId: 'greet_001' }],
      },
      {
        id: 'reward_001',
        text: '每日签到、成就系统、活动任务都有丰厚奖励！记得按时领取哦~',
        options: [{ text: '谢谢', nextDialogueId: 'greet_001' }],
      },
      {
        id: 'bye_001',
        text: '祝你游戏愉快！有需要随时找我~',
      },
    ],
  },
  {
    id: 'npc_merchant',
    name: '神秘商人',
    title: '黑市商人',
    avatar: '🧙',
    relationship: 30,
    dialogues: [
      {
        id: 'merchant_001',
        text: '嘿嘿，稀有货物刚到，要不要看看？',
        options: [
          { text: '看看商品', effect: { type: 'openShop', value: true } },
          { text: '太贵了', nextDialogueId: 'merchant_002' },
          { text: '下次吧', nextDialogueId: 'bye_002' },
        ],
      },
      {
        id: 'merchant_002',
        text: '嫌贵？这可是限量版！过了这村没这店了！',
        options: [{ text: '...好吧', nextDialogueId: 'merchant_001' }],
      },
      {
        id: 'bye_002',
        text: '随时欢迎回来~',
      },
    ],
  },
  {
    id: 'npc_blacksmith',
    name: '铁匠大叔',
    title: '装备大师',
    avatar: '👨‍🔧',
    relationship: 40,
    dialogues: [
      {
        id: 'blacksmith_001',
        text: '哟，要来强化装备吗？手艺包你满意！',
        options: [
          { text: '强化装备', effect: { type: 'openEnhance', value: true } },
          { text: '聊聊', nextDialogueId: 'blacksmith_002' },
        ],
      },
      {
        id: 'blacksmith_002',
        text: '我打铁三十年了，什么装备没见过？放心交给我！',
        options: [{ text: '谢谢大叔', nextDialogueId: 'blacksmith_001' }],
      },
    ],
  },
];

// ==================== 默认设置 ====================

export const DEFAULT_SETTINGS: ChatSettings = {
  showSystemMessages: true,
  showCombatMessages: true,
  showTipsMessages: true,
  autoCleanupDays: 7,
  maxMessages: 500,
  priorityFilter: ['normal', 'high', 'urgent'],
};

// ==================== 工具函数 ====================

export function getNow(): number {
  return Date.now();
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getMessageTypeLabel(type: MessageType): string {
  const labels: Record<MessageType, string> = {
    system: '系统',
    npc: 'NPC',
    broadcast: '公告',
    mail: '邮件',
    combat: '战斗',
    reward: '奖励',
    tips: '提示',
  };
  return labels[type];
}

export function getPriorityLabel(priority: MessagePriority): string {
  const labels: Record<MessagePriority, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority];
}

// ==================== 核心函数 ====================

/**
 * 创建聊天系统状态
 */
export function createChatState(playerId: string, now?: number): ChatState {
  return {
    playerId,
    messages: [],
    unreadCount: 0,
    importantCount: 0,
    npcRelationships: {},
    unlockedDialogues: ['greet_001'],
    settings: { ...DEFAULT_SETTINGS },
    lastCleanupTime: now ?? getNow(),
  };
}

/**
 * 添加消息
 */
export function addMessage(
  state: ChatState,
  type: MessageType,
  sender: string,
  content: string,
  options?: {
    priority?: MessagePriority;
    isImportant?: boolean;
    metadata?: Record<string, any>;
    expiresAt?: number;
  },
  now?: number
): ChatState {
  const currentTime = now ?? getNow();
  const message: ChatMessage = {
    id: generateMessageId(),
    type,
    priority: options?.priority || 'normal',
    sender,
    content,
    timestamp: currentTime,
    isRead: false,
    isImportant: options?.isImportant || false,
    metadata: options?.metadata,
    expiresAt: options?.expiresAt || 0,
  };

  // 检查设置是否显示该类型消息
  if (type === 'system' && !state.settings.showSystemMessages) return state;
  if (type === 'combat' && !state.settings.showCombatMessages) return state;
  if (type === 'tips' && !state.settings.showTipsMessages) return state;

  const newMessages = [message, ...state.messages].slice(0, state.settings.maxMessages);

  return {
    ...state,
    messages: newMessages,
    unreadCount: newMessages.filter(m => !m.isRead).length,
    importantCount: newMessages.filter(m => m.isImportant && !m.isRead).length,
  };
}

/**
 * 标记消息为已读
 */
export function markMessageRead(state: ChatState, messageId: string): ChatState {
  const messageIndex = state.messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) return state;

  const message = state.messages[messageIndex];
  if (message.isRead) return state;

  const newMessages = [...state.messages];
  newMessages[messageIndex] = { ...message, isRead: true };

  return {
    ...state,
    messages: newMessages,
    unreadCount: newMessages.filter(m => !m.isRead).length,
    importantCount: newMessages.filter(m => m.isImportant && !m.isRead).length,
  };
}

/**
 * 批量标记已读
 */
export function markAllRead(state: ChatState, type?: MessageType): ChatState {
  const newMessages = state.messages.map(m => {
    if (type && m.type !== type) return m;
    return { ...m, isRead: true };
  });

  return {
    ...state,
    messages: newMessages,
    unreadCount: 0,
    importantCount: 0,
  };
}

/**
 * 删除消息
 */
export function deleteMessage(state: ChatState, messageId: string): ChatState {
  const newMessages = state.messages.filter(m => m.id !== messageId);
  return {
    ...state,
    messages: newMessages,
    unreadCount: newMessages.filter(m => !m.isRead).length,
    importantCount: newMessages.filter(m => m.isImportant && !m.isRead).length,
  };
}

/**
 * 清理过期消息
 */
export function cleanupExpiredMessages(state: ChatState, now?: number): ChatState {
  const currentTime = now ?? getNow();
  const cleanupDays = state.settings.autoCleanupDays;
  const cleanupThreshold = currentTime - cleanupDays * 24 * 60 * 60 * 1000;

  const newMessages = state.messages.filter(m => {
    // 永不过期的消息保留
    if (m.expiresAt === 0) return true;
    // 未过期的保留
    if (m.expiresAt > currentTime) return true;
    // 最近的重要消息保留
    if (m.isImportant && m.timestamp > cleanupThreshold) return true;
    return false;
  });

  return {
    ...state,
    messages: newMessages,
    unreadCount: newMessages.filter(m => !m.isRead).length,
    importantCount: newMessages.filter(m => m.isImportant && !m.isRead).length,
    lastCleanupTime: currentTime,
  };
}

/**
 * 获取 NPC
 */
export function getNPC(npcId: string): NPCConfig | undefined {
  return NPC_DATABASE.find(npc => npc.id === npcId);
}

/**
 * 获取对话
 */
export function getDialogue(npcId: string, dialogueId: string): DialogueLine | undefined {
  const npc = getNPC(npcId);
  if (!npc) return undefined;
  return npc.dialogues.find(d => d.id === dialogueId);
}

/**
 * 更新 NPC 关系
 */
export function updateNPCRelationship(
  state: ChatState,
  npcId: string,
  delta: number
): ChatState {
  const current = state.npcRelationships[npcId] || 0;
  const newValue = Math.max(0, Math.min(100, current + delta));

  return {
    ...state,
    npcRelationships: {
      ...state.npcRelationships,
      [npcId]: newValue,
    },
  };
}

/**
 * 解锁对话
 */
export function unlockDialogue(state: ChatState, dialogueId: string): ChatState {
  if (state.unlockedDialogues.includes(dialogueId)) return state;
  return {
    ...state,
    unlockedDialogues: [...state.unlockedDialogues, dialogueId],
  };
}

/**
 * 获取未读消息
 */
export function getUnreadMessages(state: ChatState): ChatMessage[] {
  return state.messages.filter(m => !m.isRead);
}

/**
 * 获取重要消息
 */
export function getImportantMessages(state: ChatState): ChatMessage[] {
  return state.messages.filter(m => m.isImportant);
}

/**
 * 按类型筛选消息
 */
export function getMessagesByType(state: ChatState, type: MessageType): ChatMessage[] {
  return state.messages.filter(m => m.type === type);
}

/**
 * 获取聊天统计
 */
export function getChatStats(state: ChatState): {
  totalMessages: number;
  unreadCount: number;
  importantCount: number;
  messagesByType: Record<MessageType, number>;
  npcCount: number;
  avgRelationship: number;
} {
  const messagesByType: Record<MessageType, number> = {
    system: 0, npc: 0, broadcast: 0, mail: 0, combat: 0, reward: 0, tips: 0,
  };
  state.messages.forEach(m => {
    messagesByType[m.type]++;
  });

  const relationships = Object.values(state.npcRelationships);
  const avgRelationship = relationships.length > 0
    ? Math.round(relationships.reduce((sum, r) => sum + r, 0) / relationships.length)
    : 0;

  return {
    totalMessages: state.messages.length,
    unreadCount: state.unreadCount,
    importantCount: state.importantCount,
    messagesByType,
    npcCount: Object.keys(state.npcRelationships).length,
    avgRelationship,
  };
}

/**
 * 更新设置
 */
export function updateChatSettings(
  state: ChatState,
  updates: Partial<ChatSettings>
): ChatState {
  return {
    ...state,
    settings: { ...state.settings, ...updates },
  };
}

/**
 * 导出数据
 */
export function exportChatData(state: ChatState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importChatData(json: string): ChatState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !Array.isArray(data.messages)) return null;
    return data as ChatState;
  } catch {
    return null;
  }
}
