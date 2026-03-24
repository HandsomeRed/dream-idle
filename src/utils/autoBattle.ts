// 自动战斗AI系统 - v0.67
// Auto Battle AI - 挂机战斗智能策略

/**
 * AI 策略类型
 */
export type AIStrategy = 'aggressive' | 'defensive' | 'balanced' | 'speed' | 'boss' | 'custom';

/**
 * 目标选择优先级
 */
export type TargetPriority = 'lowest_hp' | 'highest_hp' | 'lowest_def' | 'highest_atk' | 'random' | 'back_row';

/**
 * 技能使用策略
 */
export type SkillPolicy = 'strongest_first' | 'save_ultimate' | 'aoe_priority' | 'single_target' | 'heal_priority';

/**
 * AI 配置
 */
export interface AIConfig {
  strategy: AIStrategy;
  targetPriority: TargetPriority;
  skillPolicy: SkillPolicy;
  /** 低血量切换防御阈值 (0-1) */
  lowHpThreshold: number;
  /** 是否使用治疗技能 */
  useHealing: boolean;
  /** 治疗触发阈值 (0-1) */
  healThreshold: number;
  /** 是否使用buff技能 */
  useBuffs: boolean;
  /** 是否自动使用药水 */
  autoPotion: boolean;
  /** 药水使用阈值 (0-1) */
  potionThreshold: number;
  /** 加速倍率 (1x, 2x, 4x) */
  speedMultiplier: number;
  /** 自动循环战斗 */
  autoRepeat: boolean;
  /** 最大自动循环次数 (0=无限) */
  maxRepeatCount: number;
  /** 失败后是否停止 */
  stopOnDefeat: boolean;
}

/**
 * 战斗单位
 */
export interface BattleUnit {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  isAlly: boolean;
  skills: BattleSkill[];
  position: 'front' | 'back';
  buffs: string[];
  debuffs: string[];
}

/**
 * 战斗技能
 */
export interface BattleSkill {
  id: string;
  name: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff' | 'aoe' | 'ultimate';
  power: number;
  cooldown: number;
  currentCooldown: number;
  targetType: 'enemy' | 'ally' | 'self' | 'all_enemies' | 'all_allies';
}

/**
 * AI 决策结果
 */
export interface AIDecision {
  action: 'attack' | 'skill' | 'defend' | 'potion' | 'flee';
  skillId?: string;
  targetId?: string;
  reason: string;
}

/**
 * 战斗回合记录
 */
export interface BattleLog {
  turn: number;
  unitId: string;
  unitName: string;
  action: string;
  targetId?: string;
  targetName?: string;
  damage?: number;
  healing?: number;
  isCritical?: boolean;
}

/**
 * 自动战斗状态
 */
export interface AutoBattleState {
  config: AIConfig;
  battleCount: number;
  winCount: number;
  loseCount: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealing: number;
  totalTurns: number;
  isRunning: boolean;
  logs: BattleLog[];
}

// ==================== 预设策略 ====================

