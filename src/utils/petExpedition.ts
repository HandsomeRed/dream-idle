// 宠物探险系统 - v0.73
// Pet Expedition - 派遣宠物外出探索获取资源

/**
 * 探险区域类型
 */
export type ExpeditionZone = 'forest' | 'cave' | 'ruins' | 'volcano' | 'ocean' | 'sky' | 'dark_realm';

/**
 * 探险难度
 */
export type ExpeditionDifficulty = 'easy' | 'normal' | 'hard' | 'expert' | 'legend';

/**
 * 探险状态
 */
export type ExpeditionStatus = 'exploring' | 'completed' | 'failed' | 'returned_early';

/**
 * 探险事件类型
 */
export type ExpeditionEventType = 'treasure' | 'monster' | 'trap' | 'mystery' | 'rest' | 'boss';

/**
 * 探险事件
 */
export interface ExpeditionEvent {
  type: ExpeditionEventType;
  description: string;
  outcome: 'positive' | 'negative' | 'neutral';
  rewards?: RewardItem[];
  damage?: number;
  durationReduction?: number; // 分钟
}

/**
 * 探险奖励物品
 */
export interface RewardItem {
  type: 'gold' | 'diamond' | 'exp' | 'stamina' | 'petFood' | 'petShard' | 'equipBox' | 'material' | 'artifact';
  amount: number;
  name: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 探险配置
 */
export interface ExpeditionConfig {
  zone: ExpeditionZone;
  difficulty: ExpeditionDifficulty;
  durationMinutes: number;
  requiredPower: number;
  baseRewards: RewardItem[];
  eventChance: number; // 0-1
  failureChance: number; // 0-1
}

/**
 * 探险任务
 */
export interface ExpeditionMission {
  id: string;
  petId: string;
  config: ExpeditionConfig;
  startTime: number;
  endTime: number;
  status: ExpeditionStatus;
  events: ExpeditionEvent[];
  finalRewards: RewardItem[];
  damageTaken: number;
  expGained: number;
  isAutoReturn: boolean;
}

/**
 * 探险系统状态
 */
export interface ExpeditionState {
  playerId: string;
  activeMissions: ExpeditionMission[];
  completedMissions: ExpeditionMission[];
  totalExpeditions: number;
  totalSuccess: number;
  totalFailure: number;
  totalRewards: Record<string, number>;
  unlockedZones: ExpeditionZone[];
  maxActiveMissions: number;
  autoReturnEnabled: boolean;
}

// ==================== 区域配置 ====================

export const ZONE_CONFIGS: Record<ExpeditionZone, { name: string; minPower: number; difficulties: ExpeditionDifficulty[] }> = {
  forest: { name: '迷雾森林', minPower: 100, difficulties: ['easy', 'normal', 'hard'] },
  cave: { name: '幽暗洞穴', minPower: 300, difficulties: ['normal', 'hard', 'expert'] },
  ruins: { name: '古代遗迹', minPower: 600, difficulties: ['hard', 'expert', 'legend'] },
  volcano: { name: '火焰火山', minPower: 1000, difficulties: ['expert', 'legend'] },
  ocean: { name: '深海秘境', minPower: 1500, difficulties: ['expert', 'legend'] },
  sky: { name: '天空之城', minPower: 2000, difficulties: ['legend'] },
  dark_realm: { name: '暗黑魔域', minPower: 3000, difficulties: ['legend'] },
};

export const DIFFICULTY_MULTIPLIERS: Record<ExpeditionDifficulty, { duration: number; rewards: number; failure: number }> = {
  easy: { duration: 0.5, rewards: 0.5, failure: 0.05 },
  normal: { duration: 1, rewards: 1, failure: 0.1 },
  hard: { duration: 1.5, rewards: 2, failure: 0.2 },
  expert: { duration: 2, rewards: 4, failure: 0.3 },
  legend: { duration: 3, rewards: 8, failure: 0.4 },
};

const BASE_DURATION_MINUTES = 60; // 基础时长 1 小时

// ==================== 事件池 ====================

const EVENT_POOL: Record<ExpeditionEventType, { desc: string; outcome: 'positive' | 'negative' | 'neutral'; effect: string }[]> = {
  treasure: [
    { desc: '发现隐藏宝箱', outcome: 'positive', effect: '获得额外奖励' },
    { desc: '遇到神秘商人', outcome: 'positive', effect: '低价购买宝物' },
    { desc: '找到古代遗物', outcome: 'positive', effect: '获得神器碎片' },
  ],
  monster: [
    { desc: '遭遇野生怪物', outcome: 'negative', effect: '战斗受伤' },
    { desc: '被魔物袭击', outcome: 'negative', effect: '损失生命值' },
    { desc: '击退敌对生物', outcome: 'neutral', effect: '无影响' },
  ],
  trap: [
    { desc: '触发机关陷阱', outcome: 'negative', effect: '受伤并延迟' },
    { desc: '避开致命陷阱', outcome: 'positive', effect: '获得经验' },
  ],
  mystery: [
    { desc: '遇到神秘事件', outcome: 'neutral', effect: '未知影响' },
    { desc: '解开古老谜题', outcome: 'positive', effect: '获得智慧' },
  ],
  rest: [
    { desc: '发现安全营地', outcome: 'positive', effect: '恢复状态' },
    { desc: '短暂休息', outcome: 'neutral', effect: '恢复体力' },
  ],
  boss: [
    { desc: '遭遇区域 BOSS', outcome: 'negative', effect: '重伤或逃跑' },
    { desc: '击败守护 BOSS', outcome: 'positive', effect: '获得丰厚奖励' },
  ],
};

// ==================== 工具函数 ====================

export function getNow(): number {
  return Date.now();
}

export function getZoneName(zone: ExpeditionZone): string {
  return ZONE_CONFIGS[zone].name;
}

export function getDifficultyName(difficulty: ExpeditionDifficulty): string {
  const names: Record<ExpeditionDifficulty, string> = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
    expert: '专家',
    legend: '传说',
  };
  return names[difficulty];
}

