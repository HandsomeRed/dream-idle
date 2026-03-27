/**
 * v0.79 - 姻缘系统 (Marriage/Partnership System)
 * 
 * 功能：
 * - 求婚与结婚系统
 * - 夫妻亲密度
 * - 夫妻专属技能
 * - 夫妻任务
 * - 结婚奖励
 */

export interface MarriageProposal {
  id: string;
  proposerId: string;
  targetId: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  giftItem?: string;
}

export interface MarriageRelationship {
  id: string;
  partnerA: string;
  partnerB: string;
  marryDate: number;
  intimacy: number; // 0-10000
  level: number; // 1-10 based on intimacy
  activeSkill?: string;
  completedQuests: string[];
  anniversaryDays: number;
}

export interface CoupleSkill {
  id: string;
  name: string;
  description: string;
  minIntimacy: number;
  effect: {
    type: 'stat_boost' | 'damage_bonus' | 'exp_bonus' | 'gold_bonus';
    value: number;
  };
  cooldown?: number; // seconds
}

export interface CoupleQuest {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: {
    minIntimacy: number;
    minLevel: number;
  };
  rewards: {
    intimacy: number;
    gold: number;
    exp: number;
    items?: string[];
  };
}

// 亲密度等级配置
const INTIMACY_LEVELS = [
  { level: 1, minIntimacy: 0, name: '陌生', maxIntimacy: 999 },
  { level: 2, minIntimacy: 1000, name: '相识', maxIntimacy: 1999 },
  { level: 3, minIntimacy: 2000, name: '友好', maxIntimacy: 2999 },
  { level: 4, minIntimacy: 3000, name: '亲密', maxIntimacy: 3999 },
  { level: 5, minIntimacy: 4000, name: '恋人', maxIntimacy: 4999 },
  { level: 6, minIntimacy: 5000, name: '新婚', maxIntimacy: 5999 },
  { level: 7, minIntimacy: 6000, name: '恩爱', maxIntimacy: 6999 },
  { level: 8, minIntimacy: 7000, name: '伉俪', maxIntimacy: 7999 },
  { level: 9, minIntimacy: 8000, name: '比翼', maxIntimacy: 8999 },
  { level: 10, minIntimacy: 9000, name: '连理', maxIntimacy: 10000 },
];

// 夫妻技能库
const COUPLE_SKILLS: CoupleSkill[] = [
  {
    id: 'couple_skill_1',
    name: '心心相印',
    description: '双方攻击力提升 5%',
    minIntimacy: 5000,
    effect: { type: 'damage_bonus', value: 0.05 },
  },
  {
    id: 'couple_skill_2',
    name: '生死与共',
    description: '一方倒地时，另一方立即恢复 30% 生命值（每场战斗限 1 次）',
    minIntimacy: 6000,
    effect: { type: 'stat_boost', value: 0.3 },
    cooldown: 300,
  },
  {
    id: 'couple_skill_3',
    name: '比翼双飞',
    description: '双方速度提升 10%',
    minIntimacy: 7000,
    effect: { type: 'stat_boost', value: 0.1 },
  },
  {
    id: 'couple_skill_4',
    name: '琴瑟和鸣',
    description: '双方经验获取提升 15%',
    minIntimacy: 8000,
    effect: { type: 'exp_bonus', value: 0.15 },
  },
  {
    id: 'couple_skill_5',
    name: '天作之合',
    description: '双方所有属性提升 8%',
    minIntimacy: 9000,
    effect: { type: 'stat_boost', value: 0.08 },
  },
];

// 夫妻任务库
const COUPLE_QUESTS: CoupleQuest[] = [
  {
    id: 'couple_quest_1',
    name: '初见回忆',
    description: '一起完成 3 次副本',
    difficulty: 'easy',
    requirements: { minIntimacy: 3000, minLevel: 6 },
    rewards: { intimacy: 200, gold: 5000, exp: 1000 },
  },
  {
    id: 'couple_quest_2',
    name: '默契考验',
    description: '在竞技场中共同获胜 5 场',
    difficulty: 'medium',
    requirements: { minIntimacy: 5000, minLevel: 7 },
    rewards: { intimacy: 500, gold: 10000, exp: 2000 },
  },
  {
    id: 'couple_quest_3',
    name: '生死相依',
    description: '一起挑战世界 BOSS 并造成伤害前 10',
    difficulty: 'hard',
    requirements: { minIntimacy: 7000, minLevel: 8 },
    rewards: { intimacy: 1000, gold: 50000, exp: 10000, items: ['couple_ring'] },
  },
];

