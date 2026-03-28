// v0.94 阵法系统核心逻辑
import { 
  Formation, 
  FormationBonus, 
  FormationMatchup, 
  FormationConfig,
  PlayerFormation,
  ActiveFormation,
  StatType 
} from '../types/formation';
import { 
  FORMATIONS, 
  FORMATION_MATCHUPS, 
  FORMATION_CONFIG,
  FORMATION_COUNTER_MULTIPLIER 
} from '../data/formations';

/**
 * 获取阵法数据
 */
export function getFormation(formationId: string): Formation | undefined {
  return FORMATIONS.find(f => f.id === formationId);
}

/**
 * 获取所有阵法
 */
export function getAllFormations(): Formation[] {
  return FORMATIONS;
}

/**
 * 计算位置系数
 */
export function getPositionMultiplier(position: number): number {
  return FORMATION_CONFIG.positionMultiplier[position] || 0.6;
}

/**
 * 计算阵法加成 (考虑等级和位置)
 */
export function calculateFormationBonus(
  formation: Formation,
  position: number,
  stat: StatType
): number {
  const baseBonuses = formation.bonuses.filter(
    b => b.position === position && b.stat === stat
  );
  
  if (baseBonuses.length === 0) {
    return 0;
  }
  
  const baseValue = baseBonuses.reduce((sum, b) => sum + b.value, 0);
  const positionMultiplier = getPositionMultiplier(position);
  const levelMultiplier = 1 + (formation.level - 1) * 0.02; // 每级 +2%
  
  return baseValue * positionMultiplier * levelMultiplier;
}

/**
 * 获取阵法在指定位置的所有加成
 */
export function getFormationBonusesAtPosition(
  formation: Formation,
  position: number
): FormationBonus[] {
  const bonuses: FormationBonus[] = [];
  const stats: StatType[] = [
    'damage', 'defense', 'speed', 'magic', 
    'sealHit', 'sealResist', 'crit', 'critResist'
  ];
  
  for (const stat of stats) {
    const value = calculateFormationBonus(formation, position, stat);
    if (value !== 0) {
      bonuses.push({ position, stat, value });
    }
  }
  
  return bonuses;
}

/**
 * 检查阵法克制关系
 */
export function checkFormationMatchup(
  attackerFormationId: string,
  defenderFormationId: string
): 'strong' | 'weak' | 'neutral' {
  if (attackerFormationId === defenderFormationId) {
    return 'neutral';
  }
  
  const matchup = FORMATION_MATCHUPS.find(
    m => m.formationId === attackerFormationId
  );
  
  if (!matchup) {
    return 'neutral';
  }
  
  if (matchup.strongAgainst.includes(defenderFormationId)) {
    return 'strong';
  }
  
  if (matchup.weakAgainst.includes(defenderFormationId)) {
    return 'weak';
  }
  
  return 'neutral';
}

/**
 * 获取阵法克制伤害系数
 */
export function getFormationDamageMultiplier(
  attackerFormationId: string,
  defenderFormationId: string
): number {
  const matchup = checkFormationMatchup(attackerFormationId, defenderFormationId);
  
  switch (matchup) {
    case 'strong':
      return 1 + FORMATION_COUNTER_MULTIPLIER; // +25%
    case 'weak':
      return 1 - FORMATION_COUNTER_MULTIPLIER; // -25%
    default:
      return 1.0;
  }
}

/**
 * 计算升级所需经验
 */
export function getExpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > FORMATION_CONFIG.maxLevel) return Infinity;
  
  return Math.floor(
    FORMATION_CONFIG.baseExpPerLevel * 
    Math.pow(FORMATION_CONFIG.expGrowthRate, level - 1)
  );
}

/**
 * 计算累计所需经验
 */
export function getTotalExpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getExpForLevel(i);
  }
  return total;
}

/**
 * 阵法添加经验
 */
export function addFormationExp(
  formation: PlayerFormation,
  exp: number
): { leveledUp: boolean; newLevel: number } {
  if (!formation.unlocked) {
    return { leveledUp: false, newLevel: formation.level };
  }
  
  let newExp = formation.exp + exp;
  let newLevel = formation.level;
  let leveledUp = false;
  
  while (newLevel < FORMATION_CONFIG.maxLevel) {
    const expNeeded = getExpForLevel(newLevel + 1);
    if (newExp >= expNeeded) {
      newExp -= expNeeded;
      newLevel++;
      leveledUp = true;
    } else {
      break;
    }
  }
  
  formation.exp = newExp;
  formation.level = newLevel;
  
  return { leveledUp, newLevel };
}

/**
 * 解锁阵法
 */
export function unlockFormation(
  playerFormations: PlayerFormation[],
  formationId: string
): boolean {
  const existing = playerFormations.find(pf => pf.formationId === formationId);
  
  if (existing) {
    existing.unlocked = true;
    return true;
  }
  
  playerFormations.push({
    formationId,
    level: 1,
    exp: 0,
    unlocked: true,
  });
  
  return true;
}

/**
 * 获取玩家阵法
 */
export function getPlayerFormation(
  playerFormations: PlayerFormation[],
  formationId: string
): PlayerFormation | undefined {
  return playerFormations.find(pf => pf.formationId === formationId);
}

/**
 * 激活阵法
 */
export function activateFormation(
  formationId: string,
  positions: Record<number, string>,
  playerFormations?: PlayerFormation[]
): ActiveFormation | null {
  const formation = getFormation(formationId);
  if (!formation) {
    return null;
  }
  
  // 检查是否已解锁 (如果有玩家阵法列表)
  if (playerFormations) {
    const playerFormation = getPlayerFormation(playerFormations, formationId);
    if (!playerFormation || !playerFormation.unlocked) {
      return null;
    }
  }
  
  const effects: FormationBonus[] = [];
  
  for (const position of [1, 2, 3, 4, 5]) {
    if (positions[position]) {
      const bonuses = getFormationBonusesAtPosition(formation, position);
      effects.push(...bonuses);
    }
  }
  
  return {
    formationId,
    positions,
    effects,
  };
}

/**
 * 获取阵法统计信息
 */
export function getFormationStats(formation: Formation): Record<StatType, number> {
  const stats: Record<StatType, number> = {
    damage: 0,
    defense: 0,
    speed: 0,
    magic: 0,
    sealHit: 0,
    sealResist: 0,
    crit: 0,
    critResist: 0,
  };
  
  for (const bonus of formation.bonuses) {
    stats[bonus.stat] += bonus.value;
  }
  
  return stats;
}

/**
 * 验证阵法位置是否有效
 */
export function validateFormationPositions(
  positions: Record<number, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const playerIds = new Set<string>();
  
  // 检查必须的位置
  if (!positions[1]) {
    errors.push('队长位 (1 号位) 必须有玩家');
  }
  
  // 检查重复玩家
  for (const position of [1, 2, 3, 4, 5]) {
    if (positions[position]) {
      if (playerIds.has(positions[position])) {
        errors.push(`玩家 ${positions[position]} 在多个位置`);
      }
      playerIds.add(positions[position]);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
