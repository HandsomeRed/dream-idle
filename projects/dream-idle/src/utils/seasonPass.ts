// 赛季通行证系统 - v0.66
// Season Pass with themed rewards and progression

/**
 * 赛季主题
 */
export type SeasonTheme = 'spring' | 'summer' | 'autumn' | 'winter' | 'anniversary' | 'festival';

/**
 * 通行证等级奖励
 */
export interface PassReward {
  level: number;
  freeReward: RewardItem;
  premiumReward: RewardItem;
}

/**
 * 奖励物品
 */
export interface RewardItem {
  type: 'gold' | 'diamond' | 'exp' | 'stamina' | 'summonTicket' | 'equipBox' | 'petShard' | 'heroShard' | 'skinFragment' | 'title' | 'avatar' | 'none';
  amount: number;
  name: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 赛季任务
 */
export interface SeasonMission {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'season';
  requirement: number;
  expReward: number;
}

/**
 * 赛季配置
 */
export interface SeasonConfig {
  id: string;
  name: string;
  theme: SeasonTheme;
  startTime: number;
  endTime: number;
  maxLevel: number;
  expPerLevel: number;
  premiumPrice: number; // 钻石
  rewards: PassReward[];
  missions: SeasonMission[];
}

/**
 * 赛季通行证状态
 */
export interface SeasonPassState {
  playerId: string;
  seasonId: string;
  level: number;
  exp: number;
  isPremium: boolean;
  /** 已领取的免费奖励等级 */
  claimedFree: number[];
  /** 已领取的高级奖励等级 */
  claimedPremium: number[];
  /** 任务进度 */
  missionProgress: Record<string, number>;
  /** 已完成任务 */
  completedMissions: string[];
  /** 已领取任务奖励 */
  claimedMissions: string[];
  /** 每日任务上次重置日期 */
  lastDailyReset: string;
  /** 每周任务上次重置日期 */
  lastWeeklyReset: string;
  /** 购买时间 */
  purchasedAt?: number;
  /** 总获得经验 */
  totalExpEarned: number;
}

// ==================== 赛季配置 ====================

const SEASON_MISSIONS: SeasonMission[] = [
  // 每日任务
  { id: 'daily_login', name: '每日登录', description: '登录游戏', type: 'daily', requirement: 1, expReward: 100 },
  { id: 'daily_battle_5', name: '战斗5次', description: '完成5场战斗', type: 'daily', requirement: 5, expReward: 150 },
  { id: 'daily_dungeon', name: '挑战副本', description: '完成1次副本', type: 'daily', requirement: 1, expReward: 120 },
  // 每周任务
  { id: 'weekly_battle_30', name: '战斗30次', description: '完成30场战斗', type: 'weekly', requirement: 30, expReward: 500 },
  { id: 'weekly_tower_5', name: '爬塔5层', description: '攀登5层塔', type: 'weekly', requirement: 5, expReward: 400 },
  { id: 'weekly_arena_10', name: '竞技场10场', description: '参加10场竞技场', type: 'weekly', requirement: 10, expReward: 450 },
  // 赛季任务
  { id: 'season_level_30', name: '角色30级', description: '角色达到30级', type: 'season', requirement: 30, expReward: 1000 },
  { id: 'season_collect_10', name: '收集10英雄', description: '收集10个英雄', type: 'season', requirement: 10, expReward: 800 },
  { id: 'season_tower_50', name: '爬塔50层', description: '攀登50层塔', type: 'season', requirement: 50, expReward: 1200 },
];

function generateRewards(maxLevel: number): PassReward[] {
  const rewards: PassReward[] = [];
  for (let level = 1; level <= maxLevel; level++) {
    let freeReward: RewardItem;
    let premiumReward: RewardItem;

    if (level % 10 === 0) {
      // 里程碑等级 - 大奖
      freeReward = { type: 'diamond', amount: 50, name: `钻石×50` };
      premiumReward = { type: 'heroShard', amount: 20, name: '英雄碎片×20', rarity: 'legendary' };
    } else if (level % 5 === 0) {
      // 中等奖励
      freeReward = { type: 'summonTicket', amount: 1, name: '召唤券×1' };
      premiumReward = { type: 'diamond', amount: 30, name: '钻石×30', rarity: 'epic' };
    } else if (level % 3 === 0) {
      freeReward = { type: 'exp', amount: 500, name: '经验×500' };
      premiumReward = { type: 'equipBox', amount: 1, name: '装备宝箱×1', rarity: 'rare' };
    } else {
      freeReward = { type: 'gold', amount: 1000 * level, name: `金币×${1000 * level}` };
      premiumReward = { type: 'gold', amount: 2000 * level, name: `金币×${2000 * level}` };
    }

    rewards.push({ level, freeReward, premiumReward });
  }
  return rewards;
}

export const CURRENT_SEASON: SeasonConfig = {
  id: 'season_001',
  name: '春日物语',
  theme: 'spring',
  startTime: new Date('2026-03-01').getTime(),
  endTime: new Date('2026-04-01').getTime(),
  maxLevel: 50,
  expPerLevel: 1000,
  premiumPrice: 680,
  rewards: generateRewards(50),
  missions: SEASON_MISSIONS,
};

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getWeekStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  return getTodayStr(monday.getTime());
}

