/**
 * v0.84 师门任务系统 (Sect Mission System)
 * 每日师门任务，完成获得门派贡献、经验、金币奖励
 */

export interface SectMission {
  id: string;
  type: MissionType;
  difficulty: Difficulty;
  description: string;
  target: number; // 目标数量
  progress: number; // 当前进度
  reward: MissionReward;
  isDaily: boolean;
  expireTime: number; // 过期时间
  status: MissionStatus;
}

export type MissionType = 
  | 'hunt'      // 讨伐怪物
  | 'gather'    // 收集物品
  | 'escort'    // 护送任务
  | 'challenge' // 挑战任务
  | 'explore';  // 探索任务

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'claimed' | 'expired';

export interface MissionReward {
  exp: number;
  gold: number;
  sectContribution: number; // 门派贡献
  bonusExp?: number; // 额外经验
  items?: MissionItem[];
}

export interface MissionItem {
  id: string;
  name: string;
  quantity: number;
}

export interface SectMissionConfig {
  dailyMissionCount: number; // 每日任务数量
  maxConcurrentMissions: number; // 最大同时进行任务数
  missionRefreshTime: number; // 任务刷新时间 (小时)
  difficultyRates: Record<Difficulty, number>; // 各难度出现概率
  baseRewards: Record<Difficulty, { exp: number; gold: number; sectContribution: number }>;
}

export const SECT_MISSION_CONFIG: SectMissionConfig = {
  dailyMissionCount: 20,
  maxConcurrentMissions: 3,
  missionRefreshTime: 24,
  difficultyRates: {
    easy: 0.40,
    medium: 0.35,
    hard: 0.20,
    expert: 0.05,
  },
  baseRewards: {
    easy: { exp: 1000, gold: 500, sectContribution: 1 },
    medium: { exp: 2500, gold: 1200, sectContribution: 3 },
    hard: { exp: 6000, gold: 3000, sectContribution: 8 },
    expert: { exp: 15000, gold: 8000, sectContribution: 20 },
  },
};

// 任务描述模板
const MISSION_TEMPLATES: Record<MissionType, string[]> = {
  hunt: [
    '讨伐{monster} {count} 只',
    '消灭{monster} {count} 只',
    '清除{monster} {count} 只',
  ],
  gather: [
    '收集{item} {count} 个',
    '采集{item} {count} 份',
    '寻找{item} {count} 个',
  ],
  escort: [
    '护送{npc} 到{location}',
    '保护{npc} 到达{location}',
    '协助{npc} 前往{location}',
  ],
  challenge: [
    '挑战{target} 并获胜',
    '击败{target}',
    '战胜{target}',
  ],
  explore: [
    '探索{location} 区域',
    '调查{location} 的秘密',
    '巡查{location}',
  ],
};

// 怪物列表
const MONSTERS = ['强盗', '山贼', '老虎', '黑熊', '狼精', '狐妖', '蛇精', '骷髅', '僵尸', '恶鬼'];

// 物品列表
const ITEMS = ['草药', '矿石', '木材', '兽皮', '宝石', '灵珠', '符咒', '丹药'];

// NPC 列表
const NPCS = ['商队', '村民', '弟子', '长老', '使者'];

// 地点列表
const LOCATIONS = ['长安城', '大唐官府', '方寸山', '龙宫', '魔王寨', '盘丝洞', '阴曹地府'];

// 生成随机难度
export function getRandomDifficulty(): Difficulty {
  const rand = Math.random();
  let cumulative = 0;
  
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
  
  for (const diff of difficulties) {
    cumulative += SECT_MISSION_CONFIG.difficultyRates[diff];
    if (rand <= cumulative) {
      return diff;
    }
  }
  
  return 'easy';
}

