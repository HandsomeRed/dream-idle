/**
 * v0.91 宠物进化系统 (Pet Evolution System)
 * 宠物培养、进化、技能继承、资质提升
 */

export interface Pet {
  id: string;
  name: string;
  species: string;
  level: number;
  exp: number;
  maxExp: number;
  star: number; // 星级 1-5
  evolutionStage: number; // 进化阶段 0-3
  attributes: PetAttributes;
  skills: PetSkill[];
  quality: PetQuality;
  lockStatus: boolean; // 是否锁定
}

export interface PetAttributes {
  attack: number;
  defense: number;
  health: number;
  speed: number;
  growth: number; // 成长率
  aptitude: {
    attack: number;
    defense: number;
    health: number;
    speed: number;
  };
}

export interface PetSkill {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  type: SkillType;
  damage?: number;
  effect?: string;
  inherited: boolean; // 是否继承技能
}

export type SkillType = 'attack' | 'defense' | 'support' | 'passive';

export type PetQuality = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type PetEvolutionType = 'normal' | 'advance' | 'super' | 'ultimate';

export interface PetConfig {
  maxPetLevel: number;
  maxStar: number;
  maxEvolutionStage: number;
  evolutionCost: Record<PetEvolutionType, number>;
  skillInheritChance: number; // 技能继承概率
}

export const PET_CONFIG: PetConfig = {
  maxPetLevel: 100,
  maxStar: 5,
  maxEvolutionStage: 3,
  evolutionCost: {
    normal: 10000,
    advance: 50000,
    super: 200000,
    ultimate: 1000000,
  },
  skillInheritChance: 0.7,
};

// 宠物数据库
export const PET_SPECIES: { id: string; name: string; baseAttributes: PetAttributes; evolutionChain: string[] }[] = [
  {
    id: 'pet_1',
    name: '泡泡',
    baseAttributes: { attack: 50, defense: 40, health: 100, speed: 30, growth: 1.2, aptitude: { attack: 80, defense: 70, health: 90, speed: 60 } },
    evolutionChain: ['泡泡', '泡泡·进阶', '泡泡·超级', '泡泡·终极'],
  },
  {
    id: 'pet_2',
    name: '大海龟',
    baseAttributes: { attack: 40, defense: 80, health: 150, speed: 20, growth: 1.1, aptitude: { attack: 60, defense: 95, health: 100, speed: 40 } },
    evolutionChain: ['大海龟', '大海龟·进阶', '大海龟·超级', '大海龟·终极'],
  },
  {
    id: 'pet_3',
    name: '巨蛙',
    baseAttributes: { attack: 60, defense: 30, health: 80, speed: 50, growth: 1.15, aptitude: { attack: 90, defense: 50, health: 70, speed: 80 } },
    evolutionChain: ['巨蛙', '巨蛙·进阶', '巨蛙·超级', '巨蛙·终极'],
  },
];

// 宠物技能数据库
export const PET_SKILLS: PetSkill[] = [
  { id: 'ps_1', name: '水攻', level: 1, maxLevel: 10, type: 'attack', damage: 50, effect: '水系法术攻击', inherited: false },
  { id: 'ps_2', name: '防御', level: 1, maxLevel: 10, type: 'defense', effect: '提升防御力 20%', inherited: false },
  { id: 'ps_3', name: '感知', level: 1, maxLevel: 10, type: 'passive', effect: '可检测隐身单位', inherited: false },
  { id: 'ps_4', name: '连击', level: 1, maxLevel: 10, type: 'passive', effect: '15% 概率连击', inherited: false },
  { id: 'ps_5', name: '再生', level: 1, maxLevel: 10, type: 'support', effect: '每回合恢复 5% 气血', inherited: false },
  { id: 'ps_6', name: '强力', level: 1, maxLevel: 10, type: 'passive', effect: '增加等级×2 攻击力', inherited: false },
  { id: 'ps_7', name: '敏捷', level: 1, maxLevel: 10, type: 'passive', effect: '增加等级×1.5 速度', inherited: false },
  { id: 'ps_8', name: '神佑复生', level: 1, maxLevel: 10, type: 'passive', effect: '10% 概率复活', inherited: false },
];

