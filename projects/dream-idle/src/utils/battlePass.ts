/**
 * v0.38 通行证系统（Battle Pass）
 * 
 * 功能：
 * - 免费通行证
 * - 高级通行证（付费解锁）
 * - 赛季制度（每赛季 30 天）
 * - 任务系统获取经验
 * - 等级奖励领取
 * - 赛季重置
 */

export interface BattlePassTier {
  level: number;
  freeReward: {
    gold?: number;
    diamond?: number;
    item?: {
      id: string;
      name: string;
      quantity: number;
    };
  };
  premiumReward?: {
    gold?: number;
    diamond?: number;
    item?: {
      id: string;
      name: string;
      quantity: number;
    };
    petFragment?: {
      petId: string;
      quantity: number;
    };
  };
}

export interface BattlePassSeason {
  seasonId: number;
  name: string;
  startDate: number;
  endDate: number;
  theme: string;
}

export interface BattlePassState {
  currentSeason: number;
  level: number;
  exp: number;
  isPremium: boolean;
  claimedRewards: number[]; // 已领取奖励的等级
  completedMissions: string[]; // 已完成任务 ID
  dailyMissionsReset: number; // 每日任务刷新时间
}

export interface BattlePassMission {
  id: string;
  name: string;
  description: string;
  expReward: number;
  type: 'daily' | 'weekly' | 'season';
  requirement: {
    type: 'battle_count' | 'win_count' | 'level_up' | 'spend_diamond' | 'complete_dungeon' | 'pet_evolution';
    target: number;
  };
  progress: number;
  completed: boolean;
  claimed: boolean;
}

/**
 * 通行证等级配置（50 级）
 */
