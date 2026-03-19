/**
 * v0.21 爬塔系统 (Tower Challenge System)
 * 
 * 功能：
 * - 无尽爬塔（1000+ 层）
 * - 每层不同敌人配置
 * - 首通奖励 + 星级奖励
 * - 排行榜（最高层数）
 * - 重置挑战
 */

// ==================== 类型定义 ====================

export interface TowerFloor {
  floor: number;
  enemyPower: number;
  enemyName: string;
  starRequirements: {
    stars1: number; // 1 星：通关
    stars2: number; // 2 星：多少回合内通关
    stars3: number; // 3 星：多少回合内无伤通关
  };
  rewards: {
    gold: number;
    exp: number;
    diamond?: number;
    itemDrop?: string;
  };
}

export interface TowerProgress {
  maxFloor: number; // 最高到达层数
  currentFloor: number; // 当前挑战层数
  floorStars: { [floor: number]: number }; // 每层获得的星级
  firstClearRewards: number[]; // 已领取首通奖励的层数
  lastResetTime: number;
  totalChallenges: number;
  totalWins: number;
}

export interface TowerChallenge {
  floor: number;
  playerPower: number;
  enemyPower: number;
  rounds: number;
  playerHP: number;
  maxHP: number;
  isVictory: boolean;
  stars: number;
}

export interface TowerConfig {
  totalFloors: number;
  baseEnemyPower: number;
  powerGrowthRate: number;
  resetCost: number; // 重置需要的钻石
  starRewards: {
    [stars: number]: { gold: number; exp: number; diamond?: number };
  };
}

// ==================== 配置 ====================

export const TOWER_CONFIG: TowerConfig = {
  totalFloors: 1000,
  baseEnemyPower: 100,
  powerGrowthRate: 1.05, // 每层 +5% 战力
  resetCost: 50, // 重置需要 50 钻石
  starRewards: {
    1: { gold: 100, exp: 50 },
    2: { gold: 200, exp: 100 },
    3: { gold: 300, exp: 150, diamond: 1 },
  },
};

// ==================== 工具函数 ====================

/**
 * 生成关卡数据
 */
export function generateTowerFloor(floor: number): TowerFloor {
  const enemyPower = Math.floor(
    TOWER_CONFIG.baseEnemyPower * Math.pow(TOWER_CONFIG.powerGrowthRate, floor - 1)
  );

  // 根据层数生成敌人名字
  const enemyNames = [
    '小怪', '精英', '守护者', '领主', '魔王', '天神'
  ];
  const tierIndex = Math.min(Math.floor((floor - 1) / 100), enemyNames.length - 1);
  const enemyName = `${['一', '二', '三', '四', '五', '六'][tierIndex]}阶${enemyNames[tierIndex]}`;

  // 星级要求
  const stars2Rounds = Math.max(3, 10 - Math.floor(floor / 100)); // 随层数降低要求
  const stars3Rounds = Math.max(2, stars2Rounds - 2);

  // 奖励
  const baseGold = 50 * floor;
  const baseExp = 25 * floor;
  const diamondReward = floor % 10 === 0 ? Math.floor(floor / 10) : undefined;

  return {
    floor,
    enemyPower,
    enemyName,
    starRequirements: {
      stars1: 1, // 通关即可
      stars2: stars2Rounds,
      stars3: stars3Rounds,
    },
    rewards: {
      gold: baseGold,
      exp: baseExp,
      diamond: diamondReward,
    },
  };
}

/**
 * 创建爬塔进度
 */
export function createTowerProgress(): TowerProgress {
  return {
    maxFloor: 1,
    currentFloor: 1,
    floorStars: {},
    firstClearRewards: [],
    lastResetTime: Date.now(),
    totalChallenges: 0,
    totalWins: 0,
  };
}

/**
 * 开始挑战
 */
export function startTowerChallenge(progress: TowerProgress, floor?: number): TowerProgress {
  const targetFloor = floor || progress.maxFloor;
  
  if (targetFloor > TOWER_CONFIG.totalFloors) {
    throw new Error('已达到最高层数');
  }

  return {
    ...progress,
    currentFloor: targetFloor,
    totalChallenges: progress.totalChallenges + 1,
  };
}

/**
 * 计算挑战结果
 */
export function calculateTowerChallenge(
  playerPower: number,
  floor: number,
  rounds: number,
  remainingHP: number,
  maxHP: number
): TowerChallenge {
  const floorData = generateTowerFloor(floor);
  const isVictory = playerPower >= floorData.enemyPower * 0.8; // 80% 战力可过（考虑操作）
  
  // 计算星级
  let stars = 0;
  if (isVictory) {
    stars = 1;
    if (rounds <= floorData.starRequirements.stars2) {
      stars = 2;
    }
    if (rounds <= floorData.starRequirements.stars3 && remainingHP >= maxHP * 0.9) {
      stars = 3;
    }
  }

  return {
    floor,
    playerPower,
    enemyPower: floorData.enemyPower,
    rounds,
    playerHP: remainingHP,
    maxHP,
    isVictory,
    stars,
  };
}

/**
 * 完成挑战
 */