// 创建宠物
export function createPet(speciesId: string): Pet {
  const species = PET_SPECIES.find(s => s.id === speciesId);
  
  if (!species) {
    throw new Error(`Unknown pet species: ${speciesId}`);
  }
  
  return {
    id: `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: species.name,
    species: speciesId,
    level: 1,
    exp: 0,
    maxExp: 100,
    star: 1,
    evolutionStage: 0,
    attributes: {
      ...species.baseAttributes,
      aptitude: { ...species.baseAttributes.aptitude },
    },
    skills: [],
    quality: 'common',
    lockStatus: false,
  };
}

// 宠物升级
export function levelUpPet(pet: Pet, expGain: number): { success: boolean; message: string; leveledUp?: boolean } {
  pet.exp += expGain;
  
  if (pet.exp >= pet.maxExp && pet.level < PET_CONFIG.maxPetLevel) {
    pet.level += 1;
    pet.exp = 0;
    pet.maxExp = Math.floor(pet.maxExp * 1.2);
    
    // 升级增加属性
    pet.attributes.attack += Math.floor(5 * pet.attributes.growth);
    pet.attributes.defense += Math.floor(3 * pet.attributes.growth);
    pet.attributes.health += Math.floor(10 * pet.attributes.growth);
    pet.attributes.speed += Math.floor(2 * pet.attributes.growth);
    
    return { success: true, message: `${pet.name}升级到${pet.level}级！`, leveledUp: true };
  }
  
  return { success: true, message: `获得${expGain}经验` };
}

// 宠物升星
export function starUpPet(pet: Pet): { success: boolean; message: string } {
  if (pet.star >= PET_CONFIG.maxStar) {
    return { success: false, message: '宠物已达最高星级' };
  }
  
  pet.star += 1;
  
  // 升星提升成长率
  pet.attributes.growth += 0.1;
  
  // 重新计算属性
  recalculatePetAttributes(pet);
  
  return { success: true, message: `${pet.name}升到${pet.star}星！成长率提升到${pet.attributes.growth}` };
}

// 重新计算宠物属性
function recalculatePetAttributes(pet: Pet) {
  const species = PET_SPECIES.find(s => s.id === pet.species);
  if (!species) return;
  
  const levelMultiplier = pet.level / 100;
  const starMultiplier = 1 + (pet.star - 1) * 0.2;
  const evolutionMultiplier = 1 + pet.evolutionStage * 0.3;
  const aptitudeMultiplier = {
    attack: pet.attributes.aptitude.attack / 100,
    defense: pet.attributes.aptitude.defense / 100,
    health: pet.attributes.aptitude.health / 100,
    speed: pet.attributes.aptitude.speed / 100,
  };
  
  pet.attributes.attack = Math.floor(species.baseAttributes.attack * levelMultiplier * starMultiplier * evolutionMultiplier * pet.attributes.growth * aptitudeMultiplier.attack);
  pet.attributes.defense = Math.floor(species.baseAttributes.defense * levelMultiplier * starMultiplier * evolutionMultiplier * pet.attributes.growth * aptitudeMultiplier.defense);
  pet.attributes.health = Math.floor(species.baseAttributes.health * levelMultiplier * starMultiplier * evolutionMultiplier * pet.attributes.growth * aptitudeMultiplier.health);
  pet.attributes.speed = Math.floor(species.baseAttributes.speed * levelMultiplier * starMultiplier * evolutionMultiplier * pet.attributes.growth * aptitudeMultiplier.speed);
}

// 宠物进化
export function evolvePet(pet: Pet, evolutionType: PetEvolutionType, cost: number): { success: boolean; message: string; newForm?: string } {
  if (pet.evolutionStage >= PET_CONFIG.maxEvolutionStage) {
    return { success: false, message: '宠物已达最高进化阶段' };
  }
  
  const species = PET_SPECIES.find(s => s.id === pet.species);
  if (!species) {
    return { success: false, message: '未知宠物种类' };
  }
  
  const requiredCost = PET_CONFIG.evolutionCost[evolutionType];
  if (cost < requiredCost) {
    return { success: false, message: `进化需要${requiredCost}金币` };
  }
  
  pet.evolutionStage += 1;
  pet.name = species.evolutionChain[pet.evolutionStage];
  
  // 进化大幅提升属性
  pet.attributes.growth += 0.2;
  recalculatePetAttributes(pet);
  
  // 进化可能解锁新技能
  if (pet.evolutionStage >= 2 && pet.skills.length < 4) {
    const randomSkill = getRandomPetSkill();
    if (randomSkill) {
      pet.skills.push({ ...randomSkill });
    }
  }
  
  // 提升品质
  const qualities: PetQuality[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const currentIndex = qualities.indexOf(pet.quality);
  if (currentIndex < qualities.length - 1 && pet.evolutionStage >= 1) {
    pet.quality = qualities[currentIndex + 1];
  }
  
  return { success: true, message: `${pet.name}进化成功！`, newForm: pet.name };
}

// 随机获取宠物技能
function getRandomPetSkill(): PetSkill | null {
  const randomIndex = Math.floor(Math.random() * PET_SKILLS.length);
  return { ...PET_SKILLS[randomIndex] };
}

// 学习技能
export function learnPetSkill(pet: Pet, skillId: string): { success: boolean; message: string } {
  if (pet.skills.length >= 4) {
    return { success: false, message: '宠物最多学习 4 个技能' };
  }
  
  const existingSkill = pet.skills.find(s => s.id === skillId);
  if (existingSkill) {
    return { success: false, message: '宠物已学会该技能' };
  }
  
  const skill = PET_SKILLS.find(s => s.id === skillId);
  if (!skill) {
    return { success: false, message: '技能不存在' };
  }
  
  pet.skills.push({ ...skill });
  
  return { success: true, message: `${pet.name}学会了${skill.name}！` };
}

// 升级技能
export function upgradePetSkill(pet: Pet, skillId: string): { success: boolean; message: string } {
  const skill = pet.skills.find(s => s.id === skillId);
  
  if (!skill) {
    return { success: false, message: '宠物未学会该技能' };
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

// 技能继承（两只宠物合成）
export function inheritSkills(sourcePet: Pet, targetPet: Pet): { success: boolean; message: string; inheritedSkills: string[] } {
  const inheritedSkills: string[] = [];
  
  sourcePet.skills.forEach(skill => {
    if (targetPet.skills.length >= 4) return;
    
    const existingSkill = targetPet.skills.find(s => s.id === skill.id);
    if (existingSkill) return;
    
    // 继承概率
    if (Math.random() < PET_CONFIG.skillInheritChance) {
      targetPet.skills.push({ ...skill, inherited: true });
      inheritedSkills.push(skill.name);
    }
  });
  
  if (inheritedSkills.length === 0) {
    return { success: true, message: '技能继承失败', inheritedSkills };
  }
  
  return { success: true, message: `成功继承${inheritedSkills.length}个技能：${inheritedSkills.join(', ')}`, inheritedSkills };
}

// 提升资质
export function improveAptitude(pet: Pet, aptitudeType: keyof PetAttributes['aptitude'], value: number): { success: boolean; message: string } {
  if (pet.attributes.aptitude[aptitudeType] >= 100) {
    return { success: false, message: '该项资质已达上限' };
  }
  
  pet.attributes.aptitude[aptitudeType] = Math.min(100, pet.attributes.aptitude[aptitudeType] + value);
  
  // 资质影响属性
  recalculatePetAttributes(pet);
  
  return { success: true, message: `${aptitudeType}资质提升到${pet.attributes.aptitude[aptitudeType]}` };
}

// 获取宠物评分
export function getPetScore(pet: Pet): number {
  const levelScore = pet.level * 10;
  const starScore = pet.star * 100;
  const evolutionScore = pet.evolutionStage * 200;
  const skillScore = pet.skills.reduce((sum, s) => sum + s.level * 20, 0);
  const aptitudeScore = Object.values(pet.attributes.aptitude).reduce((sum, a) => sum + a, 0);
  const growthScore = pet.attributes.growth * 100;
  
  return Math.floor(levelScore + starScore + evolutionScore + skillScore + aptitudeScore + growthScore);
}

// 获取宠物统计
export function getPetStats(pet: Pet): {
  level: number;
  star: number;
  evolutionStage: number;
  evolutionName: string;
  quality: string;
  score: number;
  skillCount: number;
  totalAttributes: number;
} {
  const evolutionNames = ['初始', '进阶', '超级', '终极'];
  
  return {
    level: pet.level,
    star: pet.star,
    evolutionStage: pet.evolutionStage,
    evolutionName: evolutionNames[pet.evolutionStage] || '初始',
    quality: getQualityName(pet.quality),
    score: getPetScore(pet),
    skillCount: pet.skills.length,
    totalAttributes: pet.attributes.attack + pet.attributes.defense + pet.attributes.health + pet.attributes.speed,
  };
}

// 锁定/解锁宠物
export function togglePetLock(pet: Pet): { success: boolean; message: string } {
  pet.lockStatus = !pet.lockStatus;
  return { success: true, message: pet.lockStatus ? '宠物已锁定' : '宠物已解锁' };
}

// 获取进化类型名称
export function getEvolutionTypeName(type: PetEvolutionType): string {
  const names: Record<PetEvolutionType, string> = {
    normal: '普通进化',
    advance: '高级进化',
    super: '超级进化',
    ultimate: '终极进化',
  };
  return names[type];
}

// 获取品质名称
export function getQualityName(quality: PetQuality): string {
  const names: Record<PetQuality, string> = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return names[quality];
}
