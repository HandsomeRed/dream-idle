/**
 * v0.89 帮派系统测试
 */

import {
  createGang,
  joinGang,
  leaveGang,
  upgradeGang,
  donateToGang,
  upgradeGangSkill,
  getGangSkillBonuses,
  createGangTask,
  completeGangTask,
  claimTaskReward,
  getGangStats,
  getPositionPermissions,
  getGangLevelName,
  GANG_CONFIG,
  Gang,
} from './gangSystem';

describe('v0.89 帮派系统', () => {
  describe('帮派创建', () => {
    it('应该创建帮派', () => {
      const result = createGang('天龙帮', 'user_1', '张三', 10000);
      
      expect(result.success).toBe(true);
      expect(result.gang).toBeDefined();
      expect(result.gang!.name).toBe('天龙帮');
      expect(result.gang!.leaderId).toBe('user_1');
      expect(result.gang!.level).toBe(1);
      expect(result.gang!.memberCount).toBe(1);
    });

    it('应该拒绝资金不足', () => {
      const result = createGang('天龙帮', 'user_1', '张三', 5000);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('需要');
    });

    it('应该初始化帮派技能', () => {
      const result = createGang('天龙帮', 'user_1', '张三', 10000);
      
      expect(result.gang!.skills.length).toBeGreaterThan(0);
      result.gang!.skills.forEach(skill => {
        expect(skill.level).toBe(0);
        expect(skill.maxLevel).toBe(10);
      });
    });
  });

  describe('加入帮派', () => {
    it('应该加入帮派', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      const initialCount = gang.memberCount;
      
      const result = joinGang(gang, 'user_2', '李四');
      
      expect(result.success).toBe(true);
      expect(gang.memberCount).toBe(initialCount + 1);
    });

    it('应该拒绝已满的帮派', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      gang.memberCount = gang.maxMembers;
      
      const result = joinGang(gang, 'user_2', '李四');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已满');
    });
  });

  describe('退出帮派', () => {
    it('应该退出帮派', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      joinGang(gang, 'user_2', '李四');
      
      const result = leaveGang(gang);
      
      expect(result.success).toBe(true);
      expect(gang.memberCount).toBe(1);
    });

    it('应该拒绝只剩帮主', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      
      const result = leaveGang(gang);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('只剩帮主');
    });
  });

  describe('帮派升级', () => {
    it('应该升级帮派', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      gang.exp = gang.maxExp;
      
      const result = upgradeGang(gang);
      
      expect(result.success).toBe(true);
      expect(gang.level).toBe(2);
      expect(gang.maxMembers).toBe(20);
    });

    it('应该拒绝经验不足', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      
      const result = upgradeGang(gang);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('经验不足');
    });
  });

  describe('帮派捐献', () => {
    it('应该捐献帮派', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      
      const result = donateToGang(gang, 1000);
      
      expect(result.success).toBe(true);
      expect(gang.funds).toBe(1000);
      expect(result.expGain).toBe(100);
    });

    it('应该拒绝零捐献', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      
      const result = donateToGang(gang, 0);
      
      expect(result.success).toBe(false);
    });
  });

  describe('帮派技能', () => {
    it('应该升级帮派技能', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      gang.funds = 2000;
      
      const result = upgradeGangSkill(gang, 'gs_1');
      
      expect(result.success).toBe(true);
      expect(gang.skills[0].level).toBe(1);
      expect(gang.funds).toBe(1000);
    });

    it('应该拒绝资金不足', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      gang.funds = 500;
      
      const result = upgradeGangSkill(gang, 'gs_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('资金不足');
    });

    it('应该拒绝满级技能', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      gang.funds = 10000;
      gang.skills[0].level = 10;
      
      const result = upgradeGangSkill(gang, 'gs_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('满级');
    });

    it('应该获取技能总加成', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      gang.funds = 10000;
      
      upgradeGangSkill(gang, 'gs_1');
      upgradeGangSkill(gang, 'gs_2');
      
      const bonus = getGangSkillBonuses(gang);
      
      expect(bonus.attack).toBeGreaterThan(0);
      expect(bonus.defense).toBeGreaterThan(0);
    });
  });

  describe('帮派任务', () => {
    it('应该创建帮派任务', () => {
      const task = createGangTask('donate');
      
      expect(task.id).toBeDefined();
      expect(task.type).toBe('donate');
      expect(task.status).toBe('pending');
      expect(task.reward.exp).toBeGreaterThan(0);
    });

    it('应该完成帮派任务', () => {
      const task = createGangTask('donate');
      
      const result = completeGangTask(task, task.target);
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(true);
      expect(task.status).toBe('completed');
    });

    it('应该部分完成任务', () => {
      const task = createGangTask('donate');
      
      const result = completeGangTask(task, 500);
      
      expect(result.success).toBe(true);
      expect(task.progress).toBe(500);
      expect(task.status).toBe('in_progress');
    });

    it('应该领取任务奖励', () => {
      const task = createGangTask('donate');
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      
      completeGangTask(task, task.target);
      const initialFunds = gang.funds;
      
      const result = claimTaskReward(task, gang);
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(gang.funds).toBeGreaterThan(initialFunds);
      expect(task.status).toBe('claimed');
    });

    it('应该拒绝未完成任务领取', () => {
      const task = createGangTask('donate');
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      
      const result = claimTaskReward(task, gang);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未完成');
    });
  });

  describe('帮派统计', () => {
    it('应该获取帮派统计', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      
      const stats = getGangStats(gang);
      
      expect(stats.level).toBe(1);
      expect(stats.memberCount).toBe('1/10');
      expect(stats.funds).toBe(0);
      expect(stats.prestige).toBe(0);
    });

    it('应该计算技能加成', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      gang.funds = 10000;
      
      upgradeGangSkill(gang, 'gs_1');
      
      const stats = getGangStats(gang);
      
      expect(stats.skillCount).toBe(1);
      expect(stats.totalBonus.attack).toBeGreaterThan(0);
    });
  });

  describe('职位权限', () => {
    it('应该获取帮主权限', () => {
      const perms = getPositionPermissions('leader');
      
      expect(perms.canInvite).toBe(true);
      expect(perms.canKick).toBe(true);
      expect(perms.canUpgradeSkill).toBe(true);
      expect(perms.canStartWar).toBe(true);
      expect(perms.canEditAnnouncement).toBe(true);
    });

    it('应该获取长老权限', () => {
      const perms = getPositionPermissions('elder');
      
      expect(perms.canInvite).toBe(true);
      expect(perms.canKick).toBe(false);
      expect(perms.canUpgradeSkill).toBe(false);
    });

    it('应该获取成员权限', () => {
      const perms = getPositionPermissions('member');
      
      expect(perms.canInvite).toBe(false);
      expect(perms.canKick).toBe(false);
      expect(perms.canUpgradeSkill).toBe(false);
    });
  });

  describe('帮派等级名称', () => {
    it('应该返回正确的等级名称', () => {
      expect(getGangLevelName(1)).toBe('初出茅庐');
      expect(getGangLevelName(3)).toBe('江湖小派');
      expect(getGangLevelName(5)).toBe('武林门派');
      expect(getGangLevelName(7)).toBe('江湖大派');
      expect(getGangLevelName(9)).toBe('名门正派');
      expect(getGangLevelName(10)).toBe('天下第一帮');
      expect(getGangLevelName(15)).toBe('天下第一帮');
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的创建消耗', () => {
      expect(GANG_CONFIG.createCost).toBe(10000);
    });

    it('应该配置正确的每日任务上限', () => {
      expect(GANG_CONFIG.dailyTaskLimit).toBe(5);
    });

    it('应该配置正确的帮派战持续时间', () => {
      expect(GANG_CONFIG.warDuration).toBe(30);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的帮派流程', () => {
      // 1. 创建帮派
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      expect(gangResult.success).toBe(true);
      const gang = gangResult.gang!;
      
      // 2. 加入成员
      joinGang(gang, 'user_2', '李四');
      joinGang(gang, 'user_3', '王五');
      expect(gang.memberCount).toBe(3);
      
      // 3. 捐献
      donateToGang(gang, 5000);
      expect(gang.funds).toBe(5000);
      
      // 4. 升级技能
      upgradeGangSkill(gang, 'gs_1');
      expect(gang.skills[0].level).toBe(1);
      
      // 5. 创建并完成任务
      const task = createGangTask('donate');
      completeGangTask(task, task.target);
      claimTaskReward(task, gang);
      expect(task.status).toBe('claimed');
      
      // 6. 获取统计
      const stats = getGangStats(gang);
      expect(stats.level).toBe(1);
      expect(stats.memberCount).toBe('3/10');
      expect(stats.skillCount).toBe(1);
    });

    it('应该处理帮派升级', () => {
      const gangResult = createGang('天龙帮', 'user_1', '张三', 10000);
      const gang = gangResult.gang!;
      
      // 捐献获得经验
      donateToGang(gang, 10000);
      
      // 升级
      upgradeGang(gang);
      expect(gang.level).toBe(2);
      expect(gang.maxMembers).toBe(20);
      
      // 验证等级名称
      expect(getGangLevelName(2)).toBe('江湖小派');
    });
  });
});