// ==================== 核心函数 ====================

/**
 * 创建探险系统状态
 */
export function createExpeditionState(playerId: string): ExpeditionState {
  return {
    playerId,
    activeMissions: [],
    completedMissions: [],
    totalExpeditions: 0,
    totalSuccess: 0,
    totalFailure: 0,
    totalRewards: {},
    unlockedZones: ['forest'],
    maxActiveMissions: 3,
    autoReturnEnabled: false,
  };
}

/**
 * 检查区域是否解锁
 */
export function isZoneUnlocked(state: ExpeditionState, zone: ExpeditionZone): boolean {
  return state.unlockedZones.includes(zone);
}

/**
 * 解锁区域
 */
export function unlockZone(state: ExpeditionState, zone: ExpeditionZone): ExpeditionState {
  if (state.unlockedZones.includes(zone)) return state;
  return {
    ...state,
    unlockedZones: [...state.unlockedZones, zone],
  };
}

/**
 * 检查宠物是否可以探险
 */
export function canPetExpedition(
  state: ExpeditionState,
  petId: string,
  petPower: number,
  zone: ExpeditionZone
): { can: boolean; reason?: string } {
  // 检查是否已有相同宠物在探险
  const existing = state.activeMissions.find(m => m.petId === petId);
  if (existing) {
    return { can: false, reason: '宠物正在探险中' };
  }

  // 检查区域是否解锁
  if (!isZoneUnlocked(state, zone)) {
    return { can: false, reason: `区域${getZoneName(zone)}未解锁` };
  }

  // 检查战力要求
  const zoneConfig = ZONE_CONFIGS[zone];
  if (petPower < zoneConfig.minPower) {
    return { can: false, reason: `宠物战力不足（需要${zoneConfig.minPower}）` };
  }

  // 检查任务数量限制
  if (state.activeMissions.length >= state.maxActiveMissions) {
    return { can: false, reason: '探险队伍已满' };
  }

  return { can: true };
}

