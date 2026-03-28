/**
 * v0.92 法宝系统 (Magic Artifact System)
 * 法宝炼制、祭炼、炼化、法宝技能、法宝融合
 */

export interface MagicArtifact {
  id: string;
  name: string;
  type: ArtifactType;
  level: number;
  exp: number;
  maxExp: number;
  star: number; // 品阶 1-5
  quality: ArtifactQuality;
  attributes: ArtifactAttributes;
  skills: ArtifactSkill[];
  refinement: number; // 炼化度 0-100
  owner?: string;
  lockStatus: boolean;
}

export type ArtifactType = 'attack' | 'defense' | 'support' | 'special';

export type ArtifactQuality = 'mortal' | 'earth' | 'heaven' | 'immortal' | 'divine';

export interface ArtifactAttributes {
  attack: number;
  defense: number;
  health: number;
  speed: number;
  mana: number; // 法力
  luck: number; // 气运
}

export interface ArtifactSkill {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  type: SkillType;
  damage?: number;
  effect?: string;
  cooldown?: number; // 冷却时间 (秒)
}

export type SkillType = 'active' | 'passive' | 'aura';

export interface ArtifactMaterial {
  id: string;
  name: string;
  rarity: MaterialRarity;
  type: MaterialType;
  effect: string;
}

export type MaterialRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type MaterialType = 'ore' | 'herb' | 'beast' | 'essence' | 'crystal';

export interface ArtifactConfig {
  maxArtifactLevel: number;
  maxStar: number;
  maxRefinement: number;
  refineCost: number; // 炼化基础消耗
  fuseSuccessRate: number; // 融合基础成功率
}

export const ARTIFACT_CONFIG: ArtifactConfig = {
  maxArtifactLevel: 100,
  maxStar: 5,
  maxRefinement: 100,
  refineCost: 1000,
  fuseSuccessRate: 0.6,
};

// 法宝数据库
export const ARTIFACT_TEMPLATES: { id: string; name: string; type: ArtifactType; baseAttributes: ArtifactAttributes }[] = [
  { id: 'ma_1', name: '诛仙剑', type: 'attack', baseAttributes: { attack: 100, defense: 20, health: 50, speed: 30, mana: 50, luck: 5 } },
  { id: 'ma_2', name: '太极图', type: 'defense', baseAttributes: { attack: 30, defense: 100, health: 100, speed: 20, mana: 80, luck: 10 } },
  { id: 'ma_3', name: '盘古幡', type: 'attack', baseAttributes: { attack: 120, defense: 15, health: 40, speed: 25, mana: 60, luck: 8 } },
  { id: 'ma_4', name: '昆仑镜', type: 'support', baseAttributes: { attack: 20, defense: 50, health: 80, speed: 40, mana: 100, luck: 15 } },
  { id: 'ma_5', name: '东皇钟', type: 'special', baseAttributes: { attack: 80, defense: 80, health: 120, speed: 15, mana: 120, luck: 20 } },
];

// 法宝技能数据库
export const ARTIFACT_SKILLS: ArtifactSkill[] = [
  { id: 'as_1', name: '剑刃风暴', level: 1, maxLevel: 10, type: 'active', damage: 150, effect: '对敌方全体造成剑系伤害', cooldown: 30 },
  { id: 'as_2', name: '太极护体', level: 1, maxLevel: 10, type: 'active', effect: '生成护盾吸收伤害', cooldown: 60 },
  { id: 'as_3', name: '盘古之力', level: 1, maxLevel: 10, type: 'passive', effect: '永久提升攻击力 20%', },
  { id: 'as_4', name: '时空扭曲', level: 1, maxLevel: 10, type: 'active', effect: '降低敌方速度 30%', cooldown: 45 },
  { id: 'as_5', name: '混沌 aura', level: 1, maxLevel: 10, type: 'aura', effect: '周围友方全属性 +10%', },
  { id: 'as_6', name: '炼妖壶', level: 1, maxLevel: 10, type: 'active', effect: '有概率封印敌方技能', cooldown: 90 },
  { id: 'as_7', name: '气运加身', level: 1, maxLevel: 10, type: 'passive', effect: '提升暴击率和掉宝率', },
];

