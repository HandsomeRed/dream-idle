// 英雄收集系统 - v0.43

/**
 * 英雄品质
 */
export type HeroRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * 英雄职业
 */
export type HeroClass = 'warrior' | 'mage' | 'tank' | 'assassin' | 'support';

/**
 * 英雄元素
 */
export type HeroElement = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';

/**
 * 英雄基础属性
 */
export interface HeroBaseStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  mag: number;
  res: number;
}

/**
 * 英雄配置
 */
export interface HeroConfig {
  id: string;
  name: string;
  rarity: HeroRarity;
  classType: HeroClass;
  element: HeroElement;
  baseStats: HeroBaseStats;
  growthMultiplier: number; // 成长系数
  maxLevel: number;
  maxStar: number;
  skills: string[]; // 技能 ID 列表
  description: string;
}

/**
 * 玩家拥有的英雄
 */
export interface OwnedHero {
  heroId: string;
  level: number;
  star: number;
  exp: number;
  isLocked: boolean;
  favorite: boolean;
  obtainedAt: number; // 时间戳
}

/**
 * 英雄召唤结果
 */
export interface SummonResult {
  heroId: string;
  rarity: HeroRarity;
  isDuplicate: boolean;
  convertedShards: number; // 重复英雄转化的碎片数
}

/**
 * 英雄碎片
 */
export interface HeroShard {
  heroId: string;
  count: number;
  requiredForSummon: number; // 召唤所需碎片数
}

/**
 * 所有英雄配置
 */