/**
 * 生成探险配置
 */
export function generateExpeditionConfig(
  zone: ExpeditionZone,
  difficulty: ExpeditionDifficulty
): ExpeditionConfig {
  const zoneConfig = ZONE_CONFIGS[zone];
  const diffMult = DIFFICULTY_MULTIPLIERS[difficulty];

  // 验证难度是否适用于该区域
  if (!zoneConfig.difficulties.includes(difficulty)) {
    difficulty = zoneConfig.difficulties[zoneConfig.difficulties.length - 1];
  }

  const durationMinutes = Math.round(BASE_DURATION_MINUTES * diffMult.duration);
  const requiredPower = zoneConfig.minPower * (1 + zoneConfig.difficulties.indexOf(difficulty) * 0.5);

  // 基础奖励
  const baseRewards: RewardItem[] = [
    { type: 'gold', amount: Math.round(1000 * diffMult.rewards), name: '金币' },
    { type: 'exp', amount: Math.round(500 * diffMult.rewards), name: '宠物经验' },
    { type: 'petFood', amount: Math.round(10 * diffMult.rewards), name: '宠物粮' },
  ];

  // 高难度额外奖励
  if (difficulty === 'expert' || difficulty === 'legend') {
    baseRewards.push({ type: 'petShard', amount: Math.round(5 * diffMult.rewards), name: '宠物碎片', rarity: 'rare' });
  }
  if (difficulty === 'legend') {
    baseRewards.push({ type: 'artifact', amount: 1, name: '神器碎片', rarity: 'legendary' });
  }

  return {
    zone,
    difficulty,
    durationMinutes,
    requiredPower: Math.round(requiredPower),
    baseRewards,
    eventChance: 0.3 + (zoneConfig.difficulties.indexOf(difficulty) * 0.1),
    failureChance: diffMult.failure,
  };
}

/**
 * 生成随机事件
 */
export function generateRandomEvent(
  config: ExpeditionConfig,
  rng?: () => number
): ExpeditionEvent | null {
  const rand = rng ?? Math.random;

  if (rand() > config.eventChance) return null;

  const eventTypes: ExpeditionEventType[] = ['treasure', 'monster', 'trap', 'mystery', 'rest', 'boss'];
  const weights = [0.25, 0.25, 0.15, 0.15, 0.15, 0.05];

  // 权重选择事件类型
  let roll = rand();
  let cumulative = 0;
  let selectedType: ExpeditionEventType = 'mystery';

  for (let i = 0; i < eventTypes.length; i++) {
    cumulative += weights[i];
    if (roll <= cumulative) {
      selectedType = eventTypes[i];
      break;
    }
  }

  // BOSS 事件只在传说难度出现
  if (selectedType === 'boss' && config.difficulty !== 'legend') {
    selectedType = 'monster';
  }

  const events = EVENT_POOL[selectedType];
  const event = events[Math.floor(rand() * events.length)];

  // 生成奖励或伤害
  const diffMult = DIFFICULTY_MULTIPLIERS[config.difficulty];
  let rewards: RewardItem[] | undefined;
  let damage: number | undefined;

  if (event.outcome === 'positive') {
    rewards = [
      { type: 'gold', amount: Math.round(500 * diffMult.rewards), name: '额外金币' },
      { type: 'exp', amount: Math.round(200 * diffMult.rewards), name: '额外经验' },
    ];
  } else if (event.outcome === 'negative') {
    damage = Math.round(100 * (1 + zoneConfigIndex(config.zone) * 0.5));
  }

  return {
    type: selectedType,
    description: event.desc,
    outcome: event.outcome,
    rewards,
    damage,
  };
}

function zoneConfigIndex(zone: ExpeditionZone): number {
  const zones: ExpeditionZone[] = ['forest', 'cave', 'ruins', 'volcano', 'ocean', 'sky', 'dark_realm'];
  return zones.indexOf(zone);
}

/**
 * 开始探险
 */