export const PRESET_STRATEGIES: Record<AIStrategy, Omit<AIConfig, 'autoRepeat' | 'maxRepeatCount'>> = {
  aggressive: {
    strategy: 'aggressive',
    targetPriority: 'lowest_hp',
    skillPolicy: 'strongest_first',
    lowHpThreshold: 0.2,
    useHealing: false,
    healThreshold: 0.3,
    useBuffs: false,
    autoPotion: true,
    potionThreshold: 0.15,
    speedMultiplier: 2,
    stopOnDefeat: false,
  },
  defensive: {
    strategy: 'defensive',
    targetPriority: 'highest_atk',
    skillPolicy: 'heal_priority',
    lowHpThreshold: 0.5,
    useHealing: true,
    healThreshold: 0.6,
    useBuffs: true,
    autoPotion: true,
    potionThreshold: 0.4,
    speedMultiplier: 1,
    stopOnDefeat: true,
  },
  balanced: {
    strategy: 'balanced',
    targetPriority: 'lowest_hp',
    skillPolicy: 'aoe_priority',
    lowHpThreshold: 0.3,
    useHealing: true,
    healThreshold: 0.4,
    useBuffs: true,
    autoPotion: true,
    potionThreshold: 0.25,
    speedMultiplier: 2,
    stopOnDefeat: false,
  },
  speed: {
    strategy: 'speed',
    targetPriority: 'lowest_hp',
    skillPolicy: 'aoe_priority',
    lowHpThreshold: 0.15,
    useHealing: false,
    healThreshold: 0.2,
    useBuffs: false,
    autoPotion: false,
    potionThreshold: 0.1,
    speedMultiplier: 4,
    stopOnDefeat: false,
  },
  boss: {
    strategy: 'boss',
    targetPriority: 'highest_hp',
    skillPolicy: 'save_ultimate',
    lowHpThreshold: 0.4,
    useHealing: true,
    healThreshold: 0.5,
    useBuffs: true,
    autoPotion: true,
    potionThreshold: 0.3,
    speedMultiplier: 1,
    stopOnDefeat: true,
  },
  custom: {
    strategy: 'custom',
    targetPriority: 'lowest_hp',
    skillPolicy: 'strongest_first',
    lowHpThreshold: 0.3,
    useHealing: true,
    healThreshold: 0.4,
    useBuffs: true,
    autoPotion: true,
    potionThreshold: 0.25,
    speedMultiplier: 2,
    stopOnDefeat: false,
  },
};

export const STRATEGY_NAMES: Record<AIStrategy, string> = {
  aggressive: '猛攻',
  defensive: '防御',
  balanced: '均衡',
  speed: '速刷',
  boss: 'Boss战',
  custom: '自定义',
};

// ==================== 核心函数 ====================

/**
 * 创建 AI 配置
 */
export function createAIConfig(strategy: AIStrategy = 'balanced'): AIConfig {
  const preset = PRESET_STRATEGIES[strategy];
  return {
    ...preset,
    autoRepeat: true,
    maxRepeatCount: 0,
  };
}

/**
 * 创建自动战斗状态
 */
export function createAutoBattleState(config?: AIConfig): AutoBattleState {
  return {
    config: config ?? createAIConfig('balanced'),
    battleCount: 0,
    winCount: 0,
    loseCount: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalHealing: 0,
    totalTurns: 0,
    isRunning: false,
    logs: [],
  };
}

/**
 * 获取HP比例
 */
export function getHpRatio(unit: BattleUnit): number {
  return unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
}

/**
 * 选择目标
 */
export function selectTarget(
  enemies: BattleUnit[],
  priority: TargetPriority,
  rng?: () => number
): BattleUnit | null {
  const alive = enemies.filter(e => e.hp > 0);
  if (alive.length === 0) return null;

  switch (priority) {
    case 'lowest_hp':
      return alive.reduce((min, e) => e.hp < min.hp ? e : min, alive[0]);
    case 'highest_hp':
      return alive.reduce((max, e) => e.hp > max.hp ? e : max, alive[0]);
    case 'lowest_def':
      return alive.reduce((min, e) => e.def < min.def ? e : min, alive[0]);
    case 'highest_atk':
      return alive.reduce((max, e) => e.atk > max.atk ? e : max, alive[0]);
    case 'back_row':
      const backRow = alive.filter(e => e.position === 'back');
      return backRow.length > 0 ? backRow[0] : alive[0];
    case 'random':
    default:
      const rand = rng ?? Math.random;
      return alive[Math.floor(rand() * alive.length)];
  }
}

/**
 * 选择技能
 */
