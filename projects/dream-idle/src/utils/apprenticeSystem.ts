/**
 * v0.80 - 师徒系统 (Master-Apprentice System)
 * 
 * 功能：
 * - 拜师与收徒系统
 * - 师德值（师徒亲密度）
 * - 师徒任务
 * - 出师机制
 * - 师徒技能加成
 */

export interface ApprenticeshipProposal {
  id: string;
  proposerId: string;
  targetId: string;
  type: 'apply' | 'accept'; // apply: 申请拜师，accept: 同意收徒
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface MasterApprenticeRelationship {
  id: string;
  masterId: string;
  apprenticeId: string;
  startDate: number;
  virtuePoints: number; // 师德值 (0-10000)
  level: number; // 师徒等级 (1-10)
  completedTasks: string[];
  isGraduated: boolean;
  graduationDate?: number;
}

export interface ApprenticeTask {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: {
    minVirtuePoints: number;
    minLevel: number;
    minRelationshipLevel: number;
  };
  rewards: {
    virtuePoints: number;
    exp: number;
    gold: number;
    items?: string[];
  };
}

export interface MasterSkill {
  id: string;
  name: string;
  description: string;
  minVirtuePoints: number;
  effect: {
    type: 'stat_boost' | 'exp_bonus' | 'gold_bonus' | 'drop_bonus' | 'virtue_bonus';
    value: number;
    target: 'master' | 'apprentice' | 'both';
  };
}

// 师徒等级配置
const RELATIONSHIP_LEVELS = [
  { level: 1, minVirtue: 0, name: '初识', maxVirtue: 999 },
  { level: 2, minVirtue: 1000, name: '入门', maxVirtue: 1999 },
  { level: 3, minVirtue: 2000, name: '登堂', maxVirtue: 2999 },
  { level: 4, minVirtue: 3000, name: '入室', maxVirtue: 3999 },
  { level: 5, minVirtue: 4000, name: '得意', maxVirtue: 4999 },
  { level: 6, minVirtue: 5000, name: '真传', maxVirtue: 5999 },
  { level: 7, minVirtue: 6000, name: '嫡系', maxVirtue: 6999 },
  { level: 8, minVirtue: 7000, name: '宗师', maxVirtue: 7999 },
  { level: 9, minVirtue: 8000, name: '泰斗', maxVirtue: 8999 },
  { level: 10, minVirtue: 9000, name: '圣人', maxVirtue: 10000 },
];

// 出师条件
const GRADUATION_REQUIREMENTS = {
  minVirtuePoints: 5000, // 至少 5000 师德
  minRelationshipLevel: 6, // 至少真传等级
  minTasksCompleted: 10, // 至少完成 10 个师徒任务
  minDays: 7, // 至少拜师 7 天
};

// 师徒技能库
const MASTER_SKILLS: MasterSkill[] = [
  {
    id: 'master_skill_1',
    name: '言传身教',
    description: '徒弟经验获取提升 10%',
    minVirtuePoints: 3000,
    effect: { type: 'exp_bonus', value: 0.1, target: 'apprentice' },
  },
  {
    id: 'master_skill_2',
    name: '师恩如山',
    description: '师傅师德获取提升 15%',
    minVirtuePoints: 4000,
    effect: { type: 'virtue_bonus', value: 0.15, target: 'master' },
  },
  {
    id: 'master_skill_3',
    name: '心有灵犀',
    description: '师徒双方攻击力提升 5%',
    minVirtuePoints: 5000,
    effect: { type: 'stat_boost', value: 0.05, target: 'both' },
  },
  {
    id: 'master_skill_4',
    name: '名师高徒',
    description: '师徒双方金币获取提升 12%',
    minVirtuePoints: 6000,
    effect: { type: 'gold_bonus', value: 0.12, target: 'both' },
  },
  {
    id: 'master_skill_5',
    name: '一代宗师',
    description: '师徒双方所有属性提升 8%',
    minVirtuePoints: 8000,
    effect: { type: 'stat_boost', value: 0.08, target: 'both' },
  },
];

// 师徒任务库
const APPRENTICE_TASKS: ApprenticeTask[] = [
  {
    id: 'apprentice_task_1',
    name: '初入师门',
    description: '完成 3 次日常修炼',
    difficulty: 'easy',
    requirements: { minVirtuePoints: 0, minLevel: 1, minRelationshipLevel: 1 },
    rewards: { virtuePoints: 100, exp: 500, gold: 1000 },
  },
  {
    id: 'apprentice_task_2',
    name: '勤学苦练',
    description: '累计在线 2 小时',
    difficulty: 'easy',
    requirements: { minVirtuePoints: 500, minLevel: 1, minRelationshipLevel: 2 },
    rewards: { virtuePoints: 200, exp: 1000, gold: 2000 },
  },
  {
    id: 'apprentice_task_3',
    name: '师徒同心',
    description: '与师傅/徒弟一起完成 5 次副本',
    difficulty: 'medium',
    requirements: { minVirtuePoints: 2000, minLevel: 3, minRelationshipLevel: 4 },
    rewards: { virtuePoints: 500, exp: 3000, gold: 5000 },
  },
  {
    id: 'apprentice_task_4',
    name: '青出于蓝',
    description: '徒弟在竞技场进入前 100 名',
    difficulty: 'hard',
    requirements: { minVirtuePoints: 4000, minLevel: 5, minRelationshipLevel: 6 },
    rewards: { virtuePoints: 1000, exp: 10000, gold: 20000, items: ['master_scroll'] },
  },
  {
    id: 'apprentice_task_5',
    name: '师门荣耀',
    description: '师徒共同挑战世界 BOSS 并造成伤害前 5',
    difficulty: 'hard',
    requirements: { minVirtuePoints: 6000, minLevel: 7, minRelationshipLevel: 8 },
    rewards: { virtuePoints: 2000, exp: 20000, gold: 50000, items: ['master_ring'] },
  },
];

export class ApprenticeSystem {
  private proposals: Map<string, ApprenticeshipProposal> = new Map();
  private relationships: Map<string, MasterApprenticeRelationship> = new Map();
  private playerRelationshipMap: Map<string, string> = new Map(); // playerId -> relationshipId