export function startExpedition(
  state: ExpeditionState,
  petId: string,
  petPower: number,
  zone: ExpeditionZone,
  difficulty: ExpeditionDifficulty,
  now?: number
): { state: ExpeditionState; mission?: ExpeditionMission; error?: string } {
  const check = canPetExpedition(state, petId, petPower, zone);
  if (!check.can) {
    return { state, error: check.reason };
  }

  const config = generateExpeditionConfig(zone, difficulty);
  const currentTime = now ?? getNow();
  const endTime = currentTime + config.durationMinutes * 60 * 1000;

  const mission: ExpeditionMission = {
    id: `exp_${Date.now()}_${petId}`,
    petId,
    config,
    startTime: currentTime,
    endTime,
    status: 'exploring',
    events: [],
    finalRewards: [],
    damageTaken: 0,
    expGained: 0,
    isAutoReturn: state.autoReturnEnabled,
  };

  return {
    state: {
      ...state,
      activeMissions: [...state.activeMissions, mission],
    },
    mission,
  };
}

/**
 * 处理探险事件（模拟）
 */
export function processExpeditionEvents(
  mission: ExpeditionMission,
  petPower: number,
  rng?: () => number
): ExpeditionMission {
  const newMission = { ...mission, events: [...mission.events] };
  const rand = rng ?? Math.random;

  // 模拟过程中的事件
  const eventCount = Math.floor(mission.config.durationMinutes / 20); // 每 20 分钟可能触发事件

  for (let i = 0; i < eventCount; i++) {
    const event = generateRandomEvent(mission.config, () => rand());
    if (event) {
      newMission.events.push(event);

      if (event.damage) {
        newMission.damageTaken += event.damage;
      }

      if (event.rewards) {
        // 临时存储，最终结算时合并
      }

      // BOSS 战可能直接失败
      if (event.type === 'boss' && event.outcome === 'negative') {
        if (rand() < 0.5) {
          // 50% 几率被 BOSS 击败
          newMission.status = 'failed';
          break;
        }
      }
    }
  }

  return newMission;
}

/**
 * 完成探险
 */
export function completeExpedition(
  state: ExpeditionState,
  missionId: string,
  now?: number
): { state: ExpeditionState; success: boolean; rewards?: RewardItem[]; error?: string } {
  const missionIndex = state.activeMissions.findIndex(m => m.id === missionId);
  if (missionIndex === -1) {
    return { state, success: false, error: '探险任务不存在' };
  }

  const mission = state.activeMissions[missionIndex];
  const currentTime = now ?? getNow();

  // 检查是否已完成
  if (currentTime < mission.endTime && mission.status === 'exploring') {
    return { state, success: false, error: '探险尚未完成' };
  }

  // 处理事件和奖励
  const processedMission = processExpeditionEvents(mission, 1000);

  // 检查是否因伤害过高而失败
  const failChance = mission.config.failureChance;
  const rand = Math.random();

  if (rand < failChance || processedMission.status === 'failed') {
    // 失败
    const failedMission = { ...processedMission, status: 'failed' as ExpeditionStatus };

    return {
      state: {
        ...state,
        activeMissions: state.activeMissions.filter(m => m.id !== missionId),
        completedMissions: [...state.completedMissions, failedMission].slice(-50),
        totalExpeditions: state.totalExpeditions + 1,
        totalFailure: state.totalFailure + 1,
      },
      success: false,
      rewards: [],
    };
  }

  // 成功 - 计算最终奖励
  const finalRewards = [...mission.config.baseRewards];

  // 添加事件奖励
  processedMission.events.forEach(event => {
    if (event.rewards) {
      finalRewards.push(...event.rewards);
    }
  });

  // 计算经验
  const expGained = finalRewards.filter(r => r.type === 'exp').reduce((sum, r) => sum + r.amount, 0);

  const completedMission: ExpeditionMission = {
    ...processedMission,
    status: 'completed',
    finalRewards,
    expGained,
  };

  // 更新奖励统计
  const newTotalRewards = { ...state.totalRewards };
  finalRewards.forEach(r => {
    const key = `${r.type}_${r.name}`;
    newTotalRewards[key] = (newTotalRewards[key] || 0) + r.amount;
  });

  return {
    state: {
      ...state,
      activeMissions: state.activeMissions.filter(m => m.id !== missionId),
      completedMissions: [...state.completedMissions, completedMission].slice(-50),
      totalExpeditions: state.totalExpeditions + 1,
      totalSuccess: state.totalSuccess + 1,
      totalRewards: newTotalRewards,
    },
    success: true,
    rewards: finalRewards,
  };
}

