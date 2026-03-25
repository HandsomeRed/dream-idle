// 好感度系统 - v0.71
// Affinity / Friendship system for heroes and pets

/**
 * 好感度等级
 */
export type AffinityLevel = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend' | 'soulmate';

/**
 * 好感度事件类型
 */
export type AffinityEventType = 'battle_together' | 'gift' | 'dialogue' | 'quest_complete' | 'idle_together' | 'feed' | 'birthday';

/**
 * 好感度等级配置
 */
export interface AffinityLevelConfig {
  level: AffinityLevel;
  name: string;
  minPoints: number;
  maxPoints: number;
  bonusAtk: number; // 攻击加成%
  bonusDef: number; // 防御加成%
  bonusHp: number;  // 生命加成%
  unlockStory: boolean; // 解锁剧情
  unlockSkin: boolean;  // 解锁皮肤
  icon: string;
}

/**
 * 礼物配置
 */
export interface GiftConfig {
  id: string;
  name: string;
  basePoints: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  cost: { type: 'gold' | 'diamond'; amount: number };
  icon: string;
}

/**
 * 好感度记录
 */
export interface AffinityRecord {
  targetId: string;
  targetType: 'hero' | 'pet';
  targetName: string;
  points: number;
  level: AffinityLevel;
  giftCount: number;
  battleCount: number;
  dialogueCount: number;
  lastInteraction: number;
  unlockedStories: string[];
}

/**
 * 好感度系统状态
 */
export interface AffinityState {
  playerId: string;
  records: Record<string, AffinityRecord>; // targetId -> record
  dailyGiftsGiven: number;
  dailyDialogues: number;
  lastDailyReset: string;
  totalGiftsGiven: number;
  totalDialogues: number;
}

// ==================== 配置 ====================

export const AFFINITY_LEVELS: AffinityLevelConfig[] = [
  { level: 'stranger', name: '陌生人', minPoints: 0, maxPoints: 99, bonusAtk: 0, bonusDef: 0, bonusHp: 0, unlockStory: false, unlockSkin: false, icon: '😐' },
  { level: 'acquaintance', name: '认识', minPoints: 100, maxPoints: 299, bonusAtk: 2, bonusDef: 1, bonusHp: 1, unlockStory: true, unlockSkin: false, icon: '🙂' },
  { level: 'friend', name: '朋友', minPoints: 300, maxPoints: 599, bonusAtk: 5, bonusDef: 3, bonusHp: 3, unlockStory: true, unlockSkin: false, icon: '😊' },
  { level: 'close_friend', name: '挚友', minPoints: 600, maxPoints: 999, bonusAtk: 8, bonusDef: 5, bonusHp: 5, unlockStory: true, unlockSkin: true, icon: '🥰' },
  { level: 'best_friend', name: '至交', minPoints: 1000, maxPoints: 1499, bonusAtk: 12, bonusDef: 8, bonusHp: 8, unlockStory: true, unlockSkin: true, icon: '💕' },
  { level: 'soulmate', name: '灵魂伴侣', minPoints: 1500, maxPoints: Infinity, bonusAtk: 18, bonusDef: 12, bonusHp: 12, unlockStory: true, unlockSkin: true, icon: '💖' },
];

export const GIFTS: GiftConfig[] = [
  { id: 'gift_flower', name: '鲜花', basePoints: 10, rarity: 'common', cost: { type: 'gold', amount: 200 }, icon: '🌸' },
  { id: 'gift_cake', name: '蛋糕', basePoints: 15, rarity: 'common', cost: { type: 'gold', amount: 500 }, icon: '🎂' },
  { id: 'gift_gem', name: '宝石', basePoints: 30, rarity: 'rare', cost: { type: 'gold', amount: 1500 }, icon: '💎' },
  { id: 'gift_ring', name: '戒指', basePoints: 50, rarity: 'epic', cost: { type: 'diamond', amount: 50 }, icon: '💍' },
  { id: 'gift_crown', name: '王冠', basePoints: 100, rarity: 'legendary', cost: { type: 'diamond', amount: 200 }, icon: '👑' },
];

export const EVENT_POINTS: Record<AffinityEventType, number> = {
  battle_together: 5,
  gift: 0, // varies by gift
  dialogue: 8,
  quest_complete: 15,
  idle_together: 3,
  feed: 5,
  birthday: 50,
};

export const DAILY_LIMITS = {
  gifts: 10,
  dialogues: 5,
};

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 获取好感度等级配置
 */