  /**
   * 申请拜师
   */
  applyForApprenticeship(apprenticeId: string, masterId: string): ApprenticeshipProposal {
    // 检查是否已经有师徒关系
    if (this.playerRelationshipMap.has(apprenticeId)) {
      throw new Error('你已经有师傅了，不能再拜师');
    }
    if (this.playerRelationshipMap.has(masterId)) {
      throw new Error('对方已经有师傅了，不能收徒');
    }

    // 检查是否有待处理的申请
    const existingProposal = Array.from(this.proposals.values()).find(
      p => (p.proposerId === apprenticeId && p.targetId === masterId) ||
           (p.proposerId === masterId && p.targetId === apprenticeId)
    );

    if (existingProposal && existingProposal.status === 'pending') {
      throw new Error('已有待处理的师徒申请');
    }

    const proposal: ApprenticeshipProposal = {
      id: `apprentice_proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      proposerId: apprenticeId,
      targetId: masterId,
      type: 'apply',
      timestamp: Date.now(),
      status: 'pending',
    };

    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  /**
   * 同意收徒
   */
  acceptApprenticeship(proposalId: string): MasterApprenticeRelationship | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('申请不存在');
    }

    if (proposal.status !== 'pending') {
      throw new Error('申请已过期或已处理');
    }

    // 检查是否过期（24 小时）
    if (Date.now() - proposal.timestamp > 24 * 60 * 60 * 1000) {
      proposal.status = 'expired';
      this.proposals.set(proposalId, proposal);
      return null;
    }

    // 创建师徒关系
    proposal.status = 'accepted';
    this.proposals.set(proposalId, proposal);

    const relationship: MasterApprenticeRelationship = {
      id: `apprentice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      masterId: proposal.targetId,
      apprenticeId: proposal.proposerId,
      startDate: Date.now(),
      virtuePoints: 0, // 初始师德值
      level: 1, // 初识等级
      completedTasks: [],
      isGraduated: false,
    };

    this.relationships.set(relationship.id, relationship);
    this.playerRelationshipMap.set(proposal.targetId, relationship.id); // master
    this.playerRelationshipMap.set(proposal.proposerId, relationship.id); // apprentice

    return relationship;
  }

  /**
   * 拒绝拜师
   */
  rejectApprenticeship(proposalId: string): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('申请不存在');
    }

    if (proposal.status !== 'pending') {
      throw new Error('申请已过期或已处理');
    }

