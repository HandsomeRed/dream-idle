/**
 * v0.85 押镖系统测试
 */

import {
  createEscortMission,
  getRandomEscortDifficulty,
  startEscort,
  updateEscortProgress,
  defeatAmbusher,
  claimEscortReward,
  checkEscortExpired,
  getEscortRemainingTime,
  getEscortEstimatedTime,
  getEscortStats,
  getClaimableEscports,
  getActiveEscorts,
  claimAllEscortRewards,
  getEscortDifficultyName,
  getEscortDifficultyColor,
  getEscortStatusName,
  calculateDailyBonus,
  ESCORT_CONFIG,
  ESCORT_ROUTES,
  EscortMission,
} from './escortMissionSystem';

describe('v0.85 押镖系统', () => {
  describe('押镖任务创建', () => {
    it('应该创建押镖任务', () => {
      const mission = createEscortMission();
      
      expect(mission.id).toBeDefined();
      expect(mission.difficulty).toBeDefined();
      expect(mission.route).toBeDefined();
      expect(mission.progress).toBe(0);
      expect(mission.status).toBe('preparing');
      expect(mission.isDaily).toBe(true);
    });

    it('应该生成合理的过期时间', () => {
      const mission = createEscortMission();
      const now = Date.now();
      
      expect(mission.expireTime).toBeGreaterThan(now);
      expect(mission.expireTime).toBeLessThanOrEqual(now + (24 * 60 * 60 * 1000));
    });

    it('应该包含奖励信息', () => {
      const mission = createEscortMission();
      
      expect(mission.reward.exp).toBeGreaterThan(0);
      expect(mission.reward.gold).toBeGreaterThan(0);
      expect(mission.reward.gangContribution).toBeGreaterThan(0);
    });

    it('应该根据难度计算奖励倍数', () => {
      const normalMission = createEscortMission('normal');
      const expertMission = createEscortMission('expert');
      
      expect(expertMission.reward.bonusMultiplier).toBeGreaterThan(normalMission.reward.bonusMultiplier);
    });
  });

  describe('押镖路线', () => {
    it('应该包含多条路线', () => {
      expect(ESCORT_ROUTES.length).toBeGreaterThan(0);
    });

    it('路线应该有正确的属性', () => {
      ESCORT_ROUTES.forEach(route => {
        expect(route.id).toBeDefined();
        expect(route.name).toBeDefined();
        expect(route.distance).toBeGreaterThan(0);
        expect(route.dangerLevel).toBeGreaterThanOrEqual(1);
        expect(route.dangerLevel).toBeLessThanOrEqual(10);
        expect(route.baseReward.exp).toBeGreaterThan(0);
        expect(route.baseReward.gold).toBeGreaterThan(0);
        expect(route.baseReward.gangContribution).toBeGreaterThan(0);
      });
    });

    it('危险等级应该与奖励正相关', () => {
      const sortedRoutes = [...ESCORT_ROUTES].sort((a, b) => a.dangerLevel - b.dangerLevel);
      
      for (let i = 1; i < sortedRoutes.length; i++) {
        expect(sortedRoutes[i].baseReward.exp).toBeGreaterThanOrEqual(sortedRoutes[i - 1].baseReward.exp);
      }
    });
  });

  describe('难度系统', () => {
    it('应该随机生成难度', () => {
      const difficulties = new Set();
      
      for (let i = 0; i < 100; i++) {
        difficulties.add(getRandomEscortDifficulty());
      }
      
      expect(difficulties.has('normal')).toBe(true);
    });

    it('应该按概率分布生成难度', () => {
      const counts: Record<string, number> = { normal: 0, hard: 0, expert: 0 };
      
      for (let i = 0; i < 1000; i++) {
        const diff = getRandomEscortDifficulty();
        counts[diff]++;
      }
      
      expect(counts.normal).toBeGreaterThan(counts.hard);
      expect(counts.hard).toBeGreaterThan(counts.expert);
    });

    it('应该返回正确的难度名称', () => {
      expect(getEscortDifficultyName('normal')).toBe('普通');
      expect(getEscortDifficultyName('hard')).toBe('困难');
      expect(getEscortDifficultyName('expert')).toBe('专家');
    });

    it('应该返回正确的难度颜色', () => {
      expect(getEscortDifficultyColor('normal')).toBe('#4CAF50');
      expect(getEscortDifficultyColor('hard')).toBe('#FF9800');
      expect(getEscortDifficultyColor('expert')).toBe('#F44336');
    });
  });

  describe('开始押镖', () => {
    it('应该开始押镖', () => {
      const mission = createEscortMission();
      
      const result = startEscort(mission);
      
      expect(result.success).toBe(true);
      expect(mission.status).toBe('escorting');
    });

    it('应该拒绝非准备状态的任务', () => {
      const mission = createEscortMission();
      mission.status = 'completed';
      
      const result = startEscort(mission);
      
      expect(result.success).toBe(false);
    });
  });

  describe('进度更新', () => {
    it('应该更新押镖进度', () => {
      const mission = createEscortMission();
      startEscort(mission);
      
      const result = updateEscortProgress(mission, 25);
      
      expect(result.success).toBe(true);
      expect(mission.progress).toBe(25);
    });

    it('应该标记任务完成', () => {
      const mission = createEscortMission();
      startEscort(mission);
      
      const result = updateEscortProgress(mission, 100);
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(true);
      expect(mission.status).toBe('completed');
      expect(mission.progress).toBe(100);
    });

    it('应该拒绝未开始的押镖', () => {
      const mission = createEscortMission();
      
      const result = updateEscortProgress(mission, 10);
      
      expect(result.success).toBe(false);
    });

    it('应该限制进度不超过 100', () => {
      const mission = createEscortMission();
      startEscort(mission);
      
      updateEscortProgress(mission, 150);
      
      expect(mission.progress).toBe(100);
    });
  });

  describe('劫镖系统', () => {
    it('应该可能遭遇劫镖', () => {
      const mission = createEscortMission('expert'); // 专家难度劫镖率高
      startEscort(mission);
      
      // 多次尝试以触发劫镖
      let ambushed = false;
      for (let i = 0; i < 20; i++) {
        const testMission = createEscortMission('expert');
        startEscort(testMission);
        const result = updateEscortProgress(testMission, 10);
        if (result.ambushed) {
          ambushed = true;
          break;
        }
      }
      
      // 专家难度 40% 劫镖率，20 次尝试应该至少触发一次
      expect(ambushed).toBe(true);
    });

    it('应该击败劫匪后继续押镖', () => {
      const mission = createEscortMission();
      startEscort(mission);
      mission.status = 'ambushed';
      
      const result = defeatAmbusher(mission);
      
      expect(result.success).toBe(true);
      expect(mission.status).toBe('escorting');
    });

    it('应该拒绝非劫镖状态', () => {
      const mission = createEscortMission();
      
      const result = defeatAmbusher(mission);
      
      expect(result.success).toBe(false);
    });
  });

  describe('奖励领取', () => {
    it('应该领取完成的押镖奖励', () => {
      const mission = createEscortMission();
      startEscort(mission);
      updateEscortProgress(mission, 100);
      
      const result = claimEscortReward(mission);
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(mission.status).toBe('claimed');
    });

    it('应该拒绝未完成的押镖', () => {
      const mission = createEscortMission();
      startEscort(mission);
      
      const result = claimEscortReward(mission);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未完成');
    });

    it('应该拒绝已领取的押镖', () => {
      const mission = createEscortMission();
      startEscort(mission);
      updateEscortProgress(mission, 100);
      claimEscortReward(mission);
      
      const result = claimEscortReward(mission);
      
      expect(result.success).toBe(false);
    });
  });

  describe('过期检查', () => {
    it('应该检测到过期押镖', () => {
      const mission = createEscortMission();
      mission.expireTime = Date.now() - 1000;
      
      const expired = checkEscortExpired(mission);
      
      expect(expired).toBe(true);
      expect(mission.status).toBe('expired');
    });

    it('应该检测到有效押镖', () => {
      const mission = createEscortMission();
      
      const expired = checkEscortExpired(mission);
      
      expect(expired).toBe(false);
    });

    it('应该计算剩余时间', () => {
      const mission = createEscortMission();
      mission.expireTime = Date.now() + (60 * 1000);
      
      const remaining = getEscortRemainingTime(mission);
      
      expect(remaining).toBeGreaterThanOrEqual(59);
      expect(remaining).toBeLessThanOrEqual(60);
    });

    it('应该返回 0 当押镖过期', () => {
      const mission = createEscortMission();
      mission.expireTime = Date.now() - 1000;
      
      const remaining = getEscortRemainingTime(mission);
      
      expect(remaining).toBe(0);
    });
  });

  describe('预计时间', () => {
    it('应该计算预计完成时间', () => {
      const mission = createEscortMission();
      mission.route = ESCORT_ROUTES[0]; // distance: 100
      startEscort(mission);
      mission.progress = 50;
      
      const estimated = getEscortEstimatedTime(mission);
      
      expect(estimated).toBeGreaterThan(0);
      expect(estimated).toBeLessThan(ESCORT_CONFIG.baseDuration);
    });

    it('应该返回 0 当未开始', () => {
      const mission = createEscortMission();
      
      const estimated = getEscortEstimatedTime(mission);
      
      expect(estimated).toBe(0);
    });
  });

  describe('押镖统计', () => {
    it('应该统计各状态押镖数量', () => {
      const missions: EscortMission[] = [
        { ...createEscortMission(), status: 'preparing' },
        { ...createEscortMission(), status: 'escorting' },
        { ...createEscortMission(), status: 'completed' },
        { ...createEscortMission(), status: 'claimed' },
        { ...createEscortMission(), status: 'failed' },
      ];
      
      const stats = getEscortStats(missions);
      
      expect(stats.total).toBe(5);
      expect(stats.preparing).toBe(1);
      expect(stats.escorting).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.claimed).toBe(1);
      expect(stats.failed).toBe(1);
    });

    it('应该计算总奖励', () => {
      const missions: EscortMission[] = [
        { ...createEscortMission(), status: 'claimed', reward: { exp: 5000, gold: 2000, gangContribution: 5, bonusMultiplier: 1 } },
        { ...createEscortMission(), status: 'claimed', reward: { exp: 8000, gold: 3500, gangContribution: 8, bonusMultiplier: 1 } },
      ];
      
      const stats = getEscortStats(missions);
      
      expect(stats.totalRewards.exp).toBe(13000);
      expect(stats.totalRewards.gold).toBe(5500);
      expect(stats.totalRewards.gangContribution).toBe(13);
    });
  });

  describe('任务筛选', () => {
    it('应该获取可领取的押镖', () => {
      const missions: EscortMission[] = [
        { ...createEscortMission(), status: 'completed' },
        { ...createEscortMission(), status: 'completed' },
        { ...createEscortMission(), status: 'escorting' },
      ];
      
      const claimable = getClaimableEscports(missions);
      
      expect(claimable.length).toBe(2);
      expect(claimable.every(m => m.status === 'completed')).toBe(true);
    });

    it('应该获取进行中的押镖', () => {
      const missions: EscortMission[] = [
        { ...createEscortMission(), status: 'escorting' },
        { ...createEscortMission(), status: 'ambushed' },
        { ...createEscortMission(), status: 'preparing' },
      ];
      
      const active = getActiveEscorts(missions);
      
      expect(active.length).toBe(2);
    });
  });

  describe('批量领取', () => {
    it('应该批量领取所有奖励', () => {
      const missions: EscortMission[] = [
        { ...createEscortMission(), status: 'completed', reward: { exp: 5000, gold: 2000, gangContribution: 5, bonusMultiplier: 1 } },
        { ...createEscortMission(), status: 'completed', reward: { exp: 8000, gold: 3500, gangContribution: 8, bonusMultiplier: 1 } },
      ];
      
      const result = claimAllEscortRewards(missions);
      
      expect(result.success).toBe(true);
      expect(result.claimedCount).toBe(2);
      expect(result.totalReward.exp).toBe(13000);
      expect(result.totalReward.gold).toBe(5500);
      expect(result.totalReward.gangContribution).toBe(13);
    });

    it('应该处理没有可领取的情况', () => {
      const missions: EscortMission[] = [
        { ...createEscortMission(), status: 'escorting' },
        { ...createEscortMission(), status: 'preparing' },
      ];
      
      const result = claimAllEscortRewards(missions);
      
      expect(result.success).toBe(false);
      expect(result.claimedCount).toBe(0);
    });
  });

  describe('每日奖励倍数', () => {
    it('应该计算连续押镖奖励', () => {
      expect(calculateDailyBonus(0)).toBe(1.0);
      expect(calculateDailyBonus(1)).toBe(1.2);
      expect(calculateDailyBonus(2)).toBe(1.5);
      expect(calculateDailyBonus(3)).toBe(2.0);
      expect(calculateDailyBonus(10)).toBe(2.0);
    });
  });

  describe('状态名称', () => {
    it('应该返回正确的状态名称', () => {
      expect(getEscortStatusName('preparing')).toBe('准备中');
      expect(getEscortStatusName('escorting')).toBe('押镖中');
      expect(getEscortStatusName('ambushed')).toBe('遭遇劫镖');
      expect(getEscortStatusName('completed')).toBe('已完成');
      expect(getEscortStatusName('failed')).toBe('已失败');
      expect(getEscortStatusName('claimed')).toBe('已领取');
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的每日最大次数', () => {
      expect(ESCORT_CONFIG.dailyMaxMissions).toBe(3);
    });

    it('应该配置正确的劫镖概率', () => {
      expect(ESCORT_CONFIG.ambushRate.normal).toBe(0.10);
      expect(ESCORT_CONFIG.ambushRate.hard).toBe(0.25);
      expect(ESCORT_CONFIG.ambushRate.expert).toBe(0.40);
    });

    it('应该配置正确的奖励倍数', () => {
      expect(ESCORT_CONFIG.difficultyRewards.normal).toBe(1.0);
      expect(ESCORT_CONFIG.difficultyRewards.hard).toBe(2.5);
      expect(ESCORT_CONFIG.difficultyRewards.expert).toBe(6.0);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的押镖流程', () => {
      const mission = createEscortMission('normal');
      
      // 1. 开始押镖
      expect(startEscort(mission).success).toBe(true);
      expect(mission.status).toBe('escorting');
      
      // 2. 更新进度到完成
      const progressResult = updateEscortProgress(mission, 100);
      expect(progressResult.success).toBe(true);
      expect(progressResult.completed).toBe(true);
      expect(mission.status).toBe('completed');
      
      // 3. 领取奖励
      const claimResult = claimEscortReward(mission);
      expect(claimResult.success).toBe(true);
      expect(claimResult.reward).toBeDefined();
      expect(mission.status).toBe('claimed');
      
      // 4. 验证奖励
      expect(claimResult.reward!.exp).toBeGreaterThan(0);
      expect(claimResult.reward!.gold).toBeGreaterThan(0);
      expect(claimResult.reward!.gangContribution).toBeGreaterThan(0);
    });

    it('应该处理劫镖流程', () => {
      let ambushed = false;
      let mission: EscortMission;
      
      // 多次尝试直到遭遇劫镖
      for (let i = 0; i < 50; i++) {
        mission = createEscortMission('expert');
        startEscort(mission);
        const result = updateEscortProgress(mission, 20);
        if (result.ambushed) {
          ambushed = true;
          break;
        }
      }
      
      expect(ambushed).toBe(true);
    });
  });
});
