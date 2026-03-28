/**
 * v0.90 结婚系统测试
 */

import {
  createProposal,
  acceptProposal,
  rejectProposal,
  createMarriage,
  increaseIntimacy,
  calculateIntimacyLevel,
  unlockMarriageSkill,
  upgradeMarriageSkill,
  getMarriageSkillBonuses,
  createMarriageTask,
  completeMarriageTask,
  claimMarriageTaskReward,
  getMarriageStats,
  getIntimacyLevelName,
  applyIntimacyDecay,
  MARRIAGE_CONFIG,
  Marriage,
} from './marriageSystem';

describe('v0.90 结婚系统', () => {
  describe('求婚系统', () => {
    it('应该创建求婚', () => {
      const proposal = createProposal('user_1', '张三', 'user_2', '李四', 'ring_1', '钻石戒指');
      
      expect(proposal.id).toBeDefined();
      expect(proposal.proposerId).toBe('user_1');
      expect(proposal.targetId).toBe('user_2');
      expect(proposal.status).toBe('pending');
    });

    it('应该接受求婚', () => {
      const proposal = createProposal('user_1', '张三', 'user_2', '李四', 'ring_1', '钻石戒指');
      
      const result = acceptProposal(proposal);
      
      expect(result.success).toBe(true);
      expect(proposal.status).toBe('accepted');
    });

    it('应该拒绝求婚', () => {
      const proposal = createProposal('user_1', '张三', 'user_2', '李四', 'ring_1', '钻石戒指');
      
      const result = rejectProposal(proposal);
      
      expect(result.success).toBe(true);
      expect(proposal.status).toBe('rejected');
    });

    it('应该拒绝已处理的求婚', () => {
      const proposal = createProposal('user_1', '张三', 'user_2', '李四', 'ring_1', '钻石戒指');
      acceptProposal(proposal);
      
      const result = acceptProposal(proposal);
      
      expect(result.success).toBe(false);
    });
  });

  describe('婚姻创建', () => {
    it('应该创建婚姻', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      
      expect(marriage.id).toBeDefined();
      expect(marriage.player1Id).toBe('user_1');
      expect(marriage.player2Id).toBe('user_2');
      expect(marriage.intimacy).toBe(1000);
      expect(marriage.intimacyLevel).toBe(1);
    });

    it('应该初始化夫妻技能', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      
      expect(marriage.skills.length).toBeGreaterThan(0);
      marriage.skills.forEach(skill => {
        expect(skill.unlocked).toBe(false);
        expect(skill.level).toBe(0);
      });
    });
  });

  describe('亲密度系统', () => {
    it('应该增加亲密度', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      const initialIntimacy = marriage.intimacy;
      
      const result = increaseIntimacy(marriage, 100);
      
      expect(result.success).toBe(true);
      expect(marriage.intimacy).toBe(initialIntimacy + 100);
    });

    it('应该提升亲密度等级', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      
      increaseIntimacy(marriage, 500);
      
      expect(marriage.intimacyLevel).toBeGreaterThan(1);
    });

    it('应该计算正确的亲密度等级', () => {
      expect(calculateIntimacyLevel(0)).toBe(0);
      expect(calculateIntimacyLevel(1000)).toBe(1);
      expect(calculateIntimacyLevel(1500)).toBe(3);
      expect(calculateIntimacyLevel(5000)).toBe(6);
      expect(calculateIntimacyLevel(20000)).toBe(10);
    });

    it('应该返回正确的等级名称', () => {
      expect(getIntimacyLevelName(0)).toBe('陌路');
      expect(getIntimacyLevelName(1)).toBe('相识');
      expect(getIntimacyLevelName(5)).toBe('相守');
      expect(getIntimacyLevelName(10)).toBe('永恒');
    });

    it('应该每日衰减亲密度', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      const initialIntimacy = marriage.intimacy;
      
      const result = applyIntimacyDecay(marriage);
      
      expect(result.success).toBe(true);
      expect(marriage.intimacy).toBe(initialIntimacy - MARRIAGE_CONFIG.intimacyDecayPerDay);
    });
  });

  describe('夫妻技能', () => {
    it('应该解锁夫妻技能', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      marriage.intimacy = 2000;
      
      const result = unlockMarriageSkill(marriage, 'ms_2');
      
      expect(result.success).toBe(true);
      expect(marriage.skills[1].unlocked).toBe(true);
    });

    it('应该拒绝亲密度不足', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      
      const result = unlockMarriageSkill(marriage, 'ms_2');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('亲密度不足');
    });

    it('应该升级夫妻技能', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      marriage.intimacy = 10000; // 升级需要更多亲密度
      unlockMarriageSkill(marriage, 'ms_4');
      
      const result = upgradeMarriageSkill(marriage, 'ms_4');
      
      expect(result.success).toBe(true);
      expect(marriage.skills[3].level).toBe(2);
    });

    it('应该拒绝未解锁技能升级', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      
      const result = upgradeMarriageSkill(marriage, 'ms_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未解锁');
    });

    it('应该获取技能总加成', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      marriage.intimacy = 2000;
      unlockMarriageSkill(marriage, 'ms_1');
      upgradeMarriageSkill(marriage, 'ms_1');
      
      const bonus = getMarriageSkillBonuses(marriage);
      
      expect(bonus.attack).toBeGreaterThan(0);
    });
  });

  describe('夫妻任务', () => {
    it('应该创建夫妻任务', () => {
      const task = createMarriageTask('gift');
      
      expect(task.id).toBeDefined();
      expect(task.type).toBe('gift');
      expect(task.status).toBe('pending');
      expect(task.reward.intimacy).toBeGreaterThan(0);
    });

    it('应该完成夫妻任务', () => {
      const task = createMarriageTask('gift');
      
      const result = completeMarriageTask(task, task.target);
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(true);
      expect(task.status).toBe('completed');
    });

    it('应该部分完成任务', () => {
      const task = createMarriageTask('copy');
      
      const result = completeMarriageTask(task, 1);
      
      expect(result.success).toBe(true);
      expect(task.progress).toBe(1);
      expect(task.status).toBe('in_progress');
    });

    it('应该领取任务奖励', () => {
      const task = createMarriageTask('gift');
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      const initialIntimacy = marriage.intimacy;
      
      completeMarriageTask(task, task.target);
      const result = claimMarriageTaskReward(task, marriage);
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(marriage.intimacy).toBeGreaterThan(initialIntimacy);
      expect(task.status).toBe('claimed');
    });

    it('应该拒绝未完成任务领取', () => {
      const task = createMarriageTask('gift');
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      
      const result = claimMarriageTaskReward(task, marriage);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未完成');
    });
  });

  describe('婚姻统计', () => {
    it('应该获取婚姻统计', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      
      const stats = getMarriageStats(marriage);
      
      expect(stats.intimacy).toBe(1000);
      expect(stats.intimacyLevel).toBe(1);
      expect(stats.intimacyLevelName).toBe('相识');
      expect(stats.marriedDays).toBeGreaterThanOrEqual(0);
      expect(stats.skillCount).toBe(0);
    });

    it('应该计算技能加成', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      marriage.intimacy = 2000;
      unlockMarriageSkill(marriage, 'ms_1');
      
      const stats = getMarriageStats(marriage);
      
      expect(stats.skillCount).toBe(1);
      expect(stats.totalBonus.attack).toBeGreaterThan(0);
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的求婚最低亲密度', () => {
      expect(MARRIAGE_CONFIG.minIntimacyForProposal).toBe(1000);
    });

    it('应该配置正确的结婚最低等级', () => {
      expect(MARRIAGE_CONFIG.minLevelForMarriage).toBe(30);
    });

    it('应该配置正确的婚礼消耗', () => {
      expect(MARRIAGE_CONFIG.weddingCost).toBe(9999);
    });

    it('应该配置正确的每日任务上限', () => {
      expect(MARRIAGE_CONFIG.dailyTaskLimit).toBe(5);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的结婚流程', () => {
      // 1. 求婚
      const proposal = createProposal('user_1', '张三', 'user_2', '李四', 'ring_1', '钻石戒指');
      expect(acceptProposal(proposal).success).toBe(true);
      
      // 2. 创建婚姻
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      expect(marriage.intimacy).toBe(1000);
      
      // 3. 增加亲密度
      increaseIntimacy(marriage, 1000);
      expect(marriage.intimacy).toBe(2000);
      
      // 4. 解锁技能
      expect(unlockMarriageSkill(marriage, 'ms_2').success).toBe(true);
      
      // 5. 升级技能（需要更多亲密度）
      marriage.intimacy = 5000;
      expect(upgradeMarriageSkill(marriage, 'ms_2').success).toBe(true);
      
      // 6. 创建并完成任务
      const task = createMarriageTask('date');
      completeMarriageTask(task, task.target);
      claimMarriageTaskReward(task, marriage);
      expect(task.status).toBe('claimed');
      
      // 7. 获取统计
      const stats = getMarriageStats(marriage);
      expect(stats.intimacyLevel).toBeGreaterThan(1);
      expect(stats.skillCount).toBe(1);
    });

    it('应该处理亲密度衰减', () => {
      const marriage = createMarriage('user_1', '张三', 'user_2', '李四');
      marriage.intimacy = 5000;
      
      // 连续衰减多天
      for (let i = 0; i < 10; i++) {
        applyIntimacyDecay(marriage);
      }
      
      expect(marriage.intimacy).toBeLessThan(5000);
      expect(marriage.intimacyLevel).toBeLessThan(6);
    });
  });
});
