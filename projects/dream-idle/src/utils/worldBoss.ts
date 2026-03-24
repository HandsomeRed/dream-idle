// v0.46 世界 BOSS 系统

/**
 * BOSS 难度
 */
export type BossDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare' | 'hell';

/**
 * BOSS 阶段
 */
export type BossPhase = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'enraged';

/**
 * BOSS 技能类型
 */
export type BossSkillType = 'single_target' | 'aoe' | 'buff' | 'debuff' | 'summon';

/**
 * BOSS 技能
 */
export interface BossSkill {
  id: string;
  name: string;
  description: string;
  type: BossSkillType;
  damageMultiplier: number;
  targetCount: number;
  cooldown: number;
  phase?: BossPhase; // 特定阶段才使用
}

/**
 * BOSS 配置
 */
export interface BossConfig {
  id: string;
  name: string;
  description: string;
  difficulty: BossDifficulty;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  skills: BossSkill[];
  phases: BossPhaseConfig[];
  rewards: BossReward[];
  timeLimit: number; // 秒
  minPlayerLevel: number;
  maxPlayers: number;
}

/**
 * BOSS 阶段配置
 */
export interface BossPhaseConfig {
  phase: BossPhase;
  hpThreshold: number; // 百分比，低于此值进入该阶段
  attackMultiplier: number;
  defenseMultiplier: number;
  newSkills?: string[];
}

/**
 * BOSS 奖励
 */
export interface BossReward {
  type: 'gold' | 'diamond' | 'exp' | 'item' | 'equipment' | 'hero_shard';
  itemId?: string;
  minAmount: number;
  maxAmount: number;
  dropRate: number; // 掉落概率
}

/**
 * 玩家 BOSS 挑战记录
 */
export interface BossChallenge {
  bossId: string;
  playerId: string;
  damage: number;
  rank: number;
  rewards: BossReward[];
  completedAt: number;
  duration: number; // 战斗时长（秒）
}

/**
 * BOSS 实例
 */
export interface BossInstance {
  id: string;
  bossId: string;
  currentHp: number;
  maxHp: number;
  currentPhase: BossPhase;
  spawnedAt: number;
  expiresAt: number;
  participants: string[]; // 玩家 ID 列表
  totalDamage: number;
  damageRanking: Map<string, number>; // playerId -> damage
  isDefeated: boolean;
  defeatedAt?: number;
}

/**
 * 所有 BOSS 配置
 */
