// 组队副本系统 - v0.67
// Team Raid / 多人协作BOSS挑战

/**
 * 副本难度
 */
export type RaidDifficulty = 'normal' | 'hard' | 'nightmare' | 'hell';

/**
 * 副本状态
 */
export type RaidStatus = 'waiting' | 'inProgress' | 'completed' | 'failed' | 'expired';

/**
 * 副本BOSS配置
 */
export interface RaidBossConfig {
  id: string;
  name: string;
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  /** 技能列表 */
  skills: string[];
  /** 掉落奖励 */
  drops: RaidDrop[];
}

/**
 * 副本掉落
 */
export interface RaidDrop {
  type: 'gold' | 'diamond' | 'exp' | 'equipBox' | 'petShard' | 'heroShard' | 'material';
  amount: number;
  probability: number; // 0-1
  name: string;
}

/**
 * 副本配置
 */
export interface RaidConfig {
  id: string;
  name: string;
  description: string;
  difficulty: RaidDifficulty;
  boss: RaidBossConfig;
  /** 最少参与人数 */
  minPlayers: number;
  /** 最多参与人数 */
  maxPlayers: number;
  /** 推荐战力 */
  recommendedPower: number;
  /** 时间限制（秒） */
  timeLimit: number;
  /** 每日挑战次数 */
  dailyAttempts: number;
  /** 难度系数 */
  difficultyMultiplier: number;
}

/**
 * 队伍成员
 */
export interface RaidMember {
  playerId: string;
  name: string;
  power: number;
  damage: number;
  isReady: boolean;
  joinedAt: number;
}

/**
 * 副本房间
 */
export interface RaidRoom {
  id: string;
  raidId: string;
  hostId: string;
  members: RaidMember[];
  status: RaidStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  /** BOSS当前血量 */
  bossCurrentHp: number;
  bossMaxHp: number;
  /** 战斗回合 */
  rounds: number;
  /** 总伤害 */
  totalDamage: number;
  /** 掉落结果 */
  drops?: { playerId: string; items: RaidDrop[] }[];
}

/**
 * 组队副本系统状态
 */
export interface TeamRaidState {
  /** 所有房间 */
  rooms: Record<string, RaidRoom>;
  /** 玩家今日已用次数 */
  playerAttempts: Record<string, Record<string, number>>; // playerId -> raidId -> count
  /** 最后重置日期 */
  lastResetDate: string;
  /** 全局统计 */
  stats: {
    totalRaids: number;
    totalClears: number;
    totalDamage: number;
  };
}

// ==================== 副本配置 ====================

const RAID_BOSSES: Record<string, RaidBossConfig> = {
  boss_fire_dragon: {
    id: 'boss_fire_dragon',
    name: '烈焰巨龙',
    element: 'fire',
    baseHp: 100000,
    baseAttack: 500,
    baseDefense: 300,
    skills: ['火焰吐息', '龙翼横扫', '烈焰风暴'],
    drops: [
      { type: 'gold', amount: 10000, probability: 1, name: '金币×10000' },
      { type: 'exp', amount: 5000, probability: 1, name: '经验×5000' },
      { type: 'equipBox', amount: 1, probability: 0.3, name: '装备宝箱' },
      { type: 'heroShard', amount: 5, probability: 0.1, name: '英雄碎片×5' },
    ],
  },
  boss_ice_titan: {
    id: 'boss_ice_titan',
    name: '冰霜泰坦',
    element: 'water',
    baseHp: 150000,
    baseAttack: 400,
    baseDefense: 500,
    skills: ['冰冻之握', '暴风雪', '冰盾'],
    drops: [
      { type: 'gold', amount: 15000, probability: 1, name: '金币×15000' },
      { type: 'exp', amount: 8000, probability: 1, name: '经验×8000' },
      { type: 'petShard', amount: 10, probability: 0.25, name: '宠物碎片×10' },
      { type: 'diamond', amount: 50, probability: 0.15, name: '钻石×50' },
    ],
  },
  boss_earth_golem: {
    id: 'boss_earth_golem',
    name: '大地魔像',
    element: 'earth',
    baseHp: 200000,
    baseAttack: 350,
    baseDefense: 700,
    skills: ['岩石碎击', '地震', '石化之眼'],
    drops: [
      { type: 'gold', amount: 20000, probability: 1, name: '金币×20000' },
      { type: 'exp', amount: 10000, probability: 1, name: '经验×10000' },
      { type: 'material', amount: 5, probability: 0.4, name: '强化石×5' },
      { type: 'heroShard', amount: 10, probability: 0.08, name: '英雄碎片×10' },
    ],
  },
  boss_shadow_lord: {
    id: 'boss_shadow_lord',
    name: '暗影领主',
    element: 'dark',
    baseHp: 300000,
    baseAttack: 600,
    baseDefense: 400,
    skills: ['暗影吞噬', '灵魂收割', '黑暗领域', '不死重生'],
    drops: [
      { type: 'gold', amount: 30000, probability: 1, name: '金币×30000' },
      { type: 'diamond', amount: 100, probability: 0.5, name: '钻石×100' },
      { type: 'heroShard', amount: 20, probability: 0.05, name: '传说英雄碎片×20' },
      { type: 'equipBox', amount: 3, probability: 0.2, name: '高级装备宝箱×3' },
    ],
  },
};