export const HERO_CONFIGS: Record<string, HeroConfig> = {
  // ===== 普通品质 (Common) =====
  'hero_001': {
    id: 'hero_001',
    name: '剑士新兵',
    rarity: 'common',
    classType: 'warrior',
    element: 'earth',
    baseStats: { hp: 100, attack: 12, defense: 10, speed: 8, mag: 5, res: 8 },
    growthMultiplier: 1.0,
    maxLevel: 50,
    maxStar: 3,
    skills: ['basic_strike'],
    description: '刚入伍的年轻剑士，基础扎实。'
  },
  'hero_002': {
    id: 'hero_002',
    name: '学徒法师',
    rarity: 'common',
    classType: 'mage',
    element: 'fire',
    baseStats: { hp: 70, attack: 8, defense: 6, speed: 7, mag: 14, res: 10 },
    growthMultiplier: 1.0,
    maxLevel: 50,
    maxStar: 3,
    skills: ['fireball_basic'],
    description: '正在学习火焰魔法的学徒。'
  },
  'hero_003': {
    id: 'hero_003',
    name: '轻装步兵',
    rarity: 'common',
    classType: 'tank',
    element: 'earth',
    baseStats: { hp: 120, attack: 8, defense: 14, speed: 6, mag: 4, res: 10 },
    growthMultiplier: 1.0,
    maxLevel: 50,
    maxStar: 3,
    skills: ['shield_bash'],
    description: '装备轻便盔甲的步兵。'
  },

  // ===== 稀有品质 (Uncommon) =====
  'hero_010': {
    id: 'hero_010',
    name: '精英剑士',
    rarity: 'uncommon',
    classType: 'warrior',
    element: 'wind',
    baseStats: { hp: 130, attack: 16, defense: 12, speed: 11, mag: 7, res: 10 },
    growthMultiplier: 1.2,
    maxLevel: 60,
    maxStar: 4,
    skills: ['wind_slash', 'basic_strike'],
    description: '经验丰富的剑士，剑法如风。'
  },
  'hero_011': {
    id: 'hero_011',
    name: '火焰术士',
    rarity: 'uncommon',
    classType: 'mage',
    element: 'fire',
    baseStats: { hp: 90, attack: 10, defense: 8, speed: 9, mag: 18, res: 12 },
    growthMultiplier: 1.2,
    maxLevel: 60,
    maxStar: 4,
    skills: ['fireball', 'flame_burst'],
    description: '精通火焰魔法的术士。'
  },
  'hero_012': {
    id: 'hero_012',
    name: '暗影刺客',
    rarity: 'uncommon',
    classType: 'assassin',
    element: 'dark',
    baseStats: { hp: 85, attack: 18, defense: 7, speed: 15, mag: 6, res: 8 },
    growthMultiplier: 1.2,
    maxLevel: 60,
    maxStar: 4,
    skills: ['shadow_strike', 'poison_dagger'],
    description: '来自黑暗的致命刺客。'
  },
  'hero_013': {
    id: 'hero_013',
    name: '光明祭司',
    rarity: 'uncommon',
    classType: 'support',
    element: 'light',
    baseStats: { hp: 95, attack: 8, defense: 10, speed: 9, mag: 15, res: 14 },
    growthMultiplier: 1.2,
    maxLevel: 60,
    maxStar: 4,
    skills: ['heal', 'blessing'],
    description: '信仰光明的治愈者。'
  },

  // ===== 史诗品质 (Rare) =====
  'hero_020': {
    id: 'hero_020',
    name: '龙血战士',
    rarity: 'rare',
    classType: 'warrior',
    element: 'fire',
    baseStats: { hp: 160, attack: 20, defense: 14, speed: 12, mag: 10, res: 12 },
    growthMultiplier: 1.5,
    maxLevel: 80,
    maxStar: 5,
    skills: ['dragon_strike', 'flame_weapon', 'battle_roar'],
    description: '沐浴龙血而获得力量的战士。'
  },
  'hero_021': {
    id: 'hero_021',
    name: '冰霜女巫',
    rarity: 'rare',
    classType: 'mage',
    element: 'water',
    baseStats: { hp: 110, attack: 12, defense: 10, speed: 11, mag: 24, res: 16 },
    growthMultiplier: 1.5,
    maxLevel: 80,
    maxStar: 5,
    skills: ['blizzard', 'ice_lance', 'frost_armor'],
    description: '掌控冰雪之力的女巫。'
  },
  'hero_022': {
    id: 'hero_022',
    name: '圣骑士',
    rarity: 'rare',
    classType: 'tank',
    element: 'light',
    baseStats: { hp: 180, attack: 14, defense: 20, speed: 9, mag: 12, res: 18 },
    growthMultiplier: 1.5,
    maxLevel: 80,
    maxStar: 5,
    skills: ['holy_shield', 'divine_protection', 'smite'],
    description: '神圣的守护者，坚不可摧。'
  },
  'hero_023': {
    id: 'hero_023',
    name: '暗夜魔王',
    rarity: 'rare',
    classType: 'assassin',
    element: 'dark',
    baseStats: { hp: 120, attack: 24, defense: 10, speed: 18, mag: 10, res: 10 },
    growthMultiplier: 1.5,
    maxLevel: 80,
    maxStar: 5,
    skills: ['demon_blade', 'shadow_clone', 'life_drain'],
    description: '来自深渊的恐怖存在。'
  },
  'hero_024': {
    id: 'hero_024',
    name: '自然德鲁伊',
    rarity: 'rare',
    classType: 'support',
    element: 'earth',
    baseStats: { hp: 130, attack: 10, defense: 12, speed: 11, mag: 20, res: 18 },
    growthMultiplier: 1.5,
    maxLevel: 80,
    maxStar: 5,
    skills: ['healing_circle', 'nature_blessing', 'entangle'],
    description: '与自然共鸣的治愈者。'
  },

  // ===== 传说品质 (Legendary) =====
  'hero_030': {
    id: 'hero_030',
    name: '战神刑天',
    rarity: 'legendary',
    classType: 'warrior',
    element: 'fire',
    baseStats: { hp: 200, attack: 28, defense: 18, speed: 14, mag: 12, res: 14 },
    growthMultiplier: 2.0,
    maxLevel: 100,
    maxStar: 6,
    skills: ['heaven_splitter', 'war_god_form', 'immortal_fury', 'battle_master'],
    description: '上古战神，以乳为目，以脐为口，战意永存。'
  },
  'hero_031': {
    id: 'hero_031',
    name: '九天玄女',
    rarity: 'legendary',
    classType: 'mage',
    element: 'light',
    baseStats: { hp: 140, attack: 14, defense: 12, speed: 15, mag: 32, res: 22 },
    growthMultiplier: 2.0,
    maxLevel: 100,
    maxStar: 6,
    skills: ['celestial_judgment', 'phoenix_fire', 'divine_wisdom', 'magic_mastery'],
    description: '天庭女神，精通天地玄机。'
  },
  'hero_032': {
    id: 'hero_032',
    name: '玄武真君',
    rarity: 'legendary',
    classType: 'tank',
    element: 'water',
    baseStats: { hp: 240, attack: 16, defense: 26, speed: 10, mag: 14, res: 24 },
    growthMultiplier: 2.0,
    maxLevel: 100,
    maxStar: 6,
    skills: ['turtle_shell', 'water_barrier', 'north_guardian', 'immortal_defense'],
    description: '北方守护神，防御无双。'
  },
  'hero_033': {
    id: 'hero_033',
    name: '白虎杀神',
    rarity: 'legendary',
    classType: 'assassin',
    element: 'wind',
    baseStats: { hp: 150, attack: 32, defense: 12, speed: 22, mag: 12, res: 12 },
    growthMultiplier: 2.0,
    maxLevel: 100,
    maxStar: 6,
    skills: ['tiger_fang', 'wind_god_step', 'killing_intent', 'divine_speed'],
    description: '西方杀神，一击必杀。'
  },
  'hero_034': {
    id: 'hero_034',
    name: '女娲圣人',
    rarity: 'legendary',
    classType: 'support',
    element: 'earth',
    baseStats: { hp: 160, attack: 12, defense: 14, speed: 13, mag: 28, res: 26 },
    growthMultiplier: 2.0,
    maxLevel: 100,
    maxStar: 6,
    skills: ['creation_heal', 'stone_repair', 'human_blessing', 'life_creator'],
    description: '创世女神，万物之母。'
  }
};