// 生成任务描述
export function generateMissionDescription(type: MissionType, difficulty: Difficulty): { description: string; target: number } {
  const templates = MISSION_TEMPLATES[type];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  let description = template;
  let target = 0;
  
  switch (type) {
    case 'hunt':
      const monster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
      target = Math.floor(Math.random() * 5 + 5) * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : difficulty === 'hard' ? 3 : 5);
      description = description.replace('{monster}', monster).replace('{count}', target.toString());
      break;
    case 'gather':
      const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      target = Math.floor(Math.random() * 10 + 10) * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : difficulty === 'hard' ? 3 : 5);
      description = description.replace('{item}', item).replace('{count}', target.toString());
      break;
    case 'escort':
      const npc = NPCS[Math.floor(Math.random() * NPCS.length)];
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      description = description.replace('{npc}', npc).replace('{location}', location);
      target = 1;
      break;
    case 'challenge':
      const challengeTarget = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
      description = description.replace('{target}', challengeTarget);
      target = 1;
      break;
    case 'explore':
      const exploreLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      description = description.replace('{location}', exploreLocation);
      target = 1;
      break;
  }
  
  return { description, target };
}

// 计算任务奖励
export function calculateMissionReward(difficulty: Difficulty, isDaily: boolean): MissionReward {
  const base = SECT_MISSION_CONFIG.baseRewards[difficulty];
  const multiplier = isDaily ? 1.2 : 1.0; // 每日任务额外 20% 奖励
  
  return {
    exp: Math.floor(base.exp * multiplier),
    gold: Math.floor(base.gold * multiplier),
    sectContribution: Math.floor(base.sectContribution * multiplier),
  };
}

// 生成随机任务类型
export function getRandomMissionType(): MissionType {
  const types: MissionType[] = ['hunt', 'gather', 'escort', 'challenge', 'explore'];
  return types[Math.floor(Math.random() * types.length)];
}

// 创建新任务
export function createSectMission(isDaily: boolean = true): SectMission {
  const difficulty = getRandomDifficulty();
  const type = getRandomMissionType();
  const { description, target } = generateMissionDescription(type, difficulty);
  const reward = calculateMissionReward(difficulty, isDaily);
  
  const expireTime = Date.now() + (SECT_MISSION_CONFIG.missionRefreshTime * 60 * 60 * 1000);
  
  return {
    id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    difficulty,
    description,
    target,
    progress: 0,
    reward,
    isDaily,
    expireTime,
    status: 'pending',
  };
}

// 生成每日任务列表
export function generateDailyMissions(): SectMission[] {
  const missions: SectMission[] = [];
  
  for (let i = 0; i < SECT_MISSION_CONFIG.dailyMissionCount; i++) {
    missions.push(createSectMission(true));
  }
  
  return missions;
}

// 接受任务
export function acceptMission(mission: SectMission): { success: boolean; message: string } {
  if (mission.status !== 'pending') {
    return { success: false, message: '任务状态不允许接受' };
  }
  
  mission.status = 'in_progress';
  return { success: true, message: `接受任务：${mission.description}` };
}

// 更新任务进度
export function updateMissionProgress(mission: SectMission, progress: number): { success: boolean; message: string; completed?: boolean } {
  if (mission.status !== 'in_progress') {
    return { success: false, message: '任务未进行中' };
  }
  
  mission.progress += progress;
  
  if (mission.progress >= mission.target) {
    mission.progress = mission.target;
    mission.status = 'completed';
    return { success: true, message: `任务完成！${mission.description}`, completed: true };
  }
  
  return { success: true, message: `进度更新：${mission.progress}/${mission.target}` };
}

// 领取任务奖励
export function claimMissionReward(mission: SectMission): { success: boolean; message: string; reward?: MissionReward } {
  if (mission.status !== 'completed') {
    return { success: false, message: '任务未完成，无法领取奖励' };
  }
  
  const reward = { ...mission.reward };
  mission.status = 'claimed';
  
  return { success: true, message: '领取奖励成功！', reward };
}