// ==================== 核心函数 ====================

/**
 * 创建赛季通行证状态
 */
export function createSeasonPassState(playerId: string, season?: SeasonConfig, now?: number): SeasonPassState {
  const s = season ?? CURRENT_SEASON;
  return {
    playerId,
    seasonId: s.id,
    level: 0,
    exp: 0,
    isPremium: false,
    claimedFree: [],
    claimedPremium: [],
    missionProgress: {},
    completedMissions: [],
    claimedMissions: [],
    lastDailyReset: getTodayStr(now),
    lastWeeklyReset: getWeekStr(now),
    totalExpEarned: 0,
  };
}

/**
 * 购买高级通行证
 */
export function purchasePremium(
  state: SeasonPassState,
  playerDiamonds: number,
  season?: SeasonConfig,
  now?: number
): { state: SeasonPassState; success: boolean; cost: number; error?: string } {
  const s = season ?? CURRENT_SEASON;
  if (state.isPremium) return { state, success: false, cost: 0, error: '已购买高级通行证' };
  if (playerDiamonds < s.premiumPrice) return { state, success: false, cost: s.premiumPrice, error: '钻石不足' };

  return {
    state: { ...state, isPremium: true, purchasedAt: now ?? Date.now() },
    success: true,
    cost: s.premiumPrice,
  };
}

/**
 * 添加经验（自动升级）
 */
export function addExp(
  state: SeasonPassState,
  amount: number,
  season?: SeasonConfig
): { state: SeasonPassState; levelsGained: number } {
  const s = season ?? CURRENT_SEASON;
  let newState = { ...state };
  newState.exp += amount;
  newState.totalExpEarned += amount;
  let levelsGained = 0;

  while (newState.level < s.maxLevel && newState.exp >= s.expPerLevel) {
    newState.exp -= s.expPerLevel;
    newState.level++;
    levelsGained++;
  }

  // Cap exp at max level
  if (newState.level >= s.maxLevel) {
    newState.exp = 0;
  }

  return { state: newState, levelsGained };
}

/**
 * 更新任务进度
 */
export function updateMissionProgress(
  state: SeasonPassState,
  missionId: string,
  increment: number = 1,
  season?: SeasonConfig
): { state: SeasonPassState; completed: boolean } {
  const s = season ?? CURRENT_SEASON;
  const mission = s.missions.find(m => m.id === missionId);
  if (!mission) return { state, completed: false };
  if (state.completedMissions.includes(missionId)) return { state, completed: false };

  const newState = { ...state, missionProgress: { ...state.missionProgress } };
  newState.missionProgress[missionId] = (newState.missionProgress[missionId] || 0) + increment;

  const completed = newState.missionProgress[missionId] >= mission.requirement;
  if (completed && !newState.completedMissions.includes(missionId)) {
    newState.completedMissions = [...newState.completedMissions, missionId];
  }

  return { state: newState, completed };
}

/**
 * 领取任务经验奖励
 */
export function claimMissionReward(
  state: SeasonPassState,
  missionId: string,
  season?: SeasonConfig
): { state: SeasonPassState; success: boolean; expGained: number; levelsGained: number; error?: string } {
  const s = season ?? CURRENT_SEASON;
  const mission = s.missions.find(m => m.id === missionId);
  if (!mission) return { state, success: false, expGained: 0, levelsGained: 0, error: '任务不存在' };
  if (!state.completedMissions.includes(missionId)) return { state, success: false, expGained: 0, levelsGained: 0, error: '任务未完成' };
  if (state.claimedMissions.includes(missionId)) return { state, success: false, expGained: 0, levelsGained: 0, error: '已领取' };

  let newState = { ...state, claimedMissions: [...state.claimedMissions, missionId] };
  const { state: afterExp, levelsGained } = addExp(newState, mission.expReward, s);

  return { state: afterExp, success: true, expGained: mission.expReward, levelsGained };
}

/**
 * 领取等级奖励（免费）
 */
export function claimFreeReward(
  state: SeasonPassState,
  level: number,
  season?: SeasonConfig
): { state: SeasonPassState; success: boolean; reward?: RewardItem; error?: string } {
  const s = season ?? CURRENT_SEASON;
  if (state.level < level) return { state, success: false, error: '等级不足' };
  if (state.claimedFree.includes(level)) return { state, success: false, error: '已领取' };

  const passReward = s.rewards.find(r => r.level === level);
  if (!passReward) return { state, success: false, error: '奖励不存在' };

  return {
    state: { ...state, claimedFree: [...state.claimedFree, level] },
    success: true,
    reward: passReward.freeReward,
  };
}

