// 组队副本系统测试 - v0.67

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  RAID_CONFIGS,
  DIFFICULTY_NAMES,
  createTeamRaidState,
  checkDailyReset,
  getPlayerAttemptsLeft,
  createRoom,
  joinRoom,
  leaveRoom,
  toggleReady,
  startRaid,
  simulateRound,
  settleRaid,
  getAvailableRaids,
  getWaitingRooms,
  getRaidStats,
  cleanupRooms,
  getDifficultyName,
  exportTeamRaidData,
  importTeamRaidData,
  type TeamRaidState,
} from './teamRaid';

describe('组队副本系统 v0.67', () => {
  let state: TeamRaidState;

  beforeEach(() => {
    state = createTeamRaidState();
  });

  // ==================== 配置测试 ====================
  describe('副本配置', () => {
    it('应包含多个副本', () => {
      expect(Object.keys(RAID_CONFIGS).length).toBeGreaterThanOrEqual(3);
    });

    it('每个副本应包含必要字段', () => {
      Object.values(RAID_CONFIGS).forEach(config => {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('boss');
        expect(config).toHaveProperty('minPlayers');
        expect(config).toHaveProperty('maxPlayers');
        expect(config.minPlayers).toBeLessThanOrEqual(config.maxPlayers);
        expect(config.dailyAttempts).toBeGreaterThan(0);
      });
    });

    it('BOSS应有技能和掉落', () => {
      Object.values(RAID_CONFIGS).forEach(config => {
        expect(config.boss.skills.length).toBeGreaterThan(0);
        expect(config.boss.drops.length).toBeGreaterThan(0);
      });
    });

    it('难度名称应完整', () => {
      expect(getDifficultyName('normal')).toBe('普通');
      expect(getDifficultyName('hard')).toBe('困难');
      expect(getDifficultyName('nightmare')).toBe('噩梦');
      expect(getDifficultyName('hell')).toBe('地狱');
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建空状态', () => {
      expect(Object.keys(state.rooms)).toHaveLength(0);
      expect(state.stats.totalRaids).toBe(0);
    });

    it('玩家应有完整次数', () => {
      const left = getPlayerAttemptsLeft(state, 'player_001', 'raid_fire_normal');
      expect(left).toBe(RAID_CONFIGS['raid_fire_normal'].dailyAttempts);
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('同一天不需要重置', () => {
      const result = checkDailyReset(state);
      expect(result.lastResetDate).toBe(state.lastResetDate);
    });

    it('跨天应重置次数', () => {
      state.lastResetDate = '2020-01-01';
      state.playerAttempts = { 'player_001': { 'raid_fire_normal': 3 } };
      const result = checkDailyReset(state);
      expect(Object.keys(result.playerAttempts)).toHaveLength(0);
    });
  });

  // ==================== 房间创建测试 ====================
  describe('房间创建', () => {
    it('应成功创建房间', () => {
      const result = createRoom(state, 'raid_fire_normal', 'player_001', '玩家1', 5000);
      expect(result.room).toBeDefined();
      expect(result.room!.hostId).toBe('player_001');
      expect(result.room!.status).toBe('waiting');
      expect(result.room!.members).toHaveLength(1);
    });

    it('不存在的副本应失败', () => {
      const result = createRoom(state, 'nonexistent', 'player_001', '玩家1', 5000);
      expect(result.room).toBeNull();
      expect(result.error).toContain('不存在');
    });

    it('次数用完应失败', () => {
      state.playerAttempts = { 'player_001': { 'raid_fire_normal': 3 } };
      const result = createRoom(state, 'raid_fire_normal', 'player_001', '玩家1', 5000);
      expect(result.room).toBeNull();
      expect(result.error).toContain('次数');
    });

    it('已在房间中应失败', () => {
      const { state: s1 } = createRoom(state, 'raid_fire_normal', 'player_001', '玩家1', 5000);
      const result = createRoom(s1, 'raid_fire_normal', 'player_001', '玩家1', 5000);
      expect(result.room).toBeNull();
      expect(result.error).toContain('已在');
    });
  });

  // ==================== 加入/离开房间测试 ====================
  describe('加入/离开房间', () => {
    let roomId: string;
    let stateWithRoom: TeamRaidState;

    beforeEach(() => {
      const result = createRoom(state, 'raid_fire_normal', 'host', '房主', 5000);
      stateWithRoom = result.state;
      roomId = result.room!.id;
    });

    it('应成功加入房间', () => {
      const result = joinRoom(stateWithRoom, roomId, 'player_002', '玩家2', 4000);
      expect(result.success).toBe(true);
      expect(result.state.rooms[roomId].members).toHaveLength(2);
    });

    it('重复加入应失败', () => {
      const { state: s1 } = joinRoom(stateWithRoom, roomId, 'player_002', '玩家2', 4000);
      const result = joinRoom(s1, roomId, 'player_002', '玩家2', 4000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('已在');
    });

    it('房间满员应失败', () => {
      let s = stateWithRoom;
      const maxPlayers = RAID_CONFIGS['raid_fire_normal'].maxPlayers;
      for (let i = 2; i <= maxPlayers; i++) {
        const { state: newState } = joinRoom(s, roomId, `player_${i}`, `玩家${i}`, 4000);
        s = newState;
      }
      const result = joinRoom(s, roomId, 'player_extra', '额外', 4000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('满');
    });

    it('普通成员离开应成功', () => {
      const { state: s1 } = joinRoom(stateWithRoom, roomId, 'player_002', '玩家2', 4000);
      const result = leaveRoom(s1, roomId, 'player_002');
      expect(result.success).toBe(true);
      expect(result.state.rooms[roomId].members).toHaveLength(1);
    });

    it('房主离开应解散房间', () => {
      const result = leaveRoom(stateWithRoom, roomId, 'host');
      expect(result.success).toBe(true);
      expect(result.state.rooms[roomId]).toBeUndefined();
    });
  });

  // ==================== 准备/开始测试 ====================
  describe('准备与开始', () => {
    let roomId: string;
    let stateWith2: TeamRaidState;

    beforeEach(() => {
      const { state: s1, room } = createRoom(state, 'raid_fire_normal', 'host', '房主', 5000);
      roomId = room!.id;
      const { state: s2 } = joinRoom(s1, roomId, 'player_002', '玩家2', 4000);
      stateWith2 = s2;
    });

    it('应能切换准备状态', () => {
      const result = toggleReady(stateWith2, roomId, 'player_002');
      expect(result.success).toBe(true);
      expect(result.isReady).toBe(true);
    });

    it('非房主不能开始', () => {
      const result = startRaid(stateWith2, roomId, 'player_002');
      expect(result.success).toBe(false);
      expect(result.error).toContain('房主');
    });

    it('未全部准备不能开始', () => {
      const result = startRaid(stateWith2, roomId, 'host');
      expect(result.success).toBe(false);
      expect(result.error).toContain('准备');
    });

    it('全部准备后可以开始', () => {
      const { state: s1 } = toggleReady(stateWith2, roomId, 'player_002');
      const result = startRaid(s1, roomId, 'host');
      expect(result.success).toBe(true);
      expect(result.state.rooms[roomId].status).toBe('inProgress');
    });

    it('人数不足不能开始', () => {
      // 创建一个需要3人的副本房间
      const { state: s1, room } = createRoom(state, 'raid_ice_normal', 'host', '房主', 8000);
      const iceRoomId = room!.id;
      const { state: s2 } = joinRoom(s1, iceRoomId, 'p2', '玩家2', 7000);
      const { state: s3 } = toggleReady(s2, iceRoomId, 'p2');
      const result = startRaid(s3, iceRoomId, 'host');
      expect(result.success).toBe(false);
      expect(result.error).toContain('至少');
    });
  });

  // ==================== 战斗模拟测试 ====================
  describe('战斗模拟', () => {
    let roomId: string;
    let battleState: TeamRaidState;

    beforeEach(() => {
      const { state: s1, room } = createRoom(state, 'raid_fire_normal', 'host', '房主', 5000);
      roomId = room!.id;
      const { state: s2 } = joinRoom(s1, roomId, 'p2', '玩家2', 4000);
      const { state: s3 } = toggleReady(s2, roomId, 'p2');
      const { state: s4 } = startRaid(s3, roomId, 'host');
      battleState = s4;
    });

    it('应造成伤害', () => {
      const result = simulateRound(battleState, roomId, () => 0.5);
      expect(result.roundDamage).toBeGreaterThan(0);
      expect(result.bossHpPercent).toBeLessThan(100);
    });

    it('多轮战斗应累计伤害', () => {
      let s = battleState;
      for (let i = 0; i < 5; i++) {
        const { state: newState } = simulateRound(s, roomId, () => 0.5);
        s = newState;
      }
      expect(s.rooms[roomId].rounds).toBe(5);
      expect(s.rooms[roomId].totalDamage).toBeGreaterThan(0);
    });

    it('每个成员应有独立伤害', () => {
      const { state: s1 } = simulateRound(battleState, roomId, () => 0.5);
      const members = s1.rooms[roomId].members;
      members.forEach(m => expect(m.damage).toBeGreaterThan(0));
    });

    it('BOSS死亡应完成副本', () => {
      let s = battleState;
      let finished = false;
      for (let i = 0; i < 1000 && !finished; i++) {
        const result = simulateRound(s, roomId, () => 0.9);
        s = result.state;
        finished = result.finished;
      }
      expect(finished).toBe(true);
      expect(s.rooms[roomId].status).toBe('completed');
    });
  });

  // ==================== 结算测试 ====================
  describe('副本结算', () => {
    let roomId: string;
    let completedState: TeamRaidState;

    beforeEach(() => {
      const { state: s1, room } = createRoom(state, 'raid_fire_normal', 'host', '房主', 50000);
      roomId = room!.id;
      const { state: s2 } = joinRoom(s1, roomId, 'p2', '玩家2', 40000);
      const { state: s3 } = toggleReady(s2, roomId, 'p2');
      const { state: s4 } = startRaid(s3, roomId, 'host');

      // 快速击杀
      let s = s4;
      let finished = false;
      for (let i = 0; i < 100 && !finished; i++) {
        const result = simulateRound(s, roomId, () => 0.9);
        s = result.state;
        finished = result.finished;
      }
      completedState = s;
    });

    it('应成功结算', () => {
      const result = settleRaid(completedState, roomId, () => 0.5);
      expect(result.success).toBe(true);
      expect(result.drops.length).toBe(2); // 2 players
    });

    it('结算应消耗次数', () => {
      const { state: s1 } = settleRaid(completedState, roomId, () => 0.5);
      expect(getPlayerAttemptsLeft(s1, 'host', 'raid_fire_normal')).toBeLessThan(
        RAID_CONFIGS['raid_fire_normal'].dailyAttempts
      );
    });

    it('结算应更新统计', () => {
      const { state: s1 } = settleRaid(completedState, roomId, () => 0.5);
      expect(s1.stats.totalRaids).toBe(1);
      expect(s1.stats.totalClears).toBe(1);
    });

    it('重复结算应失败', () => {
      const { state: s1 } = settleRaid(completedState, roomId, () => 0.5);
      const result = settleRaid(s1, roomId, () => 0.5);
      expect(result.success).toBe(false);
      expect(result.error).toContain('已结算');
    });

    it('每个玩家应获得掉落', () => {
      const result = settleRaid(completedState, roomId, () => 0.01); // 高掉率
      result.drops.forEach(d => {
        expect(d.items.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== 查询功能测试 ====================
  describe('查询功能', () => {
    it('获取可用副本列表', () => {
      const raids = getAvailableRaids(state, 'player_001');
      expect(raids.length).toBe(Object.keys(RAID_CONFIGS).length);
      raids.forEach(r => expect(r.attemptsLeft).toBeGreaterThan(0));
    });

    it('获取等待中的房间', () => {
      const { state: s1 } = createRoom(state, 'raid_fire_normal', 'host', '房主', 5000);
      const rooms = getWaitingRooms(s1);
      expect(rooms).toHaveLength(1);
    });

    it('获取统计信息', () => {
      const stats = getRaidStats(state);
      expect(stats.totalRaids).toBe(0);
      expect(stats.activeRooms).toBe(0);
    });
  });

  // ==================== 房间清理测试 ====================
  describe('房间清理', () => {
    it('应保留活跃房间', () => {
      const { state: s1 } = createRoom(state, 'raid_fire_normal', 'host', '房主', 5000);
      const cleaned = cleanupRooms(s1);
      expect(Object.keys(cleaned.rooms)).toHaveLength(1);
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportTeamRaidData(state);
      expect(typeof json).toBe('string');
    });

    it('导入应还原数据', () => {
      state.stats.totalRaids = 42;
      const json = exportTeamRaidData(state);
      const imported = importTeamRaidData(json);
      expect(imported).toBeDefined();
      expect(imported!.stats.totalRaids).toBe(42);
    });

    it('无效数据应返回null', () => {
      expect(importTeamRaidData('bad')).toBeNull();
      expect(importTeamRaidData('{}')).toBeNull();
    });
  });

  // ==================== 边界情况 ====================
  describe('边界情况', () => {
    it('非战斗状态模拟应安全返回', () => {
      const { state: s1, room } = createRoom(state, 'raid_fire_normal', 'host', '房主', 5000);
      const result = simulateRound(s1, room!.id);
      expect(result.roundDamage).toBe(0);
    });

    it('战斗中不能离开', () => {
      const { state: s1, room } = createRoom(state, 'raid_fire_normal', 'host', '房主', 5000);
      const roomId = room!.id;
      const { state: s2 } = joinRoom(s1, roomId, 'p2', '玩家2', 4000);
      const { state: s3 } = toggleReady(s2, roomId, 'p2');
      const { state: s4 } = startRaid(s3, roomId, 'host');
      const result = leaveRoom(s4, roomId, 'p2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('战斗中');
    });
  });
});