// 炼制材料数据库
export const ARTIFACT_MATERIALS: ArtifactMaterial[] = [
  { id: 'mat_1', name: '玄铁', rarity: 'common', type: 'ore', effect: '提升防御' },
  { id: 'mat_2', name: '千年灵芝', rarity: 'uncommon', type: 'herb', effect: '提升气血' },
  { id: 'mat_3', name: '龙筋', rarity: 'rare', type: 'beast', effect: '提升攻击' },
  { id: 'mat_4', name: '混沌精华', rarity: 'epic', type: 'essence', effect: '全属性提升' },
  { id: 'mat_5', name: '星辰结晶', rarity: 'legendary', type: 'crystal', effect: '大幅提升品阶' },
];

// 创建法宝
export function createMagicArtifact(artifactId: string): MagicArtifact {
  const template = ARTIFACT_TEMPLATES.find(a => a.id === artifactId);
  
  if (!template) {
    throw new Error(`Unknown artifact: ${artifactId}`);
  }
  
  return {
    id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    type: template.type,
    level: 1,
    exp: 0,
    maxExp: 100,
    star: 1,
    quality: 'mortal',
    attributes: { ...template.baseAttributes },
    skills: [],
    refinement: 0,
    lockStatus: false,
  };
}

// 法宝升级
export function levelUpArtifact(artifact: MagicArtifact, expGain: number): { success: boolean; message: string; leveledUp?: boolean } {
  artifact.exp += expGain;
  
  if (artifact.exp >= artifact.maxExp && artifact.level < ARTIFACT_CONFIG.maxArtifactLevel) {
    artifact.level += 1;
    artifact.exp = 0;
    artifact.maxExp = Math.floor(artifact.maxExp * 1.2);
    
    // 升级增加属性
    artifact.attributes.attack += 5;
    artifact.attributes.defense += 3;
    artifact.attributes.health += 10;
    artifact.attributes.speed += 2;
    artifact.attributes.mana += 5;
    
    return { success: true, message: `${artifact.name}升级到${artifact.level}级！`, leveledUp: true };
  }
  
  return { success: true, message: `获得${expGain}炼化经验` };
}

// 法宝升星
export function starUpArtifact(artifact: MagicArtifact, materialId: string): { success: boolean; message: string } {
  if (artifact.star >= ARTIFACT_CONFIG.maxStar) {
    return { success: false, message: '法宝已达最高品阶' };
  }
  
  const material = ARTIFACT_MATERIALS.find(m => m.id === materialId);
  if (!material) {
    return { success: false, message: '材料不存在' };
  }
  
  // 检查材料稀有度是否匹配
  const requiredRarity = getRequiredRarityForStar(artifact.star);
  if (getRarityValue(material.rarity) < getRarityValue(requiredRarity)) {
    return { success: false, message: `材料品阶不足，需要${getRarityName(requiredRarity)}及以上` };
  }
  
  artifact.star += 1;
  
  // 升星大幅提升属性
  artifact.attributes.attack = Math.floor(artifact.attributes.attack * 1.3);
  artifact.attributes.defense = Math.floor(artifact.attributes.defense * 1.3);
  artifact.attributes.health = Math.floor(artifact.attributes.health * 1.3);
  artifact.attributes.speed = Math.floor(artifact.attributes.speed * 1.3);
  artifact.attributes.mana = Math.floor(artifact.attributes.mana * 1.3);
  
  // 可能提升品质
  upgradeArtifactQuality(artifact);
  
  return { success: true, message: `${artifact.name}升到${artifact.star}星！` };
}

