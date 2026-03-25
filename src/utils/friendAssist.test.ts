// 好友助力系统测试 - v0.73

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ASSIST_CONFIG,
  ASSIST_TEMPLATES,
  createFriendAssistState,
  checkDailyReset,
  createAssistRequest,
  acceptAssistRequest,
  completeAssist,
  receiveAssist,
  cancelRequest,
  declineRequest,
  getAvailableRequests,
  getMyActiveRequests,
  getAssistStats,
  redeemAssistPoints,
  exportAssistData,
  importAssistData,
  type FriendAssistState,
  type AssistRequest,
} from './friendAssist';

describe('好友助力系统 v0.73', () => {
  let state: FriendAssistState;

  beforeEach(() => {
    state = createFriendAssistState('player_001');
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.myRequests).toHaveLength(0);
      expect(state.receivedRequests).toHaveLength(0);
      expect(state.todayAssists).toBe(0);
      expect(state.assistPoints).toBe(0);
    });

    it('配置应包含所有限制', () => {
      expect(ASSIST_CONFIG.maxActiveRequests).toBeGreaterThan(0);
      expect(ASSIST_CONFIG.dailyAssistLimit).toBeGreaterThan(0);
      expect(ASSIST_CONFIG.requestExpiryHours).toBeGreaterThan(0);
    });

    it('应包含所有助力类型模板', () => {
      const types = Object.keys(ASSIST_TEMPLATES);
      expect(types).toContain('battle');
      expect(types).toContain('resource');
      expect(types.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('同一天不需要重置', () => {
      state.todayAssists = 5;
      const newState = checkDailyReset(state);
      expect(newState.todayAssists).toBe(5);
    });

    it('跨天应重置计数', () => {
      state.todayAssists = 5;
      state.todayReceived = 3;
      state.lastResetDate = '2020-01-01';
      const newState = checkDailyReset(state);
      expect(newState.todayAssists).toBe(0);
      expect(newState.todayReceived).toBe(0);
    });

    it('跨天应清理过期请求', () => {
      const now = Date.now();
      state.myRequests = [
        { id: 'r1', requesterId: 'p1', requesterName: 'P1', type: 'battle', description: 'test', reward: { requester: {}, helper: {} }, status: 'pending', createdAt: now, expiresAt: now - 1000 },
      ];
      state.lastResetDate = '2020-01-01';
      const newState = checkDailyReset(state);
      expect(newState.myRequests).toHaveLength(0);
    });
  });

  // ==================== 创建请求测试 ====================
  describe('创建请求', () => {
    it('应能创建助力请求', () => {
      const { state: newState, request } = createAssistRequest(state, 'battle', 'Player1');
      expect(request).toBeDefined();
      expect(request!.type).toBe('battle');
      expect(newState.myRequests).toHaveLength(1);
    });

    it('请求应包含正确奖励', () => {
      const { request } = createAssistRequest(state, 'battle', 'Player1');
      expect(request!.reward.requester.gold).toBe(5000);
      expect(request!.reward.helper.diamond).toBe(5);
    });

    it('请求应有过期时间', () => {
      const { request } = createAssistRequest(state, 'battle', 'Player1');
      expect(request!.expiresAt).toBeGreaterThan(request!.createdAt);
    });

    it('达到最大请求数应失败', () => {
      let s = state;
      for (let i = 0; i < ASSIST_CONFIG.maxActiveRequests; i++) {
        const result = createAssistRequest(s, 'battle', 'Player1');
        if (result.request) s = result.state;
      }
      const result = createAssistRequest(s, 'battle', 'Player1');
      expect(result.error).toContain('最大活跃请求数');
    });
  });

  // ==================== 接受请求测试 ====================
  describe('接受请求', () => {
    it('应能接受请求', () => {
      const { state: s1 } = createAssistRequest(state, 'battle', 'Player1');
      const request = s1.myRequests[0];
      
      // 将请求添加到接收列表（模拟别人发给我的）
      const s2 = { ...s1, receivedRequests: [{ ...request, requesterId: 'player_002' }] };
      
      const result = acceptAssistRequest(s2, request.id, 'Helper1');
      expect(result.success).toBe(true);
    });

    it('达到助力次数限制应失败', () => {
      state.todayAssists = ASSIST_CONFIG.dailyAssistLimit;
      const result = acceptAssistRequest(state, 'any', 'Helper1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('上限');
    });

    it('不存在的请求应失败', () => {
      const result = acceptAssistRequest(state, 'nonexistent', 'Helper1');
      expect(result.success).toBe(false);
    });

    it('已处理的请求应失败', () => {
      const { state: s1 } = createAssistRequest(state, 'battle', 'Player1');
      const request = { ...s1.myRequests[0], status: 'completed' as const };
      const s2 = { ...s1, receivedRequests: [request] };
      
      const result = acceptAssistRequest(s2, request.id, 'Helper1');
      expect(result.success).toBe(false);
    });
  });

  // ==================== 完成助力测试 ====================
  describe('完成助力', () => {
    it('应能完成助力', () => {
      const { state: s1 } = createAssistRequest(state, 'battle', 'Player1');
      const request = { ...s1.myRequests[0], status: 'accepted' as const, requesterId: 'player_002' };
      const s2 = { ...s1, receivedRequests: [request], acceptedRequests: [request.id] };
      
      const result = completeAssist(s2, request.id);
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
    });

    it('完成应增加助力点数', () => {
      const { state: s1 } = createAssistRequest(state, 'battle', 'Player1');
      const request = { ...s1.myRequests[0], status: 'accepted' as const, requesterId: 'player_002' };
      const s2 = { ...s1, receivedRequests: [request], acceptedRequests: [request.id] };
      
      const { state: s3 } = completeAssist(s2, request.id)!;
      expect(s3.assistPoints).toBe(ASSIST_CONFIG.basePoints);
    });

    it('完成应增加今日助力次数', () => {
      const { state: s1 } = createAssistRequest(state, 'battle', 'Player1');
      const request = { ...s1.myRequests[0], status: 'accepted' as const, requesterId: 'player_002' };
      const s2 = { ...s1, receivedRequests: [request], acceptedRequests: [request.id] };
      
      const { state: s3 } = completeAssist(s2, request.id)!;
      expect(s3.todayAssists).toBe(1);
    });

    it('完成应添加历史记录', () => {
      const { state: s1 } = createAssistRequest(state, 'battle', 'Player1');
      const request = { ...s1.myRequests[0], status: 'accepted' as const, requesterId: 'player_002' };
      const s2 = { ...s1, receivedRequests: [request], acceptedRequests: [request.id] };
      
      const { state: s3 } = completeAssist(s2, request.id)!;
      expect(s3.history).toHaveLength(1);
      expect(s3.history[0].role).toBe('helper');
    });
  });

  // ==================== 接收助力测试 ====================
  describe('接收助力', () => {
    it('应能接收助力奖励', () => {
      const { state: s1, request } = createAssistRequest(state, 'battle', 'Player1');
      const completedRequest = { ...request!, status: 'completed' as const, acceptedBy: 'Helper1' };
      const s2 = { ...s1, myRequests: [completedRequest] };
      
      const result = receiveAssist(s2, request!.id);
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
    });

    it('助力未完成应无法领取', () => {
      const { state: s1, request } = createAssistRequest(state, 'battle', 'Player1');
      const s2 = { ...s1, myRequests: [request!] };
      
      const result = receiveAssist(s2, request!.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain('未完成');
    });

    it('重复领取应失败', () => {
      const { state: s1, request } = createAssistRequest(state, 'battle', 'Player1');
      const completedRequest = { ...request!, status: 'completed' as const, acceptedBy: 'Helper1' };
      const s2 = { ...s1, myRequests: [completedRequest] };
      
      const { state: s3 } = receiveAssist(s2, request!.id)!;
      // 第一次领取后请求状态变为 expired，第二次应失败
      const result = receiveAssist(s3, request!.id);
      expect(result.success).toBe(false);
      // 错误可能是"已领取"或"未完成"（因为状态变为 expired）
      expect(result.error).toBeTruthy();
    });
  });

  // ==================== 取消/拒绝测试 ====================
  describe('取消/拒绝', () => {
    it('应能取消 pending 请求', () => {
      const { state: s1, request } = createAssistRequest(state, 'battle', 'Player1');
      const result = cancelRequest(s1, request!.id);
      expect(result.success).toBe(true);
      expect(result.state.myRequests).toHaveLength(0);
    });

    it('已处理的请求无法取消', () => {
      const { state: s1, request } = createAssistRequest(state, 'battle', 'Player1');
      const modified = { ...request!, status: 'accepted' as const };
      const s2 = { ...s1, myRequests: [modified] };
      
      const result = cancelRequest(s2, request!.id);
      expect(result.success).toBe(false);
    });

    it('应能拒绝请求', () => {
      const { state: s1, request } = createAssistRequest(state, 'battle', 'Player1');
      const received = { ...request!, requesterId: 'player_002' };
      const s2 = { ...s1, receivedRequests: [received] };
      
      const result = declineRequest(s2, request!.id);
      expect(result.success).toBe(true);
      expect(result.state.receivedRequests[0].status).toBe('declined');
    });
  });

  // ==================== 查询功能测试 ====================
  describe('查询功能', () => {
    it('获取可接受请求', () => {
      const { state: s1, request } = createAssistRequest(state, 'battle', 'Player1');
      const received = { ...request!, requesterId: 'player_002' };
      const s2 = { ...s1, receivedRequests: [received] };
      
      const available = getAvailableRequests(s2);
      expect(available).toHaveLength(1);
    });

    it('获取我的活跃请求', () => {
      const { state: s1 } = createAssistRequest(state, 'battle', 'Player1');
      const active = getMyActiveRequests(s1);
      expect(active).toHaveLength(1);
    });

    it('过期请求不应出现在活跃列表', () => {
      const { state: s1, request } = createAssistRequest(state, 'battle', 'Player1');
      const expired = { ...request!, expiresAt: Date.now() - 1000 };
      const s2 = { ...s1, myRequests: [expired] };
      
      const active = getMyActiveRequests(s2);
      expect(active).toHaveLength(0);
    });

    it('获取助力统计', () => {
      state.todayAssists = 3;
      state.todayReceived = 2;
      state.assistPoints = 50;
      
      const stats = getAssistStats(state);
      expect(stats.todayAssists).toBe(3);
      expect(stats.todayReceived).toBe(2);
      expect(stats.assistPoints).toBe(50);
      expect(stats.remainingAssists).toBe(ASSIST_CONFIG.dailyAssistLimit - 3);
    });
  });

  // ==================== 点数兑换测试 ====================
  describe('点数兑换', () => {
    it('点数足够应能兑换', () => {
      state.assistPoints = 100;
      const result = redeemAssistPoints(state, 50, { gold: 1000 });
      expect(result.success).toBe(true);
      expect(result.state.assistPoints).toBe(50);
    });

    it('点数不足应失败', () => {
      state.assistPoints = 10;
      const result = redeemAssistPoints(state, 50, { gold: 1000 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('不足');
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回 JSON', () => {
      const json = exportAssistData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      state.assistPoints = 99;
      const json = exportAssistData(state);
      const imported = importAssistData(json);
      expect(imported).toBeDefined();
      expect(imported!.assistPoints).toBe(99);
    });

    it('无效数据应返回 null', () => {
      expect(importAssistData('nope')).toBeNull();
      expect(importAssistData('{}')).toBeNull();
    });
  });

  // ==================== 边界情况测试 ====================
  describe('边界情况', () => {
    it('历史记录应限制 100 条', () => {
      let s = state;
      for (let i = 0; i < 105; i++) {
        const { state: s1, request } = createAssistRequest(s, 'battle', `Player${i}`);
        const completed = { ...request!, status: 'completed' as const, acceptedBy: 'Helper' };
        const s2 = { ...s1, myRequests: [completed] };
        const { state: s3 } = receiveAssist(s2, request!.id);
        s = s3!;
      }
      expect(s.history.length).toBeLessThanOrEqual(100);
    });

    it('不存在的请求操作应安全返回', () => {
      const result = completeAssist(state, 'nonexistent');
      expect(result.success).toBe(false);
    });

    it('助力类型模板应包含必要字段', () => {
      Object.values(ASSIST_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('reward');
        expect(template.reward).toHaveProperty('requester');
        expect(template.reward).toHaveProperty('helper');
      });
    });
  });
});