export const BOSS_CONFIGS: Record<string, BossConfig> = {
  // ===== 普通难度 BOSS =====
  'boss_001': {
    id: 'boss_001',
    name: '千年树妖',
    description: '盘踞在森林深处的千年妖树，能召唤藤蔓攻击敌人',
    difficulty: 'easy',
    level: 20,
    hp: 100000,
    attack: 500,
    defense: 200,
    skills: [
      {
        id: 'skill_boss_001',
        name: '藤蔓缠绕',
        description: '对单个目标造成 120% 攻击力的伤害',
        type: 'single_target',
        damageMultiplier: 1.2,
        targetCount: 1,
        cooldown: 3,
      },
      {
        id: 'skill_boss_002',
        name: '自然之怒',
        description: '对所有敌人造成 80% 攻击力的伤害',
        type: 'aoe',
        damageMultiplier: 0.8,
        targetCount: 5,
        cooldown: 5,
      },
    ],
    phases: [
      {
        phase: 'phase1',
        hpThreshold: 1.0,
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
      },
      {
        phase: 'phase2',
        hpThreshold: 0.5,
        attackMultiplier: 1.2,
        defenseMultiplier: 0.8,
      },
      {
        phase: 'enraged',
        hpThreshold: 0.1,
        attackMultiplier: 1.5,
        defenseMultiplier: 0.5,
      },
    ],
    rewards: [
      { type: 'gold', minAmount: 5000, maxAmount: 10000, dropRate: 1.0 },
      { type: 'exp', minAmount: 1000, maxAmount: 2000, dropRate: 1.0 },
      { type: 'item', itemId: 'skill_book_common', minAmount: 1, maxAmount: 3, dropRate: 0.5 },
    ],
    timeLimit: 300,
    minPlayerLevel: 15,
    maxPlayers: 10,
  },
  'boss_002': {
    id: 'boss_002',
    name: '寒冰巨龙',
    description: '来自北方冰原的远古巨龙，掌握冰霜之力',
    difficulty: 'normal',
    level: 40,
    hp: 500000,
    attack: 1200,
    defense: 500,
    skills: [
      {
        id: 'skill_boss_003',
        name: '冰霜吐息',
        description: '对所有敌人造成 100% 攻击力的冰系伤害',
        type: 'aoe',
        damageMultiplier: 1.0,
        targetCount: 5,
        cooldown: 4,
      },
      {
        id: 'skill_boss_004',
        name: '冰封牢笼',
        description: '冻结单个目标，使其无法行动 2 回合',
        type: 'debuff',
        damageMultiplier: 0.5,
        targetCount: 1,
        cooldown: 6,
      },
    ],
    phases: [
      {
        phase: 'phase1',
        hpThreshold: 1.0,
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
      },
      {
        phase: 'phase2',
        hpThreshold: 0.6,
        attackMultiplier: 1.3,
        defenseMultiplier: 0.9,
      },
      {
        phase: 'phase3',
        hpThreshold: 0.3,
        attackMultiplier: 1.5,
        defenseMultiplier: 0.7,
      },
    ],
    rewards: [
      { type: 'gold', minAmount: 20000, maxAmount: 40000, dropRate: 1.0 },
      { type: 'diamond', minAmount: 50, maxAmount: 100, dropRate: 1.0 },
      { type: 'item', itemId: 'skill_book_rare', minAmount: 1, maxAmount: 2, dropRate: 0.3 },
      { type: 'hero_shard', itemId: 'hero_021', minAmount: 5, maxAmount: 10, dropRate: 0.4 },
    ],
    timeLimit: 420,
    minPlayerLevel: 35,
    maxPlayers: 20,
  },
  'boss_003': {
    id: 'boss_003',
    name: '炎魔领主',
    description: '地狱深处的火焰魔神，拥有毁灭性的力量',
    difficulty: 'hard',
    level: 60,
    hp: 2000000,
    attack: 3000,
    defense: 1200,
    skills: [
      {
        id: 'skill_boss_005',
        name: '地狱火雨',
        description: '对所有敌人造成 150% 攻击力的火系伤害',
        type: 'aoe',
        damageMultiplier: 1.5,
        targetCount: 5,
        cooldown: 5,
      },
      {
        id: 'skill_boss_006',
        name: '火焰旋风',
        description: '对随机 3 个目标造成 200% 攻击力的伤害',
        type: 'aoe',
        damageMultiplier: 2.0,
        targetCount: 3,
        cooldown: 7,
      },
      {
        id: 'skill_boss_007',
        name: '魔神之力',
        description: '提升自身 50% 攻击力，持续 3 回合',
        type: 'buff',
        damageMultiplier: 0,
        targetCount: 0,
        cooldown: 10,
      },
    ],
    phases: [
      {
        phase: 'phase1',
        hpThreshold: 1.0,
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
      },
      {
        phase: 'phase2',
        hpThreshold: 0.7,
        attackMultiplier: 1.3,
        defenseMultiplier: 0.9,
      },
      {
        phase: 'phase3',
        hpThreshold: 0.4,
        attackMultiplier: 1.6,
        defenseMultiplier: 0.7,
      },
      {
        phase: 'enraged',
        hpThreshold: 0.15,
        attackMultiplier: 2.0,
        defenseMultiplier: 0.5,
      },
    ],
    rewards: [
      { type: 'gold', minAmount: 50000, maxAmount: 100000, dropRate: 1.0 },
      { type: 'diamond', minAmount: 200, maxAmount: 400, dropRate: 1.0 },
      { type: 'equipment', itemId: 'epic_weapon', minAmount: 1, maxAmount: 1, dropRate: 0.2 },
      { type: 'hero_shard', itemId: 'hero_030', minAmount: 10, maxAmount: 20, dropRate: 0.3 },
    ],
    timeLimit: 600,
    minPlayerLevel: 55,
    maxPlayers: 30,
  },
  'boss_004': {
    id: 'boss_004',
    name: '混沌魔神',
    description: '来自混沌虚空的远古魔神，拥有毁天灭地的力量',
    difficulty: 'nightmare',
    level: 80,
    hp: 10000000,
    attack: 8000,
    defense: 3000,
    skills: [
      {
        id: 'skill_boss_008',
        name: '混沌冲击',
        description: '对所有敌人造成 200% 攻击力的伤害',
        type: 'aoe',
        damageMultiplier: 2.0,
        targetCount: 5,
        cooldown: 4,
      },
      {
        id: 'skill_boss_009',
        name: '虚空召唤',
        description: '召唤 2 个虚空分身协助战斗',
        type: 'summon',
        damageMultiplier: 0,
        targetCount: 0,
        cooldown: 15,
      },
      {
        id: 'skill_boss_010',
        name: '灭世一击',
        description: '对血量最低的目标造成 500% 攻击力的伤害',
        type: 'single_target',
        damageMultiplier: 5.0,
        targetCount: 1,
        cooldown: 20,
      },
    ],
    phases: [
      {
        phase: 'phase1',
        hpThreshold: 1.0,
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
      },
      {
        phase: 'phase2',
        hpThreshold: 0.75,
        attackMultiplier: 1.4,
        defenseMultiplier: 0.85,
      },
      {
        phase: 'phase3',
        hpThreshold: 0.5,
        attackMultiplier: 1.8,
        defenseMultiplier: 0.7,
      },
      {
        phase: 'enraged',
        hpThreshold: 0.25,
        attackMultiplier: 2.5,
        defenseMultiplier: 0.4,
      },
    ],
    rewards: [
      { type: 'gold', minAmount: 200000, maxAmount: 500000, dropRate: 1.0 },
      { type: 'diamond', minAmount: 1000, maxAmount: 2000, dropRate: 1.0 },
      { type: 'equipment', itemId: 'legendary_armor', minAmount: 1, maxAmount: 1, dropRate: 0.1 },
      { type: 'hero_shard', itemId: 'hero_031', minAmount: 20, maxAmount: 50, dropRate: 0.25 },
    ],
    timeLimit: 900,
    minPlayerLevel: 75,
    maxPlayers: 50,
  },
  'boss_005': {
    id: 'boss_005',
    name: '创世神龙',
    description: '传说中的创世神龙，拥有创造与毁灭的双重力量',
    difficulty: 'hell',
    level: 100,
    hp: 50000000,
    attack: 20000,
    defense: 8000,
    skills: [
      {
        id: 'skill_boss_011',
        name: '龙息毁灭',
        description: '对所有敌人造成 300% 攻击力的伤害',
        type: 'aoe',
        damageMultiplier: 3.0,
        targetCount: 5,
        cooldown: 5,
      },
      {
        id: 'skill_boss_012',
        name: '时空扭曲',
        description: '使所有敌人技能冷却时间 +3 回合',
        type: 'debuff',
        damageMultiplier: 0,
        targetCount: 5,
        cooldown: 12,
      },
      {
        id: 'skill_boss_013',
        name: '神龙降临',
        description: '提升自身 100% 全属性，持续 5 回合',
        type: 'buff',
        damageMultiplier: 0,
        targetCount: 0,
        cooldown: 20,
      },
      {
        id: 'skill_boss_014',
        name: '创世一击',
        description: '对随机目标造成 1000% 攻击力的真实伤害',
        type: 'single_target',
        damageMultiplier: 10.0,
        targetCount: 1,
        cooldown: 30,
      },
    ],
    phases: [
      {
        phase: 'phase1',
        hpThreshold: 1.0,
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
      },
      {
        phase: 'phase2',
        hpThreshold: 0.8,
        attackMultiplier: 1.5,
        defenseMultiplier: 0.9,
      },
      {
        phase: 'phase3',
        hpThreshold: 0.6,
        attackMultiplier: 2.0,
        defenseMultiplier: 0.8,
      },
      {
        phase: 'phase4',
        hpThreshold: 0.4,
        attackMultiplier: 2.5,
        defenseMultiplier: 0.6,
      },
      {
        phase: 'enraged',
        hpThreshold: 0.2,
        attackMultiplier: 3.0,
        defenseMultiplier: 0.3,
      },
    ],
    rewards: [
      { type: 'gold', minAmount: 1000000, maxAmount: 2000000, dropRate: 1.0 },
      { type: 'diamond', minAmount: 5000, maxAmount: 10000, dropRate: 1.0 },
      { type: 'equipment', itemId: 'mythic_weapon', minAmount: 1, maxAmount: 1, dropRate: 0.05 },
      { type: 'hero_shard', itemId: 'hero_034', minAmount: 50, maxAmount: 100, dropRate: 0.2 },
    ],
    timeLimit: 1200,
    minPlayerLevel: 90,
    maxPlayers: 100,
  },
};