export const RAID_CONFIGS: Record<string, RaidConfig> = {
  raid_fire_normal: {
    id: 'raid_fire_normal', name: '烈焰巨龙（普通）', description: '挑战烈焰巨龙',
    difficulty: 'normal', boss: RAID_BOSSES['boss_fire_dragon'],
    minPlayers: 2, maxPlayers: 4, recommendedPower: 5000, timeLimit: 300,
    dailyAttempts: 3, difficultyMultiplier: 1,
  },
  raid_fire_hard: {
    id: 'raid_fire_hard', name: '烈焰巨龙（困难）', description: '困难模式挑战烈焰巨龙',
    difficulty: 'hard', boss: RAID_BOSSES['boss_fire_dragon'],
    minPlayers: 3, maxPlayers: 5, recommendedPower: 10000, timeLimit: 240,
    dailyAttempts: 2, difficultyMultiplier: 2,
  },
  raid_ice_normal: {
    id: 'raid_ice_normal', name: '冰霜泰坦（普通）', description: '挑战冰霜泰坦',
    difficulty: 'normal', boss: RAID_BOSSES['boss_ice_titan'],
    minPlayers: 3, maxPlayers: 5, recommendedPower: 8000, timeLimit: 360,
    dailyAttempts: 3, difficultyMultiplier: 1,
  },
  raid_earth_hard: {
    id: 'raid_earth_hard', name: '大地魔像（困难）', description: '困难模式挑战大地魔像',
    difficulty: 'hard', boss: RAID_BOSSES['boss_earth_golem'],
    minPlayers: 3, maxPlayers: 5, recommendedPower: 15000, timeLimit: 300,
    dailyAttempts: 2, difficultyMultiplier: 2,
  },
  raid_shadow_nightmare: {
    id: 'raid_shadow_nightmare', name: '暗影领主（噩梦）', description: '噩梦模式挑战暗影领主',
    difficulty: 'nightmare', boss: RAID_BOSSES['boss_shadow_lord'],
    minPlayers: 4, maxPlayers: 6, recommendedPower: 25000, timeLimit: 360,
    dailyAttempts: 1, difficultyMultiplier: 3,
  },
};

export const DIFFICULTY_NAMES: Record<RaidDifficulty, string> = {
  normal: '普通',
  hard: '困难',
  nightmare: '噩梦',
  hell: '地狱',
};

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let roomCounter = 0;
export function generateRoomId(): string {
  return `room_${Date.now()}_${++roomCounter}`;
}

// ==================== 核心函数 ====================

/**
 * 创建组队副本状态
 */
