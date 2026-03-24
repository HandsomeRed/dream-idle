// 公会系统 - v0.69
// Guild / Clan system for single-player with NPC members

/**
 * 公会等级配置
 */
export interface GuildLevelConfig {
  level: number;
  expRequired: number;
  maxMembers: number;
  perks: string[];
}

/**
 * 公会成员（NPC）
 */
export interface GuildMember {
  id: string;
  name: string;
  role: 'leader' | 'officer' | 'elite' | 'member';
  level: number;
  power: number;
  joinedAt: number;
  lastActive: number;
  contribution: number;
  isPlayer: boolean;
}

/**
 * 公会技能
 */
export interface GuildSkill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  /** 每级效果值 */
  effectPerLevel: number;
  /** 升级消耗公会资金 */
  upgradeCost: number;
}

/**
 * 公会捐献记录
 */
export interface DonationRecord {
  memberId: string;
  amount: number;
  type: 'gold' | 'diamond';
  timestamp: number;
}

/**
 * 公会状态
 */
export interface GuildState {
  id: string;
  name: string;
  level: number;
  exp: number;
  funds: number; // 公会资金
  members: GuildMember[];
  skills: GuildSkill[];
  donations: DonationRecord[];
  createdAt: number;
  announcement: string;
  /** 每日签到 */
  dailyCheckins: Record<string, string>; // memberId -> dateStr
  lastResetDate: string;
}

// ==================== 配置 ====================

export const GUILD_LEVELS: GuildLevelConfig[] = [
  { level: 1, expRequired: 0, maxMembers: 10, perks: ['基础公会'] },
  { level: 2, expRequired: 1000, maxMembers: 15, perks: ['公会技能Lv1'] },
  { level: 3, expRequired: 3000, maxMembers: 20, perks: ['公会商店'] },
  { level: 4, expRequired: 6000, maxMembers: 25, perks: ['公会副本'] },
  { level: 5, expRequired: 10000, maxMembers: 30, perks: ['公会战'] },
  { level: 6, expRequired: 20000, maxMembers: 35, perks: ['高级技能'] },
  { level: 7, expRequired: 35000, maxMembers: 40, perks: ['公会拍卖'] },
  { level: 8, expRequired: 55000, maxMembers: 45, perks: ['公会领地'] },
  { level: 9, expRequired: 80000, maxMembers: 48, perks: ['传说技能'] },
  { level: 10, expRequired: 120000, maxMembers: 50, perks: ['满级特权'] },
];

export const GUILD_SKILLS_CONFIG: Omit<GuildSkill, 'currentLevel'>[] = [
  { id: 'atk_boost', name: '攻击强化', description: '全员攻击力+', maxLevel: 10, effectPerLevel: 2, upgradeCost: 500 },
  { id: 'def_boost', name: '防御强化', description: '全员防御力+', maxLevel: 10, effectPerLevel: 2, upgradeCost: 500 },
  { id: 'hp_boost', name: '生命强化', description: '全员生命值+', maxLevel: 10, effectPerLevel: 3, upgradeCost: 500 },
  { id: 'exp_boost', name: '经验加成', description: '经验获取+', maxLevel: 5, effectPerLevel: 5, upgradeCost: 1000 },
  { id: 'gold_boost', name: '金币加成', description: '金币获取+', maxLevel: 5, effectPerLevel: 5, upgradeCost: 1000 },
  { id: 'crit_boost', name: '暴击强化', description: '暴击率+', maxLevel: 5, effectPerLevel: 1, upgradeCost: 800 },
];

const NPC_NAMES = [
  '剑圣·云逸', '法师·星辰', '暗影·夜歌', '守护·磐石', '弓手·风铃',
  '刺客·幽兰', '牧师·白露', '战士·铁山', '术士·紫霄', '猎人·鹰眼',
  '骑士·银月', '召唤·灵犀', '武僧·悟空', '游侠·绿萝', '圣骑·光明',
];

export const DONATION_RATES = {
  gold: { amount: 10000, guildExp: 100, guildFunds: 50, contribution: 10 },
  diamond: { amount: 100, guildExp: 500, guildFunds: 200, contribution: 50 },
};

export const CHECKIN_REWARD = { gold: 2000, exp: 500, contribution: 5 };

export const ROLE_NAMES: Record<GuildMember['role'], string> = {
  leader: '会长',
  officer: '副会长',
  elite: '精英',
  member: '成员',
};

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateNPCMember(index: number, now: number): GuildMember {
  const name = NPC_NAMES[index % NPC_NAMES.length];
  const level = 10 + Math.floor(Math.random() * 40);
  return {
    id: `npc_${index}`,
    name,
    role: index === 0 ? 'officer' : 'member',
    level,
    power: level * 100 + Math.floor(Math.random() * 500),
    joinedAt: now - Math.floor(Math.random() * 86400000 * 30),
    lastActive: now - Math.floor(Math.random() * 86400000 * 3),
    contribution: Math.floor(Math.random() * 500),
    isPlayer: false,
  };
}

