/**
 * v0.85 押镖系统 (Escort Mission System)
 * 每日押镖任务，护送镖车获得金币、经验、帮派贡献奖励
 */

export interface EscortMission {
  id: string;
  difficulty: EscortDifficulty;
  route: EscortRoute;
  targetLocation: string;
  progress: number; // 0-100
  reward: EscortReward;
  status: EscortStatus;
  startTime: number;
  expireTime: number;
  isDaily: boolean;
  completedCount: number; // 今日已完成次数
}

export type EscortDifficulty = 'normal' | 'hard' | 'expert';

export type EscortRoute = {
  id: string;
  name: string;
  distance: number; // 距离 (影响时间)
  dangerLevel: number; // 危险等级 1-10
  baseReward: { exp: number; gold: number; gangContribution: number };
};

export type EscortStatus = 'preparing' | 'escorting' | 'ambushed' | 'completed' | 'failed' | 'claimed' | 'expired';

export interface EscortReward {
  exp: number;
  gold: number;
  gangContribution: number; // 帮派贡献
  bonusMultiplier: number; // 奖励倍数
}

export interface EscortConfig {
  dailyMaxMissions: number; // 每日最大押镖次数
  baseDuration: number; // 基础持续时间 (秒)
  refreshTime: number; // 刷新时间 (小时)
  ambushRate: Record<EscortDifficulty, number>; // 各难度遭遇劫镖概率
  difficultyRewards: Record<EscortDifficulty, number>; // 各难度奖励倍数
}

export const ESCORT_CONFIG: EscortConfig = {
  dailyMaxMissions: 3,
  baseDuration: 300, // 5 分钟
  refreshTime: 24,
  ambushRate: {
    normal: 0.10,
    hard: 0.25,
    expert: 0.40,
  },
  difficultyRewards: {
    normal: 1.0,
    hard: 2.5,
    expert: 6.0,
  },
};

// 押镖路线
export const ESCORT_ROUTES: EscortRoute[] = [
  { id: 'route_1', name: '长安→大唐官府', distance: 100, dangerLevel: 2, baseReward: { exp: 5000, gold: 2000, gangContribution: 5 } },
  { id: 'route_2', name: '长安→方寸山', distance: 150, dangerLevel: 4, baseReward: { exp: 8000, gold: 3500, gangContribution: 8 } },
  { id: 'route_3', name: '长安→龙宫', distance: 200, dangerLevel: 6, baseReward: { exp: 12000, gold: 5000, gangContribution: 12 } },
  { id: 'route_4', name: '长安→魔王寨', distance: 250, dangerLevel: 8, baseReward: { exp: 18000, gold: 8000, gangContribution: 18 } },
  { id: 'route_5', name: '长安→阴曹地府', distance: 300, dangerLevel: 10, baseReward: { exp: 25000, gold: 12000, gangContribution: 25 } },
];