/**
 * 根据难度获取难度系数
 */
export function getDifficultyMultiplier(difficulty: BossDifficulty): number {
  const multipliers: Record<BossDifficulty, number> = {
    easy: 1.0,
    normal: 2.0,
    hard: 5.0,
    nightmare: 10.0,
    hell: 25.0,
  };
  return multipliers[difficulty];
}

/**
 * 计算 BOSS 当前属性（考虑阶段加成）
 */
export function calculateBossStats(
  boss: BossConfig,
  currentPhase: BossPhase
): { hp: number; attack: number; defense: number } {
  const phaseConfig = boss.phases.find(p => p.phase === currentPhase);
  if (!phaseConfig) {
    return { hp: boss.hp, attack: boss.attack, defense: boss.defense };
  }

  return {
    hp: Math.floor(boss.hp * phaseConfig.hpThreshold),
    attack: Math.floor(boss.attack * phaseConfig.attackMultiplier),
    defense: Math.floor(boss.defense * phaseConfig.defenseMultiplier),
  };
}

/**
 * 获取 BOSS 可用技能
 */
export function getAvailableSkills(boss: BossConfig, currentPhase: BossPhase): BossSkill[] {
  let skills = [...boss.skills];

  // 添加阶段专属技能
  for (const phase of boss.phases) {
    if (phase.phase === currentPhase && phase.newSkills) {
      for (const skillId of phase.newSkills) {
        const skill = boss.skills.find(s => s.id === skillId);
        if (skill && !skills.includes(skill)) {
          skills.push(skill);
        }
      }
    }
  }

  return skills;
}