// ==================== 核心函数 ====================

/**
 * 创建公会
 */
export function createGuild(
  guildName: string,
  playerName: string,
  playerLevel: number = 1,
  now?: number
): GuildState {
  const timestamp = now ?? Date.now();

  const player: GuildMember = {
    id: 'player',
    name: playerName,
    role: 'leader',
    level: playerLevel,
    power: playerLevel * 100,
    joinedAt: timestamp,
    lastActive: timestamp,
    contribution: 0,
    isPlayer: true,
  };

  // 生成初始 NPC 成员
  const npcs = Array.from({ length: 5 }, (_, i) => generateNPCMember(i, timestamp));

  const skills: GuildSkill[] = GUILD_SKILLS_CONFIG.map(s => ({ ...s, currentLevel: 0 }));

  return {
    id: `guild_${Date.now()}`,
    name: guildName,
    level: 1,
    exp: 0,
    funds: 0,
    members: [player, ...npcs],
    skills,
    donations: [],
    createdAt: timestamp,
    announcement: `欢迎加入${guildName}！`,
    dailyCheckins: {},
    lastResetDate: getTodayStr(timestamp),
  };
}

/**
 * 添加公会经验（自动升级）
 */
export function addGuildExp(state: GuildState, amount: number): { state: GuildState; levelsGained: number } {
  let newState = { ...state };
  newState.exp += amount;
  let levelsGained = 0;

  const maxLevel = GUILD_LEVELS.length;
  while (newState.level < maxLevel) {
    const nextLevelConfig = GUILD_LEVELS[newState.level]; // level is 1-indexed, array 0-indexed
    if (!nextLevelConfig) break;
    if (newState.exp >= nextLevelConfig.expRequired && newState.level < nextLevelConfig.level) {
      newState.level = nextLevelConfig.level;
      levelsGained++;
    } else {
      break;
    }
  }

  return { state: newState, levelsGained };
}

/**
 * 捐献
 */
export function donate(
  state: GuildState,
  memberId: string,
  type: 'gold' | 'diamond',
  now?: number
): { state: GuildState; success: boolean; contribution: number; guildExp: number; error?: string } {
  const member = state.members.find(m => m.id === memberId);
  if (!member) return { state, success: false, contribution: 0, guildExp: 0, error: '成员不存在' };

  const rate = DONATION_RATES[type];
  const timestamp = now ?? Date.now();

  const newMembers = state.members.map(m =>
    m.id === memberId ? { ...m, contribution: m.contribution + rate.contribution } : m
  );

  const record: DonationRecord = {
    memberId,
    amount: rate.amount,
    type,
    timestamp,
  };

  const newState: GuildState = {
    ...state,
    funds: state.funds + rate.guildFunds,
    members: newMembers,
    donations: [record, ...state.donations].slice(0, 100),
  };

  const { state: afterExp, levelsGained } = addGuildExp(newState, rate.guildExp);

  return { state: afterExp, success: true, contribution: rate.contribution, guildExp: rate.guildExp };
}

/**
 * 升级公会技能
 */
export function upgradeGuildSkill(
  state: GuildState,
  skillId: string
): { state: GuildState; success: boolean; newLevel: number; error?: string } {
  const skillIndex = state.skills.findIndex(s => s.id === skillId);
  if (skillIndex < 0) return { state, success: false, newLevel: 0, error: '技能不存在' };

  const skill = state.skills[skillIndex];
  if (skill.currentLevel >= skill.maxLevel) return { state, success: false, newLevel: skill.currentLevel, error: '已满级' };

  const cost = skill.upgradeCost * (skill.currentLevel + 1);
  if (state.funds < cost) return { state, success: false, newLevel: skill.currentLevel, error: `资金不足（需要${cost}）` };

  const newSkills = [...state.skills];
  newSkills[skillIndex] = { ...skill, currentLevel: skill.currentLevel + 1 };

  return {
    state: { ...state, funds: state.funds - cost, skills: newSkills },
    success: true,
    newLevel: skill.currentLevel + 1,
  };
}

/**
 * 每日签到
 */
export function guildCheckin(
  state: GuildState,
  memberId: string,
  now?: number
): { state: GuildState; success: boolean; rewards: typeof CHECKIN_REWARD | null; error?: string } {
  const member = state.members.find(m => m.id === memberId);
  if (!member) return { state, success: false, rewards: null, error: '成员不存在' };

  const today = getTodayStr(now);
  const key = `${memberId}_${today}`;
  if (state.dailyCheckins[key]) return { state, success: false, rewards: null, error: '今日已签到' };

  const newCheckins = { ...state.dailyCheckins, [key]: today };
  const newMembers = state.members.map(m =>
    m.id === memberId ? { ...m, contribution: m.contribution + CHECKIN_REWARD.contribution, lastActive: now ?? Date.now() } : m
  );

  return {
    state: { ...state, dailyCheckins: newCheckins, members: newMembers },
    success: true,
    rewards: CHECKIN_REWARD,
  };
}