export function createTeamRaidState(now?: number): TeamRaidState {
  return {
    rooms: {},
    playerAttempts: {},
    lastResetDate: getTodayStr(now),
    stats: { totalRaids: 0, totalClears: 0, totalDamage: 0 },
  };
}

/**
 * 检查每日重置
 */
export function checkDailyReset(state: TeamRaidState, now?: number): TeamRaidState {
  const today = getTodayStr(now);
  if (today === state.lastResetDate) return state;
  return {
    ...state,
    playerAttempts: {},
    lastResetDate: today,
  };
}

/**
 * 获取玩家剩余次数
 */
export function getPlayerAttemptsLeft(state: TeamRaidState, playerId: string, raidId: string): number {
  const config = RAID_CONFIGS[raidId];
  if (!config) return 0;
  const used = state.playerAttempts[playerId]?.[raidId] || 0;
  return Math.max(0, config.dailyAttempts - used);
}

/**
 * 创建房间
 */
export function createRoom(
  state: TeamRaidState,
  raidId: string,
  hostId: string,
  hostName: string,
  hostPower: number,
  now?: number
): { state: TeamRaidState; room: RaidRoom | null; error?: string } {
  const config = RAID_CONFIGS[raidId];
  if (!config) return { state, room: null, error: '副本不存在' };

  if (getPlayerAttemptsLeft(state, hostId, raidId) <= 0) {
    return { state, room: null, error: '今日挑战次数已用完' };
  }

  // Check if player is already in a room
  const existingRoom = Object.values(state.rooms).find(
    r => r.status === 'waiting' && r.members.some(m => m.playerId === hostId)
  );
  if (existingRoom) return { state, room: null, error: '已在其他房间中' };

  const roomId = generateRoomId();
  const bossHp = Math.round(config.boss.baseHp * config.difficultyMultiplier);

  const room: RaidRoom = {
    id: roomId,
    raidId,
    hostId,
    members: [{
      playerId: hostId,
      name: hostName,
      power: hostPower,
      damage: 0,
      isReady: true,
      joinedAt: now ?? Date.now(),
    }],
    status: 'waiting',
    createdAt: now ?? Date.now(),
    bossCurrentHp: bossHp,
    bossMaxHp: bossHp,
    rounds: 0,
    totalDamage: 0,
  };

  return {
    state: { ...state, rooms: { ...state.rooms, [roomId]: room } },
    room,
  };
}

/**
 * 加入房间
 */
export function joinRoom(
  state: TeamRaidState,
  roomId: string,
  playerId: string,
  playerName: string,
  playerPower: number,
  now?: number
): { state: TeamRaidState; success: boolean; error?: string } {
  const room = state.rooms[roomId];
  if (!room) return { state, success: false, error: '房间不存在' };
  if (room.status !== 'waiting') return { state, success: false, error: '房间已开始或结束' };

  const config = RAID_CONFIGS[room.raidId];
  if (room.members.length >= config.maxPlayers) return { state, success: false, error: '房间已满' };

  if (room.members.some(m => m.playerId === playerId)) {
    return { state, success: false, error: '已在房间中' };
  }

  if (getPlayerAttemptsLeft(state, playerId, room.raidId) <= 0) {
    return { state, success: false, error: '今日挑战次数已用完' };
  }

  const newRoom: RaidRoom = {
    ...room,
    members: [...room.members, {
      playerId,
      name: playerName,
      power: playerPower,
      damage: 0,
      isReady: false,
      joinedAt: now ?? Date.now(),
    }],
  };

  return {
    state: { ...state, rooms: { ...state.rooms, [roomId]: newRoom } },
    success: true,
  };
}

/**
 * 离开房间
 */