/**
 * 提前召回探险
 */
export function recallExpedition(
  state: ExpeditionState,
  missionId: string
): { state: ExpeditionState; success: boolean; partialRewards?: RewardItem[]; error?: string } {
  const missionIndex = state.activeMissions.findIndex(m => m.id === missionId);
  if (missionIndex === -1) {
    return { state, success: false, error: '探险任务不存在' };
  }

  const mission = state.activeMissions[missionIndex];

  // 计算完成度
  const now = getNow();
  const elapsed = now - mission.startTime;
  const total = mission.endTime - mission.startTime;
  const completion = Math.min(1, elapsed / total);

  // 提前召回只能获得部分奖励（50% * 完成度）
  const multiplier = 0.5 * completion;
  const partialRewards = mission.config.baseRewards.map(r => ({
    ...r,
    amount: Math.round(r.amount * multiplier),
  }));

  const recalledMission: ExpeditionMission = {
    ...mission,
    status: 'returned_early',
    finalRewards: partialRewards,
  };

  return {
    state: {
      ...state,
      activeMissions: state.activeMissions.filter(m => m.id !== missionId),
      completedMissions: [...state.completedMissions, recalledMission].slice(-50),
      totalExpeditions: state.totalExpeditions + 1,
      totalSuccess: state.totalSuccess + 1,
    },
    success: true,
    partialRewards,
  };
}

/**
 * 获取可领取的探险
 */
export function getClaimableMissions(state: ExpeditionState, now?: number): ExpeditionMission[] {
  const currentTime = now ?? getNow();
  return state.activeMissions.filter(m => currentTime >= m.endTime && m.status === 'exploring');
}

/**
 * 获取探险统计
 */
export function getExpeditionStats(state: ExpeditionState): {
  activeCount: number;
  maxActive: number;
  totalExpeditions: number;
  successRate: number;
  unlockedZones: number;
  totalZones: number;
  favoriteZone: ExpeditionZone | null;
} {
  const successRate = state.totalExpeditions > 0
    ? Math.round((state.totalSuccess / state.totalExpeditions) * 100)
    : 0;

  // 计算最常去的区域
  let favoriteZone: ExpeditionZone | null = null;
  let maxCount = 0;
  const zoneCounts: Record<string, number> = {};

  state.completedMissions.forEach(m => {
    zoneCounts[m.config.zone] = (zoneCounts[m.config.zone] || 0) + 1;
    if (zoneCounts[m.config.zone] > maxCount) {
      maxCount = zoneCounts[m.config.zone];
      favoriteZone = m.config.zone;
    }
  });

  return {
    activeCount: state.activeMissions.length,
    maxActive: state.maxActiveMissions,
    totalExpeditions: state.totalExpeditions,
    successRate,
    unlockedZones: state.unlockedZones.length,
    totalZones: Object.keys(ZONE_CONFIGS).length,
    favoriteZone,
  };
}

/**
 * 设置自动召回
 */
export function setAutoReturn(state: ExpeditionState, enabled: boolean): ExpeditionState {
  return { ...state, autoReturnEnabled: enabled };
}

/**
 * 导出数据
 */
export function exportExpeditionData(state: ExpeditionState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importExpeditionData(json: string): ExpeditionState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || typeof data.totalExpeditions !== 'number') return null;
    return data as ExpeditionState;
  } catch {
    return null;
  }
}
