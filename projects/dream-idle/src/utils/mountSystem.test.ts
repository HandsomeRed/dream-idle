/**
 * v0.81 - 坐骑系统测试
 */

import { MountSystem } from './mountSystem';

describe('MountSystem - v0.81 坐骑系统', () => {
  let system: MountSystem;

  beforeEach(() => {
    system = new MountSystem();
  });

  describe('坐骑获取', () => {
    test('可以获得坐骑', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      expect(mount.name).toBe('赤兔马');
      expect(mount.rarity).toBe('rare');
      expect(mount.level).toBe(1);
      expect(mount.exp).toBe(0);
      expect(mount.star).toBe(1);
      expect(mount.isEquipped).toBe(true); // 第一个坐骑自动装备
    });

    test('获得多个坐骑', () => {
      const mount1 = system.obtainMount('player1', 'mount_horse');
      const mount2 = system.obtainMount('player1', 'mount_dragon');
      
      expect(mount1.isEquipped).toBe(true);
      expect(mount2.isEquipped).toBe(false); // 第二个不自动装备
    });

    test('不存在的坐骑模板返回错误', () => {
      expect(() => system.obtainMount('player1', 'invalid_mount')).toThrow('坐骑模板不存在');
    });
  });

  describe('坐骑列表', () => {
    test('获取玩家坐骑列表', () => {
      system.obtainMount('player1', 'mount_horse');
      system.obtainMount('player1', 'mount_dragon');
      
      const mounts = system.getPlayerMounts('player1');
      
      expect(mounts.length).toBe(2);
    });

    test('获取已装备的坐骑', () => {
      system.obtainMount('player1', 'mount_horse');
      system.obtainMount('player1', 'mount_dragon');
      
      const equipped = system.getEquippedMount('player1');
      
      expect(equipped).not.toBeNull();
      expect(equipped!.name).toBe('赤兔马');
    });

    test('没有坐骑时返回 null', () => {
      const equipped = system.getEquippedMount('player_no_mounts');
      expect(equipped).toBeNull();
    });
  });

  describe('装备坐骑', () => {
    test('可以装备坐骑', () => {
      system.obtainMount('player1', 'mount_horse');
      const dragon = system.obtainMount('player1', 'mount_dragon');
      
      const equipped = system.equipMount('player1', dragon.id);
      
      expect(equipped.isEquipped).toBe(true);
      
      const currentEquipped = system.getEquippedMount('player1');
      expect(currentEquipped!.name).toBe('青龙');
    });

    test('装备新坐骑时卸下旧坐骑', () => {
      const horse = system.obtainMount('player1', 'mount_horse');
      const dragon = system.obtainMount('player1', 'mount_dragon');
      
      system.equipMount('player1', dragon.id);
      
      const horseAfter = system.getPlayerMounts('player1').find(m => m.id === horse.id);
      expect(horseAfter!.isEquipped).toBe(false);
    });

    test('装备不属于自己的坐骑返回错误', () => {
      system.obtainMount('player1', 'mount_horse');
      const dragon = system.obtainMount('player2', 'mount_dragon');
      
      expect(() => system.equipMount('player1', dragon.id)).toThrow('该坐骑不属于你');
    });
  });

  describe('坐骑经验', () => {
    test('可以增加经验', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      const result = system.addExp('player1', mount.id, 500);
      
      expect(result.mount.exp).toBe(500);
      expect(result.leveledUp).toBe(false);
    });

    test('经验达到升级条件时升级', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      const result = system.addExp('player1', mount.id, 1500);
      
      expect(result.mount.level).toBe(2);
      expect(result.leveledUp).toBe(true);
    });

    test('升级后属性增加', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      const baseAttack = mount.stats.attack;
      
      system.addExp('player1', mount.id, 1500);
      
      const updated = system.getPlayerMounts('player1').find(m => m.id === mount.id);
      expect(updated!.stats.attack).toBeGreaterThan(baseAttack);
    });

    test('使用经验道具', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      const result = system.useExpItem('player1', mount.id, 'mount_exp_medium');
      
      expect(result.mount.exp).toBe(500);
    });

    test('使用不存在的经验道具返回错误', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      expect(() => system.useExpItem('player1', mount.id, 'invalid_item')).toThrow('经验道具不存在');
    });
  });

  describe('坐骑进阶', () => {
    test('经验达到进阶条件时进阶', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      const result = system.addExp('player1', mount.id, 1000); // 达到 2 星要求
      
      expect(result.mount.star).toBe(2);
      expect(result.advanced).toBe(true);
    });

    test('进阶后属性大幅提升', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      const baseAttack = mount.stats.attack;
      
      system.addExp('player1', mount.id, 1000); // 进阶到 2 星
      
      const updated = system.getPlayerMounts('player1').find(m => m.id === mount.id);
      expect(updated!.stats.attack).toBeGreaterThan(baseAttack);
    });

    test('进阶解锁新技能', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      // 进阶到 3 星，解锁强壮技能
      system.addExp('player1', mount.id, 2500);
      
      const updated = system.getPlayerMounts('player1').find(m => m.id === mount.id);
      expect(updated!.skills.length).toBeGreaterThan(0);
    });

    test('星级上限为 10 星', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      // 直接给大量经验
      system.addExp('player1', mount.id, 100000);
      
      const updated = system.getPlayerMounts('player1').find(m => m.id === mount.id);
      expect(updated!.star).toBe(10);
    });
  });

  describe('坐骑技能', () => {
    test('获取坐骑技能', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      // 进阶到 3 星解锁技能
      system.addExp('player1', mount.id, 2500);
      
      const updated = system.getPlayerMounts('player1').find(m => m.id === mount.id);
      const skills = system.getMountSkills(updated!);
      
      expect(skills.length).toBeGreaterThan(0);
    });

    test('激活坐骑技能', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      // 疾风技能需要 1 星，默认已解锁
      
      const result = system.activateSkill('player1', mount.id, 'mount_skill_1');
      
      expect(result.success).toBe(true);
      expect(result.effect).toBeDefined();
    });

    test('未装备坐骑不能激活技能', () => {
      const horse = system.obtainMount('player1', 'mount_horse');
      const dragon = system.obtainMount('player1', 'mount_dragon'); // 青龙自动不装备
      
      system.equipMount('player1', dragon.id); // 装备青龙，赤兔马变为未装备
      
      const result = system.activateSkill('player1', horse.id, 'mount_skill_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已装备');
    });

    test('星级不足不能激活技能', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      // 1 星尝试激活需要 9 星的幸运技能
      
      const result = system.activateSkill('player1', mount.id, 'mount_skill_5');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('星级不足');
    });
  });

  describe('属性加成', () => {
    test('获取坐骑属性加成', () => {
      system.obtainMount('player1', 'mount_horse');
      
      const bonus = system.getMountBonus('player1');
      
      expect(bonus.attack).toBeGreaterThan(0);
      expect(bonus.defense).toBeGreaterThan(0);
      expect(bonus.health).toBeGreaterThan(0);
      expect(bonus.speed).toBeGreaterThan(0);
    });

    test('没有坐骑时加成为 0', () => {
      const bonus = system.getMountBonus('player_no_mounts');
      
      expect(bonus.attack).toBe(0);
      expect(bonus.defense).toBe(0);
      expect(bonus.health).toBe(0);
      expect(bonus.speed).toBe(0);
    });
  });

  describe('进阶信息', () => {
    test('获取坐骑进阶信息', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      
      const info = system.getAdvanceInfo(mount);
      
      expect(info.currentStar).toBe(1);
      expect(info.currentExp).toBe(0);
      expect(info.nextStarExp).toBe(1000);
      expect(info.progress).toBe(0);
    });

    test('进阶进度计算正确', () => {
      const mount = system.obtainMount('player1', 'mount_horse');
      system.addExp('player1', mount.id, 500); // 50% 进度
      
      const updated = system.getPlayerMounts('player1').find(m => m.id === mount.id);
      const info = system.getAdvanceInfo(updated!);
      
      expect(info.progress).toBeCloseTo(50, 0);
    });
  });

  describe('可获得的坐骑', () => {
    test('获取所有可获得的坐骑', () => {
      const mounts = system.getAvailableMounts();
      
      expect(mounts.length).toBeGreaterThan(0);
      expect(mounts.find(m => m.name === '赤兔马')).toBeDefined();
      expect(mounts.find(m => m.name === '青龙')).toBeDefined();
    });
  });

  describe('坐骑统计', () => {
    test('获取坐骑统计', () => {
      system.obtainMount('player1', 'mount_horse');
      system.obtainMount('player1', 'mount_dragon');
      system.addExp('player1', system.getPlayerMounts('player1')[0].id, 500); // 只加经验不进阶
      
      const stats = system.getStats('player1');
      
      expect(stats.totalMounts).toBe(2);
      expect(stats.equippedMount).toBe('赤兔马');
      expect(stats.highestStar).toBe(1);
      expect(stats.averageLevel).toBeGreaterThan(0);
    });
  });
});
