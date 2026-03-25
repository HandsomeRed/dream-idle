// VIP 系统测试 - v0.77

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  VIP_LEVELS,
  PRIVILEGE_CONFIG,
  DAILY_DIAMOND_REWARDS,
  EXP_BONUS,
  GOLD_BONUS,
  createVIPState,
  addVIPExp,
  claimDailyDiamond,
  claimGiftPack,
  hasPrivilege,
  getAllPrivileges,
  getExpBonus,
  getGoldBonus,
  getLevelProgress,
  getVIPStats,
  dailyReset,
  exportVIPData,
  importVIPData,
  getVIPLevel,
  getPrivilegeName,
  getPrivilegeDescription,
  type VIPState,
  type VIPPrivilege,
} from './vipSystem';

describe('VIP 系统 v0.77', () => {
  let state: VIPState;

  beforeEach(() => {
    state = createVIPState('player_001');
  });

  // ==================== 配置测试 ====================
  describe('配置', () => {
    it('应有 11 个 VIP 等级 (0-10)', () => {
      expect(VIP_LEVELS).toHaveLength(11);
    });

    it('每个等级应有必要字段', () => {
      VIP_LEVELS.forEach(v => {
        expect(v).toHaveProperty('level');
        expect(v).toHaveProperty('name');
        expect(v).toHaveProperty('expRequired');
        expect(v).toHaveProperty('privileges');
      });
    });

    it('特权配置应完整', () => {
      const allPrivileges = VIP_LEVELS.flatMap(v => v.privileges);
      const uniquePrivileges = [...new Set(allPrivileges)];
      uniquePrivileges.forEach(p => {
        expect(PRIVILEGE_CONFIG[p]).toBeDefined();
      });
    });

    it('特权名称应正确', () => {
      expect(getPrivilegeName('dailyDiamond')).toBe('每日钻石');
      expect(getPrivilegeName('autoBattle')).toBe('自动战斗');
    });

    it('每日钻石奖励应递增', () => {
      expect(DAILY_DIAMOND_REWARDS[1]).toBeLessThan(DAILY_DIAMOND_REWARDS[10]);
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.level).toBe(0);
      expect(state.exp).toBe(0);
      expect(state.totalExp).toBe(0);
    });

    it('初始应无特权', () => {
      expect(state.dailyDiamondClaimed).toBe(false);
      expect(state.dailyGiftClaimed).toBe(false);
    });
  });

  // ==================== VIP 经验测试 ====================
  describe('VIP 经验', () => {
    it('应能添加经验', () => {
      const { state: s1 } = addVIPExp(state, 100, 'recharge', '充值 100 元');
      expect(s1.exp).toBe(100);
      expect(s1.totalExp).toBe(100);
    });

    it('充值应增加累计充值', () => {
      const { state: s1 } = addVIPExp(state, 500, 'recharge', '充值');
      expect(s1.totalRecharge).toBe(500);
    });

    it('任务经验不增加充值', () => {
      const { state: s1 } = addVIPExp(state, 100, 'task', '完成任务');
      expect(s1.totalRecharge).toBe(0);
    });

    it('经验应记录历史', () => {
      const { state: s1 } = addVIPExp(state, 100, 'recharge', '测试');
      expect(s1.expHistory).toHaveLength(1);
      expect(s1.expHistory[0].amount).toBe(100);
    });

    it('应能升级', () => {
      const { state: s1, leveledUp, newLevel } = addVIPExp(state, 500, 'recharge', '充值');
      expect(leveledUp).toBe(true);
      expect(newLevel).toBe(2);
      expect(s1.level).toBe(2);
    });

    it('升级应解锁特权', () => {
      const { state: s1 } = addVIPExp(state, 500, 'recharge', '充值');
      expect(hasPrivilege(s1, 'dailyDiamond')).toBe(true);
      expect(hasPrivilege(s1, 'buyLimit')).toBe(true);
    });
  });

  // ==================== 每日钻石测试 ====================
  describe('每日钻石', () => {
    it('VIP0 不能领取', () => {
      const result = claimDailyDiamond(state);
      expect(result.success).toBe(false);
      expect(result.error).toContain('VIP1');
    });

    it('VIP1+ 可以领取', () => {
      let s = state;
      s = addVIPExp(s, 100, 'recharge', '充值').state;
      const result = claimDailyDiamond(s);
      expect(result.success).toBe(true);
      expect(result.amount).toBe(DAILY_DIAMOND_REWARDS[1]);
    });

    it('高等级获得更多钻石', () => {
      let s = state;
      s = addVIPExp(s, 200000, 'recharge', '充值').state; // VIP10
      const result = claimDailyDiamond(s);
      expect(result.amount).toBe(DAILY_DIAMOND_REWARDS[10]);
      expect(result.amount).toBeGreaterThan(DAILY_DIAMOND_REWARDS[1]);
    });

    it('每日只能领取一次', () => {
      let s = state;
      s = addVIPExp(s, 100, 'recharge', '充值').state;
      const { state: s2 } = claimDailyDiamond(s);
      const result = claimDailyDiamond(s2);
      expect(result.success).toBe(false);
      expect(result.error).toContain('已领取');
    });
  });

  // ==================== 特权礼包测试 ====================
  describe('特权礼包', () => {
    it('VIP 等级不足不能领取', () => {
      const result = claimGiftPack(state, 5);
      expect(result.success).toBe(false);
      expect(result.error).toContain('等级');
    });

    it('该等级无礼包不能领取', () => {
      let s = state;
      s = addVIPExp(s, 100, 'recharge', '充值').state; // VIP1
      const result = claimGiftPack(s, 1); // VIP1 无 giftPack 特权
      expect(result.success).toBe(false);
    });

    it('可以领取礼包', () => {
      let s = state;
      s = addVIPExp(s, 100000, 'recharge', '充值').state; // VIP9
      const result = claimGiftPack(s, 9);
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
    });

    it('礼包奖励应随等级提升', () => {
      let s = state;
      s = addVIPExp(s, 200000, 'recharge', '充值').state; // VIP10
      const { rewards: r9 } = claimGiftPack(s, 9);
      const { rewards: r10 } = claimGiftPack(s, 10);
      expect(r10!.diamond).toBeGreaterThan(r9!.diamond);
    });
  });

  // ==================== 特权检查测试 ====================
  describe('特权检查', () => {
    it('VIP0 无特权', () => {
      expect(hasPrivilege(state, 'dailyDiamond')).toBe(false);
      expect(hasPrivilege(state, 'autoBattle')).toBe(false);
    });

    it('VIP3 有经验加成', () => {
      let s = state;
      s = addVIPExp(s, 1000, 'recharge', '充值').state;
      expect(hasPrivilege(s, 'expBonus')).toBe(true);
      expect(getExpBonus(s)).toBe(0.1);
    });

    it('VIP4 有金币加成', () => {
      let s = state;
      s = addVIPExp(s, 2000, 'recharge', '充值').state;
      expect(hasPrivilege(s, 'goldBonus')).toBe(true);
      expect(getGoldBonus(s)).toBe(0.1);
    });

    it('获取所有特权', () => {
      let s = state;
      s = addVIPExp(s, 200000, 'recharge', '充值').state; // VIP10
      const privileges = getAllPrivileges(s);
      expect(privileges.length).toBeGreaterThan(5);
    });
  });

  // ==================== 进度测试 ====================
  describe('进度', () => {
    it('获取升级进度', () => {
      let s = state;
      s = addVIPExp(s, 50, 'recharge', '充值').state;
      const progress = getLevelProgress(s);
      expect(progress.current).toBe(50);
      expect(progress.next).toBe(100);
      expect(progress.percentage).toBe(50);
    });

    it('满级应 100%', () => {
      let s = state;
      s = addVIPExp(s, 999999, 'recharge', '充值').state;
      const progress = getLevelProgress(s);
      expect(progress.percentage).toBe(100);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('获取 VIP 统计', () => {
      const stats = getVIPStats(state);
      expect(stats.level).toBe(0);
      expect(stats.levelName).toBe('平民');
      expect(stats.privilegesCount).toBe(0);
    });

    it('升级后统计更新', () => {
      let s = state;
      s = addVIPExp(s, 500, 'recharge', '充值').state;
      const stats = getVIPStats(s);
      expect(stats.level).toBe(2);
      expect(stats.levelName).toBe('VIP2');
      expect(stats.privilegesCount).toBeGreaterThan(0);
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('重置后应可重新领取', () => {
      let s = state;
      s = addVIPExp(s, 100, 'recharge', '充值').state;
      claimDailyDiamond(s);
      const reset = dailyReset(s);
      expect(reset.dailyDiamondClaimed).toBe(false);
    });

    it('重置应清空礼包状态', () => {
      let s = state;
      s = addVIPExp(s, 100000, 'recharge', '充值').state; // VIP9
      claimGiftPack(s, 9);
      const reset = dailyReset(s);
      // 重置后礼包状态应清空 (变为空对象)
      expect(Object.keys(reset.giftPackClaimed).length).toBe(0);
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回 JSON', () => {
      const json = exportVIPData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      let s = state;
      s = addVIPExp(s, 500, 'recharge', '充值').state;
      const json = exportVIPData(s);
      const imported = importVIPData(json);
      expect(imported).toBeDefined();
      expect(imported!.level).toBe(2);
    });

    it('无效数据应返回 null', () => {
      expect(importVIPData('nope')).toBeNull();
      expect(importVIPData('{}')).toBeNull();
    });
  });
});