/**
 * 召唤概率配置
 */
export const SUMMON_PROBABILITIES = {
  legendary: 0.02,    // 2%
  rare: 0.10,         // 10%
  uncommon: 0.38,     // 38%
  common: 0.50        // 50%
};

/**
 * 召唤保底配置
 */
export const PITY_SYSTEM = {
  rarePity: 10,        // 10 抽必出稀有以上
  legendaryPity: 90,   // 90 抽必出传说
  rareGuarantee: true  // 是否启用稀有保底
};

/**
 * 英雄升级经验需求
 */
export function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

/**
 * 英雄升星所需碎片数
 */
export function getShardsForStarUp(currentStar: number): number {
  const costs: Record<number, number> = {
    1: 20,
    2: 50,
    3: 100,
    4: 200,
    5: 400
  };
  return costs[currentStar] || 0;
}

/**
 * 计算英雄实际属性
 */
export function calculateHeroStats(
  config: HeroConfig,
  level: number,
  star: number
): HeroBaseStats {
  const starMultiplier = 1 + (star - 1) * 0.2; // 每星 +20%
  const levelMultiplier = 1 + (level - 1) * 0.05; // 每级 +5%

  return {
    hp: Math.floor(config.baseStats.hp * config.growthMultiplier * starMultiplier * levelMultiplier),
    attack: Math.floor(config.baseStats.attack * config.growthMultiplier * starMultiplier * levelMultiplier),
    defense: Math.floor(config.baseStats.defense * config.growthMultiplier * starMultiplier * levelMultiplier),
    speed: Math.floor(config.baseStats.speed * config.growthMultiplier * starMultiplier * levelMultiplier),
    mag: Math.floor(config.baseStats.mag * config.growthMultiplier * starMultiplier * levelMultiplier),
    res: Math.floor(config.baseStats.res * config.growthMultiplier * starMultiplier * levelMultiplier)
  };
}

/**
 * 获取英雄稀有度颜色
 */
export function getRarityColor(rarity: HeroRarity): string {
  const colors: Record<HeroRarity, string> = {
    common: '#9ca3af',      // gray-400
    uncommon: '#22c55e',    // green-500
    rare: '#3b82f6',        // blue-500
    epic: '#a855f7',        // purple-500
    legendary: '#f59e0b'    // amber-500
  };
  return colors[rarity];
}

/**
 * 获取英雄稀有度中文名称
 */
export function getRarityName(rarity: HeroRarity): string {
  const names: Record<HeroRarity, string> = {
    common: '普通',
    uncommon: '稀有',
    rare: '史诗',
    epic: '传说',
    legendary: '神话'
  };
  return names[rarity];
}

/**
 * 获取职业中文名称
 */
export function getClassName(classType: HeroClass): string {
  const names: Record<HeroClass, string> = {
    warrior: '战士',
    mage: '法师',
    tank: '坦克',
    assassin: '刺客',
    support: '辅助'
  };
  return names[classType];
}

/**
 * 获取元素中文名称
 */
export function getElementName(element: HeroElement): string {
  const names: Record<HeroElement, string> = {
    fire: '火',
    water: '水',
    earth: '土',
    wind: '风',
    light: '光',
    dark: '暗'
  };
  return names[element];
}

/**
 * 英雄系统主类
 */
