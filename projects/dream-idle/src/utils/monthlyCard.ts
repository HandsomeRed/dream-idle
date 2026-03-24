/**
 * v0.37 月卡系统
 * 
 * 功能：
 * - 普通月卡（30 天）
 * - 高级月卡（30 天）
 * - 每日领取奖励
 * - 累计领取天数
 * - 过期处理
 */

export interface MonthlyCardType {
  id: string;
  name: string;
  price: number; // 钻石价格
  duration: number; // 天数
  dailyReward: {
    gold: number;
    diamond: number;
    item?: {
      id: string;
      name: string;
      quantity: number;
    };
  };
  instantReward?: {
    gold: number;
    diamond: number;
  };
  description: string;
}

export interface MonthlyCardState {
  activeCards: {
    cardId: string;
    startDate: number; // 时间戳
    endDate: number; // 时间戳
    claimedDays: number; // 已领取天数
    lastClaimDate?: number; // 最后领取日期（时间戳）
  }[];
  totalClaimedDays: number; // 累计领取天数
  totalPurchased: number; // 累计购买次数
}

/**
 * 月卡配置
 */
export const MONTHLY_CARDS: MonthlyCardType[] = [
  {
    id: 'basic',
    name: '普通月卡',
    price: 300, // 300 钻石
    duration: 30,
    dailyReward: {
      gold: 5000,
      diamond: 50
    },
    instantReward: {
      gold: 10000,
      diamond: 100
    },
    description: '每日领取 5000 金币 +50 钻石，立即获得 10000 金币 +100 钻石'
  },
  {
    id: 'premium',
    name: '高级月卡',
    price: 600, // 600 钻石
    duration: 30,
    dailyReward: {
      gold: 10000,
      diamond: 100,
      item: {
        id: 'card-exp',
        name: '月卡经验',
        quantity: 10
      }
    },
    instantReward: {
      gold: 20000,
      diamond: 200
    },
    description: '每日领取 10000 金币 +100 钻石 +10 月卡经验，立即获得 20000 金币 +200 钻石'
  }
];

/**
 * 初始化月卡状态
 */
export function initializeMonthlyCardState(): MonthlyCardState {
  return {
    activeCards: [],
    totalClaimedDays: 0,
    totalPurchased: 0
  };
}

/**
 * 购买月卡
 */
export function purchaseMonthlyCard(
  state: MonthlyCardState,
  cardId: string,
  currentTime: number = Date.now()
): {
  success: boolean;
  reason?: string;
  newState: MonthlyCardState;
  instantReward?: { gold: number; diamond: number };
} {
  const card = MONTHLY_CARDS.find(c => c.id === cardId);
  if (!card) {
    return {
      success: false,
      reason: '无效的月卡类型',
      newState: state
    };
  }

  // 检查是否已购买同类型月卡且未过期
  const existingCard = state.activeCards.find(c => c.cardId === cardId);
  if (existingCard && existingCard.endDate > currentTime) {
    // 已有未过期月卡，延长有效期
    const newEndDate = existingCard.endDate + card.duration * 24 * 60 * 60 * 1000;
    const updatedCards = state.activeCards.map(c =>
      c.cardId === cardId ? { ...c, endDate: newEndDate } : c
    );

    return {
      success: true,
      newState: {
        ...state,
        activeCards: updatedCards,
        totalPurchased: state.totalPurchased + 1
      },
      instantReward: card.instantReward
    };
  }

  // 新购买月卡
  const newCard = {
    cardId,
    startDate: currentTime,
    endDate: currentTime + card.duration * 24 * 60 * 60 * 1000,
    claimedDays: 0
  };

  return {
    success: true,
    newState: {
      ...state,
      activeCards: [...state.activeCards, newCard],
      totalPurchased: state.totalPurchased + 1
    },
    instantReward: card.instantReward
  };
}

/**
 * 领取每日奖励
 */