export const BATTLE_PASS_TIERS: BattlePassTier[] = [
  { level: 1, freeReward: { gold: 1000 }, premiumReward: { diamond: 50 } },
  { level: 2, freeReward: { gold: 2000 }, premiumReward: { gold: 5000 } },
  { level: 3, freeReward: { item: { id: 'exp-potion', name: '经验药水', quantity: 5 } }, premiumReward: { diamond: 50 } },
  { level: 4, freeReward: { gold: 3000 }, premiumReward: { gold: 10000 } },
  { level: 5, freeReward: { gold: 4000 }, premiumReward: { diamond: 100, item: { id: 'skin-fragment', name: '皮肤碎片', quantity: 1 } } },
  { level: 6, freeReward: { gold: 5000 }, premiumReward: { gold: 15000 } },
  { level: 7, freeReward: { item: { id: 'evolution-stone', name: '进化石', quantity: 3 } }, premiumReward: { diamond: 50 } },
  { level: 8, freeReward: { gold: 6000 }, premiumReward: { gold: 20000 } },
  { level: 9, freeReward: { gold: 7000 }, premiumReward: { diamond: 50 } },
  { level: 10, freeReward: { gold: 8000 }, premiumReward: { diamond: 200, item: { id: 'legendary-fragment', name: '传说碎片', quantity: 5 } } },
  { level: 11, freeReward: { gold: 9000 }, premiumReward: { gold: 25000 } },
  { level: 12, freeReward: { item: { id: 'exp-potion', name: '经验药水', quantity: 10 } }, premiumReward: { diamond: 50 } },
  { level: 13, freeReward: { gold: 10000 }, premiumReward: { gold: 30000 } },
  { level: 14, freeReward: { gold: 11000 }, premiumReward: { diamond: 50 } },
  { level: 15, freeReward: { gold: 12000 }, premiumReward: { diamond: 100, item: { id: 'epic-fragment', name: '史诗碎片', quantity: 5 } } },
  { level: 16, freeReward: { gold: 13000 }, premiumReward: { gold: 35000 } },
  { level: 17, freeReward: { item: { id: 'evolution-stone', name: '进化石', quantity: 5 } }, premiumReward: { diamond: 50 } },
  { level: 18, freeReward: { gold: 14000 }, premiumReward: { gold: 40000 } },
  { level: 19, freeReward: { gold: 15000 }, premiumReward: { diamond: 50 } },
  { level: 20, freeReward: { gold: 16000 }, premiumReward: { diamond: 200, item: { id: 'rare-pet-fragment', name: '稀有宠物碎片', quantity: 10 } } },
  { level: 21, freeReward: { gold: 17000 }, premiumReward: { gold: 45000 } },
  { level: 22, freeReward: { item: { id: 'exp-potion', name: '经验药水', quantity: 15 } }, premiumReward: { diamond: 50 } },
  { level: 23, freeReward: { gold: 18000 }, premiumReward: { gold: 50000 } },
  { level: 24, freeReward: { gold: 19000 }, premiumReward: { diamond: 50 } },
  { level: 25, freeReward: { gold: 20000 }, premiumReward: { diamond: 300, item: { id: 'exclusive-skin', name: '专属皮肤', quantity: 1 } } },
  { level: 26, freeReward: { gold: 21000 }, premiumReward: { gold: 55000 } },
  { level: 27, freeReward: { item: { id: 'evolution-stone', name: '进化石', quantity: 8 } }, premiumReward: { diamond: 50 } },
  { level: 28, freeReward: { gold: 22000 }, premiumReward: { gold: 60000 } },
  { level: 29, freeReward: { gold: 23000 }, premiumReward: { diamond: 50 } },
  { level: 30, freeReward: { gold: 24000 }, premiumReward: { diamond: 300, item: { id: 'legendary-pet-fragment', name: '传说宠物碎片', quantity: 10 } } },
  { level: 31, freeReward: { gold: 25000 }, premiumReward: { gold: 65000 } },
  { level: 32, freeReward: { item: { id: 'exp-potion', name: '经验药水', quantity: 20 } }, premiumReward: { diamond: 50 } },
  { level: 33, freeReward: { gold: 26000 }, premiumReward: { gold: 70000 } },
  { level: 34, freeReward: { gold: 27000 }, premiumReward: { diamond: 50 } },
  { level: 35, freeReward: { gold: 28000 }, premiumReward: { diamond: 100, item: { id: 'mythic-fragment', name: '神话碎片', quantity: 5 } } },
  { level: 36, freeReward: { gold: 29000 }, premiumReward: { gold: 75000 } },
  { level: 37, freeReward: { item: { id: 'evolution-stone', name: '进化石', quantity: 10 } }, premiumReward: { diamond: 50 } },
  { level: 38, freeReward: { gold: 30000 }, premiumReward: { gold: 80000 } },
  { level: 39, freeReward: { gold: 31000 }, premiumReward: { diamond: 50 } },
  { level: 40, freeReward: { gold: 32000 }, premiumReward: { diamond: 500, item: { id: 'grand-skin', name: '至尊皮肤', quantity: 1 } } },
  { level: 41, freeReward: { gold: 33000 }, premiumReward: { gold: 85000 } },
  { level: 42, freeReward: { item: { id: 'exp-potion', name: '经验药水', quantity: 25 } }, premiumReward: { diamond: 50 } },
  { level: 43, freeReward: { gold: 34000 }, premiumReward: { gold: 90000 } },
  { level: 44, freeReward: { gold: 35000 }, premiumReward: { diamond: 50 } },
  { level: 45, freeReward: { gold: 36000 }, premiumReward: { diamond: 100, item: { id: 'divine-fragment', name: '神兵碎片', quantity: 5 } } },
  { level: 46, freeReward: { gold: 37000 }, premiumReward: { gold: 95000 } },
  { level: 47, freeReward: { item: { id: 'evolution-stone', name: '进化石', quantity: 12 } }, premiumReward: { diamond: 50 } },
  { level: 48, freeReward: { gold: 38000 }, premiumReward: { gold: 100000 } },
  { level: 49, freeReward: { gold: 39000 }, premiumReward: { diamond: 100 } },
  { level: 50, freeReward: { gold: 40000, diamond: 100 }, premiumReward: { diamond: 1000, item: { id: 'champion-title', name: '冠军称号', quantity: 1 } } }
];