export class HeroSystem {
  private ownedHeroes: Map<string, OwnedHero>;
  private heroShards: Map<string, number>;
  private summonHistory: SummonResult[];
  private pityCounter: number;
  private rarePityCounter: number;

  constructor() {
    this.ownedHeroes = new Map();
    this.heroShards = new Map();
    this.summonHistory = [];
    this.pityCounter = 0;
    this.rarePityCounter = 0;
  }

  /**
   * 召唤英雄（单次）
   */
  summonOne(): SummonResult {
    this.pityCounter++;
    this.rarePityCounter++;

    // 检查保底
    let targetRarity: HeroRarity;
    if (this.pityCounter >= PITY_SYSTEM.legendaryPity) {
      targetRarity = 'legendary';
      this.pityCounter = 0;
      this.rarePityCounter = 0;
    } else if (this.rarePityCounter >= PITY_SYSTEM.rarePity) {
      targetRarity = Math.random() < 0.2 ? 'legendary' : 'rare';
      if (targetRarity === 'legendary') {
        this.pityCounter = 0;
      }
      this.rarePityCounter = 0;
    } else {
      // 正常概率
      const rand = Math.random();
      if (rand < SUMMON_PROBABILITIES.legendary) {
        targetRarity = 'legendary';
        this.pityCounter = 0;
        this.rarePityCounter = 0;
      } else if (rand < SUMMON_PROBABILITIES.legendary + SUMMON_PROBABILITIES.rare) {
        targetRarity = 'rare';
        this.rarePityCounter = 0;
      } else if (rand < SUMMON_PROBABILITIES.legendary + SUMMON_PROBABILITIES.rare + SUMMON_PROBABILITIES.uncommon) {
        targetRarity = 'uncommon';
      } else {
        targetRarity = 'common';
      }
    }

    // 从对应稀有度的英雄中随机选择
    const availableHeroes = Object.values(HERO_CONFIGS).filter(h => h.rarity === targetRarity);
    const selectedHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];

    // 检查是否重复
    const existingHero = this.ownedHeroes.get(selectedHero.id);
    const isDuplicate = !!existingHero;

    // 重复英雄转化为碎片
    let convertedShards = 0;
    if (isDuplicate) {
      const shardCount = this.getShardValue(targetRarity);
      convertedShards = shardCount;
      this.addShards(selectedHero.id, shardCount);
    } else {
      // 新英雄，添加到拥有列表
      this.ownedHeroes.set(selectedHero.id, {
        heroId: selectedHero.id,
        level: 1,
        star: 1,
        exp: 0,
        isLocked: false,
        favorite: false,
        obtainedAt: Date.now()
      });
    }

    const result: SummonResult = {
      heroId: selectedHero.id,
      rarity: targetRarity,
      isDuplicate,
      convertedShards
    };