export function completeTowerChallenge(
  progress: TowerProgress,
  challenge: TowerChallenge
): { progress: TowerProgress; rewards: any } {
  const newProgress = { ...progress };
  const rewards: any = {};

  if (challenge.isVictory) {
    newProgress.totalWins = progress.totalWins + 1;

    // 更新最高层数
    if (challenge.floor >= progress.maxFloor) {
      newProgress.maxFloor = Math.min(challenge.floor + 1, TOWER_CONFIG.totalFloors);
      newProgress.currentFloor = newProgress.maxFloor;
    }

    // 更新星级
    const currentStars = progress.floorStars[challenge.floor] || 0;
    if (challenge.stars > currentStars) {
      newProgress.floorStars = {
        ...progress.floorStars,
        [challenge.floor]: challenge.stars,
      };

      // 星级奖励
      rewards.stars = TOWER_CONFIG.starRewards[challenge.stars];
    }

    // 首通奖励
    if (!progress.firstClearRewards.includes(challenge.floor)) {
      newProgress.firstClearRewards = [...progress.firstClearRewards, challenge.floor];
      const floorData = generateTowerFloor(challenge.floor);
      rewards.firstClear = floorData.rewards;
    }

    // 基础奖励
    const floorData = generateTowerFloor(challenge.floor);
    rewards.base = floorData.rewards;
  }

  return { progress: newProgress, rewards };
}

/**
 * 重置爬塔
 */
export function resetTower(progress: TowerProgress, hasDiamond: boolean): { 
  progress: TowerProgress; 
  success: boolean; 
  error?: string 
} {
  if (!hasDiamond) {
    return { progress, success: false, error: '钻石不足' };
  }

  return {
    progress: {
      ...progress,
      maxFloor: 1,
      currentFloor: 1,
      floorStars: {},
      firstClearRewards: [],
      lastResetTime: Date.now(),
    },
    success: true,
  };
}

/**
 * 检查首通奖励是否可领取
 */
export function canClaimFirstClear(progress: TowerProgress, floor: number): boolean {
  return (
    floor <= progress.maxFloor &&
    !progress.firstClearRewards.includes(floor)
  );
}

/**
 * 检查星级奖励是否可领取
 */
export function canClaimStarReward(progress: TowerProgress, floor: number, stars: number): boolean {
  const currentStars = progress.floorStars[floor] || 0;
  return currentStars >= stars;
}

/**
 * 获取玩家爬塔统计
 */
export function getTowerStats(progress: TowerProgress): {
  totalFloors: number;
  totalStars: number;
  threeStarFloors: number;
  winRate: number;
  averageRounds: number;
} {
  const floorStars = Object.values(progress.floorStars);
  const totalStars = floorStars.reduce((sum, stars) => sum + stars, 0);
  const threeStarFloors = floorStars.filter((stars) => stars === 3).length;
  const winRate = progress.totalChallenges > 0 
    ? (progress.totalWins / progress.totalChallenges) * 100 
    : 0;

  return {
    totalFloors: progress.maxFloor - 1,
    totalStars,
    threeStarFloors,
    winRate: Math.floor(winRate * 100) / 100,
    averageRounds: 0, // 需要额外数据
  };
}

/**
 * 获取推荐挑战层数
 */
export function getRecommendedFloor(playerPower: number): number {
  // 找到玩家战力能通关的最高层
  for (let floor = 1; floor <= TOWER_CONFIG.totalFloors; floor++) {
    const floorData = generateTowerFloor(floor);
    if (floorData.enemyPower > playerPower * 1.2) {
      return Math.max(1, floor - 1);
    }
  }
  return TOWER_CONFIG.totalFloors;
}

/**
 * 计算爬塔总奖励
 */
export function calculateTotalRewards(progress: TowerProgress): {
  totalGold: number;
  totalExp: number;
  totalDiamond: number;
} {
  let totalGold = 0;
  let totalExp = 0;
  let totalDiamond = 0;

  // 首通奖励
  for (const floor of progress.firstClearRewards) {
    const floorData = generateTowerFloor(floor);
    totalGold += floorData.rewards.gold;
    totalExp += floorData.rewards.exp;
    if (floorData.rewards.diamond) {
      totalDiamond += floorData.rewards.diamond;
    }
  }

  // 星级奖励
  for (const [floorStr, stars] of Object.entries(progress.floorStars)) {
    const floor = parseInt(floorStr);
    const reward = TOWER_CONFIG.starRewards[stars];
    if (reward) {
      totalGold += reward.gold;
      totalExp += reward.exp;
      if (reward.diamond) {
        totalDiamond += reward.diamond;
      }
    }
  }

  return { totalGold, totalExp, totalDiamond };
}

/**
 * 获取层数难度等级
 */
export function getFloorDifficulty(floor: number): 'easy' | 'normal' | 'hard' | 'expert' | 'master' | 'legend' {
  if (floor <= 50) return 'easy';
  if (floor <= 100) return 'normal';
  if (floor <= 200) return 'hard';
  if (floor <= 400) return 'expert';
  if (floor <= 700) return 'master';
  return 'legend';
}

/**
 * 批量跳过已通关层数
 */
export function skipClearedFloors(progress: TowerProgress, playerPower: number): number {
  let skipCount = 0;
  
  for (let floor = progress.currentFloor; floor < progress.maxFloor; floor++) {
    const floorData = generateTowerFloor(floor);
    if (playerPower >= floorData.enemyPower * 3) {
      // 战力碾压，可以跳过
      skipCount++;
    } else {
      break;
    }
  }

  return Math.min(skipCount, 10); // 最多跳过 10 层
}