// 检查任务过期
export function checkMissionExpired(mission: SectMission, currentTime: number = Date.now()): boolean {
  if (mission.status === 'claimed' || mission.status === 'expired') {
    return true;
  }
  
  if (currentTime >= mission.expireTime) {
    mission.status = 'expired';
    return true;
  }
  
  return false;
}

// 获取任务剩余时间
export function getMissionRemainingTime(mission: SectMission, currentTime: number = Date.now()): number {
  const remaining = mission.expireTime - currentTime;
  return Math.max(0, Math.floor(remaining / 1000)); // 秒
}

// 获取任务状态统计
export function getMissionStats(missions: SectMission[]): {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  claimed: number;
  expired: number;
  completionRate: number;
} {
  const stats = {
    total: missions.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
    claimed: 0,
    expired: 0,
    completionRate: 0,
  };
  
  missions.forEach(mission => {
    switch (mission.status) {
      case 'pending': stats.pending++; break;
      case 'in_progress': stats.inProgress++; break;
      case 'completed': stats.completed++; break;
      case 'claimed': stats.claimed++; break;
      case 'expired': stats.expired++; break;
    }
  });
  
  const finished = stats.claimed + stats.expired;
  stats.completionRate = stats.total > 0 ? Math.floor((stats.claimed / stats.total) * 100) : 0;
  
  return stats;
}

// 获取可领取奖励的任务
export function getClaimableMissions(missions: SectMission[]): SectMission[] {
  return missions.filter(m => m.status === 'completed');
}

// 获取进行中的任务
export function getActiveMissions(missions: SectMission[]): SectMission[] {
  return missions.filter(m => m.status === 'in_progress');
}

// 获取未过期的任务
export function getValidMissions(missions: SectMission[], currentTime: number = Date.now()): SectMission[] {
  return missions.filter(m => {
    if (m.status === 'expired' || m.status === 'claimed') {
      return false;
    }
    return currentTime < m.expireTime;
  });
}

// 批量领取奖励
export function claimAllRewards(missions: SectMission[]): { 
  success: boolean; 
  message: string; 
  totalReward: { exp: number; gold: number; sectContribution: number };
  claimedCount: number;
} {
  const claimable = getClaimableMissions(missions);
  
  if (claimable.length === 0) {
    return { success: false, message: '没有可领取的奖励', totalReward: { exp: 0, gold: 0, sectContribution: 0 }, claimedCount: 0 };
  }
  
  const totalReward = { exp: 0, gold: 0, sectContribution: 0 };
  let claimedCount = 0;
  
  claimable.forEach(mission => {
    const result = claimMissionReward(mission);
    if (result.success && result.reward) {
      totalReward.exp += result.reward.exp;
      totalReward.gold += result.reward.gold;
      totalReward.sectContribution += result.reward.sectContribution;
      claimedCount++;
    }
  });
  
  return {
    success: true,
    message: `领取了 ${claimedCount} 个任务的奖励！`,
    totalReward,
    claimedCount,
  };
}

// 获取难度颜色
export function getDifficultyColor(difficulty: Difficulty): string {
  const colors: Record<Difficulty, string> = {
    easy: '#4CAF50',     // 绿色
    medium: '#2196F3',   // 蓝色
    hard: '#FF9800',     // 橙色
    expert: '#F44336',   // 红色
  };
  return colors[difficulty];
}

// 获取难度名称
export function getDifficultyName(difficulty: Difficulty): string {
  const names: Record<Difficulty, string> = {
    easy: '简单',
    medium: '普通',
    hard: '困难',
    expert: '专家',
  };
  return names[difficulty];
}

// 获取任务类型名称
export function getMissionTypeName(type: MissionType): string {
  const names: Record<MissionType, string> = {
    hunt: '讨伐',
    gather: '收集',
    escort: '护送',
    challenge: '挑战',
    explore: '探索',
  };
  return names[type];
}