export function claimDailyReward(
  state: MonthlyCardState,
  cardId: string,
  currentTime: number = Date.now()
): {
  success: boolean;
  reason?: string;
  newState: MonthlyCardState;
  reward?: MonthlyCardType['dailyReward'];
} {
  const cardIndex = state.activeCards.findIndex(c => c.cardId === cardId);
  if (cardIndex === -1) {
    return {
      success: false,
      reason: '未激活该月卡',
      newState: state
    };
  }

  const activeCard = state.activeCards[cardIndex];
  const card = MONTHLY_CARDS.find(c => c.id === cardId);
  if (!card) {
    return {
      success: false,
      reason: '无效的月卡类型',
      newState: state
    };
  }

  // 检查是否过期
  if (activeCard.endDate <= currentTime) {
    return {
      success: false,
      reason: '月卡已过期',
      newState: state
    };
  }

  // 检查今日是否已领取（按自然日计算）
  const today = new Date(currentTime).setHours(0, 0, 0, 0);
  if (activeCard.lastClaimDate) {
    const lastClaim = new Date(activeCard.lastClaimDate).setHours(0, 0, 0, 0);
    if (lastClaim >= today) {
      return {
        success: false,
        reason: '今日奖励已领取',
        newState: state
      };
    }
  }

  // 领取奖励
  const updatedCard = {
    ...activeCard,
    claimedDays: activeCard.claimedDays + 1,
    lastClaimDate: currentTime
  };

  const updatedCards = [...state.activeCards];
  updatedCards[cardIndex] = updatedCard;

  return {
    success: true,
    newState: {
      ...state,
      activeCards: updatedCards,
      totalClaimedDays: state.totalClaimedDays + 1
    },
    reward: card.dailyReward
  };
}

/**
 * 检查月卡是否有效
 */
export function isCardActive(state: MonthlyCardState, cardId: string, currentTime: number = Date.now()): boolean {
  const card = state.activeCards.find(c => c.cardId === cardId);
  return !!card && card.endDate > currentTime;
}

/**
 * 获取月卡剩余天数
 */
export function getRemainingDays(state: MonthlyCardState, cardId: string, currentTime: number = Date.now()): number {
  const card = state.activeCards.find(c => c.cardId === cardId);
  if (!card) return 0;

  const remaining = card.endDate - currentTime;
  if (remaining <= 0) return 0;

  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

/**
 * 获取可领取奖励的月卡列表
 */
export function getClaimableCards(state: MonthlyCardState, currentTime: number = Date.now()): MonthlyCardType[] {
  const claimable: MonthlyCardType[] = [];

  for (const activeCard of state.activeCards) {
    if (activeCard.endDate <= currentTime) continue;

    const today = new Date(currentTime).setHours(0, 0, 0, 0);
    if (activeCard.lastClaimDate) {
      const lastClaim = new Date(activeCard.lastClaimDate).setHours(0, 0, 0, 0);
      if (lastClaim >= today) continue;
    }

    const card = MONTHLY_CARDS.find(c => c.id === activeCard.cardId);
    if (card) {
      claimable.push(card);
    }
  }

  return claimable;
}

/**
 * 清理过期月卡
 */
export function cleanupExpiredCards(state: MonthlyCardState, currentTime: number = Date.now()): MonthlyCardState {
  return {
    ...state,
    activeCards: state.activeCards.filter(c => c.endDate > currentTime)
  };
}

/**
 * 获取月卡总剩余天数
 */
export function getTotalRemainingDays(state: MonthlyCardState, currentTime: number = Date.now()): number {
  return state.activeCards.reduce((total, card) => {
    const remaining = card.endDate - currentTime;
    if (remaining <= 0) return total;
    return total + Math.ceil(remaining / (24 * 60 * 60 * 1000));
  }, 0);
}

/**
 * 获取每日总奖励
 */
export function getTotalDailyReward(state: MonthlyCardState, currentTime: number = Date.now()): {
  gold: number;
  diamond: number;
  items: Array<{ id: string; name: string; quantity: number }>;
} {
  const reward = {
    gold: 0,
    diamond: 0,
    items: [] as Array<{ id: string; name: string; quantity: number }>
  };

  for (const activeCard of state.activeCards) {
    if (activeCard.endDate <= currentTime) continue;

    const card = MONTHLY_CARDS.find(c => c.id === activeCard.cardId);
    if (card) {
      reward.gold += card.dailyReward.gold;
      reward.diamond += card.dailyReward.diamond;
      if (card.dailyReward.item) {
        reward.items.push(card.dailyReward.item);
      }
    }
  }

  return reward;
}

/**
 * 保存月卡状态到 localStorage
 */
export function saveMonthlyCardState(state: MonthlyCardState): void {
  localStorage.setItem('dream-idle-monthly-card', JSON.stringify(state));
}

/**
 * 从 localStorage 加载月卡状态
 */
export function loadMonthlyCardState(): MonthlyCardState {
  const saved = localStorage.getItem('dream-idle-monthly-card');
  if (saved) {
    return JSON.parse(saved);
  }
  return initializeMonthlyCardState();
}

/**
 * 获取月卡名称
 */
export function getMonthlyCardName(cardId: string): string {
  const card = MONTHLY_CARDS.find(c => c.id === cardId);
  return card?.name || '未知月卡';
}

/**
 * 格式化时间戳为日期字符串
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 计算剩余时间文本
 */
export function getRemainingTimeText(remainingMs: number): string {
  if (remainingMs <= 0) return '已过期';

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `${days}天${hours}小时`;
  }
  return `${hours}小时`;
}