/**
 * 赛季配置
 */
export const BATTLE_PASS_SEASONS: BattlePassSeason[] = [
  {
    seasonId: 1,
    name: '初出茅庐',
    startDate: new Date('2026-03-01').getTime(),
    endDate: new Date('2026-03-31').getTime(),
    theme: '新手赛季'
  },
  {
    seasonId: 2,
    name: '勇者试炼',
    startDate: new Date('2026-04-01').getTime(),
    endDate: new Date('2026-04-30').getTime(),
    theme: '挑战赛季'
  }
];

/**
 * 每日任务配置
 */
export const DAILY_MISSIONS: Omit<BattlePassMission, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'daily-battle-5',
    name: '战斗 5 次',
    description: '完成 5 次战斗',
    expReward: 100,
    type: 'daily',
    requirement: { type: 'battle_count', target: 5 }
  },
  {
    id: 'daily-win-3',
    name: '胜利 3 次',
    description: '获得 3 场胜利',
    expReward: 150,
    type: 'daily',
    requirement: { type: 'win_count', target: 3 }
  },
  {
    id: 'daily-dungeon-2',
    name: '副本挑战',
    description: '完成 2 次副本',
    expReward: 200,
    type: 'daily',
    requirement: { type: 'complete_dungeon', target: 2 }
  },
  {
    id: 'daily-spend-50',
    name: '消费钻石',
    description: '消费 50 钻石',
    expReward: 100,
    type: 'daily',
    requirement: { type: 'spend_diamond', target: 50 }
  }
];

/**
 * 每周任务配置
 */
export const WEEKLY_MISSIONS: Omit<BattlePassMission, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'weekly-battle-50',
    name: '战斗大师',
    description: '完成 50 次战斗',
    expReward: 500,
    type: 'weekly',
    requirement: { type: 'battle_count', target: 50 }
  },
  {
    id: 'weekly-win-20',
    name: '常胜将军',
    description: '获得 20 场胜利',
    expReward: 600,
    type: 'weekly',
    requirement: { type: 'win_count', target: 20 }
  },
  {
    id: 'weekly-level-up',
    name: '快速升级',
    description: '角色升级 5 次',
    expReward: 400,
    type: 'weekly',
    requirement: { type: 'level_up', target: 5 }
  }
];

/**
 * 初始化通行证状态
 */
export function initializeBattlePassState(): BattlePassState {
  return {
    currentSeason: 1,
    level: 1,
    exp: 0,
    isPremium: false,
    claimedRewards: [],
    completedMissions: [],
    dailyMissionsReset: Date.now()
  };
}

/**
 * 获取升级所需经验
 */
export function getExpToNextLevel(level: number): number {
  if (level >= 50) return 0;
  // 每级需要 100 经验
  return 100;
}

/**
 * 添加通行证经验
 */
export function addBattlePassExp(
  state: BattlePassState,
  exp: number
): { leveledUp: boolean; newLevel: number; rewards: BattlePassTier[] } {
  const rewards: BattlePassTier[] = [];
  let newExp = state.exp + exp;
  let newLevel = state.level;
  let leveledUp = false;

  while (newExp >= getExpToNextLevel(newLevel) && newLevel < 50) {
    newExp -= getExpToNextLevel(newLevel);
    newLevel++;
    leveledUp = true;

    // 检查是否可以领取新等级奖励
    const tier = BATTLE_PASS_TIERS.find(t => t.level === newLevel);
    if (tier && !state.claimedRewards.includes(newLevel)) {
      rewards.push(tier);
    }
  }

  return {
    leveledUp,
    newLevel,
    rewards
  };
}

/**
 * 领取奖励
 */