export function getAffinityLevelConfig(points: number): AffinityLevelConfig {
  for (let i = AFFINITY_LEVELS.length - 1; i >= 0; i--) {
    if (points >= AFFINITY_LEVELS[i].minPoints) return AFFINITY_LEVELS[i];
  }
  return AFFINITY_LEVELS[0];
}

/**
 * 获取好感度等级
 */
export function getAffinityLevel(points: number): AffinityLevel {
  return getAffinityLevelConfig(points).level;
}

/**
 * 获取等级名称
 */
export function getAffinityLevelName(level: AffinityLevel): string {
  const config = AFFINITY_LEVELS.find(l => l.level === level);
  return config?.name ?? '未知';
}

/**
 * 获取到下一级所需点数
 */
export function getPointsToNextLevel(points: number): number | null {
  const currentConfig = getAffinityLevelConfig(points);
  const currentIndex = AFFINITY_LEVELS.indexOf(currentConfig);
  if (currentIndex >= AFFINITY_LEVELS.length - 1) return null; // max level
  return AFFINITY_LEVELS[currentIndex + 1].minPoints - points;
}

/**
 * 获取当前等级进度 (0-100%)
 */
export function getLevelProgress(points: number): number {
  const config = getAffinityLevelConfig(points);
  const range = config.maxPoints === Infinity ? 500 : config.maxPoints - config.minPoints + 1;
  const progress = points - config.minPoints;
  return Math.min(100, Math.round((progress / range) * 100));
}

// ==================== 核心函数 ====================

/**
 * 创建好感度系统状态
 */
export function createAffinityState(playerId: string, now?: number): AffinityState {
  return {
    playerId,
    records: {},
    dailyGiftsGiven: 0,
    dailyDialogues: 0,
    lastDailyReset: getTodayStr(now),
    totalGiftsGiven: 0,
    totalDialogues: 0,
  };
}

/**
 * 检查并执行每日重置
 */
export function checkDailyReset(state: AffinityState, now?: number): AffinityState {
  const today = getTodayStr(now);
  if (today === state.lastDailyReset) return state;
  return {
    ...state,
    dailyGiftsGiven: 0,
    dailyDialogues: 0,
    lastDailyReset: today,
  };
}

/**
 * 获取或创建好感度记录
 */
function getOrCreateRecord(state: AffinityState, targetId: string, targetType: 'hero' | 'pet', targetName: string): AffinityRecord {
  if (state.records[targetId]) return state.records[targetId];
  return {
    targetId,
    targetType,
    targetName,
    points: 0,
    level: 'stranger',
    giftCount: 0,
    battleCount: 0,
    dialogueCount: 0,
    lastInteraction: 0,
    unlockedStories: [],
  };
}

/**
 * 增加好感度
 */
export function addAffinity(
  state: AffinityState,
  targetId: string,
  targetType: 'hero' | 'pet',
  targetName: string,
  points: number,
  now?: number
): { state: AffinityState; levelUp: boolean; newLevel: AffinityLevel; prevLevel: AffinityLevel } {
  const record = getOrCreateRecord(state, targetId, targetType, targetName);
  const prevLevel = record.level;
  
  const newRecord: AffinityRecord = {
    ...record,
    points: record.points + points,
    lastInteraction: now ?? Date.now(),
  };
  newRecord.level = getAffinityLevel(newRecord.points);

  return {
    state: {
      ...state,
      records: { ...state.records, [targetId]: newRecord },
    },
    levelUp: newRecord.level !== prevLevel,
    newLevel: newRecord.level,
    prevLevel,
  };
}

/**
 * 赠送礼物
 */
export function giveGift(
  state: AffinityState,
  targetId: string,
  targetType: 'hero' | 'pet',
  targetName: string,
  giftId: string,
  now?: number
): { state: AffinityState; success: boolean; pointsGained: number; levelUp: boolean; error?: string } {
  const resetState = checkDailyReset(state, now);
  
  if (resetState.dailyGiftsGiven >= DAILY_LIMITS.gifts) {
    return { state: resetState, success: false, pointsGained: 0, levelUp: false, error: '今日赠礼次数已用完' };
  }

  const gift = GIFTS.find(g => g.id === giftId);
  if (!gift) {
    return { state: resetState, success: false, pointsGained: 0, levelUp: false, error: '礼物不存在' };
  }

  const { state: newState, levelUp } = addAffinity(resetState, targetId, targetType, targetName, gift.basePoints, now);
  
  // Update record gift count
  const record = newState.records[targetId];
  const updatedRecord = { ...record, giftCount: record.giftCount + 1 };

  return {
    state: {
      ...newState,
      records: { ...newState.records, [targetId]: updatedRecord },
      dailyGiftsGiven: newState.dailyGiftsGiven + 1,
      totalGiftsGiven: newState.totalGiftsGiven + 1,
    },
    success: true,
    pointsGained: gift.basePoints,
    levelUp,
  };
}