export function leaveRoom(
  state: TeamRaidState,
  roomId: string,
  playerId: string
): { state: TeamRaidState; success: boolean; error?: string } {
  const room = state.rooms[roomId];
  if (!room) return { state, success: false, error: '房间不存在' };
  if (room.status !== 'waiting') return { state, success: false, error: '战斗中无法离开' };

  const newMembers = room.members.filter(m => m.playerId !== playerId);

  // 如果房主离开，解散房间
  if (playerId === room.hostId || newMembers.length === 0) {
    const newRooms = { ...state.rooms };
    delete newRooms[roomId];
    return { state: { ...state, rooms: newRooms }, success: true };
  }

  return {
    state: {
      ...state,
      rooms: { ...state.rooms, [roomId]: { ...room, members: newMembers } },
    },
    success: true,
  };
}

/**
 * 准备/取消准备
 */
export function toggleReady(
  state: TeamRaidState,
  roomId: string,
  playerId: string
): { state: TeamRaidState; success: boolean; isReady: boolean } {
  const room = state.rooms[roomId];
  if (!room || room.status !== 'waiting') return { state, success: false, isReady: false };

  const newMembers = room.members.map(m =>
    m.playerId === playerId ? { ...m, isReady: !m.isReady } : m
  );

  const member = newMembers.find(m => m.playerId === playerId);
  if (!member) return { state, success: false, isReady: false };

  return {
    state: {
      ...state,
      rooms: { ...state.rooms, [roomId]: { ...room, members: newMembers } },
    },
    success: true,
    isReady: member.isReady,
  };
}

/**
 * 开始战斗
 */
export function startRaid(
  state: TeamRaidState,
  roomId: string,
  playerId: string,
  now?: number
): { state: TeamRaidState; success: boolean; error?: string } {
  const room = state.rooms[roomId];
  if (!room) return { state, success: false, error: '房间不存在' };
  if (room.status !== 'waiting') return { state, success: false, error: '已开始' };
  if (playerId !== room.hostId) return { state, success: false, error: '只有房主可以开始' };

  const config = RAID_CONFIGS[room.raidId];
  if (room.members.length < config.minPlayers) {
    return { state, success: false, error: `至少需要${config.minPlayers}人` };
  }

  const allReady = room.members.every(m => m.isReady);
  if (!allReady) return { state, success: false, error: '还有成员未准备' };

  const newRoom: RaidRoom = {
    ...room,
    status: 'inProgress',
    startedAt: now ?? Date.now(),
  };

  return {
    state: { ...state, rooms: { ...state.rooms, [roomId]: newRoom } },
    success: true,
  };
}

/**
 * 模拟一轮战斗
 */
export function simulateRound(
  state: TeamRaidState,
  roomId: string,
  rng?: () => number
): { state: TeamRaidState; roundDamage: number; bossHpPercent: number; finished: boolean } {
  const room = state.rooms[roomId];
  if (!room || room.status !== 'inProgress') {
    return { state, roundDamage: 0, bossHpPercent: 100, finished: false };
  }

  const rand = rng ?? Math.random;
  const config = RAID_CONFIGS[room.raidId];
  let roundDamage = 0;

  const newMembers = room.members.map(m => {
    // 基于战力计算伤害（带随机波动）
    const baseDmg = Math.round(m.power * (0.8 + rand() * 0.4));
    const dmg = Math.max(1, baseDmg - Math.round(config.boss.baseDefense * config.difficultyMultiplier * 0.1));
    roundDamage += dmg;
    return { ...m, damage: m.damage + dmg };
  });

  const newBossHp = Math.max(0, room.bossCurrentHp - roundDamage);
  const finished = newBossHp <= 0;

  const newRoom: RaidRoom = {
    ...room,
    members: newMembers,
    bossCurrentHp: newBossHp,
    rounds: room.rounds + 1,
    totalDamage: room.totalDamage + roundDamage,
    status: finished ? 'completed' : room.status,
    completedAt: finished ? Date.now() : undefined,
  };

  return {
    state: { ...state, rooms: { ...state.rooms, [roomId]: newRoom } },
    roundDamage,
    bossHpPercent: Math.round((newBossHp / room.bossMaxHp) * 100),
    finished,
  };
}

/**
 * 结算副本（计算掉落并消耗次数）
 */