/**
 * 领取等级奖励（高级）
 */
export function claimPremiumReward(
  state: SeasonPassState,
  level: number,
  season?: SeasonConfig
): { state: SeasonPassState; success: boolean; reward?: RewardItem; error?: string } {
  const s = season ?? CURRENT_SEASON;
  if (!state.isPremium) return { state, success: false, error: '需要高级通行证' };
  if (state.level < level) return { state, success: false, error: '等级不足' };
  if (state.claimedPremium.includes(level)) return { state, success: false, error: '已领取' };

  const passReward = s.rewards.find(r => r.level === level);
  if (!passReward) return { state, success: false, error: '奖励不存在' };

  return {
    state: { ...state, claimedPremium: [...state.claimedPremium, level] },
    success: true,
    reward: passReward.premiumReward,
  };
}

/**
 * 检查并重置每日/每周任务进度
 */
export function checkMissionReset(
  state: SeasonPassState,
  season?: SeasonConfig,
  now?: number
): SeasonPassState {
  const s = season ?? CURRENT_SEASON;
  let newState = { ...state };
  const today = getTodayStr(now);
  const week = getWeekStr(now);

  // 每日重置
  if (today !== state.lastDailyReset) {
    const dailyMissions = s.missions.filter(m => m.type === 'daily').map(m => m.id);
    const newProgress = { ...newState.missionProgress };
    const newCompleted = newState.completedMissions.filter(id => !dailyMissions.includes(id));
    const newClaimed = newState.claimedMissions.filter(id => !dailyMissions.includes(id));
    dailyMissions.forEach(id => delete newProgress[id]);

    newState = {
      ...newState,
      missionProgress: newProgress,
      completedMissions: newCompleted,
      claimedMissions: newClaimed,
      lastDailyReset: today,
    };
  }

  // 每周重置
  if (week !== state.lastWeeklyReset) {
    const weeklyMissions = s.missions.filter(m => m.type === 'weekly').map(m => m.id);
    const newProgress = { ...newState.missionProgress };
    const newCompleted = newState.completedMissions.filter(id => !weeklyMissions.includes(id));
    const newClaimed = newState.claimedMissions.filter(id => !weeklyMissions.includes(id));
    weeklyMissions.forEach(id => delete newProgress[id]);

    newState = {
      ...newState,
      missionProgress: newProgress,
      completedMissions: newCompleted,
      claimedMissions: newClaimed,
      lastWeeklyReset: week,
    };
  }

  return newState;
}

/**
 * 获取可领取的免费奖励
 */
export function getClaimableFreeRewards(state: SeasonPassState, season?: SeasonConfig): PassReward[] {
  const s = season ?? CURRENT_SEASON;
  return s.rewards.filter(r => r.level <= state.level && !state.claimedFree.includes(r.level));
}

/**
 * 获取可领取的高级奖励
 */
export function getClaimablePremiumRewards(state: SeasonPassState, season?: SeasonConfig): PassReward[] {
  const s = season ?? CURRENT_SEASON;
  if (!state.isPremium) return [];
  return s.rewards.filter(r => r.level <= state.level && !state.claimedPremium.includes(r.level));
}

/**
 * 获取赛季剩余时间
 */
export function getSeasonTimeLeft(season?: SeasonConfig, now?: number): { days: number; hours: number; expired: boolean } {
  const s = season ?? CURRENT_SEASON;
  const remaining = s.endTime - (now ?? Date.now());
  if (remaining <= 0) return { days: 0, hours: 0, expired: true };
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    expired: false,
  };
}

/**
 * 获取赛季通行证统计
 */
export function getSeasonPassStats(state: SeasonPassState, season?: SeasonConfig): {
  level: number;
  maxLevel: number;
  exp: number;
  expPerLevel: number;
  progress: number;
  isPremium: boolean;
  freeRewardsClaimed: number;
  premiumRewardsClaimed: number;
  missionsCompleted: number;
  totalMissions: number;
  totalExpEarned: number;
} {
  const s = season ?? CURRENT_SEASON;
  return {
    level: state.level,
    maxLevel: s.maxLevel,
    exp: state.exp,
    expPerLevel: s.expPerLevel,
    progress: state.level >= s.maxLevel ? 100 : Math.round((state.exp / s.expPerLevel) * 100),
    isPremium: state.isPremium,
    freeRewardsClaimed: state.claimedFree.length,
    premiumRewardsClaimed: state.claimedPremium.length,
    missionsCompleted: state.completedMissions.length,
    totalMissions: s.missions.length,
    totalExpEarned: state.totalExpEarned,
  };
}

/**
 * 导出数据
 */
export function exportSeasonPassData(state: SeasonPassState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importSeasonPassData(json: string): SeasonPassState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !data.seasonId) return null;
    return data as SeasonPassState;
  } catch {
    return null;
  }
}