// 生成押镖任务
export function createEscortMission(difficulty: EscortDifficulty = 'normal', isDaily: boolean = true): EscortMission {
  const route = ESCORT_ROUTES[Math.floor(Math.random() * ESCORT_ROUTES.length)];
  const rewardMultiplier = ESCORT_CONFIG.difficultyRewards[difficulty];
  
  const reward: EscortReward = {
    exp: Math.floor(route.baseReward.exp * rewardMultiplier),
    gold: Math.floor(route.baseReward.gold * rewardMultiplier),
    gangContribution: Math.floor(route.baseReward.gangContribution * rewardMultiplier),
    bonusMultiplier: rewardMultiplier,
  };
  
  const now = Date.now();
  const duration = ESCORT_CONFIG.baseDuration * (route.distance / 100);
  
  return {
    id: `escort_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    difficulty,
    route,
    targetLocation: route.name.split('→')[1],
    progress: 0,
    reward,
    status: 'preparing',
    startTime: now,
    expireTime: now + (ESCORT_CONFIG.refreshTime * 60 * 60 * 1000),
    isDaily,
    completedCount: 0,
  };
}

// 随机生成难度
export function getRandomEscortDifficulty(): EscortDifficulty {
  const rand = Math.random();
  if (rand < 0.50) return 'normal';
  if (rand < 0.80) return 'hard';
  return 'expert';
}

// 开始押镖
export function startEscort(mission: EscortMission): { success: boolean; message: string } {
  if (mission.status !== 'preparing') {
    return { success: false, message: '押镖任务状态不正确' };
  }
  
  mission.status = 'escorting';
  mission.startTime = Date.now();
  
  return { success: true, message: `开始押镖：${mission.route.name}` };
}

// 更新押镖进度
export function updateEscortProgress(mission: EscortMission, progressDelta: number): { 
  success: boolean; 
  message: string; 
  completed?: boolean;
  ambushed?: boolean;
} {
  if (mission.status !== 'escorting') {
    return { success: false, message: '押镖未进行中' };
  }
  
  mission.progress += progressDelta;
  
  // 检查遭遇劫镖
  const ambushRate = ESCORT_CONFIG.ambushRate[mission.difficulty];
  if (Math.random() < ambushRate && mission.progress < 100) {
    mission.status = 'ambushed';
    return { success: true, message: '遭遇劫镖！请击败劫匪！', ambushed: true };
  }
  
  if (mission.progress >= 100) {
    mission.progress = 100;
    mission.status = 'completed';
    mission.completedCount += 1;
    return { success: true, message: `押镖成功！到达${mission.targetLocation}！`, completed: true };
  }
  
  return { success: true, message: `押镖进度：${Math.floor(mission.progress)}%` };
}

// 击败劫匪 (处理劫镖)
export function defeatAmbusher(mission: EscortMission): { success: boolean; message: string } {
  if (mission.status !== 'ambushed') {
    return { success: false, message: '未遭遇劫镖' };
  }
  
  mission.status = 'escorting';
  return { success: true, message: '击败劫匪，继续押镖！' };
}

// 领取押镖奖励
export function claimEscortReward(mission: EscortMission): { success: boolean; message: string; reward?: EscortReward } {
  if (mission.status !== 'completed') {
    return { success: false, message: '押镖未完成，无法领取奖励' };
  }
  
  const reward = { ...mission.reward };
  mission.status = 'claimed';
  
  return { success: true, message: '领取押镖奖励成功！', reward };
}

// 检查押镖过期
export function checkEscortExpired(mission: EscortMission, currentTime: number = Date.now()): boolean {
  if (mission.status === 'claimed' || mission.status === 'failed' || mission.status === 'expired') {
    return true;
  }
  
  if (currentTime >= mission.expireTime) {
    mission.status = 'expired';
    return true;
  }
  
  return false;
}

// 获取押镖剩余时间
export function getEscortRemainingTime(mission: EscortMission, currentTime: number = Date.now()): number {
  const remaining = mission.expireTime - currentTime;
  return Math.max(0, Math.floor(remaining / 1000));
}

// 获取押镖预计完成时间
export function getEscortEstimatedTime(mission: EscortMission): number {
  if (mission.status !== 'escorting') {
    return 0;
  }
  
  const remainingProgress = 100 - mission.progress;
  const baseDuration = ESCORT_CONFIG.baseDuration * (mission.route.distance / 100);
  const remainingTime = (remainingProgress / 100) * baseDuration;
  
  return Math.floor(remainingTime);
}

// 获取押镖统计
export function getEscortStats(missions: EscortMission[]): {
  total: number;
  preparing: number;
  escorting: number;
  completed: number;
  claimed: number;
  failed: number;
  totalRewards: { exp: number; gold: number; gangContribution: number };
} {
  const stats = {
    total: missions.length,
    preparing: 0,
    escorting: 0,
    completed: 0,
    claimed: 0,
    failed: 0,
    totalRewards: { exp: 0, gold: 0, gangContribution: 0 },
  };
  
  missions.forEach(mission => {
    switch (mission.status) {
      case 'preparing': stats.preparing++; break;
      case 'escorting': stats.escorting++; break;
      case 'completed': stats.completed++; break;
      case 'claimed':
        stats.claimed++;
        stats.totalRewards.exp += mission.reward.exp;
        stats.totalRewards.gold += mission.reward.gold;
        stats.totalRewards.gangContribution += mission.reward.gangContribution;
        break;
      case 'failed': stats.failed++; break;
    }
  });
  
  return stats;
}

// 获取可领取的押镖
export function getClaimableEscports(missions: EscortMission[]): EscortMission[] {
  return missions.filter(m => m.status === 'completed');
}

// 获取进行中的押镖
export function getActiveEscorts(missions: EscortMission[]): EscortMission[] {
  return missions.filter(m => m.status === 'escorting' || m.status === 'ambushed');
}

// 批量领取奖励
export function claimAllEscortRewards(missions: EscortMission[]): {
  success: boolean;
  message: string;
  totalReward: { exp: number; gold: number; gangContribution: number };
  claimedCount: number;
} {
  const claimable = getClaimableEscports(missions);
  
  if (claimable.length === 0) {
    return { success: false, message: '没有可领取的押镖奖励', totalReward: { exp: 0, gold: 0, gangContribution: 0 }, claimedCount: 0 };
  }
  
  const totalReward = { exp: 0, gold: 0, gangContribution: 0 };
  let claimedCount = 0;
  
  claimable.forEach(mission => {
    const result = claimEscortReward(mission);
    if (result.success && result.reward) {
      totalReward.exp += result.reward.exp;
      totalReward.gold += result.reward.gold;
      totalReward.gangContribution += result.reward.gangContribution;
      claimedCount++;
    }
  });
  
  return {
    success: true,
    message: `领取了 ${claimedCount} 个押镖任务的奖励！`,
    totalReward,
    claimedCount,
  };
}

// 获取难度名称
export function getEscortDifficultyName(difficulty: EscortDifficulty): string {
  const names: Record<EscortDifficulty, string> = {
    normal: '普通',
    hard: '困难',
    expert: '专家',
  };
  return names[difficulty];
}

// 获取难度颜色
export function getEscortDifficultyColor(difficulty: EscortDifficulty): string {
  const colors: Record<EscortDifficulty, string> = {
    normal: '#4CAF50',
    hard: '#FF9800',
    expert: '#F44336',
  };
  return colors[difficulty];
}

// 获取状态名称
export function getEscortStatusName(status: EscortStatus): string {
  const names: Record<EscortStatus, string> = {
    preparing: '准备中',
    escorting: '押镖中',
    ambushed: '遭遇劫镖',
    completed: '已完成',
    failed: '已失败',
    claimed: '已领取',
    expired: '已过期',
  };
  return names[status];
}

// 计算今日奖励倍数 (连续押镖奖励)
export function calculateDailyBonus(completedCount: number): number {
  if (completedCount === 0) return 1.0;
  if (completedCount === 1) return 1.2;
  if (completedCount === 2) return 1.5;
  return 2.0; // 第 4 次及以后
}
