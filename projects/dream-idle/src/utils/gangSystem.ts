/**
 * v0.89 帮派系统 (Gang System)
 * 创建帮派、加入帮派、帮派任务、帮派战、帮派技能
 */

export interface Gang {
  id: string;
  name: string;
  leaderId: string;
  level: number;
  exp: number;
  maxExp: number;
  memberCount: number;
  maxMembers: number;
  funds: number; // 帮派资金
  prestige: number; // 帮派声望
  createTime: number;
  skills: GangSkill[];
  announcement: string;
}

export interface GangMember {
  userId: string;
  userName: string;
  position: GangPosition;
  contribution: number; // 帮派贡献
  joinTime: number;
  lastActiveTime: number;
  gangTasksCompleted: number;
}

export type GangPosition = 'leader' | 'officer' | 'elder' | 'member';

export interface GangSkill {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  cost: number; // 升级消耗
  effect: string;
  bonus: AttributeBonus;
}

export interface AttributeBonus {
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  crit?: number;
  dodge?: number;
}

export interface GangTask {
  id: string;
  type: GangTaskType;
  description: string;
  target: number;
  progress: number;
  reward: {
    exp: number;
    funds: number;
    contribution: number;
    prestige: number;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'claimed';
  deadline: number;
}

export type GangTaskType = 'donate' | 'build' | 'patrol' | 'war' | 'recruit';

export interface GangConfig {
  createCost: number; // 创建帮派消耗
  maxMembersPerLevel: number; // 每级最大成员数
  dailyTaskLimit: number; // 每日任务上限
  warDuration: number; // 帮派战持续时间 (分钟)
}

export const GANG_CONFIG: GangConfig = {
  createCost: 10000,
  maxMembersPerLevel: 10,
  dailyTaskLimit: 5,
  warDuration: 30,
};

// 帮派技能数据库
export const GANG_SKILLS: GangSkill[] = [
  { id: 'gs_1', name: '攻击修炼', level: 0, maxLevel: 10, cost: 1000, effect: '提升全体成员攻击力', bonus: { attack: 10 } },
  { id: 'gs_2', name: '防御修炼', level: 0, maxLevel: 10, cost: 1000, effect: '提升全体成员防御力', bonus: { defense: 10 } },
  { id: 'gs_3', name: '气血修炼', level: 0, maxLevel: 10, cost: 1000, effect: '提升全体成员气血', bonus: { health: 50 } },
  { id: 'gs_4', name: '速度修炼', level: 0, maxLevel: 10, cost: 1000, effect: '提升全体成员速度', bonus: { speed: 5 } },
  { id: 'gs_5', name: '暴击修炼', level: 0, maxLevel: 10, cost: 2000, effect: '提升全体成员暴击率', bonus: { crit: 1 } },
  { id: 'gs_6', name: '闪避修炼', level: 0, maxLevel: 10, cost: 2000, effect: '提升全体成员闪避率', bonus: { dodge: 1 } },
];

// 创建帮派
export function createGang(name: string, leaderId: string, leaderName: string, cost: number): { success: boolean; message: string; gang?: Gang } {
  if (cost < GANG_CONFIG.createCost) {
    return { success: false, message: `创建帮派需要${GANG_CONFIG.createCost}金币` };
  }
  
  const gang: Gang = {
    id: `gang_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    leaderId,
    level: 1,
    exp: 0,
    maxExp: 1000,
    memberCount: 1,
    maxMembers: GANG_CONFIG.maxMembersPerLevel,
    funds: 0,
    prestige: 0,
    createTime: Date.now(),
    skills: GANG_SKILLS.map(s => ({ ...s })),
    announcement: '',
  };
  
  return { success: true, message: `创建帮派"${name}"成功！`, gang };
}

// 加入帮派
export function joinGang(gang: Gang, userId: string, userName: string): { success: boolean; message: string } {
  if (gang.memberCount >= gang.maxMembers) {
    return { success: false, message: '帮派成员已满' };
  }
  
  gang.memberCount += 1;
  return { success: true, message: `加入帮派"${gang.name}"成功！` };
}

// 退出帮派
export function leaveGang(gang: Gang): { success: boolean; message: string } {
  if (gang.memberCount <= 1) {
    return { success: false, message: '帮派只剩帮主一人，无法退出' };
  }
  
  gang.memberCount -= 1;
  return { success: true, message: '退出帮派成功！' };
}

// 升级帮派
export function upgradeGang(gang: Gang): { success: boolean; message: string } {
  if (gang.exp < gang.maxExp) {
    return { success: false, message: '帮派经验不足' };
  }
  
  gang.level += 1;
  gang.exp = 0;
  gang.maxExp = Math.floor(gang.maxExp * 1.5);
  gang.maxMembers = gang.level * GANG_CONFIG.maxMembersPerLevel;
  
  return { success: true, message: `帮派升级到${gang.level}级！最大成员数：${gang.maxMembers}` };
}

// 捐献帮派
export function donateToGang(gang: Gang, amount: number): { success: boolean; message: string; expGain?: number } {
  if (amount <= 0) {
    return { success: false, message: '捐献金额必须大于 0' };
  }
  
  gang.funds += amount;
  const expGain = Math.floor(amount / 10);
  gang.exp += expGain;
  
  return { success: true, message: `捐献${amount}金币，帮派获得${expGain}经验`, expGain };
}

// 升级帮派技能
export function upgradeGangSkill(gang: Gang, skillId: string): { success: boolean; message: string } {
  const skill = gang.skills.find(s => s.id === skillId);
  
  if (!skill) {
    return { success: false, message: '技能不存在' };
  }
  
  if (skill.level >= skill.maxLevel) {
    return { success: false, message: '技能已达满级' };
  }
  
  if (gang.funds < skill.cost) {
    return { success: false, message: `帮派资金不足，需要${skill.cost}金币` };
  }
  
  gang.funds -= skill.cost;
  skill.level += 1;
  skill.cost = Math.floor(skill.cost * 1.5);
  
  // 增强效果
  Object.keys(skill.bonus).forEach(key => {
    const k = key as keyof AttributeBonus;
    if (skill.bonus[k]) {
      skill.bonus[k]! = Math.floor(skill.bonus[k]! * 1.2);
    }
  });
  
  return { success: true, message: `${skill.name}升级到${skill.level}级！` };
}

// 获取帮派技能总加成
export function getGangSkillBonuses(gang: Gang): AttributeBonus {
  const total: AttributeBonus = {};
  
  gang.skills.forEach(skill => {
    if (skill.level > 0) {
      Object.keys(skill.bonus).forEach(key => {
        const k = key as keyof AttributeBonus;
        total[k] = (total[k] || 0) + skill.bonus[k]!;
      });
    }
  });
  
  return total;
}

// 创建帮派任务
export function createGangTask(type: GangTaskType): GangTask {
  const taskTemplates: Record<GangTaskType, { description: string; target: number; reward: GangTask['reward'] }> = {
    donate: { description: '捐献帮派资金', target: 1000, reward: { exp: 100, funds: 1000, contribution: 50, prestige: 10 } },
    build: { description: '建设帮派建筑', target: 5, reward: { exp: 200, funds: 500, contribution: 80, prestige: 20 } },
    patrol: { description: '巡逻帮派领地', target: 10, reward: { exp: 150, funds: 300, contribution: 60, prestige: 15 } },
    war: { description: '参加帮派战', target: 3, reward: { exp: 500, funds: 2000, contribution: 200, prestige: 50 } },
    recruit: { description: '招募新成员', target: 2, reward: { exp: 300, funds: 800, contribution: 100, prestige: 30 } },
  };
  
  const template = taskTemplates[type];
  
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    description: template.description,
    target: template.target,
    progress: 0,
    reward: template.reward,
    status: 'pending',
    deadline: Date.now() + (24 * 60 * 60 * 1000),
  };
}

// 完成帮派任务
export function completeGangTask(task: GangTask, progress: number): { success: boolean; message: string; completed?: boolean } {
  if (task.status === 'completed' || task.status === 'claimed') {
    return { success: false, message: '任务已完成或已领取' };
  }
  
  task.progress += progress;
  
  if (task.progress >= task.target) {
    task.progress = task.target;
    task.status = 'completed';
    return { success: true, message: '任务完成！', completed: true };
  }
  
  task.status = 'in_progress';
  return { success: true, message: `任务进度：${task.progress}/${task.target}` };
}

// 领取任务奖励
export function claimTaskReward(task: GangTask, gang: Gang): { success: boolean; message: string; reward?: GangTask['reward'] } {
  if (task.status !== 'completed') {
    return { success: false, message: '任务未完成' };
  }
  
  const reward = { ...task.reward };
  task.status = 'claimed';
  
  gang.funds += reward.funds;
  gang.prestige += reward.prestige;
  
  return { success: true, message: '领取任务奖励成功！', reward };
}

// 获取帮派统计
export function getGangStats(gang: Gang): {
  level: number;
  expProgress: string;
  memberCount: string;
  funds: number;
  prestige: number;
  skillCount: number;
  totalBonus: AttributeBonus;
} {
  const totalBonus = getGangSkillBonuses(gang);
  
  return {
    level: gang.level,
    expProgress: `${gang.exp}/${gang.maxExp}`,
    memberCount: `${gang.memberCount}/${gang.maxMembers}`,
    funds: gang.funds,
    prestige: gang.prestige,
    skillCount: gang.skills.filter(s => s.level > 0).length,
    totalBonus,
  };
}

// 获取帮派职位权限
export function getPositionPermissions(position: GangPosition): {
  canInvite: boolean;
  canKick: boolean;
  canUpgradeSkill: boolean;
  canStartWar: boolean;
  canEditAnnouncement: boolean;
} {
  const permissions: Record<GangPosition, any> = {
    leader: { canInvite: true, canKick: true, canUpgradeSkill: true, canStartWar: true, canEditAnnouncement: true },
    officer: { canInvite: true, canKick: true, canUpgradeSkill: true, canStartWar: false, canEditAnnouncement: true },
    elder: { canInvite: true, canKick: false, canUpgradeSkill: false, canStartWar: false, canEditAnnouncement: false },
    member: { canInvite: false, canKick: false, canUpgradeSkill: false, canStartWar: false, canEditAnnouncement: false },
  };
  
  return permissions[position];
}

// 获取帮派名称
export function getGangLevelName(level: number): string {
  if (level >= 10) return '天下第一帮';
  if (level >= 8) return '名门正派';
  if (level >= 6) return '江湖大派';
  if (level >= 4) return '武林门派';
  if (level >= 2) return '江湖小派';
  return '初出茅庐';
}
