// 每日谜题系统测试 - v0.65

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  QUESTION_POOL,
  DIFFICULTY_SCORES,
  STREAK_BONUS,
  SCORE_REWARDS,
  DAILY_QUESTION_COUNT,
  SPEED_BONUS_THRESHOLD_MS,
  CATEGORY_NAMES,
  createPuzzleState,
  selectDailyQuestions,
  getQuestion,
  needsDailyReset,
  resetDaily,
  getCurrentQuestion,
  getRemainingCount,
  submitAnswer,
  getClaimableRewards,
  claimScoreReward,
  getPuzzleStats,
  getCategoryName,
  exportPuzzleData,
  importPuzzleData,
  type PuzzleState,
} from './dailyPuzzle';

describe('每日谜题系统 v0.65', () => {
  let state: PuzzleState;

  beforeEach(() => {
    state = createPuzzleState('player_001');
  });

  // ==================== 题库测试 ====================
  describe('题库配置', () => {
    it('题库应包含足够的题目', () => {
      expect(QUESTION_POOL.length).toBeGreaterThanOrEqual(DAILY_QUESTION_COUNT);
    });

    it('每个题目应包含必要字段', () => {
      QUESTION_POOL.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('category');
        expect(q).toHaveProperty('difficulty');
        expect(q).toHaveProperty('type');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('answer');
        expect(q).toHaveProperty('explanation');
      });
    });

    it('选择题应包含选项', () => {
      QUESTION_POOL.filter(q => q.type === 'choice').forEach(q => {
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('题目ID应唯一', () => {
      const ids = QUESTION_POOL.map(q => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('题库应覆盖多个分类', () => {
      const categories = new Set(QUESTION_POOL.map(q => q.category));
      expect(categories.size).toBeGreaterThanOrEqual(3);
    });

    it('题库应覆盖多个难度', () => {
      const difficulties = new Set(QUESTION_POOL.map(q => q.difficulty));
      expect(difficulties.size).toBe(3);
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.todayScore).toBe(0);
      expect(state.totalScore).toBe(0);
      expect(state.todayAnswers).toHaveLength(0);
      expect(state.currentStreak).toBe(0);
    });

    it('应选择每日题目', () => {
      expect(state.todayQuestions.length).toBe(Math.min(DAILY_QUESTION_COUNT, QUESTION_POOL.length));
    });

    it('每日题目应都是有效ID', () => {
      state.todayQuestions.forEach(id => {
        expect(getQuestion(id)).toBeDefined();
      });
    });
  });

  // ==================== 每日选题测试 ====================
  describe('每日选题', () => {
    it('同一天应选出相同题目', () => {
      const now = new Date('2026-03-25T10:00:00+08:00').getTime();
      const q1 = selectDailyQuestions(10, now);
      const q2 = selectDailyQuestions(10, now);
      expect(q1).toEqual(q2);
    });

    it('不同天应选出不同题目（大概率）', () => {
      const day1 = new Date('2026-03-25T10:00:00+08:00').getTime();
      const day2 = new Date('2026-03-26T10:00:00+08:00').getTime();
      const q1 = selectDailyQuestions(10, day1);
      const q2 = selectDailyQuestions(10, day2);
      // 至少有一题不同
      expect(q1.join(',')).not.toBe(q2.join(','));
    });

    it('选题数不应超过题库大小', () => {
      const q = selectDailyQuestions(999);
      expect(q.length).toBeLessThanOrEqual(QUESTION_POOL.length);
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('同一天不需要重置', () => {
      expect(needsDailyReset(state)).toBe(false);
    });

    it('跨天应需要重置', () => {
      state.lastResetDate = '2020-01-01';
      expect(needsDailyReset(state)).toBe(true);
    });

    it('重置应清空今日数据', () => {
      // 先答几题
      const q = getCurrentQuestion(state)!;
      const { state: s1 } = submitAnswer(state, q.answer, 5000);
      const reset = resetDaily(s1);
      expect(reset.todayAnswers).toHaveLength(0);
      expect(reset.todayScore).toBe(0);
      expect(reset.currentStreak).toBe(0);
    });

    it('重置不应清空累计数据', () => {
      const q = getCurrentQuestion(state)!;
      const { state: s1 } = submitAnswer(state, q.answer, 5000);
      const reset = resetDaily(s1);
      expect(reset.totalScore).toBe(s1.totalScore);
      expect(reset.totalAnswered).toBe(s1.totalAnswered);
      expect(reset.bestStreak).toBe(s1.bestStreak);
    });
  });

  // ==================== 答题测试 ====================
  describe('答题', () => {
    it('正确答案应得分', () => {
      const q = getCurrentQuestion(state)!;
      const result = submitAnswer(state, q.answer, 15000);
      expect(result.correct).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.state.todayScore).toBeGreaterThan(0);
    });

    it('错误答案应不得分', () => {
      const q = getCurrentQuestion(state)!;
      const wrongAnswer = q.answer === '0' ? '1' : '0';
      const result = submitAnswer(state, wrongAnswer, 15000);
      expect(result.correct).toBe(false);
      expect(result.score).toBe(0);
    });

    it('答题应返回解释', () => {
      const q = getCurrentQuestion(state)!;
      const result = submitAnswer(state, q.answer, 15000);
      expect(result.explanation).toBeTruthy();
    });

    it('答对应增加连续正确', () => {
      const q = getCurrentQuestion(state)!;
      const result = submitAnswer(state, q.answer, 15000);
      expect(result.state.currentStreak).toBe(1);
    });

    it('答错应重置连续正确', () => {
      // 先答对一题
      const q1 = getCurrentQuestion(state)!;
      const { state: s1 } = submitAnswer(state, q1.answer, 15000);
      expect(s1.currentStreak).toBe(1);

      // 再答错
      const q2 = getCurrentQuestion(s1)!;
      const wrongAnswer = q2.answer === '0' ? '1' : '0';
      const { state: s2 } = submitAnswer(s1, wrongAnswer, 15000);
      expect(s2.currentStreak).toBe(0);
    });

    it('快速答对应获得速度奖励', () => {
      const q = getCurrentQuestion(state)!;
      const result = submitAnswer(state, q.answer, 5000); // 5秒
      expect(result.speedBonus).toBeGreaterThan(0);
    });

    it('慢速答对不应获得速度奖励', () => {
      const q = getCurrentQuestion(state)!;
      const result = submitAnswer(state, q.answer, 20000); // 20秒
      expect(result.speedBonus).toBe(0);
    });

    it('答完所有题后应无法继续', () => {
      let s = state;
      for (let i = 0; i < state.todayQuestions.length; i++) {
        const q = getCurrentQuestion(s);
        if (!q) break;
        const { state: newState } = submitAnswer(s, q.answer, 10000);
        s = newState;
      }
      expect(getCurrentQuestion(s)).toBeNull();
      expect(getRemainingCount(s)).toBe(0);
    });

    it('累计数据应正确更新', () => {
      const q = getCurrentQuestion(state)!;
      const { state: s1 } = submitAnswer(state, q.answer, 15000);
      expect(s1.totalAnswered).toBe(1);
      expect(s1.totalCorrect).toBe(1);
    });
  });

  // ==================== 分数奖励测试 ====================
  describe('分数奖励', () => {
    it('初始无可领取奖励', () => {
      const rewards = getClaimableRewards(state);
      expect(rewards).toHaveLength(0);
    });

    it('达到分数阈值应可领取', () => {
      // 直接设置分数
      const s = { ...state, todayScore: 100 };
      const rewards = getClaimableRewards(s);
      expect(rewards.length).toBeGreaterThan(0);
    });

    it('领取奖励应成功', () => {
      const s = { ...state, todayScore: 100 };
      const result = claimScoreReward(s, 30);
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
    });

    it('重复领取应失败', () => {
      const s = { ...state, todayScore: 100 };
      const { state: s1 } = claimScoreReward(s, 30);
      const result = claimScoreReward(s1, 30);
      expect(result.success).toBe(false);
      expect(result.error).toContain('已领取');
    });

    it('分数不足应无法领取', () => {
      const result = claimScoreReward(state, 200);
      expect(result.success).toBe(false);
      expect(result.error).toContain('分数不足');
    });

    it('无效阈值应失败', () => {
      const result = claimScoreReward(state, 999);
      expect(result.success).toBe(false);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('初始统计应全为0', () => {
      const stats = getPuzzleStats(state);
      expect(stats.todayScore).toBe(0);
      expect(stats.todayCorrect).toBe(0);
      expect(stats.todayTotal).toBe(0);
      expect(stats.todayAccuracy).toBe(0);
      expect(stats.remaining).toBe(state.todayQuestions.length);
    });

    it('答题后统计应更新', () => {
      const q = getCurrentQuestion(state)!;
      const { state: s1 } = submitAnswer(state, q.answer, 15000);
      const stats = getPuzzleStats(s1);
      expect(stats.todayTotal).toBe(1);
      expect(stats.todayCorrect).toBe(1);
      expect(stats.todayAccuracy).toBe(100);
      expect(stats.remaining).toBe(state.todayQuestions.length - 1);
    });

    it('分类统计应正确', () => {
      const q = getCurrentQuestion(state)!;
      const { state: s1 } = submitAnswer(state, q.answer, 15000);
      const stats = getPuzzleStats(s1);
      const qConfig = getQuestion(q.id)!;
      expect(stats.categoryBreakdown[qConfig.category].total).toBe(1);
      expect(stats.categoryBreakdown[qConfig.category].correct).toBe(1);
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('获取题目应返回正确配置', () => {
      const q = getQuestion('lore_001');
      expect(q).toBeDefined();
      expect(q!.category).toBe('lore');
    });

    it('获取不存在的题目应返回undefined', () => {
      expect(getQuestion('nonexistent')).toBeUndefined();
    });

    it('分类名称应返回中文', () => {
      expect(getCategoryName('lore')).toBe('游戏知识');
      expect(getCategoryName('math')).toBe('数学计算');
    });

    it('剩余题数应正确', () => {
      expect(getRemainingCount(state)).toBe(state.todayQuestions.length);
    });
  });

  // ==================== 连续奖励测试 ====================
  describe('连续奖励', () => {
    it('3连对应获得额外奖励', () => {
      let s = state;
      let lastResult;
      for (let i = 0; i < 3; i++) {
        const q = getCurrentQuestion(s)!;
        lastResult = submitAnswer(s, q.answer, 15000);
        s = lastResult.state;
      }
      expect(lastResult!.streakBonus).toBe(STREAK_BONUS[3]);
    });

    it('最佳连续记录应更新', () => {
      let s = state;
      for (let i = 0; i < 5; i++) {
        const q = getCurrentQuestion(s);
        if (!q) break;
        const { state: newState } = submitAnswer(s, q.answer, 15000);
        s = newState;
      }
      expect(s.bestStreak).toBeGreaterThanOrEqual(5);
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportPuzzleData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      state.totalScore = 999;
      const json = exportPuzzleData(state);
      const imported = importPuzzleData(json);
      expect(imported).toBeDefined();
      expect(imported!.totalScore).toBe(999);
    });

    it('无效数据应返回null', () => {
      expect(importPuzzleData('not json')).toBeNull();
      expect(importPuzzleData('{}')).toBeNull();
    });
  });

  // ==================== 边界情况测试 ====================
  describe('边界情况', () => {
    it('没有题目时应返回null', () => {
      state.todayQuestions = [];
      expect(getCurrentQuestion(state)).toBeNull();
    });

    it('没有题目时答题应安全返回', () => {
      state.todayQuestions = [];
      const result = submitAnswer(state, '0', 5000);
      expect(result.correct).toBe(false);
      expect(result.score).toBe(0);
    });

    it('难度分数应正确', () => {
      expect(DIFFICULTY_SCORES['easy']).toBeLessThan(DIFFICULTY_SCORES['medium']);
      expect(DIFFICULTY_SCORES['medium']).toBeLessThan(DIFFICULTY_SCORES['hard']);
    });

    it('奖励阈值应递增', () => {
      for (let i = 1; i < SCORE_REWARDS.length; i++) {
        expect(SCORE_REWARDS[i].threshold).toBeGreaterThan(SCORE_REWARDS[i - 1].threshold);
      }
    });
  });
});