/**
 * 检查是否应该切换阶段
 */
export function checkPhaseChange(
  boss: BossConfig,
  currentHp: number,
  maxHp: number,
  currentPhase: BossPhase
): BossPhase {
  const hpPercent = currentHp / maxHp;

  // 按阈值从低到高检查，找到最匹配的阶段
  const phases = [...boss.phases].sort((a, b) => a.hpThreshold - b.hpThreshold);

  let matchedPhase = currentPhase;
  for (const phase of phases) {
    if (hpPercent <= phase.hpThreshold) {
      matchedPhase = phase.phase;
    }
  }

  return matchedPhase;
}

/**
 * 计算伤害结算
 */
export function calculateDamage(
  attackerAttack: number,
  defenderDefense: number,
  skillMultiplier: number,
  isCrit: boolean = false
): number {
  const baseDamage = attackerAttack * skillMultiplier;
  const defenseReduction = defenderDefense / (defenderDefense + 1000);
  const finalDamage = baseDamage * (1 - defenseReduction);

  if (isCrit) {
    return Math.floor(finalDamage * 1.5);
  }

  return Math.floor(finalDamage);
}

/**
 * 生成奖励
 */
export function generateRewards(boss: BossConfig, damageRank: number, totalParticipants: number): BossReward[] {
  const rewards: BossReward[] = [];

  for (const reward of boss.rewards) {
    const roll = Math.random();
    if (roll <= reward.dropRate) {
      // 根据排名调整奖励数量
      const rankMultiplier = 1 - (damageRank / totalParticipants) * 0.5; // 第 1 名 100%, 最后一名 50%
      const amount = Math.floor(
        (reward.minAmount + Math.random() * (reward.maxAmount - reward.minAmount)) * rankMultiplier
      );

      rewards.push({
        ...reward,
        minAmount: amount,
        maxAmount: amount,
      });
    }
  }

  return rewards;
}