export function settleRaid(
  state: TeamRaidState,
  roomId: string,
  rng?: () => number
): { state: TeamRaidState; success: boolean; drops: { playerId: string; items: RaidDrop[] }[]; error?: string } {
  const room = state.rooms[roomId];
  if (!room) return { state, success: false, drops: [], error: '房间不存在' };
  if (room.status !== 'completed') return { state, success: false, drops: [], error: '副本未完成' };
  if (room.drops) return { state, success: false, drops: [], error: '已结算' };

  const rand = rng ?? Math.random;
  const config = RAID_CONFIGS[room.raidId];
  const allDrops: { playerId: string; items: RaidDrop[] }[] = [];

  // 每个玩家独立计算掉落
  for (const member of room.members) {
    const items: RaidDrop[] = [];
    for (const drop of config.boss.drops) {
      if (rand() < drop.probability) {
        // 伤害贡献比例加成
        const contribution = room.totalDamage > 0 ? member.damage / room.totalDamage : 1 / room.members.length;
        const amount = Math.max(1, Math.round(drop.amount * (0.5 + contribution)));
        items.push({ ...drop, amount });
      }
    }
    allDrops.push({ playerId: member.playerId, items });
  }

  // 消耗次数
  const newAttempts = { ...state.playerAttempts };
  for (const member of room.members) {
    if (!newAttempts[member.playerId]) newAttempts[member.playerId] = {};
    newAttempts[member.playerId][room.raidId] = (newAttempts[member.playerId][room.raidId] || 0) + 1;
  }

  const newRoom: RaidRoom = { ...room, drops: allDrops };

  return {
    state: {
      ...state,
      rooms: { ...state.rooms, [roomId]: newRoom },
      playerAttempts: newAttempts,
      stats: {
        totalRaids: state.stats.totalRaids + 1,
        totalClears: state.stats.totalClears + 1,
        totalDamage: state.stats.totalDamage + room.totalDamage,
      },
    },
    success: true,
    drops: allDrops,
  };
}

/**
 * 获取可用副本列表
 */
export function getAvailableRaids(state: TeamRaidState, playerId: string): { config: RaidConfig; attemptsLeft: number }[] {
  return Object.values(RAID_CONFIGS).map(config => ({
    config,
    attemptsLeft: getPlayerAttemptsLeft(state, playerId, config.id),
  }));
}

/**
 * 获取等待中的房间列表
 */
export function getWaitingRooms(state: TeamRaidState): RaidRoom[] {
  return Object.values(state.rooms).filter(r => r.status === 'waiting');
}

/**
 * 获取副本统计
 */
export function getRaidStats(state: TeamRaidState): {
  totalRaids: number;
  totalClears: number;
  totalDamage: number;
  activeRooms: number;
  waitingRooms: number;
} {
  const rooms = Object.values(state.rooms);
  return {
    ...state.stats,
    activeRooms: rooms.filter(r => r.status === 'inProgress').length,
    waitingRooms: rooms.filter(r => r.status === 'waiting').length,
  };
}

/**
 * 清理已完成/过期的房间
 */
export function cleanupRooms(state: TeamRaidState, maxAge: number = 3600000): TeamRaidState {
  const now = Date.now();
  const newRooms: Record<string, RaidRoom> = {};
  for (const [id, room] of Object.entries(state.rooms)) {
    if (room.status === 'waiting' || room.status === 'inProgress') {
      newRooms[id] = room;
    } else if (now - room.createdAt < maxAge) {
      newRooms[id] = room;
    }
  }
  return { ...state, rooms: newRooms };
}

/**
 * 获取难度名称
 */
export function getDifficultyName(difficulty: RaidDifficulty): string {
  return DIFFICULTY_NAMES[difficulty];
}

/**
 * 导出数据
 */
export function exportTeamRaidData(state: TeamRaidState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importTeamRaidData(json: string): TeamRaidState | null {
  try {
    const data = JSON.parse(json);
    if (!data.rooms || !data.stats) return null;
    return data as TeamRaidState;
  } catch {
    return null;
  }
}
