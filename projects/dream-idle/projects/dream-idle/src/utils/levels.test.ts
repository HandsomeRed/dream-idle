import {
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
  LevelProgress,
  BattleResult,
} from './levels';

describe('推图系统 - 关卡生成', () => {
  test('生成 100 个关卡', () => {
    const levels = generateLevels();
    expect(levels.length).toBe(100);
  });

  test('第 1 关数据正确', () => {
    const level = getLevel(1);
    expect(level).toBeDefined();
    expect(level?.chapter).toBe(1);
    expect(level?.stage).toBe(1);
    expect(level?.enemyLevel).toBe(6);
  });

  test('第 5 关是 BOSS 关', () => {
    const level = getLevel(5);
    expect(level?.bossId).toBeDefined();
    expect(level?.enemyCount).toBe(1);
  });

  test('获取章节关卡', () => {
    const chapter1Levels = getChapterLevels(1);
    expect(chapter1Levels.length).toBe(10);
    expect(chapter1Levels[0].chapter).toBe(1);
    expect(chapter1Levels[9].stage).toBe(10);
  });
});

describe('推图系统 - 进度管理', () => {
  test('初始进度从第 1 关开始', () => {
    const progress: LevelProgress[] = [];
    const current = getCurrentLevel(progress);
    expect(current).toBe(1);
  });

  test('通关后进度 +1', () => {
    const progress: LevelProgress[] = [
      { levelId: 1, stars: 3, cleared: true, bestRound: 5, clearedAt: Date.now() },
    ];
    const current = getCurrentLevel(progress);
    expect(current).toBe(2);
  });

  test('更新进度 - 新关卡', () => {
    const progress: LevelProgress[] = [];
    const updated = updateProgress(progress, 1, 3, 8);
    expect(updated.length).toBe(1);
    expect(updated[0].levelId).toBe(1);
    expect(updated[0].stars).toBe(3);
    expect(updated[0].cleared).toBe(true);
  });

  test('更新进度 - 已通关关卡（更新星级）', () => {
    const progress: LevelProgress[] = [
      { levelId: 1, stars: 2, cleared: true, bestRound: 12, clearedAt: Date.now() - 10000 },
    ];
    const updated = updateProgress(progress, 1, 3, 8);
    expect(updated[0].stars).toBe(3);  // 星级取最高
    expect(updated[0].bestRound).toBe(8);  // 回合数取最少
  });

  test('检查是否已通关', () => {
    const progress: LevelProgress[] = [
      { levelId: 1, stars: 3, cleared: true, bestRound: 5, clearedAt: Date.now() },
    ];
    expect(isLevelCleared(progress, 1)).toBe(true);
    expect(isLevelCleared(progress, 2)).toBe(false);
  });

  test('计算总星级', () => {
    const progress: LevelProgress[] = [
      { levelId: 1, stars: 3, cleared: true, bestRound: 5, clearedAt: Date.now() },
      { levelId: 2, stars: 2, cleared: true, bestRound: 10, clearedAt: Date.now() },
      { levelId: 3, stars: 1, cleared: true, bestRound: 15, clearedAt: Date.now() },
    ];
    expect(getTotalStars(progress)).toBe(6);
  });

  test('计算完美通关数', () => {
    const progress: LevelProgress[] = [
      { levelId: 1, stars: 3, cleared: true, bestRound: 5, clearedAt: Date.now() },
      { levelId: 2, stars: 2, cleared: true, bestRound: 10, clearedAt: Date.now() },
      { levelId: 3, stars: 3, cleared: true, bestRound: 8, clearedAt: Date.now() },
    ];
    expect(getPerfectLevels(progress)).toBe(2);
  });
});

describe('推图系统 - 星级计算', () => {
  const mockLevel = {
    id: 1,
    chapter: 1,
    stage: 1,
    name: '长安城郊 - 第 1 关',
    enemyLevel: 6,
    enemyCount: 3,
    starRequirement: {
      oneStar: 1,
      twoStar: 0,
      threeStar: 12,
    },
    rewards: { gold: 100, exp: 50 },
    firstClearReward: { diamond: 10 },
  };

  test('失败 - 0 星', () => {
    const result: BattleResult = {
      victory: false,
      round: 15,
      playerAlive: false,
      casualtyCount: 3,
    };
    expect(calculateStars(result, mockLevel)).toBe(0);
  });

  test('通关 - 1 星', () => {
    const result: BattleResult = {
      victory: true,
      round: 15,
      playerAlive: true,
      casualtyCount: 2,
    };
    expect(calculateStars(result, mockLevel)).toBe(1);
  });

  test('无伤亡 - 2 星', () => {
    const result: BattleResult = {
      victory: true,
      round: 15,
      playerAlive: true,
      casualtyCount: 0,
    };
    expect(calculateStars(result, mockLevel)).toBe(2);
  });

  test('3 星通关', () => {
    const result: BattleResult = {
      victory: true,
      round: 10,
      playerAlive: true,
      casualtyCount: 0,
    };
    expect(calculateStars(result, mockLevel)).toBe(3);
  });
});

describe('推图系统 - 战力计算', () => {
  test('初始战力为 1', () => {
    const progress: LevelProgress[] = [];
    expect(calculateProgressPower(progress)).toBe(1);
  });

  test('每关增加 10% 收益', () => {
    const progress: LevelProgress[] = [
      { levelId: 1, stars: 3, cleared: true, bestRound: 5, clearedAt: Date.now() },
      { levelId: 2, stars: 3, cleared: true, bestRound: 5, clearedAt: Date.now() },
      { levelId: 3, stars: 3, cleared: true, bestRound: 5, clearedAt: Date.now() },
    ];
    expect(calculateProgressPower(progress)).toBe(1.3);  // 1 + 3 * 0.1
  });

  test('100 关满进度战力', () => {
    const progress: LevelProgress[] = Array.from({ length: 100 }, (_, i) => ({
      levelId: i + 1,
      stars: 3,
      cleared: true,
      bestRound: 5,
      clearedAt: Date.now(),
    }));
    expect(calculateProgressPower(progress)).toBe(11);  // 1 + 100 * 0.1
  });
});