/**
 * 世界 BOSS 系统主类
 */
export class WorldBossSystem {
  private activeBosses: Map<string, BossInstance>;
  private playerChallenges: Map<string, BossChallenge[]>; // playerId -> challenges
  private bossSpawnSchedule: Map<string, number>; // bossId -> nextSpawnTime

  constructor() {
    this.activeBosses = new Map();
    this.playerChallenges = new Map();
    this.bossSpawnSchedule = new Map();
  }

  /**
   * 生成 BOSS
   */
  spawnBoss(bossId: string): BossInstance {
    const boss = BOSS_CONFIGS[bossId];
    if (!boss) {
      throw new Error(`BOSS ${bossId} not found`);
    }

    const now = Date.now();
    const instance: BossInstance = {
      id: `boss_${bossId}_${now}`,
      bossId,
      currentHp: boss.hp,
      maxHp: boss.hp,
      currentPhase: 'phase1',
      spawnedAt: now,
      expiresAt: now + boss.timeLimit * 1000,
      participants: [],
      totalDamage: 0,
      damageRanking: new Map(),
      isDefeated: false,
    };

    this.activeBosses.set(instance.id, instance);

    // 设置下次生成时间
    const nextSpawn = now + boss.timeLimit * 1000 + 3600000; // 1 小时后
    this.bossSpawnSchedule.set(bossId, nextSpawn);

    return instance;
  }

  /**
   * 玩家挑战 BOSS
   */
  challengeBoss(
    instanceId: string,
    playerId: string,
    playerAttack: number,
    playerDefense: number,
    skills: string[]
  ): {
    success: boolean;
    message: string;
    damage: number;
    bossHp: number;
    bossPhase: BossPhase;
    isDefeated: boolean;
    rewards?: BossReward[];
  } {
    const instance = this.activeBosses.get(instanceId);
    if (!instance) {
      return { success: false, message: 'BOSS 不存在', damage: 0, bossHp: 0, bossPhase: 'phase1', isDefeated: false };
    }

    if (instance.isDefeated) {
      return { success: false, message: 'BOSS 已被击败', damage: 0, bossHp: 0, bossPhase: 'phase1', isDefeated: true };
    }

    if (instance.expiresAt < Date.now()) {
      return { success: false, message: 'BOSS 已超时', damage: 0, bossHp: 0, bossPhase: 'phase1', isDefeated: false };
    }

    const boss = BOSS_CONFIGS[instance.bossId];

    // 检查玩家等级
    if (playerAttack < boss.minPlayerLevel * 10) {
      return { success: false, message: `玩家等级不足，需要${boss.minPlayerLevel}级`, damage: 0, bossHp: instance.currentHp, bossPhase: instance.currentPhase, isDefeated: false };
    }

    // 添加参与者
    if (!instance.participants.includes(playerId)) {
      instance.participants.push(playerId);
    }

    // 计算玩家伤害（简化战斗逻辑）
    const bossStats = calculateBossStats(boss, instance.currentPhase);
    let totalDamage = 0;

    // 模拟技能释放
    for (const skillId of skills) {
      const skillMultiplier = 1.0; // 简化
      const damage = calculateDamage(playerAttack, bossStats.defense, skillMultiplier);
      totalDamage += damage;
    }

    // 更新 BOSS 血量
    instance.currentHp = Math.max(0, instance.currentHp - totalDamage);
    instance.totalDamage += totalDamage;
    instance.damageRanking.set(playerId, (instance.damageRanking.get(playerId) || 0) + totalDamage);

    // 检查阶段变化
    const newPhase = checkPhaseChange(boss, instance.currentHp, instance.maxHp, instance.currentPhase);
    if (newPhase !== instance.currentPhase) {
      instance.currentPhase = newPhase;
    }

    // 检查是否击败
    let rewards: BossReward[] | undefined;
    if (instance.currentHp <= 0) {
      instance.isDefeated = true;
      instance.defeatedAt = Date.now();

      // 生成奖励
      const ranking = this.getPlayerRanking(instanceId, playerId);
      rewards = generateRewards(boss, ranking, instance.participants.length);

      // 保存挑战记录
      this.saveChallenge(playerId, {
        bossId: instance.bossId,
        playerId,
        damage: totalDamage,
        rank: ranking,
        rewards,
        completedAt: Date.now(),
        duration: (Date.now() - instance.spawnedAt) / 1000,
      });
    }

    return {
      success: true,
      message: instance.isDefeated ? 'BOSS 已被击败！' : '挑战成功',
      damage: totalDamage,
      bossHp: instance.currentHp,
      bossPhase: instance.currentPhase,
      isDefeated: instance.isDefeated,
      rewards,
    };
  }