function getRequiredRarityForStar(star: number): MaterialRarity {
  const rarities: MaterialRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  return rarities[Math.min(star - 1, rarities.length - 1)];
}

function getRarityValue(rarity: MaterialRarity): number {
  const values: Record<MaterialRarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  };
  return values[rarity];
}

function getRarityName(rarity: MaterialRarity): string {
  const names: Record<MaterialRarity, string> = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return names[rarity];
}

// 提升法宝品质
function upgradeArtifactQuality(artifact: MagicArtifact) {
  const qualities: ArtifactQuality[] = ['mortal', 'earth', 'heaven', 'immortal', 'divine'];
  const currentIndex = qualities.indexOf(artifact.quality);
  
  // 升星有概率提升品质
  if (currentIndex < qualities.length - 1 && Math.random() < 0.5) {
    artifact.quality = qualities[currentIndex + 1];
  }
}

// 炼化法宝
export function refineArtifact(artifact: MagicArtifact, cost: number): { success: boolean; message: string; refinementGain: number } {
  if (artifact.refinement >= ARTIFACT_CONFIG.maxRefinement) {
    return { success: false, message: '法宝已达最大炼化度' };
  }
  
  if (cost < ARTIFACT_CONFIG.refineCost) {
    return { success: false, message: `炼化需要${ARTIFACT_CONFIG.refineCost}金币` };
  }
  
  // 炼化度提升
  const refinementGain = Math.floor(Math.random() * 5) + 3; // 3-7 点
  artifact.refinement = Math.min(ARTIFACT_CONFIG.maxRefinement, artifact.refinement + refinementGain);
  
  // 炼化度提升属性
  const bonusMultiplier = 1 + (artifact.refinement / 100) * 0.5; // 最高 +50%
  artifact.attributes.attack = Math.floor(artifact.attributes.attack * bonusMultiplier);
  artifact.attributes.defense = Math.floor(artifact.attributes.defense * bonusMultiplier);
  artifact.attributes.health = Math.floor(artifact.attributes.health * bonusMultiplier);
  
  return { success: true, message: `炼化成功！炼化度提升到${artifact.refinement}`, refinementGain };
}

// 学习法宝技能
export function learnArtifactSkill(artifact: MagicArtifact, skillId: string): { success: boolean; message: string } {
  if (artifact.skills.length >= 4) {
    return { success: false, message: '法宝最多学习 4 个技能' };
  }
  
  const existingSkill = artifact.skills.find(s => s.id === skillId);
  if (existingSkill) {
    return { success: false, message: '法宝已学会该技能' };
  }
  
  const skill = ARTIFACT_SKILLS.find(s => s.id === skillId);
  if (!skill) {
    return { success: false, message: '技能不存在' };
  }
  
  // 检查法宝等级是否足够
  const requiredLevel = skill.maxLevel * 5;
  if (artifact.level < requiredLevel) {
    return { success: false, message: `法宝等级不足，需要${requiredLevel}级` };
  }
  
  artifact.skills.push({ ...skill });
  
  return { success: true, message: `${artifact.name}学会了${skill.name}！` };
}

// 升级法宝技能
export function upgradeArtifactSkill(artifact: MagicArtifact, skillId: string): { success: boolean; message: string } {
  const skill = artifact.skills.find(s => s.id === skillId);
  
  if (!skill) {
    return { success: false, message: '法宝未学会该技能' };
  }
  
  if (skill.level >= skill.maxLevel) {
    return { success: false, message: '技能已达满级' };
  }
  
  skill.level += 1;
  
  // 升级增强效果
  if (skill.damage) {
    skill.damage = Math.floor(skill.damage * 1.1);
  }
  
  return { success: true, message: `${skill.name}升级到${skill.level}级！` };
}