/**
 * 触发好感度事件
 */
export function triggerEvent(
  state: AffinityState,
  targetId: string,
  targetType: 'hero' | 'pet',
  targetName: string,
  event: AffinityEventType,
  now?: number
): { state: AffinityState; pointsGained: number; levelUp: boolean; error?: string } {
  const resetState = checkDailyReset(state, now);

  if (event === 'dialogue') {
    if (resetState.dailyDialogues >= DAILY_LIMITS.dialogues) {
      return { state: resetState, pointsGained: 0, levelUp: false, error: '今日对话次数已用完' };
    }
  }

  const points = EVENT_POINTS[event];
  if (points <= 0 && event !== 'gift') {
    return { state: resetState, pointsGained: 0, levelUp: false };
  }

  const { state: newState, levelUp } = addAffinity(resetState, targetId, targetType, targetName, points, now);

  let finalState = newState;
  const record = finalState.records[targetId];

  if (event === 'battle_together') {
    finalState = {
      ...finalState,
      records: { ...finalState.records, [targetId]: { ...record, battleCount: record.battleCount + 1 } },
    };
  } else if (event === 'dialogue') {
    finalState = {
      ...finalState,
      records: { ...finalState.records, [targetId]: { ...record, dialogueCount: record.dialogueCount + 1 } },
      dailyDialogues: finalState.dailyDialogues + 1,
      totalDialogues: finalState.totalDialogues + 1,
    };
  }

  return { state: finalState, pointsGained: points, levelUp };
}

/**
 * 获取好感度加成
 */
export function getAffinityBonus(state: AffinityState, targetId: string): { atkBonus: number; defBonus: number; hpBonus: number } {
  const record = state.records[targetId];
  if (!record) return { atkBonus: 0, defBonus: 0, hpBonus: 0 };
  const config = getAffinityLevelConfig(record.points);
  return { atkBonus: config.bonusAtk, defBonus: config.bonusDef, hpBonus: config.bonusHp };
}

/**
 * 获取所有好感度记录排序
 */
export function getAffinityRanking(state: AffinityState): AffinityRecord[] {
  return Object.values(state.records).sort((a, b) => b.points - a.points);
}

/**
 * 获取指定等级的所有目标
 */
export function getTargetsByLevel(state: AffinityState, level: AffinityLevel): AffinityRecord[] {
  return Object.values(state.records).filter(r => r.level === level);
}

/**
 * 获取好感度统计
 */
export function getAffinityStats(state: AffinityState): {
  totalTargets: number;
  levelDistribution: Record<AffinityLevel, number>;
  totalPoints: number;
  avgPoints: number;
  highestAffinity: AffinityRecord | null;
  dailyGiftsLeft: number;
  dailyDialoguesLeft: number;
} {
  const records = Object.values(state.records);
  const levelDist: Record<AffinityLevel, number> = {
    stranger: 0, acquaintance: 0, friend: 0, close_friend: 0, best_friend: 0, soulmate: 0,
  };
  let totalPoints = 0;
  let highest: AffinityRecord | null = null;

  for (const r of records) {
    levelDist[r.level]++;
    totalPoints += r.points;
    if (!highest || r.points > highest.points) highest = r;
  }

  return {
    totalTargets: records.length,
    levelDistribution: levelDist,
    totalPoints,
    avgPoints: records.length > 0 ? Math.round(totalPoints / records.length) : 0,
    highestAffinity: highest,
    dailyGiftsLeft: Math.max(0, DAILY_LIMITS.gifts - state.dailyGiftsGiven),
    dailyDialoguesLeft: Math.max(0, DAILY_LIMITS.dialogues - state.dailyDialogues),
  };
}

/**
 * 导出数据
 */
export function exportAffinityData(state: AffinityState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importAffinityData(json: string): AffinityState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !data.records) return null;
    return data as AffinityState;
  } catch {
    return null;
  }
}
