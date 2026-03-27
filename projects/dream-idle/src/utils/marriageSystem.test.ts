/**
 * v0.79 - 姻缘系统测试
 */

import { MarriageSystem, MarriageProposal, MarriageRelationship } from './marriageSystem';

describe('MarriageSystem - v0.79 姻缘系统', () => {
  let system: MarriageSystem;

  beforeEach(() => {
    system = new MarriageSystem();
  });

  describe('求婚系统', () => {
    test('可以成功求婚', () => {
      const proposal = system.propose('player1', 'player2', 'rose');
      
      expect(proposal.proposerId).toBe('player1');
      expect(proposal.targetId).toBe('player2');
      expect(proposal.status).toBe('pending');
      expect(proposal.giftItem).toBe('rose');
      expect(proposal.id).toBeDefined();
      expect(proposal.timestamp).toBeDefined();
    });

    test('求婚可以不带礼物', () => {
      const proposal = system.propose('player1', 'player2');
      
      expect(proposal.giftItem).toBeUndefined();
      expect(proposal.status).toBe('pending');
    });

    test('已婚玩家不能求婚', () => {
      // 先结婚
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      // player1 尝试向 player3 求婚
      expect(() => system.propose('player1', 'player3')).toThrow('你已经结婚了');
    });

    test('不能向已婚玩家求婚', () => {
      // 先结婚
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      // player3 尝试向 player1 求婚
      expect(() => system.propose('player3', 'player1')).toThrow('对方已经结婚了');
    });

    test('已有待处理求婚时不能重复求婚', () => {
      system.propose('player1', 'player2');
      
      // 重复求婚
      expect(() => system.propose('player1', 'player2')).toThrow('已有待处理的求婚');
    });
  });

  describe('回应求婚', () => {
    test('接受求婚后创建婚姻关系', () => {
      const proposal = system.propose('player1', 'player2', 'diamond');
      const marriage = system.respondToProposal(proposal.id, true);

      expect(marriage).not.toBeNull();
      expect(marriage!.partnerA).toBe('player1');
      expect(marriage!.partnerB).toBe('player2');
      expect(marriage!.intimacy).toBe(5000);
      expect(marriage!.level).toBe(6); // 新婚等级
      expect(marriage!.marryDate).toBeDefined();
    });

    test('拒绝求婚后返回 null', () => {
      const proposal = system.propose('player1', 'player2');
      const result = system.respondToProposal(proposal.id, false);

      expect(result).toBeNull();
    });

    test('不存在的求婚返回错误', () => {
      expect(() => system.respondToProposal('invalid_id', true)).toThrow('求婚不存在');
    });

    test('已处理的求婚不能再次回应', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      expect(() => system.respondToProposal(proposal.id, true)).toThrow('求婚已过期或已处理');
    });
  });

  describe('婚姻关系查询', () => {
    test('可以获取玩家的婚姻关系', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      const marriage1 = system.getMarriage('player1');
      const marriage2 = system.getMarriage('player2');

      expect(marriage1).not.toBeNull();
      expect(marriage2).not.toBeNull();
      expect(marriage1!.id).toBe(marriage2!.id);
    });

    test('单身玩家返回 null', () => {
      const marriage = system.getMarriage('single_player');
      expect(marriage).toBeNull();
    });
  });

  describe('亲密度系统', () => {
    test('可以增加亲密度', () => {
      const proposal = system.propose('player1', 'player2');
      const marriage = system.respondToProposal(proposal.id, true);

      const updated = system.addIntimacy('player1', 1000);
      
      expect(updated!.intimacy).toBe(6000);
      expect(updated!.level).toBe(7); // 恩爱等级
    });

    test('亲密度上限为 10000', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      const updated = system.addIntimacy('player1', 10000);
      
      expect(updated!.intimacy).toBe(10000);
    });

    test('亲密度等级计算正确', () => {
      expect(system.getIntimacyLevel(0)).toBe(1); // 陌生
      expect(system.getIntimacyLevel(1000)).toBe(2); // 相识
      expect(system.getIntimacyLevel(2000)).toBe(3); // 友好
      expect(system.getIntimacyLevel(3000)).toBe(4); // 亲密
      expect(system.getIntimacyLevel(4000)).toBe(5); // 恋人
      expect(system.getIntimacyLevel(5000)).toBe(6); // 新婚
      expect(system.getIntimacyLevel(6000)).toBe(7); // 恩爱
      expect(system.getIntimacyLevel(7000)).toBe(8); // 伉俪
      expect(system.getIntimacyLevel(8000)).toBe(9); // 比翼
      expect(system.getIntimacyLevel(9000)).toBe(10); // 连理
    });

    test('获取亲密度等级名称', () => {
      expect(system.getIntimacyLevelName(1)).toBe('陌生');
      expect(system.getIntimacyLevelName(5)).toBe('恋人');
      expect(system.getIntimacyLevelName(10)).toBe('连理');
    });
  });

  describe('夫妻技能', () => {
    test('可以解锁夫妻技能', () => {
      const proposal = system.propose('player1', 'player2');
      const marriage = system.respondToProposal(proposal.id, true);
      
      // 初始亲密度 5000，可以解锁第一个技能
      const updated = system.unlockCoupleSkill('player1', 'couple_skill_1');
      
      expect(updated!.activeSkill).toBe('couple_skill_1');
    });

    test('亲密度不足不能解锁技能', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      // 尝试解锁需要 9000 亲密度的技能
      expect(() => system.unlockCoupleSkill('player1', 'couple_skill_5'))
        .toThrow('亲密度不足，需要 9000');
    });

    test('可以获取可用的夫妻技能', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      const skills = system.getAvailableCoupleSkills('player1');
      
      // 初始亲密度 5000，只能解锁第一个技能
      expect(skills.length).toBe(1);
      expect(skills[0].id).toBe('couple_skill_1');
    });

    test('增加亲密度后解锁更多技能', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);
      system.addIntimacy('player1', 4000); // 达到 9000

      const skills = system.getAvailableCoupleSkills('player1');
      
      expect(skills.length).toBe(5); // 所有技能都可用
    });

    test('可以激活夫妻技能', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);
      system.unlockCoupleSkill('player1', 'couple_skill_1');

      const result = system.activateCoupleSkill('player1');
      
      expect(result.success).toBe(true);
      expect(result.effect).toBeDefined();
      expect(result.effect!.type).toBe('damage_bonus');
      expect(result.effect!.value).toBe(0.05);
    });

    test('未激活技能时激活失败', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      const result = system.activateCoupleSkill('player1');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('未激活任何技能');
    });

    test('单身玩家激活技能失败', () => {
      const result = system.activateCoupleSkill('single_player');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('没有婚姻关系');
    });
  });

  describe('夫妻任务', () => {
    test('可以获取可用的夫妻任务', () => {
      const proposal = system.propose('player1', 'player2');
      const marriage = system.respondToProposal(proposal.id, true);
      
      // 增加亲密度到 5500 以解锁第一个任务 (需要等级 6，即亲密度 5000-5999)
      system.addIntimacy('player1', 500); // 到 5500，等级 6

      const quests = system.getAvailableCoupleQuests('player1');
      
      expect(quests.length).toBe(1);
      expect(quests[0].id).toBe('couple_quest_1');
    });

    test('已完成的任务不重复显示', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);
      system.addIntimacy('player1', 500); // 到 5500，等级 6

      // 完成任务
      system.completeCoupleQuest('player1', 'couple_quest_1');

      const quests = system.getAvailableCoupleQuests('player1');
      
      expect(quests.length).toBe(0);
    });

    test('可以完成夫妻任务', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);
      system.addIntimacy('player1', 500); // 到 5500

      const result = system.completeCoupleQuest('player1', 'couple_quest_1');
      
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
      expect(result.rewards!.intimacy).toBe(200);
      expect(result.rewards!.gold).toBe(5000);
      expect(result.rewards!.exp).toBe(1000);
    });

    test('亲密度不足不能完成任务', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);
      system.addIntimacy('player1', -3000); // 降到 2000

      const result = system.completeCoupleQuest('player1', 'couple_quest_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('亲密度不足');
    });

    test('任务完成后增加亲密度', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);
      system.addIntimacy('player1', 500); // 到 5500

      const initialIntimacy = system.getMarriage('player1')!.intimacy;
      system.completeCoupleQuest('player1', 'couple_quest_1');
      const updatedMarriage = system.getMarriage('player1');

      expect(updatedMarriage!.intimacy).toBe(initialIntimacy + 200);
    });
  });

  describe('结婚纪念日', () => {
    test('可以计算结婚天数', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      const days = system.getAnniversaryDays('player1');
      
      expect(days).toBe(0); // 刚结婚，0 天
    });
  });

  describe('离婚系统', () => {
    test('亲密度低时可以离婚', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);
      system.addIntimacy('player1', -4000); // 降到 1000

      const result = system.divorce('player1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('已解除婚姻关系');

      // 验证已离婚
      const marriage = system.getMarriage('player1');
      expect(marriage).toBeNull();
    });

    test('亲密度高时不能离婚', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);
      system.addIntimacy('player1', 1000); // 到 6000，高于 5000 不能离婚

      const result = system.divorce('player1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('亲密度过高');
    });

    test('单身玩家不能离婚', () => {
      const result = system.divorce('single_player');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('没有婚姻关系');
    });
  });

  describe('系统统计', () => {
    test('获取婚姻统计数据', () => {
      // 创建几对夫妻
      const p1 = system.propose('p1', 'p2');
      system.respondToProposal(p1.id, true);
      
      const p2 = system.propose('p3', 'p4');
      system.respondToProposal(p2.id, true);

      const stats = system.getStats();

      expect(stats.totalMarriages).toBe(2);
      expect(stats.totalProposals).toBe(2);
      expect(stats.averageIntimacy).toBe(5000);
      expect(stats.highestIntimacy).toBe(5000);
    });

    test('没有婚姻时统计为零', () => {
      const stats = system.getStats();

      expect(stats.totalMarriages).toBe(0);
      expect(stats.totalProposals).toBe(0);
      expect(stats.averageIntimacy).toBe(0);
      expect(stats.highestIntimacy).toBe(0);
    });
  });

  describe('亲密度等级边界测试', () => {
    test('亲密度在边界值时等级正确', () => {
      const proposal = system.propose('player1', 'player2');
      system.respondToProposal(proposal.id, true);

      // 测试各个边界
      system.addIntimacy('player1', -5000); // 0
      expect(system.getMarriage('player1')!.level).toBe(1);

      system.addIntimacy('player1', 999); // 999
      expect(system.getMarriage('player1')!.level).toBe(1);

      system.addIntimacy('player1', 1); // 1000
      expect(system.getMarriage('player1')!.level).toBe(2);

      system.addIntimacy('player1', 999); // 1999
      expect(system.getMarriage('player1')!.level).toBe(2);

      system.addIntimacy('player1', 1); // 2000
      expect(system.getMarriage('player1')!.level).toBe(3);
    });
  });

  describe('求婚过期', () => {
    test('求婚 24 小时后过期', () => {
      const proposal = system.propose('player1', 'player2');
      
      // 模拟 24 小时后
      jest.spyOn(Date, 'now').mockReturnValue(proposal.timestamp + 24 * 60 * 60 * 1000 + 1);

      const result = system.respondToProposal(proposal.id, true);
      
      expect(result).toBeNull();
      
      // 恢复 Date.now
      jest.restoreAllMocks();
    });
  });
});
