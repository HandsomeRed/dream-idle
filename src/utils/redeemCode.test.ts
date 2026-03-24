// 兑换码系统测试 - v0.64

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  PRESET_CODES,
  createRedeemState,
  normalizeCode,
  validateCode,
  redeemCode,
  addCode,
  disableCode,
  enableCode,
  removeCode,
  getPlayerRedeemedCodes,
  getCodeUsageCount,
  getCodeInfo,
  getActiveCodes,
  getRedeemHistory,
  getRedeemStats,
  calculateRewardValue,
  formatRewards,
  generateRandomCode,
  generateBatchCodes,
  exportRedeemData,
  importRedeemData,
  type RedeemState,
  type RedeemCodeConfig,
} from './redeemCode';

describe('兑换码系统 v0.64', () => {
  let state: RedeemState;

  beforeEach(() => {
    state = createRedeemState();
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建包含预设码的初始状态', () => {
      expect(Object.keys(state.codes).length).toBe(PRESET_CODES.length);
    });

    it('兑换码应自动大写', () => {
      Object.keys(state.codes).forEach(code => {
        expect(code).toBe(code.toUpperCase());
      });
    });

    it('使用次数应全为0', () => {
      expect(Object.keys(state.usageCounts)).toHaveLength(0);
    });

    it('兑换历史应为空', () => {
      expect(state.history).toHaveLength(0);
    });

    it('可以传入自定义预设码', () => {
      const custom: RedeemCodeConfig[] = [
        { code: 'TEST', type: 'universal', rewards: { gold: 1 }, description: 'test', active: true, createdAt: 0 },
      ];
      const s = createRedeemState(custom);
      expect(Object.keys(s.codes)).toHaveLength(1);
      expect(s.codes['TEST']).toBeDefined();
    });
  });

  // ==================== 标准化测试 ====================
  describe('标准化', () => {
    it('应转大写', () => {
      expect(normalizeCode('welcome2026')).toBe('WELCOME2026');
    });

    it('应去除空格', () => {
      expect(normalizeCode('  WELCOME2026  ')).toBe('WELCOME2026');
    });

    it('混合大小写+空格', () => {
      expect(normalizeCode(' WelCome2026 ')).toBe('WELCOME2026');
    });
  });

  // ==================== 验证测试 ====================
  describe('验证', () => {
    it('有效的通用码应通过', () => {
      const result = validateCode(state, 'WELCOME2026', 'player_001');
      expect(result.valid).toBe(true);
    });

    it('不存在的码应失败', () => {
      const result = validateCode(state, 'NOTEXIST', 'player_001');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('不存在');
    });

    it('已禁用的码应失败', () => {
      const result = validateCode(state, 'DISABLED001', 'player_001');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('禁用');
    });

    it('已过期的码应失败', () => {
      const result = validateCode(state, 'EXPIRED001', 'player_001', 1, Date.now());
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('过期');
    });

    it('等级不足应失败', () => {
      const result = validateCode(state, 'HERO100', 'player_001', 5);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('10级');
    });

    it('等级足够应通过', () => {
      const result = validateCode(state, 'HERO100', 'player_001', 15);
      expect(result.valid).toBe(true);
    });

    it('已兑换过的码应失败', () => {
      // 先兑换一次
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      const result = validateCode(s1, 'WELCOME2026', 'player_001');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('兑换过');
    });

    it('不同玩家可以使用同一个通用码', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      const result = validateCode(s1, 'WELCOME2026', 'player_002');
      expect(result.valid).toBe(true);
    });

    it('一次性码用完应失败', () => {
      const { state: s1 } = redeemCode(state, 'HERO100', 'player_001', 20);
      const result = validateCode(s1, 'HERO100', 'player_002', 20);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('已被使用');
    });

    it('限量码用完应失败', () => {
      let s = state;
      // 把 VIP888 的 maxUses 改为 2 方便测试
      s = addCode(s, {
        code: 'LIMITED2',
        type: 'limited',
        rewards: { gold: 1 },
        description: 'test',
        maxUses: 2,
        active: true,
        createdAt: 0,
      });
      const { state: s1 } = redeemCode(s, 'LIMITED2', 'player_001');
      const { state: s2 } = redeemCode(s1, 'LIMITED2', 'player_002');
      const result = validateCode(s2, 'LIMITED2', 'player_003');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('领完');
    });

    it('小写输入应正常工作', () => {
      const result = validateCode(state, 'welcome2026', 'player_001');
      expect(result.valid).toBe(true);
    });
  });

  // ==================== 兑换测试 ====================
  describe('兑换', () => {
    it('成功兑换应返回奖励', () => {
      const result = redeemCode(state, 'WELCOME2026', 'player_001');
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
      expect(result.rewards!.gold).toBe(10000);
      expect(result.rewards!.diamond).toBe(100);
    });

    it('兑换应更新使用次数', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      expect(getCodeUsageCount(s1, 'WELCOME2026')).toBe(1);
    });

    it('兑换应记录历史', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      expect(s1.history).toHaveLength(1);
      expect(s1.history[0].code).toBe('WELCOME2026');
      expect(s1.history[0].playerId).toBe('player_001');
    });

    it('兑换应记录玩家已兑换', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      const redeemed = getPlayerRedeemedCodes(s1, 'player_001');
      expect(redeemed).toContain('WELCOME2026');
    });

    it('无效兑换应返回错误', () => {
      const result = redeemCode(state, 'NOTEXIST', 'player_001');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('历史记录应限制100条', () => {
      let s = state;
      // 添加足够多的一次性码
      for (let i = 0; i < 105; i++) {
        s = addCode(s, {
          code: `BATCH${i}`,
          type: 'universal',
          rewards: { gold: 1 },
          description: 'batch',
          active: true,
          createdAt: 0,
        });
      }
      for (let i = 0; i < 105; i++) {
        const { state: newState } = redeemCode(s, `BATCH${i}`, `player_${i}`);
        s = newState;
      }
      expect(s.history.length).toBeLessThanOrEqual(100);
    });
  });

  // ==================== 管理功能测试 ====================
  describe('管理功能', () => {
    it('添加新码', () => {
      const newState = addCode(state, {
        code: 'NEWCODE',
        type: 'universal',
        rewards: { gold: 999 },
        description: '新码',
        active: true,
        createdAt: Date.now(),
      });
      expect(newState.codes['NEWCODE']).toBeDefined();
    });

    it('禁用码', () => {
      const newState = disableCode(state, 'WELCOME2026');
      expect(newState.codes['WELCOME2026'].active).toBe(false);
    });

    it('启用码', () => {
      const s1 = disableCode(state, 'WELCOME2026');
      const s2 = enableCode(s1, 'WELCOME2026');
      expect(s2.codes['WELCOME2026'].active).toBe(true);
    });

    it('删除码', () => {
      const newState = removeCode(state, 'WELCOME2026');
      expect(newState.codes['WELCOME2026']).toBeUndefined();
    });

    it('禁用不存在的码应不报错', () => {
      const newState = disableCode(state, 'NOTEXIST');
      expect(newState).toBeDefined();
    });

    it('删除不存在的码应不报错', () => {
      const newState = removeCode(state, 'NOTEXIST');
      expect(newState).toBeDefined();
    });
  });

  // ==================== 查询功能测试 ====================
  describe('查询功能', () => {
    it('获取码信息', () => {
      const info = getCodeInfo(state, 'WELCOME2026');
      expect(info!.exists).toBe(true);
      expect(info!.type).toBe('universal');
      expect(info!.active).toBe(true);
    });

    it('不存在的码信息', () => {
      const info = getCodeInfo(state, 'NOTEXIST');
      expect(info!.exists).toBe(false);
    });

    it('限量码应显示剩余次数', () => {
      const info = getCodeInfo(state, 'VIP888');
      expect(info!.remainingUses).toBeDefined();
      expect(info!.remainingUses).toBe(100);
    });

    it('获取活跃码列表', () => {
      const active = getActiveCodes(state);
      expect(active.length).toBeGreaterThan(0);
      active.forEach(c => expect(c.active).toBe(true));
    });

    it('获取玩家已兑换码（无记录）', () => {
      const codes = getPlayerRedeemedCodes(state, 'player_001');
      expect(codes).toHaveLength(0);
    });

    it('获取兑换历史', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      const history = getRedeemHistory(s1, 10);
      expect(history).toHaveLength(1);
    });
  });

  // ==================== 统计功能测试 ====================
  describe('统计功能', () => {
    it('初始统计', () => {
      const stats = getRedeemStats(state);
      expect(stats.totalCodes).toBe(PRESET_CODES.length);
      expect(stats.totalRedemptions).toBe(0);
      expect(stats.uniquePlayers).toBe(0);
    });

    it('兑换后统计更新', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      const { state: s2 } = redeemCode(s1, 'DREAMIDLE', 'player_001');
      const stats = getRedeemStats(s2);
      expect(stats.totalRedemptions).toBe(2);
      expect(stats.uniquePlayers).toBe(1);
    });

    it('多玩家统计', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      const { state: s2 } = redeemCode(s1, 'WELCOME2026', 'player_002');
      const stats = getRedeemStats(s2);
      expect(stats.uniquePlayers).toBe(2);
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('计算奖励价值', () => {
      const value = calculateRewardValue({ gold: 10000, diamond: 100 });
      expect(value).toBeGreaterThan(0);
    });

    it('空奖励价值为0', () => {
      expect(calculateRewardValue({})).toBe(0);
    });

    it('格式化奖励', () => {
      const parts = formatRewards({ gold: 10000, diamond: 100 });
      expect(parts.length).toBe(2);
      expect(parts.some(p => p.includes('金币'))).toBe(true);
      expect(parts.some(p => p.includes('钻石'))).toBe(true);
    });

    it('空奖励格式化为空', () => {
      expect(formatRewards({})).toHaveLength(0);
    });

    it('生成随机码应为指定长度', () => {
      const code = generateRandomCode('TEST', 8);
      expect(code.length).toBe(12); // 4 prefix + 8
      expect(code.startsWith('TEST')).toBe(true);
    });

    it('生成随机码不含易混淆字符', () => {
      for (let i = 0; i < 10; i++) {
        const code = generateRandomCode('', 20);
        expect(code).not.toMatch(/[IO01]/);
      }
    });
  });

  // ==================== 批量生成测试 ====================
  describe('批量生成', () => {
    it('应生成指定数量的码', () => {
      const result = generateBatchCodes(state, 5, { gold: 100 }, '批量测试');
      expect(result.codes).toHaveLength(5);
      expect(Object.keys(result.state.codes).length).toBe(PRESET_CODES.length + 5);
    });

    it('批量码应各不相同', () => {
      const result = generateBatchCodes(state, 10, { gold: 100 }, '批量测试');
      const unique = new Set(result.codes);
      expect(unique.size).toBe(10);
    });

    it('带前缀的批量码', () => {
      const result = generateBatchCodes(state, 3, { gold: 100 }, '活动码', { prefix: 'ACT' });
      result.codes.forEach(code => expect(code.startsWith('ACT')).toBe(true));
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportRedeemData(state);
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.codes).toBeDefined();
    });

    it('导入应还原数据', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      const json = exportRedeemData(s1);
      const imported = importRedeemData(json);
      expect(imported).toBeDefined();
      expect(imported!.history).toHaveLength(1);
    });

    it('无效数据应返回null', () => {
      expect(importRedeemData('not json')).toBeNull();
      expect(importRedeemData('{}')).toBeNull();
    });
  });

  // ==================== 边界情况测试 ====================
  describe('边界情况', () => {
    it('空字符串码应无效', () => {
      const result = validateCode(state, '', 'player_001');
      expect(result.valid).toBe(false);
    });

    it('同一玩家不能重复兑换', () => {
      const { state: s1 } = redeemCode(state, 'WELCOME2026', 'player_001');
      const result = redeemCode(s1, 'WELCOME2026', 'player_001');
      expect(result.success).toBe(false);
    });

    it('过期时间刚好在当前时间应判定为过期', () => {
      let s = addCode(state, {
        code: 'EXACT',
        type: 'universal',
        rewards: { gold: 1 },
        description: 'test',
        expiresAt: 1000,
        active: true,
        createdAt: 0,
      });
      const result = validateCode(s, 'EXACT', 'player_001', 1, 1001);
      expect(result.valid).toBe(false);
    });
  });
});
