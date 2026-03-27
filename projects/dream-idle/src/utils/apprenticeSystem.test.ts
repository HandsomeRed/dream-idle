/**
 * v0.80 - 师徒系统测试
 */

import { ApprenticeSystem } from './apprenticeSystem';

describe('ApprenticeSystem - v0.80 师徒系统', () => {
  let system: ApprenticeSystem;

  beforeEach(() => {
    system = new ApprenticeSystem();
  });

  describe('拜师申请', () => {
    test('可以成功申请拜师', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      
      expect(proposal.proposerId).toBe('apprentice1');
      expect(proposal.targetId).toBe('master1');
      expect(proposal.type).toBe('apply');
      expect(proposal.status).toBe('pending');
      expect(proposal.id).toBeDefined();
    });

    test('已有师傅不能再拜师', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      expect(() => system.applyForApprenticeship('apprentice1', 'master2'))
        .toThrow('你已经有师傅了');
    });

    test('一个玩家只能有一个师徒关系', () => {
      const proposal1 = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal1.id);

      // 当前实现：一个玩家只能有一个师徒关系（无论是师傅还是徒弟）
      expect(() => system.applyForApprenticeship('apprentice2', 'master1'))
        .toThrow('对方已经有师傅了');
    });

    test('不能重复申请', () => {
      system.applyForApprenticeship('apprentice1', 'master1');
      
      expect(() => system.applyForApprenticeship('apprentice1', 'master1'))
        .toThrow('已有待处理的师徒申请');
    });
  });

  describe('接受/拒绝拜师', () => {
    test('接受拜师后创建师徒关系', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      const relationship = system.acceptApprenticeship(proposal.id);

      expect(relationship).not.toBeNull();
      expect(relationship!.masterId).toBe('master1');
      expect(relationship!.apprenticeId).toBe('apprentice1');
      expect(relationship!.virtuePoints).toBe(0);
      expect(relationship!.level).toBe(1);
      expect(relationship!.isGraduated).toBe(false);
    });

    test('拒绝拜师', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.rejectApprenticeship(proposal.id);

      const relationship = system.getRelationship('apprentice1');
      expect(relationship).toBeNull();
    });

    test('不存在的申请返回错误', () => {
      expect(() => system.acceptApprenticeship('invalid_id')).toThrow('申请不存在');
    });
  });

  describe('师徒关系查询', () => {
    test('可以获取师徒关系', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      const rel1 = system.getRelationship('master1');
      const rel2 = system.getRelationship('apprentice1');

      expect(rel1).not.toBeNull();
      expect(rel2).not.toBeNull();
      expect(rel1!.id).toBe(rel2!.id);
    });

    test('判断是否是师傅', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      expect(system.isMaster('master1')).toBe(true);
      expect(system.isMaster('apprentice1')).toBe(false);
    });

    test('判断是否是徒弟', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      expect(system.isApprentice('apprentice1')).toBe(true);
      expect(system.isApprentice('master1')).toBe(false);
    });

    test('获取 partner ID', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      expect(system.getPartner('master1')).toBe('apprentice1');
      expect(system.getPartner('apprentice1')).toBe('master1');
    });
  });

  describe('师德值系统', () => {
    test('师傅可以增加师德值', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      const updated = system.addVirtuePoints('master1', 1000);
      
      expect(updated!.virtuePoints).toBe(1000);
      expect(updated!.level).toBe(2); // 入门等级
    });

    test('徒弟不能增加师德值', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      expect(() => system.addVirtuePoints('apprentice1', 1000))
        .toThrow('只有师傅才能获得师德值');
    });

    test('师德值上限为 10000', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 15000);

      const relationship = system.getRelationship('master1');
      expect(relationship!.virtuePoints).toBe(10000);
    });

    test('师徒等级计算正确', () => {
      expect(system.getRelationshipLevel(0)).toBe(1); // 初识
      expect(system.getRelationshipLevel(1000)).toBe(2); // 入门
      expect(system.getRelationshipLevel(2000)).toBe(3); // 登堂
      expect(system.getRelationshipLevel(3000)).toBe(4); // 入室
      expect(system.getRelationshipLevel(4000)).toBe(5); // 得意
      expect(system.getRelationshipLevel(5000)).toBe(6); // 真传
      expect(system.getRelationshipLevel(6000)).toBe(7); // 嫡系
      expect(system.getRelationshipLevel(7000)).toBe(8); // 宗师
      expect(system.getRelationshipLevel(8000)).toBe(9); // 泰斗
      expect(system.getRelationshipLevel(9000)).toBe(10); // 圣人
    });

    test('获取师徒等级名称', () => {
      expect(system.getRelationshipLevelName(1)).toBe('初识');
      expect(system.getRelationshipLevelName(5)).toBe('得意');
      expect(system.getRelationshipLevelName(10)).toBe('圣人');
    });
  });

  describe('出师系统', () => {
    test('检查出师条件 - 不满足', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      const check = system.canGraduate('apprentice1');
      
      expect(check.can).toBe(false);
      expect(check.reasons.length).toBeGreaterThan(0);
    });

    test('检查出师条件 - 满足', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      
      // 满足所有出师条件
      system.addVirtuePoints('master1', 5000); // 5000 师德
      
      const relationship = system.getRelationship('apprentice1');
      if (relationship) {
        relationship.virtuePoints = 5000;
        relationship.level = 6;
        relationship.completedTasks = ['task1', 'task2', 'task3', 'task4', 'task5', 'task6', 'task7', 'task8', 'task9', 'task10'];
        relationship.startDate = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 天前
      }

      const check = system.canGraduate('apprentice1');
      
      expect(check.can).toBe(true);
      expect(check.reasons).toEqual([]);
    });

    test('只有徒弟可以出师', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      const check = system.canGraduate('master1');
      
      expect(check.can).toBe(false);
      expect(check.reasons).toContain('只有徒弟可以出师');
    });

    test('成功出师', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      
      const relationship = system.getRelationship('apprentice1');
      if (relationship) {
        relationship.virtuePoints = 5000;
        relationship.level = 6;
        relationship.completedTasks = ['task1', 'task2', 'task3', 'task4', 'task5', 'task6', 'task7', 'task8', 'task9', 'task10'];
        relationship.startDate = Date.now() - (10 * 24 * 60 * 60 * 1000);
      }

      const result = system.graduate('apprentice1');
      
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
      expect(result.rewards!.items).toContain('graduation_certIFICATE');
    });

    test('已经出师后不能再次出师', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      
      const relationship = system.getRelationship('apprentice1');
      if (relationship) {
        relationship.virtuePoints = 5000;
        relationship.level = 6;
        relationship.completedTasks = ['task1', 'task2', 'task3', 'task4', 'task5', 'task6', 'task7', 'task8', 'task9', 'task10'];
        relationship.startDate = Date.now() - (10 * 24 * 60 * 60 * 1000);
      }

      system.graduate('apprentice1');
      const check = system.canGraduate('apprentice1');

      expect(check.can).toBe(false);
      expect(check.reasons).toContain('已经出师');
    });
  });

  describe('解除师徒关系', () => {
    test('师德值低时可以解除关系', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 500); // 500 师德

      const result = system.dissolveRelationship('master1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('已解除师徒关系');

      const relationship = system.getRelationship('master1');
      expect(relationship).toBeNull();
    });

    test('师德值高时不能解除关系', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 2000); // 2000 师德

      const result = system.dissolveRelationship('master1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('师德值过高');
    });

    test('已经出师后不能解除关系', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      
      const relationship = system.getRelationship('apprentice1');
      if (relationship) {
        relationship.isGraduated = true;
      }

      const result = system.dissolveRelationship('master1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已经出师');
    });
  });

  describe('师徒任务', () => {
    test('可以获取可用的师徒任务', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 500);

      const tasks = system.getAvailableTasks('master1');
      
      expect(tasks.length).toBeGreaterThan(0);
    });

    test('已完成的任务不重复显示', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 500);

      system.completeTask('master1', 'apprentice_task_1');
      const tasks = system.getAvailableTasks('master1');

      expect(tasks.find(t => t.id === 'apprentice_task_1')).toBeUndefined();
    });

    test('可以完成师徒任务', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 500);

      const result = system.completeTask('master1', 'apprentice_task_1');
      
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
      expect(result.rewards!.virtuePoints).toBe(100);
    });

    test('完成任务后增加师德值', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 500);

      const initialVirtue = system.getRelationship('master1')!.virtuePoints;
      system.completeTask('master1', 'apprentice_task_1');
      const updatedVirtue = system.getRelationship('master1')!.virtuePoints;

      expect(updatedVirtue).toBe(initialVirtue + 100);
    });
  });

  describe('师徒技能', () => {
    test('可以获取可用的师徒技能', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 3000);

      const skills = system.getAvailableSkills('master1');
      
      expect(skills.length).toBeGreaterThan(0);
    });

    test('可以激活师徒技能', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);
      system.addVirtuePoints('master1', 3000);

      const result = system.activateSkill('master1', 'master_skill_1');
      
      expect(result.success).toBe(true);
      expect(result.effect).toBeDefined();
      expect(result.effect!.type).toBe('exp_bonus');
    });

    test('师德值不足不能激活技能', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      system.acceptApprenticeship(proposal.id);

      const result = system.activateSkill('master1', 'master_skill_5');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('师德值不足');
    });
  });

  describe('系统统计', () => {
    test('获取师徒统计', () => {
      const p1 = system.applyForApprenticeship('a1', 'm1');
      system.acceptApprenticeship(p1.id);
      
      const p2 = system.applyForApprenticeship('a2', 'm2');
      system.acceptApprenticeship(p2.id);

      const stats = system.getStats();

      expect(stats.totalRelationships).toBe(2);
      expect(stats.activeRelationships).toBe(2);
      expect(stats.graduatedCount).toBe(0);
    });

    test('统计已出师的师徒', () => {
      const p1 = system.applyForApprenticeship('a1', 'm1');
      const rel = system.acceptApprenticeship(p1.id);
      
      if (rel) {
        rel.isGraduated = true;
      }

      const stats = system.getStats();

      expect(stats.totalRelationships).toBe(1);
      expect(stats.activeRelationships).toBe(0);
      expect(stats.graduatedCount).toBe(1);
    });
  });

  describe('申请过期', () => {
    test('申请 24 小时后过期', () => {
      const proposal = system.applyForApprenticeship('apprentice1', 'master1');
      
      jest.spyOn(Date, 'now').mockReturnValue(proposal.timestamp + 24 * 60 * 60 * 1000 + 1);

      const result = system.acceptApprenticeship(proposal.id);
      
      expect(result).toBeNull();
      
      jest.restoreAllMocks();
    });
  });
});
