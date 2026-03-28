/**
 * v0.90 结婚系统 (Marriage System)
 * 求婚、结婚、夫妻技能、夫妻任务、亲密度系统
 */

export interface Marriage {
  id: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  intimacy: number; // 亲密度
  intimacyLevel: number; // 亲密度等级
  weddingDate: number;
  anniversary: number; // 结婚纪念日
  skills: MarriageSkill[];
  activeSkill?: string; // 当前激活的夫妻技能
}

export interface MarriageSkill {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  intimacyRequired: number;
  effect: string;
  bonus: AttributeBonus;
  unlocked: boolean;
}

export interface AttributeBonus {
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  crit?: number;
  dodge?: number;
  expBonus?: number;
  goldBonus?: number;
}

export interface MarriageTask {
  id: string;
  type: MarriageTaskType;
  description: string;
  target: number;
  progress: number;
  reward: {
    intimacy: number;
    exp: number;
    gold: number;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'claimed';
  deadline: number;
}

export type MarriageTaskType = 'gift' | 'date' | 'copy' | 'boss' | 'daily';

export interface Proposal {
  id: string;
  proposerId: string;
  proposerName: string;
  targetId: string;
  targetName: string;
  ringId: string;
  ringName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createTime: number;
  expireTime: number;
}

export interface MarriageConfig {
  minIntimacyForProposal: number; // 求婚最低亲密度
  minLevelForMarriage: number; // 结婚最低等级
  weddingCost: number; // 婚礼消耗
  dailyTaskLimit: number; // 每日任务上限
  intimacyDecayPerDay: number; // 每日亲密度衰减
}

export const MARRIAGE_CONFIG: MarriageConfig = {
  minIntimacyForProposal: 1000,
  minLevelForMarriage: 30,
  weddingCost: 9999,
  dailyTaskLimit: 5,
  intimacyDecayPerDay: 10,
};

// 夫妻技能数据库
export const MARRIAGE_SKILLS: MarriageSkill[] = [
  { id: 'ms_1', name: '心心相印', level: 0, maxLevel: 10, intimacyRequired: 1000, effect: '提升双方攻击力', bonus: { attack: 20 }, unlocked: false },
  { id: 'ms_2', name: '伉俪情深', level: 0, maxLevel: 10, intimacyRequired: 2000, effect: '提升双方防御力', bonus: { defense: 20 }, unlocked: false },
  { id: 'ms_3', name: '比翼双飞', level: 0, maxLevel: 10, intimacyRequired: 3000, effect: '提升双方速度', bonus: { speed: 10 }, unlocked: false },
  { id: 'ms_4', name: '相濡以沫', level: 0, maxLevel: 10, intimacyRequired: 5000, effect: '提升双方气血', bonus: { health: 100 }, unlocked: false },
  { id: 'ms_5', name: '琴瑟和鸣', level: 0, maxLevel: 10, intimacyRequired: 8000, effect: '提升双方暴击率', bonus: { crit: 2 }, unlocked: false },
  { id: 'ms_6', name: '天作之合', level: 0, maxLevel: 10, intimacyRequired: 12000, effect: '提升双方经验获取', bonus: { expBonus: 10 }, unlocked: false },
  { id: 'ms_7', name: '永结同心', level: 0, maxLevel: 10, intimacyRequired: 20000, effect: '提升双方金币获取', bonus: { goldBonus: 10 }, unlocked: false },
];

// 创建求婚
export function createProposal(proposerId: string, proposerName: string, targetId: string, targetName: string, ringId: string, ringName: string): Proposal {
  return {
    id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    proposerId,
    proposerName,
    targetId,
    targetName,
    ringId,
    ringName,
    status: 'pending',
    createTime: Date.now(),
    expireTime: Date.now() + (24 * 60 * 60 * 1000),
  };
}

// 接受求婚
export function acceptProposal(proposal: Proposal): { success: boolean; message: string } {
  if (proposal.status !== 'pending') {
    return { success: false, message: '求婚状态不正确' };
  }
  
  proposal.status = 'accepted';
  return { success: true, message: `${proposal.targetName}接受了${proposal.proposerName}的求婚！` };
}

// 拒绝求婚
export function rejectProposal(proposal: Proposal): { success: boolean; message: string } {
  if (proposal.status !== 'pending') {
    return { success: false, message: '求婚状态不正确' };
  }
  
  proposal.status = 'rejected';
  return { success: true, message: `${proposal.targetName}拒绝了${proposal.proposerName}的求婚` };
}

// 创建婚姻
export function createMarriage(player1Id: string, player1Name: string, player2Id: string, player2Name: string): Marriage {
  return {
    id: `marriage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    player1Id,
    player1Name,
    player2Id,
    player2Name,
    intimacy: 1000,
    intimacyLevel: 1,
    weddingDate: Date.now(),
    anniversary: Date.now(),
    skills: MARRIAGE_SKILLS.map(s => ({ ...s })),
  };
}

// 增加亲密度
export function increaseIntimacy(marriage: Marriage, amount: number): { success: boolean; message: string; leveledUp?: boolean } {
  marriage.intimacy += amount;
  
  // 计算亲密度等级
  const newLevel = calculateIntimacyLevel(marriage.intimacy);
  if (newLevel > marriage.intimacyLevel) {
    marriage.intimacyLevel = newLevel;
    return { success: true, message: `亲密度增加到${marriage.intimacy}，等级提升到${newLevel}级！`, leveledUp: true };
  }
  
  return { success: true, message: `亲密度增加到${marriage.intimacy}` };
}

// 计算亲密度等级
export function calculateIntimacyLevel(intimacy: number): number {
  if (intimacy >= 20000) return 10;
  if (intimacy >= 15000) return 9;
  if (intimacy >= 12000) return 8;
  if (intimacy >= 8000) return 7;
  if (intimacy >= 5000) return 6;
  if (intimacy >= 3000) return 5;
  if (intimacy >= 2000) return 4;
  if (intimacy >= 1500) return 3;
  if (intimacy >= 1200) return 2;
  if (intimacy >= 1000) return 1;
  return 0;
}

// 解锁夫妻技能
export function unlockMarriageSkill(marriage: Marriage, skillId: string): { success: boolean; message: string } {
  const skill = marriage.skills.find(s => s.id === skillId);
  
  if (!skill) {
    return { success: false, message: '技能不存在' };
  }
  
  if (skill.unlocked) {
    return { success: false, message: '技能已解锁' };
  }
  
  if (marriage.intimacy < skill.intimacyRequired) {
    return { success: false, message: `亲密度不足，需要${skill.intimacyRequired}` };
  }
  
  skill.unlocked = true;
  skill.level = 1;
  
  return { success: true, message: `解锁夫妻技能"${skill.name}"！` };
}

// 升级夫妻技能
export function upgradeMarriageSkill(marriage: Marriage, skillId: string): { success: boolean; message: string } {
  const skill = marriage.skills.find(s => s.id === skillId);
  
  if (!skill) {
    return { success: false, message: '技能不存在' };
  }
  
  if (!skill.unlocked) {
    return { success: false, message: '技能未解锁' };
  }
  
  if (skill.level >= skill.maxLevel) {
    return { success: false, message: '技能已达满级' };
  }
  
  // 检查亲密度要求（每级需要更多亲密度）
  const requiredIntimacy = skill.intimacyRequired * (1 + skill.level * 0.2);
  if (marriage.intimacy < requiredIntimacy) {
    return { success: false, message: `亲密度不足，需要${Math.floor(requiredIntimacy)}` };
  }
  
  skill.level += 1;
  
  // 增强效果
  Object.keys(skill.bonus).forEach(key => {
    const k = key as keyof AttributeBonus;
    if (skill.bonus[k]) {
      skill.bonus[k]! = Math.floor(skill.bonus[k]! * 1.2);
    }
  });
  
  return { success: true, message: `${skill.name}升级到${skill.level}级！` };
}

// 获取夫妻技能总加成
export function getMarriageSkillBonuses(marriage: Marriage): AttributeBonus {
  const total: AttributeBonus = {};
  
  marriage.skills.forEach(skill => {
    if (skill.unlocked && skill.level > 0) {
      Object.keys(skill.bonus).forEach(key => {
        const k = key as keyof AttributeBonus;
        if (skill.bonus[k]) {
          total[k] = (total[k] || 0) + skill.bonus[k]! * skill.level;
        }
      });
    }
  });
  
  return total;
}

// 创建夫妻任务
export function createMarriageTask(type: MarriageTaskType): MarriageTask {
  const taskTemplates: Record<MarriageTaskType, { description: string; target: number; reward: MarriageTask['reward'] }> = {
    gift: { description: '赠送配偶礼物', target: 1, reward: { intimacy: 50, exp: 100, gold: 500 } },
    date: { description: '与配偶约会', target: 1, reward: { intimacy: 100, exp: 200, gold: 1000 } },
    copy: { description: '与配偶组队副本', target: 3, reward: { intimacy: 150, exp: 500, gold: 2000 } },
    boss: { description: '与配偶挑战世界 BOSS', target: 1, reward: { intimacy: 200, exp: 1000, gold: 5000 } },
    daily: { description: '完成日常任务', target: 10, reward: { intimacy: 80, exp: 300, gold: 1500 } },
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

// 完成夫妻任务
export function completeMarriageTask(task: MarriageTask, progress: number): { success: boolean; message: string; completed?: boolean } {
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
export function claimMarriageTaskReward(task: MarriageTask, marriage: Marriage): { success: boolean; message: string; reward?: MarriageTask['reward'] } {
  if (task.status !== 'completed') {
    return { success: false, message: '任务未完成' };
  }
  
  const reward = { ...task.reward };
  task.status = 'claimed';
  
  marriage.intimacy += reward.intimacy;
  
  return { success: true, message: '领取任务奖励成功！', reward };
}

// 获取婚姻统计
export function getMarriageStats(marriage: Marriage): {
  intimacy: number;
  intimacyLevel: number;
  intimacyLevelName: string;
  marriedDays: number;
  skillCount: number;
  totalBonus: AttributeBonus;
} {
  const totalBonus = getMarriageSkillBonuses(marriage);
  const marriedDays = Math.floor((Date.now() - marriage.weddingDate) / (24 * 60 * 60 * 1000));
  
  return {
    intimacy: marriage.intimacy,
    intimacyLevel: marriage.intimacyLevel,
    intimacyLevelName: getIntimacyLevelName(marriage.intimacyLevel),
    marriedDays,
    skillCount: marriage.skills.filter(s => s.unlocked).length,
    totalBonus,
  };
}

// 获取亲密度等级名称
export function getIntimacyLevelName(level: number): string {
  const names: Record<number, string> = {
    0: '陌路',
    1: '相识',
    2: '相知',
    3: '相惜',
    4: '相恋',
    5: '相守',
    6: '相依',
    7: '相伴',
    8: '相随',
    9: '相爱',
    10: '永恒',
  };
  return names[level] || '陌路';
}

// 每日亲密度衰减
export function applyIntimacyDecay(marriage: Marriage): { success: boolean; message: string; decayAmount: number } {
  const decayAmount = MARRIAGE_CONFIG.intimacyDecayPerDay;
  marriage.intimacy = Math.max(0, marriage.intimacy - decayAmount);
  marriage.intimacyLevel = calculateIntimacyLevel(marriage.intimacy);
  
  return { success: true, message: `今日亲密度衰减${decayAmount}`, decayAmount };
}