export function selectSkill(
  unit: BattleUnit,
  allies: BattleUnit[],
  enemies: BattleUnit[],
  config: AIConfig
): BattleSkill | null {
  const available = unit.skills.filter(s => s.currentCooldown <= 0);
  if (available.length === 0) return null;

  const allyNeedsHeal = allies.some(a => a.hp > 0 && getHpRatio(a) < config.healThreshold);

  switch (config.skillPolicy) {
    case 'heal_priority':
      if (config.useHealing && allyNeedsHeal) {
        const healSkill = available.find(s => s.type === 'heal');
        if (healSkill) return healSkill;
      }
      return available.find(s => s.type === 'attack' || s.type === 'aoe') ?? available[0];

    case 'strongest_first':
      return available.sort((a, b) => b.power - a.power)[0];

    case 'aoe_priority':
      const aoe = available.find(s => s.type === 'aoe');
      if (aoe && enemies.filter(e => e.hp > 0).length >= 2) return aoe;
      return available.sort((a, b) => b.power - a.power)[0];

    case 'save_ultimate':
      const ultimate = available.find(s => s.type === 'ultimate');
      // Use ultimate only if enemies are below 50% or it's a boss
      if (ultimate) {
        const avgEnemyHp = enemies.filter(e => e.hp > 0).reduce((sum, e) => sum + getHpRatio(e), 0) / Math.max(1, enemies.filter(e => e.hp > 0).length);
        if (avgEnemyHp < 0.5) return ultimate;
      }
      const nonUltimate = available.filter(s => s.type !== 'ultimate');
      return nonUltimate.length > 0 ? nonUltimate.sort((a, b) => b.power - a.power)[0] : available[0];

    case 'single_target':
      return available.filter(s => s.type === 'attack').sort((a, b) => b.power - a.power)[0] ?? available[0];

    default:
      return available[0];
  }
}

/**
 * AI 决策
 */
export function makeDecision(
  unit: BattleUnit,
  allies: BattleUnit[],
  enemies: BattleUnit[],
  config: AIConfig,
  rng?: () => number
): AIDecision {
  const hpRatio = getHpRatio(unit);

  // 1. 低血量使用药水
  if (config.autoPotion && hpRatio < config.potionThreshold) {
    return { action: 'potion', reason: `HP过低(${Math.round(hpRatio * 100)}%)，使用药水` };
  }

  // 2. 低血量防御
  if (hpRatio < config.lowHpThreshold && config.strategy === 'defensive') {
    return { action: 'defend', reason: `HP过低(${Math.round(hpRatio * 100)}%)，防御` };
  }

  // 3. 治疗队友
  if (config.useHealing) {
    const allyNeedsHeal = allies.find(a => a.hp > 0 && getHpRatio(a) < config.healThreshold);
    if (allyNeedsHeal) {
      const healSkill = unit.skills.find(s => s.type === 'heal' && s.currentCooldown <= 0);
      if (healSkill) {
        return {
          action: 'skill',
          skillId: healSkill.id,
          targetId: allyNeedsHeal.id,
          reason: `治疗${allyNeedsHeal.name}(HP ${Math.round(getHpRatio(allyNeedsHeal) * 100)}%)`,
        };
      }
    }
  }

  // 4. Buff
  if (config.useBuffs) {
    const buffSkill = unit.skills.find(s => s.type === 'buff' && s.currentCooldown <= 0);
    if (buffSkill && unit.buffs.length === 0) {
      return {
        action: 'skill',
        skillId: buffSkill.id,
        targetId: unit.id,
        reason: '施放增益',
      };
    }
  }

  // 5. 使用技能
  const skill = selectSkill(unit, allies, enemies, config);
  if (skill) {
    const target = skill.targetType === 'all_enemies' || skill.targetType === 'all_allies'
      ? null
      : selectTarget(enemies, config.targetPriority, rng);

    return {
      action: 'skill',
      skillId: skill.id,
      targetId: target?.id,
      reason: `使用${skill.name}`,
    };
  }

  // 6. 普通攻击
  const target = selectTarget(enemies, config.targetPriority, rng);
  return {
    action: 'attack',
    targetId: target?.id,
    reason: '普通攻击',
  };
}

/**
 * 计算伤害
 */
export function calculateDamage(attacker: BattleUnit, defender: BattleUnit, skillPower: number = 1, isCritical: boolean = false): number {
  const baseDamage = Math.max(1, attacker.atk * skillPower - defender.def * 0.5);
  const critMultiplier = isCritical ? 1.5 : 1;
  return Math.round(baseDamage * critMultiplier);
}

/**
 * 模拟一回合战斗
 */