    proposal.status = 'rejected';
    this.proposals.set(proposalId, proposal);
  }

  /**
   * 获取玩家的师徒关系
   */
  getRelationship(playerId: string): MasterApprenticeRelationship | null {
    const relationshipId = this.playerRelationshipMap.get(playerId);
    if (!relationshipId) {
      return null;
    }
    return this.relationships.get(relationshipId) || null;
  }

  /**
   * 判断玩家是否是师傅
   */
  isMaster(playerId: string): boolean {
    const relationship = this.getRelationship(playerId);
    return relationship ? relationship.masterId === playerId : false;
  }

  /**
   * 判断玩家是否是徒弟
   */
  isApprentice(playerId: string): boolean {
    const relationship = this.getRelationship(playerId);
    return relationship ? relationship.apprenticeId === playerId : false;
  }

  /**
   * 获取师傅或徒弟的 ID
   */
  getPartner(playerId: string): string | null {
    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return null;
    }
    return relationship.masterId === playerId ? relationship.apprenticeId : relationship.masterId;
  }

  /**
   * 增加师德值
   */
  addVirtuePoints(playerId: string, amount: number): MasterApprenticeRelationship | null {
    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return null;
    }

    // 只有师傅能获得师德值
    if (relationship.masterId !== playerId) {
      throw new Error('只有师傅才能获得师德值');
    }

    relationship.virtuePoints = Math.min(10000, relationship.virtuePoints + amount);
    relationship.level = this.getRelationshipLevel(relationship.virtuePoints);

    this.relationships.set(relationship.id, relationship);
    return relationship;
  }

  /**
   * 获取师徒等级
   */
  getRelationshipLevel(virtuePoints: number): number {
    for (let i = RELATIONSHIP_LEVELS.length - 1; i >= 0; i--) {
      if (virtuePoints >= RELATIONSHIP_LEVELS[i].minVirtue) {
        return RELATIONSHIP_LEVELS[i].level;
      }
    }
    return 1;
  }

  /**
   * 获取师徒等级名称
   */
  getRelationshipLevelName(level: number): string {
    const config = RELATIONSHIP_LEVELS.find(l => l.level === level);
    return config ? config.name : '初识';
  }

  /**
   * 检查是否可以出师
   */
  canGraduate(playerId: string): { can: boolean; reasons: string[] } {
    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return { can: false, reasons: ['没有师徒关系'] };
    }

    if (relationship.isGraduated) {
      return { can: false, reasons: ['已经出师'] };
    }

    // 只有徒弟可以出师
    if (relationship.apprenticeId !== playerId) {
      return { can: false, reasons: ['只有徒弟可以出师'] };
    }

    const reasons: string[] = [];
    const now = Date.now();
    const daysSinceStart = Math.floor((now - relationship.startDate) / (24 * 60 * 60 * 1000));

    if (relationship.virtuePoints < GRADUATION_REQUIREMENTS.minVirtuePoints) {
      reasons.push(`师德值不足：${relationship.virtuePoints}/${GRADUATION_REQUIREMENTS.minVirtuePoints}`);
    }

    if (relationship.level < GRADUATION_REQUIREMENTS.minRelationshipLevel) {
      reasons.push(`师徒等级不足：${this.getRelationshipLevelName(relationship.level)}/${this.getRelationshipLevelName(GRADUATION_REQUIREMENTS.minRelationshipLevel)}`);
    }

    if (relationship.completedTasks.length < GRADUATION_REQUIREMENTS.minTasksCompleted) {
      reasons.push(`完成任务不足：${relationship.completedTasks.length}/${GRADUATION_REQUIREMENTS.minTasksCompleted}`);
    }

    if (daysSinceStart < GRADUATION_REQUIREMENTS.minDays) {
      reasons.push(`拜师时间不足：${daysSinceStart}/${GRADUATION_REQUIREMENTS.minDays}天`);
    }

    return {
      can: reasons.length === 0,
      reasons,
    };
  }

  /**
   * 出师
   */
  graduate(playerId: string): { success: boolean; message: string; rewards?: any } {
    const check = this.canGraduate(playerId);
    if (!check.can) {
      return { success: false, message: `无法出师：${check.reasons.join(', ')}` };
    }

    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return { success: false, message: '没有师徒关系' };
    }

    // 出师
    relationship.isGraduated = true;
    relationship.graduationDate = Date.now();
    this.relationships.set(relationship.id, relationship);

    // 出师奖励
    const rewards = {
      virtuePoints: 1000, // 师傅获得额外师德
      exp: 50000,
      gold: 100000,
      items: ['graduation_certIFICATE'],
      title: '出师弟子',
    };

    // 给师傅额外奖励
    const masterId = relationship.masterId;
    this.addVirtuePoints(masterId, rewards.virtuePoints);

    return {
      success: true,
      message: '恭喜出师！师徒情谊永存。',
      rewards,
    };
  }

  /**
   * 解除师徒关系（未出师情况下）
   */
  dissolveRelationship(playerId: string): { success: boolean; message: string } {
    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return { success: false, message: '没有师徒关系' };
    }

    if (relationship.isGraduated) {
      return { success: false, message: '已经出师，无法解除关系' };
    }

    // 扣除师德惩罚
    if (relationship.virtuePoints > 1000) {
      return {
        success: false,
        message: `师德值过高（${relationship.virtuePoints}），请先通过互动降低至 1000 以下再解除关系`,
      };
    }

    // 解除关系
    this.playerRelationshipMap.delete(relationship.masterId);
    this.playerRelationshipMap.delete(relationship.apprenticeId);
    this.relationships.delete(relationship.id);

    return { success: true, message: '已解除师徒关系' };
  }

  /**
   * 获取可用的师徒任务
   */
  getAvailableTasks(playerId: string): ApprenticeTask[] {
    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return [];
    }

    return APPRENTICE_TASKS.filter(task => {
      if (relationship.virtuePoints < task.requirements.minVirtuePoints) return false;
      if (relationship.level < task.requirements.minRelationshipLevel) return false;
      if (relationship.completedTasks.includes(task.id)) return false;
      return true;
    });
  }

  /**
   * 完成师徒任务
   */
  completeTask(playerId: string, taskId: string): { success: boolean; rewards?: any; message: string } {
    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return { success: false, message: '没有师徒关系' };
    }

    const task = APPRENTICE_TASKS.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: '任务不存在' };
    }

    if (relationship.completedTasks.includes(taskId)) {
      return { success: false, message: '任务已完成' };
    }

    if (relationship.virtuePoints < task.requirements.minVirtuePoints) {
      return { success: false, message: '师德值不足' };
    }

    if (relationship.level < task.requirements.minRelationshipLevel) {
      return { success: false, message: '师徒等级不足' };
    }

    // 完成任务
    relationship.completedTasks.push(taskId);
    
    // 师傅获得师德值
    if (relationship.masterId === playerId) {
      relationship.virtuePoints = Math.min(10000, relationship.virtuePoints + task.rewards.virtuePoints);
      relationship.level = this.getRelationshipLevel(relationship.virtuePoints);
    }

    this.relationships.set(relationship.id, relationship);

    return {
      success: true,
      rewards: task.rewards,
      message: `任务完成！获得师德 +${task.rewards.virtuePoints}, 经验 +${task.rewards.exp}, 金币 +${task.rewards.gold}`,
    };
  }

  /**
   * 获取可用的师徒技能
   */
  getAvailableSkills(playerId: string): MasterSkill[] {
    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return [];
    }

    return MASTER_SKILLS.filter(skill => relationship.virtuePoints >= skill.minVirtuePoints);
  }

  /**
   * 激活师徒技能
   */
  activateSkill(playerId: string, skillId: string): { success: boolean; effect?: any; message: string } {
    const relationship = this.getRelationship(playerId);
    if (!relationship) {
      return { success: false, message: '没有师徒关系' };
    }

    const skill = MASTER_SKILLS.find(s => s.id === skillId);
    if (!skill) {
      return { success: false, message: '技能不存在' };
    }

    if (relationship.virtuePoints < skill.minVirtuePoints) {
      return { success: false, message: `师德值不足，需要 ${skill.minVirtuePoints}` };
    }

    return {
      success: true,
      effect: skill.effect,
      message: `激活技能：${skill.name}`,
    };
  }

  /**
   * 获取师徒统计
   */
  getStats(): {
    totalRelationships: number;
    activeRelationships: number;
    graduatedCount: number;
    averageVirtuePoints: number;
    highestVirtuePoints: number;
  } {
    const relationships = Array.from(this.relationships.values());
    const active = relationships.filter(r => !r.isGraduated);
    const graduated = relationships.filter(r => r.isGraduated);
    const totalVirtue = relationships.reduce((sum, r) => sum + r.virtuePoints, 0);
    const highestVirtue = relationships.reduce((max, r) => Math.max(max, r.virtuePoints), 0);

    return {
      totalRelationships: relationships.length,
      activeRelationships: active.length,
      graduatedCount: graduated.length,
      averageVirtuePoints: relationships.length > 0 ? Math.round(totalVirtue / relationships.length) : 0,
      highestVirtuePoints: highestVirtue,
    };
  }
}

// 导出单例
export const apprenticeSystem = new ApprenticeSystem();