export class MarriageSystem {
  private proposals: Map<string, MarriageProposal> = new Map();
  private marriages: Map<string, MarriageRelationship> = new Map();
  private playerMarriageMap: Map<string, string> = new Map(); // playerId -> marriageId

  /**
   * 求婚
   */
  propose(proposerId: string, targetId: string, giftItem?: string): MarriageProposal {
    // 检查是否已经结婚
    if (this.playerMarriageMap.has(proposerId)) {
      throw new Error('你已经结婚了，不能再求婚');
    }
    if (this.playerMarriageMap.has(targetId)) {
      throw new Error('对方已经结婚了');
    }

    // 检查是否有待处理的求婚
    const existingProposal = Array.from(this.proposals.values()).find(
      p => (p.proposerId === proposerId && p.targetId === targetId) ||
           (p.proposerId === targetId && p.targetId === proposerId)
    );

    if (existingProposal && existingProposal.status === 'pending') {
      throw new Error('已有待处理的求婚');
    }

    const proposal: MarriageProposal = {
      id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      proposerId,
      targetId,
      timestamp: Date.now(),
      status: 'pending',
      giftItem,
    };

    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  /**
   * 回应求婚
   */
  respondToProposal(proposalId: string, accept: boolean): MarriageRelationship | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('求婚不存在');
    }

    if (proposal.status !== 'pending') {
      throw new Error('求婚已过期或已处理');
    }

    // 检查是否过期（24 小时）
    if (Date.now() - proposal.timestamp > 24 * 60 * 60 * 1000) {
      proposal.status = 'expired';
      this.proposals.set(proposalId, proposal);
      return null;
    }

    if (!accept) {
      proposal.status = 'rejected';
      this.proposals.set(proposalId, proposal);
      return null;
    }

    // 接受求婚，创建婚姻关系
    proposal.status = 'accepted';
    this.proposals.set(proposalId, proposal);