export function simulateTurn(
  allies: BattleUnit[],
  enemies: BattleUnit[],
  config: AIConfig,
  turn: number,
  rng?: () => number
): { allies: BattleUnit[]; enemies: BattleUnit[]; logs: BattleLog[]; finished: boolean; won: boolean } {
  const rand = rng ?? Math.random;
  const logs: BattleLog[] = [];

  // 按速度排序所有存活单位
  const allUnits = [...allies, ...enemies].filter(u => u.hp > 0).sort((a, b) => b.spd - a.spd);

  for (const unit of allUnits) {
    if (unit.hp <= 0) continue;

    const currentAllies = unit.isAlly ? allies : enemies;
    const currentEnemies = unit.isAlly ? enemies : allies;
    const aliveEnemies = currentEnemies.filter(e => e.hp > 0);

    if (aliveEnemies.length === 0) break;

    const decision = unit.isAlly
      ? makeDecision(unit, currentAllies, aliveEnemies, config, () => rand())
      : makeDecision(unit, currentAllies, aliveEnemies, createAIConfig('balanced'), () => rand());

    const log: BattleLog = { turn, unitId: unit.id, unitName: unit.name, action: decision.reason };

    if (decision.action === 'attack' || (decision.action === 'skill' && decision.targetId)) {
      const target = [...allies, ...enemies].find(u => u.id === decision.targetId);
      if (target && target.hp > 0) {
        const skill = decision.skillId ? unit.skills.find(s => s.id === decision.skillId) : null;
        const isCritical = rand() < 0.15;
        const damage = calculateDamage(unit, target, skill?.power ?? 1, isCritical);
        
        if (skill?.type === 'heal') {
          const healing = Math.round(skill.power * unit.atk * 0.5);
          target.hp = Math.min(target.maxHp, target.hp + healing);
          log.healing = healing;
          log.targetId = target.id;
          log.targetName = target.name;
        } else {
          target.hp = Math.max(0, target.hp - damage);
          log.damage = damage;
          log.isCritical = isCritical;
          log.targetId = target.id;
          log.targetName = target.name;
        }

        // 更新冷却
        if (skill) {
          skill.currentCooldown = skill.cooldown;
        }
      }
    } else if (decision.action === 'defend') {
      log.action = '防御';
    } else if (decision.action === 'potion') {
      const healing = Math.round(unit.maxHp * 0.3);
      unit.hp = Math.min(unit.maxHp, unit.hp + healing);
      log.healing = healing;
    }

    logs.push(log);

    // 减少所有技能CD
    unit.skills.forEach(s => {
      if (s.currentCooldown > 0) s.currentCooldown--;
    });
  }

  const allyAlive = allies.some(a => a.hp > 0);
  const enemyAlive = enemies.some(e => e.hp > 0);
  const finished = !allyAlive || !enemyAlive;

  return { allies, enemies, logs, finished, won: !enemyAlive && allyAlive };
}

/**
 * 模拟完整战斗
 */
export function simulateBattle(
  allies: BattleUnit[],
  enemies: BattleUnit[],
  config: AIConfig,
  maxTurns: number = 30,
  rng?: () => number
): { won: boolean; turns: number; logs: BattleLog[]; damageDealt: number; damageTaken: number; healing: number } {
  let currentAllies = allies.map(a => ({ ...a, skills: a.skills.map(s => ({ ...s })) }));
  let currentEnemies = enemies.map(e => ({ ...e, skills: e.skills.map(s => ({ ...s })) }));
  const allLogs: BattleLog[] = [];
  let turnCount = 0;

  for (let turn = 1; turn <= maxTurns; turn++) {
    const result = simulateTurn(currentAllies, currentEnemies, config, turn, rng);
    currentAllies = result.allies;
    currentEnemies = result.enemies;
    allLogs.push(...result.logs);
    turnCount = turn;

    if (result.finished) break;
  }

  const damageDealt = allLogs.filter(l => currentAllies.some(a => a.id === l.unitId) && l.damage).reduce((sum, l) => sum + (l.damage || 0), 0);
  const damageTaken = allLogs.filter(l => currentEnemies.some(e => e.id === l.unitId) && l.damage).reduce((sum, l) => sum + (l.damage || 0), 0);
  const healing = allLogs.filter(l => l.healing).reduce((sum, l) => sum + (l.healing || 0), 0);
  const won = currentEnemies.every(e => e.hp <= 0) && currentAllies.some(a => a.hp > 0);

  return { won, turns: turnCount, logs: allLogs, damageDealt, damageTaken, healing };
}