  /**
   * 获取玩家排名
   */
  getPlayerRanking(instanceId: string, playerId: string): number {
    const instance = this.activeBosses.get(instanceId);
    if (!instance) return 0;

    const sortedRanking = Array.from(instance.damageRanking.entries())
      .sort((a, b) => b[1] - a[1]);

    const index = sortedRanking.findIndex(entry => entry[0] === playerId);
    return index === -1 ? 0 : index + 1;
  }

  /**
   * 获取 BOSS 排行榜
   */
  getRanking(instanceId: string): { playerId: string; damage: number; rank: number }[] {
    const instance = this.activeBosses.get(instanceId);
    if (!instance) return [];

    return Array.from(instance.damageRanking.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([playerId, damage], index) => ({
        playerId,
        damage,
        rank: index + 1,
      }));
  }

  /**
   * 获取所有活跃 BOSS
   */
  getActiveBosses(): BossInstance[] {
    return Array.from(this.activeBosses.values()).filter(b => !b.isDefeated && b.expiresAt > Date.now());
  }

  /**
   * 获取 BOSS 下次生成时间
   */
  getNextSpawnTime(bossId: string): number {
    return this.bossSpawnSchedule.get(bossId) || 0;
  }

  /**
   * 保存挑战记录
   */
  private saveChallenge(playerId: string, challenge: BossChallenge) {
    const challenges = this.playerChallenges.get(playerId) || [];
    challenges.push(challenge);
    this.playerChallenges.set(playerId, challenges);
  }

  /**
   * 获取玩家挑战历史
   */
  getPlayerChallenges(playerId: string): BossChallenge[] {
    return this.playerChallenges.get(playerId) || [];
  }

  /**
   * 清理过期 BOSS
   */
  cleanupExpiredBosses(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, instance] of this.activeBosses.entries()) {
      if (instance.expiresAt < now || instance.isDefeated) {
        this.activeBosses.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 导出存档数据
   */
  exportData(): any {
    return {
      activeBosses: Array.from(this.activeBosses.entries()).map(([id, instance]) => [
        id,
        { ...instance, damageRanking: Array.from(instance.damageRanking.entries()) },
      ]),
      playerChallenges: Array.from(this.playerChallenges.entries()),
      bossSpawnSchedule: Array.from(this.bossSpawnSchedule.entries()),
    };
  }

  /**
   * 导入存档数据
   */
  importData(data: any): void {
    this.activeBosses = new Map(
      data.activeBosses.map(([id, instance]: [string, any]) => [
        id,
        { ...instance, damageRanking: new Map(instance.damageRanking) },
      ])
    );
    this.playerChallenges = new Map(data.playerChallenges);
    this.bossSpawnSchedule = new Map(data.bossSpawnSchedule);
  }
}

/**
 * 创建世界 BOSS 系统实例
 */
export function createWorldBossSystem(): WorldBossSystem {
  return new WorldBossSystem();
}
