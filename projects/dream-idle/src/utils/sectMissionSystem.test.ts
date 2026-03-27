/**
 * v0.84 师门任务系统测试
 */

import {
  createSectMission,
  generateDailyMissions,
  acceptMission,
  updateMissionProgress,
  claimMissionReward,
  checkMissionExpired,
  getMissionRemainingTime,
  getMissionStats,
  getClaimableMissions,
  getActiveMissions,
  getValidMissions,
  claimAllRewards,
  getDifficultyColor,
  getDifficultyName,
  getMissionTypeName,
  getRandomDifficulty,
  generateMissionDescription,
  calculateMissionReward,
  SECT_MISSION_CONFIG,
  SectMission,
} from './sectMissionSystem';

describe('v0.84 师门任务系统', () => {
  describe('任务创建', () => {
    it('应该创建新任务', () => {
      const mission = createSectMission();
      
      expect(mission.id).toBeDefined();
      expect(mission.type).toBeDefined();
      expect(mission.difficulty).toBeDefined();
      expect(mission.description).toBeDefined();
      expect(mission.target).toBeGreaterThan(0);
      expect(mission.progress).toBe(0);
      expect(mission.status).toBe('pending');
      expect(mission.isDaily).toBe(true);
    });

    it('应该生成合理的过期时间', () => {
      const mission = createSectMission();
      const now = Date.now();
      
      expect(mission.expireTime).toBeGreaterThan(now);
      expect(mission.expireTime).toBeLessThanOrEqual(now + (24 * 60 * 60 * 1000));
    });

    it('应该包含奖励信息', () => {
      const mission = createSectMission();
      
      expect(mission.reward.exp).toBeGreaterThan(0);
      expect(mission.reward.gold).toBeGreaterThan(0);
      expect(mission.reward.sectContribution).toBeGreaterThan(0);
    });

    it('每日任务应该有额外奖励', () => {
      // 创建多个任务对比，确保统计上每日任务奖励更高
      let dailyTotal = 0;
      let nonDailyTotal = 0;
      
      for (let i = 0; i < 20; i++) {
        dailyTotal += createSectMission(true).reward.exp;
        nonDailyTotal += createSectMission(false).reward.exp;
      }
      
      expect(dailyTotal).toBeGreaterThan(nonDailyTotal);
    });
  });

  describe('难度系统', () => {
    it('应该随机生成难度', () => {
      const difficulties = new Set();
      
      for (let i = 0; i < 100; i++) {
        difficulties.add(getRandomDifficulty());
      }
      
      expect(difficulties.has('easy')).toBe(true);
      expect(difficulties.has('medium')).toBe(true);
    });

    it('应该按概率分布生成难度', () => {
      const counts: Record<string, number> = { easy: 0, medium: 0, hard: 0, expert: 0 };
      
      for (let i = 0; i < 1000; i++) {
        const diff = getRandomDifficulty();
        counts[diff]++;
      }
      
      // 验证简单任务最多
      expect(counts.easy).toBeGreaterThan(counts.medium);
      expect(counts.medium).toBeGreaterThan(counts.hard);
      expect(counts.hard).toBeGreaterThan(counts.expert);
    });

    it('应该返回正确的难度颜色', () => {
      expect(getDifficultyColor('easy')).toBe('#4CAF50');
      expect(getDifficultyColor('medium')).toBe('#2196F3');
      expect(getDifficultyColor('hard')).toBe('#FF9800');
      expect(getDifficultyColor('expert')).toBe('#F44336');
    });

    it('应该返回正确的难度名称', () => {
      expect(getDifficultyName('easy')).toBe('简单');
      expect(getDifficultyName('medium')).toBe('普通');
      expect(getDifficultyName('hard')).toBe('困难');
      expect(getDifficultyName('expert')).toBe('专家');
    });
  });

  describe('任务描述生成', () => {
    it('应该生成讨伐任务描述', () => {
      const { description, target } = generateMissionDescription('hunt', 'easy');
      
      const hasKeyword = description.includes('讨伐') || description.includes('消灭') || description.includes('清除');
      expect(hasKeyword).toBe(true);
      expect(target).toBeGreaterThan(0);
    });

    it('应该生成收集任务描述', () => {
      const { description, target } = generateMissionDescription('gather', 'medium');
      
      const hasKeyword = description.includes('收集') || description.includes('采集') || description.includes('寻找');
      expect(hasKeyword).toBe(true);
      expect(target).toBeGreaterThan(0);
    });

    it('应该生成护送任务描述', () => {
      const { description, target } = generateMissionDescription('escort', 'hard');
      
      const hasKeyword = description.includes('护送') || description.includes('保护') || description.includes('协助');
      expect(hasKeyword).toBe(true);
      expect(target).toBe(1);
    });

    it('难度应该影响目标数量', () => {
      const easy = generateMissionDescription('hunt', 'easy');
      const expert = generateMissionDescription('hunt', 'expert');
      
      expect(expert.target).toBeGreaterThanOrEqual(easy.target);
    });
  });

  describe('奖励计算', () => {
    it('应该根据难度计算奖励', () => {
      const easyReward = calculateMissionReward('easy', false);
      const expertReward = calculateMissionReward('expert', false);
      
      expect(expertReward.exp).toBeGreaterThan(easyReward.exp);
      expect(expertReward.gold).toBeGreaterThan(easyReward.gold);
      expect(expertReward.sectContribution).toBeGreaterThan(easyReward.sectContribution);
    });

    it('每日任务应该有额外奖励', () => {
      const normalReward = calculateMissionReward('medium', false);
      const dailyReward = calculateMissionReward('medium', true);
      
      expect(dailyReward.exp).toBeGreaterThan(normalReward.exp);
      expect(dailyReward.gold).toBeGreaterThan(normalReward.gold);
    });

    it('应该符合配置的基础奖励', () => {
      const easyReward = calculateMissionReward('easy', false);
      const config = SECT_MISSION_CONFIG.baseRewards.easy;
      
      expect(easyReward.exp).toBe(config.exp);
      expect(easyReward.gold).toBe(config.gold);
      expect(easyReward.sectContribution).toBe(config.sectContribution);
    });
  });

  describe('任务接受', () => {
    it('应该接受待命任务', () => {
      const mission = createSectMission();
      
      const result = acceptMission(mission);
      
      expect(result.success).toBe(true);
      expect(mission.status).toBe('in_progress');
    });

    it('应该拒绝已进行中的任务', () => {
      const mission = createSectMission();
      mission.status = 'in_progress';
      
      const result = acceptMission(mission);
      
      expect(result.success).toBe(false);
    });

    it('应该拒绝已完成的任务', () => {
      const mission = createSectMission();
      mission.status = 'completed';
      
      const result = acceptMission(mission);
      
      expect(result.success).toBe(false);
    });
  });

  describe('进度更新', () => {
    it('应该更新任务进度', () => {
      const mission = createSectMission();
      mission.target = 10;
      acceptMission(mission);
      
      const result = updateMissionProgress(mission, 3);
      
      expect(result.success).toBe(true);
      expect(mission.progress).toBe(3);
    });

    it('应该标记任务完成', () => {
      const mission = createSectMission();
      mission.target = 5;
      acceptMission(mission);
      
      const result = updateMissionProgress(mission, 5);
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(true);
      expect(mission.status).toBe('completed');
      expect(mission.progress).toBe(5);
    });

    it('应该拒绝未接受的任务', () => {
      const mission = createSectMission();
      
      const result = updateMissionProgress(mission, 1);
      
      expect(result.success).toBe(false);
    });

    it('应该限制进度不超过目标', () => {
      const mission = createSectMission();
      mission.target = 5;
      acceptMission(mission);
      
      updateMissionProgress(mission, 10);
      
      expect(mission.progress).toBe(5);
    });
  });

  describe('奖励领取', () => {
    it('应该领取完成任务的奖励', () => {
      const mission = createSectMission();
      mission.target = 5;
      acceptMission(mission);
      updateMissionProgress(mission, 5);
      
      const result = claimMissionReward(mission);
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(mission.status).toBe('claimed');
    });

    it('应该拒绝未完成的任务', () => {
      const mission = createSectMission();
      acceptMission(mission);
      
      const result = claimMissionReward(mission);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未完成');
    });

    it('应该拒绝已领取的任务', () => {
      const mission = createSectMission();
      mission.target = 5;
      acceptMission(mission);
      updateMissionProgress(mission, 5);
      claimMissionReward(mission);
      
      const result = claimMissionReward(mission);
      
      expect(result.success).toBe(false);
    });
  });

  describe('任务过期', () => {
    it('应该检测到过期任务', () => {
      const mission = createSectMission();
      mission.expireTime = Date.now() - 1000; // 1 秒前过期
      
      const expired = checkMissionExpired(mission);
      
      expect(expired).toBe(true);
      expect(mission.status).toBe('expired');
    });

    it('应该检测到有效任务', () => {
      const mission = createSectMission();
      
      const expired = checkMissionExpired(mission);
      
      expect(expired).toBe(false);
    });

    it('应该忽略已领取的任务', () => {
      const mission = createSectMission();
      mission.status = 'claimed';
      
      const expired = checkMissionExpired(mission);
      
      expect(expired).toBe(true);
    });

    it('应该计算剩余时间', () => {
      const mission = createSectMission();
      mission.expireTime = Date.now() + (60 * 1000); // 1 分钟后
      
      const remaining = getMissionRemainingTime(mission);
      
      expect(remaining).toBeGreaterThanOrEqual(59);
      expect(remaining).toBeLessThanOrEqual(60);
    });

    it('应该返回 0 当任务过期', () => {
      const mission = createSectMission();
      mission.expireTime = Date.now() - 1000;
      
      const remaining = getMissionRemainingTime(mission);
      
      expect(remaining).toBe(0);
    });
  });

  describe('任务统计', () => {
    it('应该统计各状态任务数量', () => {
      const missions: SectMission[] = [
        { ...createSectMission(), status: 'pending' },
        { ...createSectMission(), status: 'pending' },
        { ...createSectMission(), status: 'in_progress' },
        { ...createSectMission(), status: 'completed' },
        { ...createSectMission(), status: 'claimed' },
        { ...createSectMission(), status: 'expired' },
      ];
      
      const stats = getMissionStats(missions);
      
      expect(stats.total).toBe(6);
      expect(stats.pending).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.claimed).toBe(1);
      expect(stats.expired).toBe(1);
    });

    it('应该计算完成率', () => {
      const missions: SectMission[] = [
        { ...createSectMission(), status: 'claimed' },
        { ...createSectMission(), status: 'claimed' },
        { ...createSectMission(), status: 'claimed' },
        { ...createSectMission(), status: 'expired' },
        { ...createSectMission(), status: 'in_progress' },
      ];
      
      const stats = getMissionStats(missions);
      
      expect(stats.completionRate).toBe(60); // 3/5 = 60%
    });
  });

  describe('任务筛选', () => {
    it('应该获取可领取的任务', () => {
      const missions: SectMission[] = [
        { ...createSectMission(), status: 'completed' },
        { ...createSectMission(), status: 'completed' },
        { ...createSectMission(), status: 'in_progress' },
        { ...createSectMission(), status: 'claimed' },
      ];
      
      const claimable = getClaimableMissions(missions);
      
      expect(claimable.length).toBe(2);
      expect(claimable.every(m => m.status === 'completed')).toBe(true);
    });

    it('应该获取进行中的任务', () => {
      const missions: SectMission[] = [
        { ...createSectMission(), status: 'in_progress' },
        { ...createSectMission(), status: 'in_progress' },
        { ...createSectMission(), status: 'pending' },
        { ...createSectMission(), status: 'completed' },
      ];
      
      const active = getActiveMissions(missions);
      
      expect(active.length).toBe(2);
      expect(active.every(m => m.status === 'in_progress')).toBe(true);
    });

    it('应该获取有效任务', () => {
      const now = Date.now();
      const missions: SectMission[] = [
        { ...createSectMission(), status: 'in_progress', expireTime: now + 100000 },
        { ...createSectMission(), status: 'pending', expireTime: now + 100000 },
        { ...createSectMission(), status: 'expired', expireTime: now - 1000 },
        { ...createSectMission(), status: 'claimed', expireTime: now + 100000 },
      ];
      
      const valid = getValidMissions(missions);
      
      expect(valid.length).toBe(2);
    });
  });

  describe('批量领取', () => {
    it('应该批量领取所有奖励', () => {
      const missions: SectMission[] = [
        { ...createSectMission(), status: 'completed', reward: { exp: 1000, gold: 500, sectContribution: 1 } },
        { ...createSectMission(), status: 'completed', reward: { exp: 2000, gold: 1000, sectContribution: 2 } },
        { ...createSectMission(), status: 'in_progress' },
      ];
      
      const result = claimAllRewards(missions);
      
      expect(result.success).toBe(true);
      expect(result.claimedCount).toBe(2);
      expect(result.totalReward.exp).toBe(3000);
      expect(result.totalReward.gold).toBe(1500);
      expect(result.totalReward.sectContribution).toBe(3);
    });

    it('应该处理没有可领取的情况', () => {
      const missions: SectMission[] = [
        { ...createSectMission(), status: 'in_progress' },
        { ...createSectMission(), status: 'pending' },
      ];
      
      const result = claimAllRewards(missions);
      
      expect(result.success).toBe(false);
      expect(result.claimedCount).toBe(0);
    });
  });

  describe('每日任务生成', () => {
    it('应该生成每日任务列表', () => {
      const missions = generateDailyMissions();
      
      expect(missions.length).toBe(SECT_MISSION_CONFIG.dailyMissionCount);
      expect(missions.every(m => m.isDaily)).toBe(true);
    });

    it('应该生成不同难度的任务', () => {
      const missions = generateDailyMissions();
      const difficulties = new Set(missions.map(m => m.difficulty));
      
      expect(difficulties.size).toBeGreaterThan(1);
    });

    it('应该生成不同类型的任务', () => {
      const missions = generateDailyMissions();
      const types = new Set(missions.map(m => m.type));
      
      expect(types.size).toBeGreaterThan(1);
    });
  });

  describe('任务类型名称', () => {
    it('应该返回正确的类型名称', () => {
      expect(getMissionTypeName('hunt')).toBe('讨伐');
      expect(getMissionTypeName('gather')).toBe('收集');
      expect(getMissionTypeName('escort')).toBe('护送');
      expect(getMissionTypeName('challenge')).toBe('挑战');
      expect(getMissionTypeName('explore')).toBe('探索');
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的任务流程', () => {
      const mission = createSectMission();
      
      // 1. 接受任务
      expect(acceptMission(mission).success).toBe(true);
      expect(mission.status).toBe('in_progress');
      
      // 2. 更新进度
      mission.target = 10;
      const progressResult = updateMissionProgress(mission, 10);
      expect(progressResult.success).toBe(true);
      expect(progressResult.completed).toBe(true);
      expect(mission.status).toBe('completed');
      
      // 3. 领取奖励
      const claimResult = claimMissionReward(mission);
      expect(claimResult.success).toBe(true);
      expect(claimResult.reward).toBeDefined();
      expect(mission.status).toBe('claimed');
      
      // 4. 验证奖励
      expect(claimResult.reward!.exp).toBeGreaterThan(0);
      expect(claimResult.reward!.gold).toBeGreaterThan(0);
      expect(claimResult.reward!.sectContribution).toBeGreaterThan(0);
    });

    it('应该处理多个任务', () => {
      const missions = generateDailyMissions();
      
      // 接受 3 个任务
      for (let i = 0; i < 3; i++) {
        acceptMission(missions[i]);
      }
      
      const active = getActiveMissions(missions);
      expect(active.length).toBe(3);
      
      // 完成所有接受的任务
      active.forEach(mission => {
        mission.target = 5;
        updateMissionProgress(mission, 5);
      });
      
      // 批量领取
      const result = claimAllRewards(missions);
      expect(result.success).toBe(true);
      expect(result.claimedCount).toBe(3);
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的每日任务数量', () => {
      expect(SECT_MISSION_CONFIG.dailyMissionCount).toBe(20);
    });

    it('应该配置正确的最大并发任务数', () => {
      expect(SECT_MISSION_CONFIG.maxConcurrentMissions).toBe(3);
    });

    it('应该配置正确的难度概率', () => {
      const rates = SECT_MISSION_CONFIG.difficultyRates;
      const total = Object.values(rates).reduce((sum, rate) => sum + rate, 0);
      
      expect(total).toBe(1);
    });
  });
});