/**
 * 记录战斗结果到状态
 */
export function recordBattle(
  state: AutoBattleState,
  won: boolean,
  turns: number,
  damageDealt: number,
  damageTaken: number,
  healing: number,
  logs: BattleLog[]
): AutoBattleState {
  return {
    ...state,
    battleCount: state.battleCount + 1,
    winCount: state.winCount + (won ? 1 : 0),
    loseCount: state.loseCount + (won ? 0 : 1),
    totalDamageDealt: state.totalDamageDealt + damageDealt,
    totalDamageTaken: state.totalDamageTaken + damageTaken,
    totalHealing: state.totalHealing + healing,
    totalTurns: state.totalTurns + turns,
    logs: [...logs, ...state.logs].slice(0, 200),
  };
}

/**
 * 检查是否应继续自动战斗
 */
export function shouldContinue(state: AutoBattleState, lastWon: boolean): boolean {
  if (!state.isRunning) return false;
  if (state.config.stopOnDefeat && !lastWon) return false;
  if (state.config.maxRepeatCount > 0 && state.battleCount >= state.config.maxRepeatCount) return false;
  return state.config.autoRepeat;
}

/**
 * 开始自动战斗
 */
export function startAutoBattle(state: AutoBattleState): AutoBattleState {
  return { ...state, isRunning: true };
}

/**
 * 停止自动战斗
 */
export function stopAutoBattle(state: AutoBattleState): AutoBattleState {
  return { ...state, isRunning: false };
}

/**
 * 获取战斗统计
 */
export function getAutoBattleStats(state: AutoBattleState): {
  battleCount: number;
  winRate: number;
  avgTurns: number;
  avgDamageDealt: number;
  avgDamageTaken: number;
  totalHealing: number;
  isRunning: boolean;
  strategy: string;
} {
  return {
    battleCount: state.battleCount,
    winRate: state.battleCount > 0 ? Math.round((state.winCount / state.battleCount) * 100) : 0,
    avgTurns: state.battleCount > 0 ? Math.round(state.totalTurns / state.battleCount) : 0,
    avgDamageDealt: state.battleCount > 0 ? Math.round(state.totalDamageDealt / state.battleCount) : 0,
    avgDamageTaken: state.battleCount > 0 ? Math.round(state.totalDamageTaken / state.battleCount) : 0,
    totalHealing: state.totalHealing,
    isRunning: state.isRunning,
    strategy: STRATEGY_NAMES[state.config.strategy],
  };
}

/**
 * 修改 AI 配置
 */
export function updateAIConfig(state: AutoBattleState, updates: Partial<AIConfig>): AutoBattleState {
  return {
    ...state,
    config: { ...state.config, ...updates },
  };
}

/**
 * 切换策略
 */
export function switchStrategy(state: AutoBattleState, strategy: AIStrategy): AutoBattleState {
  const newConfig = createAIConfig(strategy);
  newConfig.autoRepeat = state.config.autoRepeat;
  newConfig.maxRepeatCount = state.config.maxRepeatCount;
  return { ...state, config: newConfig };
}

/**
 * 获取策略名称
 */
export function getStrategyName(strategy: AIStrategy): string {
  return STRATEGY_NAMES[strategy];
}

/**
 * 创建测试用战斗单位
 */
export function createTestUnit(overrides: Partial<BattleUnit> & { id: string; name: string; isAlly: boolean }): BattleUnit {
  return {
    hp: 1000,
    maxHp: 1000,
    atk: 100,
    def: 50,
    spd: 50,
    skills: [],
    position: 'front',
    buffs: [],
    debuffs: [],
    ...overrides,
  };
}

/**
 * 导出数据
 */
export function exportAutoBattleData(state: AutoBattleState): string {
  return JSON.stringify({ ...state, logs: state.logs.slice(0, 50) });
}

/**
 * 导入数据
 */
export function importAutoBattleData(json: string): AutoBattleState | null {
  try {
    const data = JSON.parse(json);
    if (!data.config || typeof data.battleCount !== 'number') return null;
    return data as AutoBattleState;
  } catch {
    return null;
  }
}