// 法宝融合
export function fuseArtifacts(sourceArtifact: MagicArtifact, targetArtifact: MagicArtifact): { 
  success: boolean; 
  message: string; 
  fused?: boolean;
  newStar?: number;
} {
  if (sourceArtifact.type !== targetArtifact.type) {
    return { success: false, message: '只有同类型法宝才能融合' };
  }
  
  // 融合成功率
  const successRate = ARTIFACT_CONFIG.fuseSuccessRate * (1 + sourceArtifact.star * 0.05);
  const success = Math.random() < successRate;
  
  if (!success) {
    return { success: true, message: '融合失败，材料法宝消失', fused: false };
  }
  
  // 融合成功
  targetArtifact.star = Math.min(ARTIFACT_CONFIG.maxStar, targetArtifact.star + 1);
  targetArtifact.exp += sourceArtifact.exp;
  targetArtifact.refinement = Math.min(ARTIFACT_CONFIG.maxRefinement, targetArtifact.refinement + Math.floor(sourceArtifact.refinement / 2));
  
  // 可能继承技能
  if (sourceArtifact.skills.length > 0 && targetArtifact.skills.length < 4) {
    const randomSkill = sourceArtifact.skills[Math.floor(Math.random() * sourceArtifact.skills.length)];
    if (!targetArtifact.skills.find(s => s.id === randomSkill.id)) {
      targetArtifact.skills.push({ ...randomSkill });
    }
  }
  
  upgradeArtifactQuality(targetArtifact);
  
  return { 
    success: true, 
    message: `融合成功！${targetArtifact.name}品阶提升到${targetArtifact.star}星`, 
    fused: true,
    newStar: targetArtifact.star,
  };
}

// 获取法宝评分
export function getArtifactScore(artifact: MagicArtifact): number {
  const levelScore = artifact.level * 10;
  const starScore = artifact.star * 200;
  const refinementScore = artifact.refinement * 5;
  const skillScore = artifact.skills.reduce((sum, s) => sum + s.level * 50, 0);
  const qualityScore = getQualityScore(artifact.quality);
  const attributeScore = artifact.attributes.attack + artifact.attributes.defense + artifact.attributes.health;
  
  return Math.floor(levelScore + starScore + refinementScore + skillScore + qualityScore + attributeScore);
}

function getQualityScore(quality: ArtifactQuality): number {
  const scores: Record<ArtifactQuality, number> = {
    mortal: 0,
    earth: 100,
    heaven: 300,
    immortal: 600,
    divine: 1000,
  };
  return scores[quality];
}

// 获取法宝统计
export function getArtifactStats(artifact: MagicArtifact): {
  level: number;
  star: number;
  quality: string;
  refinement: number;
  score: number;
  skillCount: number;
  totalAttributes: number;
} {
  return {
    level: artifact.level,
    star: artifact.star,
    quality: getQualityName(artifact.quality),
    refinement: artifact.refinement,
    score: getArtifactScore(artifact),
    skillCount: artifact.skills.length,
    totalAttributes: artifact.attributes.attack + artifact.attributes.defense + artifact.attributes.health + artifact.attributes.speed + artifact.attributes.mana,
  };
}

// 获取品质名称
export function getQualityName(quality: ArtifactQuality): string {
  const names: Record<ArtifactQuality, string> = {
    mortal: '凡品',
    earth: '地品',
    heaven: '天品',
    immortal: '仙品',
    divine: '神器',
  };
  return names[quality];
}

// 获取类型名称
export function getArtifactTypeName(type: ArtifactType): string {
  const names: Record<ArtifactType, string> = {
    attack: '攻击型',
    defense: '防御型',
    support: '辅助型',
    special: '特殊型',
  };
  return names[type];
}

// 锁定/解锁法宝
export function toggleArtifactLock(artifact: MagicArtifact): { success: boolean; message: string } {
  artifact.lockStatus = !artifact.lockStatus;
  return { success: true, message: artifact.lockStatus ? '法宝已锁定' : '法宝已解锁' };
}