    this.summonHistory.push(result);
    return result;
  }

  /**
   * 召唤英雄（十连）
   */
  summonTen(): SummonResult[] {
    const results: SummonResult[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(this.summonOne());
    }
    return results;
  }

  /**
   * 获取稀有度对应的碎片价值
   */
  private getShardValue(rarity: HeroRarity): number {
    const values: Record<HeroRarity, number> = {
      common: 1,
      uncommon: 2,
      rare: 5,
      epic: 10,
      legendary: 20
    };
    return values[rarity];
  }

  /**
   * 添加英雄碎片
   */
  addShards(heroId: string, count: number): void {
    const current = this.heroShards.get(heroId) || 0;
    this.heroShards.set(heroId, current + count);
  }

  /**
   * 使用碎片召唤指定英雄
   */
  summonWithShards(heroId: string): boolean {
    const config = HERO_CONFIGS[heroId];
    if (!config) return false;

    const requiredShards = 50; // 50 碎片召唤一个英雄
    const currentShards = this.heroShards.get(heroId) || 0;

    if (currentShards < requiredShards) {
      return false;
    }

    // 扣除碎片
    this.heroShards.set(heroId, currentShards - requiredShards);

    // 添加英雄
    const existingHero = this.ownedHeroes.get(heroId);
    if (existingHero) {
      // 已有英雄，转化为额外碎片
      this.addShards(heroId, this.getShardValue(config.rarity));
    } else {
      this.ownedHeroes.set(heroId, {
        heroId,
        level: 1,
        star: 1,
        exp: 0,
        isLocked: false,
        favorite: false,
        obtainedAt: Date.now()
      });
    }

    return true;
  }

  /**
   * 英雄升级
   */
  levelUpHero(heroId: string, expAmount: number): { success: boolean; leveledUp: boolean; newLevel: number } {
    const hero = this.ownedHeroes.get(heroId);
    if (!hero) return { success: false, leveledUp: false, newLevel: 0 };

    const config = HERO_CONFIGS[heroId];
    if (!config) return { success: false, leveledUp: false, newLevel: 0 };

    if (hero.level >= config.maxLevel) {
      return { success: false, leveledUp: false, newLevel: hero.level };
    }

    hero.exp += expAmount;
    let leveledUp = false;

    // 检查是否可以升级
    while (hero.level < config.maxLevel) {
      const expNeeded = getExpForLevel(hero.level + 1);
      if (hero.exp >= expNeeded) {
        hero.exp -= expNeeded;
        hero.level++;
        leveledUp = true;
      } else {
        break;
      }
    }

    return { success: true, leveledUp, newLevel: hero.level };
  }

  /**
   * 英雄升星
   */
  starUpHero(heroId: string): { success: boolean; newStar: number; message: string } {
    const hero = this.ownedHeroes.get(heroId);
    if (!hero) return { success: false, newStar: 0, message: '英雄不存在' };

    const config = HERO_CONFIGS[heroId];
    if (!config) return { success: false, newStar: 0, message: '英雄配置不存在' };

    if (hero.star >= config.maxStar) {
      return { success: false, newStar: hero.star, message: '已达最大星级' };
    }

    const requiredShards = getShardsForStarUp(hero.star);
    const currentShards = this.heroShards.get(heroId) || 0;

    if (currentShards < requiredShards) {
      return {
        success: false,
        newStar: hero.star,
        message: `碎片不足，需要${requiredShards}个，当前${currentShards}个`
      };
    }

    // 扣除碎片并升星
    this.heroShards.set(heroId, currentShards - requiredShards);
    hero.star++;

    return { success: true, newStar: hero.star, message: '升星成功！' };
  }

  /**
   * 获取所有拥有的英雄
   */
  getOwnedHeroes(): OwnedHero[] {
    return Array.from(this.ownedHeroes.values());
  }

  /**
   * 获取英雄详情
   */
  getHeroDetail(heroId: string): { config: HeroConfig; owned?: OwnedHero } | null {
    const config = HERO_CONFIGS[heroId];
    if (!config) return null;

    const owned = this.ownedHeroes.get(heroId);
    return { config, owned };
  }

  /**
   * 获取英雄碎片数量
   */
  getShardCount(heroId: string): number {
    return this.heroShards.get(heroId) || 0;
  }

  /**
   * 获取所有碎片
   */
  getAllShards(): HeroShard[] {
    return Array.from(this.heroShards.entries())
      .filter(([_, count]) => count > 0)
      .map(([heroId, count]) => ({
        heroId,
        count,
        requiredForSummon: 50
      }));
  }

  /**
   * 锁定/解锁英雄
   */
  toggleLock(heroId: string): boolean {
    const hero = this.ownedHeroes.get(heroId);
    if (!hero) return false;

    hero.isLocked = !hero.isLocked;
    return true;
  }

  /**
   * 设置收藏
   */
  toggleFavorite(heroId: string): boolean {
    const hero = this.ownedHeroes.get(heroId);
    if (!hero) return false;

    hero.favorite = !hero.favorite;
    return true;
  }

  /**
   * 获取召唤历史
   */
  getSummonHistory(limit: number = 100): SummonResult[] {
    return this.summonHistory.slice(-limit);
  }

  /**
   * 获取保底进度
   */
  getPityProgress(): { rareProgress: number; legendaryProgress: number } {
    return {
      rareProgress: this.rarePityCounter,
      legendaryProgress: this.pityCounter
    };
  }

  /**
   * 导出存档数据
   */
  exportData(): any {
    return {
      ownedHeroes: Array.from(this.ownedHeroes.entries()),
      heroShards: Array.from(this.heroShards.entries()),
      pityCounter: this.pityCounter,
      rarePityCounter: this.rarePityCounter
    };
  }

  /**
   * 导入存档数据
   */
  importData(data: any): void {
    this.ownedHeroes = new Map(data.ownedHeroes || []);
    this.heroShards = new Map(data.heroShards || []);
    this.pityCounter = data.pityCounter || 0;
    this.rarePityCounter = data.rarePityCounter || 0;
  }
}

/**
 * 创建英雄系统实例
 */
export function createHeroSystem(): HeroSystem {
  return new HeroSystem();
}