export function claimReward(
  state: BattlePassState,
  level: number
): {
  success: boolean;
  reason?: string;
  newState: BattlePassState;
  reward?: BattlePassTier['freeReward'] | BattlePassTier['premiumReward'];
} {
  const tier = BATTLE_PASS_TIERS.find(t => t.level === level);
  if (!tier) {
    return {
      success: false,
      reason: '无效的等级',
      newState: state
    };
  }

  if (state.level < level) {
    return {
      success: false,
      reason: '等级不足',
      newState: state
    };
  }

  if (state.claimedRewards.includes(level)) {
    return {
      success: false,
      reason: '奖励已领取',
      newState: state
    };
  }

  // 领取免费奖励
  const reward = state.isPremium && tier.premiumReward ? tier.premiumReward : tier.freeReward;

  return {
    success: true,
    newState: {
      ...state,
      claimedRewards: [...state.claimedRewards, level]
    },
    reward
  };
}

/**
 * 购买高级通行证
 */
export function purchasePremium(state: BattlePassState): {
  success: boolean;
  reason?: string;
  newState: BattlePassState;
  retroactiveRewards?: BattlePassTier['premiumReward'][];
} {
  if (state.isPremium) {
    return {
      success: false,
      reason: '已购买高级通行证',
      newState: state
    };
  }

  // 补发之前等级的 premium 奖励
  const retroactiveRewards: BattlePassTier['premiumReward'][] = [];
  for (let i = 1; i <= state.level; i++) {
    const tier = BATTLE_PASS_TIERS.find(t => t.level === i);
    if (tier?.premiumReward && !state.claimedRewards.includes(i)) {
      retroactiveRewards.push(tier.premiumReward);
    }
  }

  return {
    success: true,
    newState: {
      ...state,
      isPremium: true
    },
    retroactiveRewards
  };
}

/**
 * 检查每日任务刷新
 */
export function checkDailyReset(state: BattlePassState, currentTime: number = Date.now()): BattlePassState {
  const oneDay = 24 * 60 * 60 * 1000;
  if (currentTime >= state.dailyMissionsReset + oneDay) {
    return {
      ...state,
      dailyMissionsReset: currentTime,
      completedMissions: state.completedMissions.filter(id => !DAILY_MISSIONS.find(m => m.id === id))
    };
  }
  return state;
}

/**
 * 更新任务进度
 */
export function updateMissionProgress(
  state: BattlePassState,
  missionType: BattlePassMission['requirement']['type'],
  amount: number
): {
  newState: BattlePassState;
  completedMissions: string[];
  expGained: number;
} {
  let expGained = 0;
  const completedMissions: string[] = [];

  // 这里简化处理，实际应该根据具体任务类型更新进度
  // 由于我们没有持久化任务进度，这里只检查是否完成任务

  return {
    newState: state,
    completedMissions,
    expGained
  };
}

/**
 * 获取通行证进度百分比
 */
export function getBattlePassProgress(state: BattlePassState): number {
  if (state.level >= 50) return 100;
  const expNeeded = getExpToNextLevel(state.level);
  return Math.round((state.exp / expNeeded) * 100);
}

/**
 * 保存通行证状态到 localStorage
 */
export function saveBattlePassState(state: BattlePassState): void {
  localStorage.setItem('dream-idle-battle-pass', JSON.stringify(state));
}

/**
 * 从 localStorage 加载通行证状态
 */
export function loadBattlePassState(): BattlePassState {
  const saved = localStorage.getItem('dream-idle-battle-pass');
  if (saved) {
    return JSON.parse(saved);
  }
  return initializeBattlePassState();
}

/**
 * 获取当前赛季信息
 */
export function getCurrentSeason(currentTime: number = Date.now()): BattlePassSeason | null {
  return BATTLE_PASS_SEASONS.find(s => currentTime >= s.startDate && currentTime <= s.endDate) || null;
}

/**
 * 获取赛季剩余天数
 */
export function getSeasonRemainingDays(season: BattlePassSeason, currentTime: number = Date.now()): number {
  const remaining = season.endDate - currentTime;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}