    const marriage: MarriageRelationship = {
      id: `marriage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      partnerA: proposal.proposerId,
      partnerB: proposal.targetId,
      marryDate: Date.now(),
      intimacy: 5000, // 初始亲密度
      level: 6, // 新婚等级
      activeSkill: undefined,
      completedQuests: [],
      anniversaryDays: 0,
    };

    this.marriages.set(marriage.id, marriage);
    this.playerMarriageMap.set(proposal.proposerId, marriage.id);
    this.playerMarriageMap.set(proposal.targetId, marriage.id);

    return marriage;
  }

  /**
   * 获取玩家的婚姻关系
   */
  getMarriage(playerId: string): MarriageRelationship | null {
    const marriageId = this.playerMarriageMap.get(playerId);
    if (!marriageId) {
      return null;
    }
    return this.marriages.get(marriageId) || null;
  }

  /**
   * 增加亲密度
   */
  addIntimacy(playerId: string, amount: number): MarriageRelationship | null {
    const marriage = this.getMarriage(playerId);
    if (!marriage) {
      return null;
    }

    marriage.intimacy = Math.min(10000, marriage.intimacy + amount);
    marriage.level = this.getIntimacyLevel(marriage.intimacy);

    this.marriages.set(marriage.id, marriage);
    return marriage;
  }

  /**
   * 获取亲密度等级
   */
  getIntimacyLevel(intimacy: number): number {
    for (let i = INTIMACY_LEVELS.length - 1; i >= 0; i--) {
      if (intimacy >= INTIMACY_LEVELS[i].minIntimacy) {
        return INTIMACY_LEVELS[i].level;
      }
    }
    return 1;
  }

  /**
   * 获取亲密度等级名称
   */
  getIntimacyLevelName(level: number): string {
    const config = INTIMACY_LEVELS.find(l => l.level === level);
    return config ? config.name : '陌生';
  }

  /**
   * 解锁夫妻技能
   */
  unlockCoupleSkill(playerId: string, skillId: string): MarriageRelationship | null {
    const marriage = this.getMarriage(playerId);
    if (!marriage) {
      return null;
    }

    const skill = COUPLE_SKILLS.find(s => s.id === skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    if (marriage.intimacy < skill.minIntimacy) {
      throw new Error(`亲密度不足，需要 ${skill.minIntimacy}`);
    }

    marriage.activeSkill = skillId;
    this.marriages.set(marriage.id, marriage);
    return marriage;
  }

  /**
   * 获取可用的夫妻技能
   */
  getAvailableCoupleSkills(playerId: string): CoupleSkill[] {
    const marriage = this.getMarriage(playerId);
    if (!marriage) {
      return [];
    }

    return COUPLE_SKILLS.filter(skill => marriage.intimacy >= skill.minIntimacy);
  }

  /**
   * 激活夫妻技能效果
   */
  activateCoupleSkill(playerId: string): { success: boolean; effect?: any; message: string } {
    const marriage = this.getMarriage(playerId);
    if (!marriage) {
      return { success: false, message: '没有婚姻关系' };
    }

    if (!marriage.activeSkill) {
      return { success: false, message: '未激活任何技能' };
    }

    const skill = COUPLE_SKILLS.find(s => s.id === marriage.activeSkill);
    if (!skill) {
      return { success: false, message: '技能不存在' };
    }

    // 这里可以添加 cooldown 检查
    return {
      success: true,
      effect: skill.effect,
      message: `激活技能：${skill.name}`,
    };
  }

  /**
   * 获取可用的夫妻任务
   */
  getAvailableCoupleQuests(playerId: string): CoupleQuest[] {
    const marriage = this.getMarriage(playerId);
    if (!marriage) {
      return [];
    }

    return COUPLE_QUESTS.filter(quest => {
      if (marriage.intimacy < quest.requirements.minIntimacy) return false;
      if (marriage.level < quest.requirements.minLevel) return false;
      if (marriage.completedQuests.includes(quest.id)) return false;
      return true;
    });
  }

  /**
   * 完成夫妻任务
   */
  completeCoupleQuest(playerId: string, questId: string): { success: boolean; rewards?: any; message: string } {
    const marriage = this.getMarriage(playerId);
    if (!marriage) {
      return { success: false, message: '没有婚姻关系' };
    }

    const quest = COUPLE_QUESTS.find(q => q.id === questId);
    if (!quest) {
      return { success: false, message: '任务不存在' };
    }

    if (marriage.completedQuests.includes(questId)) {
      return { success: false, message: '任务已完成' };
    }

    if (marriage.intimacy < quest.requirements.minIntimacy) {
      return { success: false, message: '亲密度不足' };
    }

    if (marriage.level < quest.requirements.minLevel) {
      return { success: false, message: '等级不足' };
    }

    // 完成任务
    marriage.completedQuests.push(questId);
    marriage.intimacy = Math.min(10000, marriage.intimacy + quest.rewards.intimacy);
    marriage.level = this.getIntimacyLevel(marriage.intimacy);

    this.marriages.set(marriage.id, marriage);

    return {
      success: true,
      rewards: quest.rewards,
      message: `任务完成！获得亲密度 +${quest.rewards.intimacy}, 金币 +${quest.rewards.gold}, 经验 +${quest.rewards.exp}`,
    };
  }

  /**
   * 计算结婚纪念日
   */
  getAnniversaryDays(playerId: string): number {
    const marriage = this.getMarriage(playerId);
    if (!marriage) {
      return 0;
    }

    const now = Date.now();
    const marryDate = marriage.marryDate;
    const days = Math.floor((now - marryDate) / (24 * 60 * 60 * 1000));
    
    marriage.anniversaryDays = days;
    this.marriages.set(marriage.id, marriage);
    
    return days;
  }

  /**
   * 离婚
   */
  divorce(playerId: string): { success: boolean; message: string } {
    const marriage = this.getMarriage(playerId);
    if (!marriage) {
      return { success: false, message: '没有婚姻关系' };
    }

    // 扣除亲密度惩罚（如果亲密度高）
    if (marriage.intimacy > 5000) {
      return { 
        success: false, 
        message: `亲密度过高（${marriage.intimacy}），无法离婚。请通过互动降低亲密度至 5000 以下` 
      };
    }

    // 解除婚姻关系
    this.playerMarriageMap.delete(marriage.partnerA);
    this.playerMarriageMap.delete(marriage.partnerB);
    this.marriages.delete(marriage.id);

    return { success: true, message: '已解除婚姻关系' };
  }

  /**
   * 获取婚姻统计
   */
  getStats(): {
    totalMarriages: number;
    totalProposals: number;
    averageIntimacy: number;
    highestIntimacy: number;
  } {
    const marriages = Array.from(this.marriages.values());
    const totalIntimacy = marriages.reduce((sum, m) => sum + m.intimacy, 0);
    const highestIntimacy = marriages.reduce((max, m) => Math.max(max, m.intimacy), 0);

    return {
      totalMarriages: marriages.length,
      totalProposals: this.proposals.size,
      averageIntimacy: marriages.length > 0 ? Math.round(totalIntimacy / marriages.length) : 0,
      highestIntimacy: highestIntimacy,
    };
  }
}

// 导出单例
export const marriageSystem = new MarriageSystem();
