/**
 * 梦幻放置 - 推图/关卡系统 v0.17
 * 
 * 核心功能：
 * - 主线关卡 1-100
 * - 每关 3 星评价（1 星通关、2 星无伤亡、3 星 10 回合内）
 * - 关卡难度递增
 * - 首通奖励
 */

// 关卡数据结构
export interface Level {
  id: number;           // 关卡 ID (e.g., 101 = 第 1 章第 1 关)
  chapter: number;      // 章节
  stage: number;        // 关卡序号
  name: string;         // 关卡名称
  enemyLevel: number;   // 敌人等级
  enemyCount: number;   // 敌人数量
  bossId?: string;      // BOSS ID（如果有）
  starRequirement: {
    oneStar: number;    // 1 星要求（通关）
    twoStar: number;    // 2 星要求（无伤亡）
    threeStar: number;  // 3 星要求（回合数）
  };
  rewards: {
    gold: number;       // 金币奖励
    exp: number;        // 经验奖励
    items?: string[];   // 道具奖励
  };
  firstClearReward: {
    diamond: number;    // 首通钻石
  };
}

// 关卡进度
export interface LevelProgress {
  levelId: number;
  stars: number;        // 当前星级 (0-3)
  cleared: boolean;     // 是否已通关
  bestRound: number;    // 最佳回合数
  clearedAt?: number;   // 通关时间戳
}

// 战斗结果
export interface BattleResult {
  victory: boolean;
  round: number;
  playerAlive: boolean;
  casualtyCount: number;
}

// 生成关卡数据
export function generateLevels(): Level[] {
  const levels: Level[] = [];
  const chapterCount = 10;  // 10 章
  const stagesPerChapter = 10;  // 每章 10 关

  const chapterNames = [
    '长安城郊', '大唐官府', '化生寺外', '方寸山前',
    '龙宫入口', '天宫南天门', '狮驼岭下', '魔王寨门',
    '地府外围', '雷音寺前'
  ];

  for (let chapter = 1; chapter <= chapterCount; chapter++) {
    for (let stage = 1; stage <= stagesPerChapter; stage++) {
      const levelId = (chapter - 1) * stagesPerChapter + stage;
      const isBoss = stage % 5 === 0;  // 每 5 关一个 BOSS
      const baseLevel = chapter * 5 + stage;

      levels.push({
        id: levelId,
        chapter,
        stage,
        name: isBoss 
          ? `${chapterNames[chapter - 1]} - BOSS`
          : `${chapterNames[chapter - 1]} - 第${stage}关`,
        enemyLevel: baseLevel,
        enemyCount: isBoss ? 1 : 3,
        bossId: isBoss ? `boss_chapter_${chapter}` : undefined,
        starRequirement: {
          oneStar: 1,
          twoStar: 0,  // 无伤亡
          threeStar: 10 + chapter * 2,  // 回合数要求随章节增加
        },
        rewards: {
          gold: 100 * chapter * stage,
          exp: 50 * chapter * stage,
          items: stage % 5 === 0 ? ['equipment_chest'] : [],
        },
        firstClearReward: {
          diamond: isBoss ? 50 : 10,
        },
      });
    }
  }

  return levels;
}

// 预生成所有关卡
const ALL_LEVELS = generateLevels();

// 获取关卡
export function getLevel(levelId: number): Level | undefined {
  return ALL_LEVELS.find(l => l.id === levelId);
}

// 获取章节所有关卡
export function getChapterLevels(chapter: number): Level[] {
  return ALL_LEVELS.filter(l => l.chapter === chapter);
}

// 获取玩家当前进度
export function getCurrentLevel(progress: LevelProgress[]): number {
  if (progress.length === 0) return 1;
  
  const maxCleared = progress
    .filter(p => p.cleared)
    .reduce((max, p) => Math.max(max, p.levelId), 0);
  
  return Math.min(maxCleared + 1, ALL_LEVELS.length);
}

// 计算关卡星级
export function calculateStars(result: BattleResult, level: Level): number {
  if (!result.victory) return 0;
  
  let stars = 1;  // 至少 1 星（通关）
  
  // 2 星：无伤亡
  if (result.casualtyCount === 0) {
    stars = 2;
  }
  
  // 3 星：回合数要求
  if (result.round <= level.starRequirement.threeStar) {
    stars = 3;
  }
  
  return stars;
}

// 更新进度
export function updateProgress(
  progress: LevelProgress[],
  levelId: number,
  stars: number,
  round: number
): LevelProgress[] {
  const existing = progress.find(p => p.levelId === levelId);
  
  if (existing) {
    // 更新已有进度
    existing.stars = Math.max(existing.stars, stars);
    existing.cleared = true;
    existing.bestRound = Math.min(existing.bestRound || round, round);
    existing.clearedAt = Date.now();
  } else {
    // 新进度
    progress.push({
      levelId,
      stars,
      cleared: true,
      bestRound: round,
      clearedAt: Date.now(),
    });
  }
  
  return progress;
}

// 检查是否已通关
export function isLevelCleared(progress: LevelProgress[], levelId: number): boolean {
  return progress.some(p => p.levelId === levelId && p.cleared);
}

// 获取总星级
export function getTotalStars(progress: LevelProgress[]): number {
  return progress.reduce((sum, p) => sum + p.stars, 0);
}

// 获取完美通关数（3 星）
export function getPerfectLevels(progress: LevelProgress[]): number {
  return progress.filter(p => p.stars >= 3).length;
}

// 计算推图战力（用于离线收益）
export function calculateProgressPower(progress: LevelProgress[]): number {
  const maxCleared = progress
    .filter(p => p.cleared)
    .reduce((max, p) => Math.max(max, p.levelId), 0);
  
  // 每关增加 10% 基础收益
  return 1 + maxCleared * 0.1;
}

export default {
  generateLevels,
  getLevel,
  getChapterLevels,
  getCurrentLevel,
  calculateStars,
  updateProgress,
  isLevelCleared,
  getTotalStars,
  getPerfectLevels,
  calculateProgressPower,
};