/**
 * 设置公告
 */
export function setAnnouncement(state: GuildState, text: string): GuildState {
  return { ...state, announcement: text.slice(0, 200) };
}

/**
 * 修改成员职位
 */
export function setMemberRole(
  state: GuildState,
  memberId: string,
  role: GuildMember['role']
): { state: GuildState; success: boolean; error?: string } {
  if (memberId === 'player') return { state, success: false, error: '不能修改自己的职位' };
  const memberIndex = state.members.findIndex(m => m.id === memberId);
  if (memberIndex < 0) return { state, success: false, error: '成员不存在' };
  if (role === 'leader') return { state, success: false, error: '不能设置为会长' };

  const newMembers = [...state.members];
  newMembers[memberIndex] = { ...newMembers[memberIndex], role };
  return { state: { ...state, members: newMembers }, success: true };
}

/**
 * 踢出成员
 */
export function kickMember(
  state: GuildState,
  memberId: string
): { state: GuildState; success: boolean; error?: string } {
  if (memberId === 'player') return { state, success: false, error: '不能踢出自己' };
  const member = state.members.find(m => m.id === memberId);
  if (!member) return { state, success: false, error: '成员不存在' };

  return {
    state: { ...state, members: state.members.filter(m => m.id !== memberId) },
    success: true,
  };
}

/**
 * 招募 NPC 成员
 */
export function recruitNPC(state: GuildState, now?: number): { state: GuildState; success: boolean; member?: GuildMember; error?: string } {
  const maxMembers = getMaxMembers(state);
  if (state.members.length >= maxMembers) return { state, success: false, error: `成员已满（${maxMembers}人）` };

  const timestamp = now ?? Date.now();
  const index = state.members.length;
  const npc = generateNPCMember(index, timestamp);

  return {
    state: { ...state, members: [...state.members, npc] },
    success: true,
    member: npc,
  };
}

/**
 * 获取最大成员数
 */
export function getMaxMembers(state: GuildState): number {
  const config = GUILD_LEVELS.find(l => l.level === state.level);
  return config?.maxMembers ?? 10;
}

/**
 * 获取公会技能加成
 */
export function getSkillBonus(state: GuildState, skillId: string): number {
  const skill = state.skills.find(s => s.id === skillId);
  if (!skill) return 0;
  return skill.currentLevel * skill.effectPerLevel;
}

/**
 * 获取所有活跃加成
 */
export function getAllBonuses(state: GuildState): Record<string, number> {
  const bonuses: Record<string, number> = {};
  for (const skill of state.skills) {
    if (skill.currentLevel > 0) {
      bonuses[skill.id] = skill.currentLevel * skill.effectPerLevel;
    }
  }
  return bonuses;
}

/**
 * 获取公会统计
 */
export function getGuildStats(state: GuildState): {
  name: string;
  level: number;
  memberCount: number;
  maxMembers: number;
  funds: number;
  totalContribution: number;
  totalDonations: number;
  skillLevels: Record<string, number>;
  topContributors: { name: string; contribution: number }[];
} {
  const totalContribution = state.members.reduce((sum, m) => sum + m.contribution, 0);
  const topContributors = [...state.members]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5)
    .map(m => ({ name: m.name, contribution: m.contribution }));

  const skillLevels: Record<string, number> = {};
  state.skills.forEach(s => { skillLevels[s.id] = s.currentLevel; });

  return {
    name: state.name,
    level: state.level,
    memberCount: state.members.length,
    maxMembers: getMaxMembers(state),
    funds: state.funds,
    totalContribution,
    totalDonations: state.donations.length,
    skillLevels,
    topContributors,
  };
}

/**
 * 检查每日重置
 */
export function checkDailyReset(state: GuildState, now?: number): GuildState {
  const today = getTodayStr(now);
  if (today === state.lastResetDate) return state;
  return { ...state, dailyCheckins: {}, lastResetDate: today };
}

/**
 * 获取职位名称
 */
export function getRoleName(role: GuildMember['role']): string {
  return ROLE_NAMES[role];
}

/**
 * 导出数据
 */
export function exportGuildData(state: GuildState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importGuildData(json: string): GuildState | null {
  try {
    const data = JSON.parse(json);
    if (!data.id || !data.name || !data.members) return null;
    return data as GuildState;
  } catch {
    return null;
  }
}
