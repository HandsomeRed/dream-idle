// 好感度系统测试 - v0.71

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  AFFINITY_LEVELS,
  GIFTS,
  EVENT_POINTS,
  DAILY_LIMITS,
  getAffinityLevelConfig,
  getAffinityLevel,
  getAffinityLevelName,
  getPointsToNextLevel,
  getLevelProgress,
  createAffinityState,
  checkDailyReset,
  addAffinity,
  giveGift,
  triggerEvent,
  getAffinityBonus,
  getAffinityRanking,
  getTargetsByLevel,
  getAffinityStats,
  exportAffinityData,
  importAffinityData,
  type AffinityState,
} from './affinity';

describe('好感度系统 v0.71', () => {
  let state: AffinityState;

  beforeEach(() => {
    state = createAffinityState('player_001');
  });

  // ==================== 配置测试 ====================
  describe('配置', () => {
    it('应有6个好感度等级', () => {
      expect(AFFINITY_LEVELS).toHaveLength(6);
    });

    it('等级应按点数递增', () => {
      for (let i = 1; i < AFFINITY_LEVELS.length; i++) {
        expect(AFFINITY_LEVELS[i].minPoints).toBeGreaterThan(AFFINITY_LEVELS[i - 1].minPoints);
      }
    });

    it('加成应随等级递增', () => {
      for (let i = 1; i < AFFINITY_LEVELS.length; i++) {
        expect(AFFINITY_LEVELS[i].bonusAtk).toBeGreaterThanOrEqual(AFFINITY_LEVELS[i - 1].bonusAtk);
      }
    });

    it('应有5种礼物', () => {
      expect(GIFTS).toHaveLength(5);
    });

    it('礼物点数应为正数', () => {
      GIFTS.forEach(g => expect(g.basePoints).toBeGreaterThan(0));
    });
  });

  // ==================== 等级判定测试 ====================
  describe('等级判定', () => {
    it('0点应为陌生人', () => {
      expect(getAffinityLevel(0)).toBe('stranger');
    });

    it('100点应为认识', () => {
      expect(getAffinityLevel(100)).toBe('acquaintance');
    });

    it('300点应为朋友', () => {
      expect(getAffinityLevel(300)).toBe('friend');
    });

    it('1500点应为灵魂伴侣', () => {
      expect(getAffinityLevel(1500)).toBe('soulmate');
    });

    it('等级名称应正确', () => {
      expect(getAffinityLevelName('stranger')).toBe('陌生人');
      expect(getAffinityLevelName('soulmate')).toBe('灵魂伴侣');
    });

    it('到下一级的点数应正确', () => {
      expect(getPointsToNextLevel(0)).toBe(100);
      expect(getPointsToNextLevel(50)).toBe(50);
    });

    it('最高级应返回null', () => {
      expect(getPointsToNextLevel(1500)).toBeNull();
    });

    it('进度百分比应正确', () => {
      expect(getLevelProgress(0)).toBe(0);
      expect(getLevelProgress(50)).toBe(50);
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建空状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(Object.keys(state.records)).toHaveLength(0);
      expect(state.dailyGiftsGiven).toBe(0);
      expect(state.totalGiftsGiven).toBe(0);
    });
  });

  // ==================== 好感度增加测试 ====================
  describe('好感度增加', () => {
    it('应增加好感度', () => {
      const result = addAffinity(state, 'hero_001', 'hero', '悟空', 50);
      expect(result.state.records['hero_001'].points).toBe(50);
      expect(result.levelUp).toBe(false);
    });

    it('好感度足够应升级', () => {
      const result = addAffinity(state, 'hero_001', 'hero', '悟空', 100);
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe('acquaintance');
      expect(result.prevLevel).toBe('stranger');
    });

    it('累加好感度', () => {
      const { state: s1 } = addAffinity(state, 'hero_001', 'hero', '悟空', 50);
      const { state: s2 } = addAffinity(s1, 'hero_001', 'hero', '悟空', 60);
      expect(s2.records['hero_001'].points).toBe(110);
    });

    it('不同目标应独立计算', () => {
      const { state: s1 } = addAffinity(state, 'hero_001', 'hero', '悟空', 50);
      const { state: s2 } = addAffinity(s1, 'pet_001', 'pet', '小白', 30);
      expect(s2.records['hero_001'].points).toBe(50);
      expect(s2.records['pet_001'].points).toBe(30);
    });
  });

  // ==================== 赠礼测试 ====================
  describe('赠礼', () => {
    it('赠送鲜花应增加10点', () => {
      const result = giveGift(state, 'hero_001', 'hero', '悟空', 'gift_flower');
      expect(result.success).toBe(true);
      expect(result.pointsGained).toBe(10);
    });

    it('赠送王冠应增加100点', () => {
      const result = giveGift(state, 'hero_001', 'hero', '悟空', 'gift_crown');
      expect(result.success).toBe(true);
      expect(result.pointsGained).toBe(100);
      expect(result.levelUp).toBe(true);
    });

    it('每日赠礼次数应有限制', () => {
      let s = state;
      for (let i = 0; i < DAILY_LIMITS.gifts; i++) {
        const { state: ns } = giveGift(s, `hero_${i}`, 'hero', `H${i}`, 'gift_flower');
        s = ns;
      }
      const result = giveGift(s, 'hero_extra', 'hero', 'Extra', 'gift_flower');
      expect(result.success).toBe(false);
      expect(result.error).toContain('用完');
    });

    it('不存在的礼物应失败', () => {
      const result = giveGift(state, 'hero_001', 'hero', '悟空', 'gift_fake');
      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });

    it('赠礼应更新统计', () => {
      const { state: s1 } = giveGift(state, 'hero_001', 'hero', '悟空', 'gift_flower');
      expect(s1.dailyGiftsGiven).toBe(1);
      expect(s1.totalGiftsGiven).toBe(1);
      expect(s1.records['hero_001'].giftCount).toBe(1);
    });
  });

  // ==================== 事件触发测试 ====================
  describe('事件触发', () => {
    it('战斗应增加好感度', () => {
      const result = triggerEvent(state, 'hero_001', 'hero', '悟空', 'battle_together');
      expect(result.pointsGained).toBe(EVENT_POINTS.battle_together);
      expect(result.state.records['hero_001'].battleCount).toBe(1);
    });

    it('对话应增加好感度', () => {
      const result = triggerEvent(state, 'hero_001', 'hero', '悟空', 'dialogue');
      expect(result.pointsGained).toBe(EVENT_POINTS.dialogue);
      expect(result.state.records['hero_001'].dialogueCount).toBe(1);
    });

    it('对话每日有限制', () => {
      let s = state;
      for (let i = 0; i < DAILY_LIMITS.dialogues; i++) {
        const { state: ns } = triggerEvent(s, 'hero_001', 'hero', '悟空', 'dialogue');
        s = ns;
      }
      const result = triggerEvent(s, 'hero_001', 'hero', '悟空', 'dialogue');
      expect(result.error).toContain('用完');
    });

    it('生日事件应给大量好感度', () => {
      const result = triggerEvent(state, 'hero_001', 'hero', '悟空', 'birthday');
      expect(result.pointsGained).toBe(50);
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('同一天不应重置', () => {
      const s = { ...state, dailyGiftsGiven: 5 };
      const reset = checkDailyReset(s);
      expect(reset.dailyGiftsGiven).toBe(5);
    });

    it('跨天应重置', () => {
      const s = { ...state, dailyGiftsGiven: 5, lastDailyReset: '2020-01-01' };
      const reset = checkDailyReset(s);
      expect(reset.dailyGiftsGiven).toBe(0);
      expect(reset.dailyDialogues).toBe(0);
    });
  });

  // ==================== 加成测试 ====================
  describe('好感度加成', () => {
    it('陌生人无加成', () => {
      const bonus = getAffinityBonus(state, 'hero_001');
      expect(bonus.atkBonus).toBe(0);
    });

    it('认识等级有加成', () => {
      const { state: s1 } = addAffinity(state, 'hero_001', 'hero', '悟空', 150);
      const bonus = getAffinityBonus(s1, 'hero_001');
      expect(bonus.atkBonus).toBe(2);
      expect(bonus.defBonus).toBe(1);
    });

    it('灵魂伴侣有最高加成', () => {
      const { state: s1 } = addAffinity(state, 'hero_001', 'hero', '悟空', 1500);
      const bonus = getAffinityBonus(s1, 'hero_001');
      expect(bonus.atkBonus).toBe(18);
    });
  });

  // ==================== 查询测试 ====================
  describe('查询', () => {
    it('排行应按好感度排序', () => {
      let s = state;
      ({ state: s } = addAffinity(s, 'h1', 'hero', 'A', 100));
      ({ state: s } = addAffinity(s, 'h2', 'hero', 'B', 500));
      ({ state: s } = addAffinity(s, 'h3', 'hero', 'C', 200));
      const ranking = getAffinityRanking(s);
      expect(ranking[0].targetId).toBe('h2');
      expect(ranking[1].targetId).toBe('h3');
    });

    it('按等级筛选', () => {
      let s = state;
      ({ state: s } = addAffinity(s, 'h1', 'hero', 'A', 50));
      ({ state: s } = addAffinity(s, 'h2', 'hero', 'B', 150));
      const strangers = getTargetsByLevel(s, 'stranger');
      expect(strangers).toHaveLength(1);
      expect(strangers[0].targetId).toBe('h1');
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('初始统计', () => {
      const stats = getAffinityStats(state);
      expect(stats.totalTargets).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.highestAffinity).toBeNull();
    });

    it('有记录后统计应正确', () => {
      let s = state;
      ({ state: s } = addAffinity(s, 'h1', 'hero', 'A', 500));
      ({ state: s } = addAffinity(s, 'h2', 'hero', 'B', 100));
      const stats = getAffinityStats(s);
      expect(stats.totalTargets).toBe(2);
      expect(stats.totalPoints).toBe(600);
      expect(stats.avgPoints).toBe(300);
      expect(stats.highestAffinity!.targetId).toBe('h1');
    });

    it('每日剩余次数应正确', () => {
      const { state: s1 } = giveGift(state, 'h1', 'hero', 'A', 'gift_flower');
      const stats = getAffinityStats(s1);
      expect(stats.dailyGiftsLeft).toBe(DAILY_LIMITS.gifts - 1);
    });
  });

  // ==================== 数据导出导入 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportAffinityData(state);
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      const { state: s1 } = addAffinity(state, 'h1', 'hero', 'A', 500);
      const json = exportAffinityData(s1);
      const imported = importAffinityData(json);
      expect(imported!.records['h1'].points).toBe(500);
    });

    it('无效数据应返回null', () => {
      expect(importAffinityData('bad')).toBeNull();
      expect(importAffinityData('{}')).toBeNull();
    });
  });
});
