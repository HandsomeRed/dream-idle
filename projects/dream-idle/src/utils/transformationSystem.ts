/**
 * v0.83 变身卡系统 (Transformation Card System)
 * 击败怪物获得变身卡，变身后获得怪物特殊能力
 */

export interface TransformationCard {
  id: string;
  name: string;
  monsterType: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  duration: number; // 变身持续时间 (秒)
  effects: CardEffect[];
  obtained: boolean;
  quantity: number;
}

export interface CardEffect {
  type: 'stat_boost' | 'skill' | 'passive' | 'special';
  name: string;
  description: string;
  value?: number;
  duration?: number;
}

export interface ActiveTransformation {
  cardId: string;
  name: string;
  monsterType: string;
  startTime: number;
  endTime: number;
  effects: CardEffect[];
  isActive: boolean;
}

export interface TransformationConfig {
  maxActiveDuration: number; // 最大变身持续时间 (秒)
  cooldownDuration: number; // 变身冷却时间 (秒)
  dropRates: Record<string, number>; // 各稀有度掉落率
}

export const TRANSFORMATION_CONFIG: TransformationConfig = {
  maxActiveDuration: 300, // 5 分钟
  cooldownDuration: 60, // 1 分钟冷却
  dropRates: {
    common: 0.50,
    uncommon: 0.30,
    rare: 0.15,
    epic: 0.04,
    legendary: 0.01,
  },
};

// 变身卡数据库
export const CARD_DATABASE: TransformationCard[] = [
  // 普通卡
  { id: 'card_001', name: '强盗变身卡', monsterType: '强盗', rarity: 'common', duration: 180, effects: [{ type: 'stat_boost', name: '力量 +5', description: '力量属性 +5', value: 5 }], obtained: false, quantity: 0 },
  { id: 'card_002', name: '山贼变身卡', monsterType: '山贼', rarity: 'common', duration: 180, effects: [{ type: 'stat_boost', name: '敏捷 +5', description: '敏捷属性 +5', value: 5 }], obtained: false, quantity: 0 },
  { id: 'card_003', name: '赌徒变身卡', monsterType: '赌徒', rarity: 'common', duration: 180, effects: [{ type: 'stat_boost', name: '幸运 +3', description: '幸运属性 +3', value: 3 }], obtained: false, quantity: 0 },
  
  // 优秀卡
  { id: 'card_011', name: '老虎变身卡', monsterType: '老虎', rarity: 'uncommon', duration: 240, effects: [{ type: 'stat_boost', name: '力量 +10', description: '力量属性 +10', value: 10 }, { type: 'passive', name: '连击', description: '10% 概率连击', value: 10 }], obtained: false, quantity: 0 },
  { id: 'card_012', name: '黑熊变身卡', monsterType: '黑熊', rarity: 'uncommon', duration: 240, effects: [{ type: 'stat_boost', name: '体质 +15', description: '体质属性 +15', value: 15 }, { type: 'passive', name: '防御', description: '防御 +10%', value: 10 }], obtained: false, quantity: 0 },
  { id: 'card_013', name: '蝴蝶仙子变身卡', monsterType: '蝴蝶仙子', rarity: 'uncommon', duration: 240, effects: [{ type: 'stat_boost', name: '魔力 +10', description: '魔力属性 +10', value: 10 }, { type: 'skill', name: '飞行', description: '速度 +15%', value: 15 }], obtained: false, quantity: 0 },
  
  // 稀有卡
  { id: 'card_021', name: '天兵变身卡', monsterType: '天兵', rarity: 'rare', duration: 300, effects: [{ type: 'stat_boost', name: '力量 +20', description: '力量属性 +20', value: 20 }, { type: 'passive', name: '感知', description: '可检测隐身单位', value: 100 }], obtained: false, quantity: 0 },
  { id: 'card_022', name: '小龙女变身卡', monsterType: '小龙女', rarity: 'rare', duration: 300, effects: [{ type: 'stat_boost', name: '魔力 +20', description: '魔力属性 +20', value: 20 }, { type: 'skill', name: '龙卷雨击', description: '群体法术攻击', value: 120 }], obtained: false, quantity: 0 },
  { id: 'card_023', name: '瑞兽变身卡', monsterType: '瑞兽', rarity: 'rare', duration: 300, effects: [{ type: 'stat_boost', name: '体质 +25', description: '体质属性 +25', value: 25 }, { type: 'passive', name: '反击', description: '20% 概率反击', value: 20 }], obtained: false, quantity: 0 },
  
  // 史诗卡
  { id: 'card_031', name: '孙悟空变身卡', monsterType: '孙悟空', rarity: 'epic', duration: 360, effects: [{ type: 'stat_boost', name: '全属性 +15', description: '所有属性 +15', value: 15 }, { type: 'skill', name: '七十二变', description: '免疫一次控制效果', value: 100 }, { type: 'passive', name: '火眼金睛', description: '暴击率 +20%', value: 20 }], obtained: false, quantity: 0 },
  { id: 'card_032', name: '猪八戒变身卡', monsterType: '猪八戒', rarity: 'epic', duration: 360, effects: [{ type: 'stat_boost', name: '体质 +40', description: '体质属性 +40', value: 40 }, { type: 'skill', name: '九齿钉耙', description: '强力单体攻击', value: 150 }, { type: 'passive', name: '贪吃', description: '治疗效果 +30%', value: 30 }], obtained: false, quantity: 0 },
  { id: 'card_033', name: '沙和尚变身卡', monsterType: '沙和尚', rarity: 'epic', duration: 360, effects: [{ type: 'stat_boost', name: '力量 +25', description: '力量属性 +25', value: 25 }, { type: 'stat_boost', name: '体质 +25', description: '体质属性 +25', value: 25 }, { type: 'passive', name: '忠诚', description: '队友防御 +15%', value: 15 }], obtained: false, quantity: 0 },
  
  // 传说卡
  { id: 'card_041', name: '蚩尤变身卡', monsterType: '蚩尤', rarity: 'legendary', duration: 600, effects: [{ type: 'stat_boost', name: '全属性 +30', description: '所有属性 +30', value: 30 }, { type: 'skill', name: '魔神之力', description: '伤害 +50%', value: 50 }, { type: 'passive', name: '战神', description: '每回合恢复 5% 气血', value: 5 }, { type: 'special', name: '威压', description: '敌方全属性 -10%', value: 10 }], obtained: false, quantity: 0 },
  { id: 'card_042', name: '伏羲女娲变身卡', monsterType: '伏羲女娲', rarity: 'legendary', duration: 600, effects: [{ type: 'stat_boost', name: '魔力 +50', description: '魔力属性 +50', value: 50 }, { type: 'skill', name: '创世之力', description: '法术伤害 +60%', value: 60 }, { type: 'passive', name: '智慧', description: '技能消耗 -30%', value: 30 }, { type: 'special', name: '造化', description: '经验获取 +20%', value: 20 }], obtained: false, quantity: 0 },
];

// 创建玩家变身卡背包
export function createTransformationDeck(): TransformationCard[] {
  return CARD_DATABASE.map(card => ({ ...card }));
}

// 根据稀有度随机获得变身卡
export function getRandomCardByRarity(rarity: TransformationCard['rarity']): TransformationCard | null {
  const cards = CARD_DATABASE.filter(c => c.rarity === rarity);
  if (cards.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * cards.length);
  return { ...cards[randomIndex] };
}

// 根据掉落率随机获得变身卡
export function getRandomCardDrop(): TransformationCard | null {
  const rand = Math.random();
  let cumulative = 0;
  
  const rarities: TransformationCard['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  
  for (const rarity of rarities) {
    cumulative += TRANSFORMATION_CONFIG.dropRates[rarity];
    if (rand <= cumulative) {
      return getRandomCardByRarity(rarity);
    }
  }
  
  return getRandomCardByRarity('common');
}

// 获得变身卡
export function obtainCard(deck: TransformationCard[], cardId: string): { success: boolean; message: string; quantity?: number } {
  const card = deck.find(c => c.id === cardId);
  
  if (!card) {
    return { success: false, message: '变身卡不存在' };
  }
  
  if (card.obtained) {
    card.quantity += 1;
    return { success: true, message: `获得 ${card.name} x1 (现有：${card.quantity})`, quantity: card.quantity };
  } else {
    card.obtained = true;
    card.quantity = 1;
    return { success: true, message: `首次获得 ${card.name}！`, quantity: 1 };
  }
}

// 变身
export function transform(deck: TransformationCard[], cardId: string, currentTime: number = Date.now()): { success: boolean; message: string; transformation?: ActiveTransformation } {
  const card = deck.find(c => c.id === cardId);
  
  if (!card || !card.obtained || card.quantity <= 0) {
    return { success: false, message: '未拥有该变身卡或数量不足' };
  }
  
  const transformation: ActiveTransformation = {
    cardId: card.id,
    name: card.name,
    monsterType: card.monsterType,
    startTime: currentTime,
    endTime: currentTime + (card.duration * 1000),
    effects: [...card.effects],
    isActive: true,
  };
  
  return { success: true, message: `变身为 ${card.name}，持续${card.duration}秒！`, transformation };
}

// 取消变身
export function cancelTransformation(transformation: ActiveTransformation | null): { success: boolean; message: string } {
  if (!transformation || !transformation.isActive) {
    return { success: false, message: '当前未变身' };
  }
  
  transformation.isActive = false;
  transformation.endTime = Date.now();
  
  return { success: true, message: '已取消变身' };
}

// 检查变身是否过期
export function checkTransformationExpired(transformation: ActiveTransformation | null, currentTime: number = Date.now()): boolean {
  if (!transformation || !transformation.isActive) {
    return true;
  }
  
  if (currentTime >= transformation.endTime) {
    transformation.isActive = false;
    return true;
  }
  
  return false;
}

// 获取变身剩余时间
export function getTransformationRemainingTime(transformation: ActiveTransformation | null, currentTime: number = Date.now()): number {
  if (!transformation || !transformation.isActive) {
    return 0;
  }
  
  const remaining = transformation.endTime - currentTime;
  return Math.max(0, Math.floor(remaining / 1000));
}

// 获取变身效果加成
export function getTransformationBuffs(transformation: ActiveTransformation | null): {
  statBoosts: Record<string, number>;
  skills: CardEffect[];
  passives: CardEffect[];
  specials: CardEffect[];
} {
  const result = {
    statBoosts: {} as Record<string, number>,
    skills: [] as CardEffect[],
    passives: [] as CardEffect[],
    specials: [] as CardEffect[],
  };
  
  if (!transformation || !transformation.isActive) {
    return result;
  }
  
  transformation.effects.forEach(effect => {
    if (effect.type === 'stat_boost') {
      // 解析属性加成，如 "力量 +5"
      const match = effect.name.match(/(.+)\+(\d+)/);
      if (match) {
        const [, stat, value] = match;
        result.statBoosts[stat.trim()] = parseInt(value);
      }
    } else if (effect.type === 'skill') {
      result.skills.push(effect);
    } else if (effect.type === 'passive') {
      result.passives.push(effect);
    } else if (effect.type === 'special') {
      result.specials.push(effect);
    }
  });
  
  return result;
}

// 使用变身卡 (消耗一张)
export function useCard(deck: TransformationCard[], cardId: string): { success: boolean; message: string; transformation?: ActiveTransformation } {
  const card = deck.find(c => c.id === cardId);
  
  if (!card || !card.obtained || card.quantity <= 0) {
    return { success: false, message: '未拥有该变身卡或数量不足' };
  }
  
  // 先变身，成功后再消耗卡片
  const transformResult = transform(deck, cardId);
  
  if (!transformResult.success) {
    return transformResult;
  }
  
  // 变身成功后消耗卡片
  card.quantity -= 1;
  
  if (card.quantity === 0) {
    card.obtained = false;
  }
  
  return { ...transformResult, message: `使用 ${card.name}，变身为 ${card.monsterType}！` };
}

// 获取已拥有的变身卡列表
export function getOwnedCards(deck: TransformationCard[]): TransformationCard[] {
  return deck.filter(c => c.obtained && c.quantity > 0);
}

// 按稀有度筛选变身卡
export function filterCardsByRarity(deck: TransformationCard[], rarity: TransformationCard['rarity']): TransformationCard[] {
  return deck.filter(c => c.rarity === rarity);
}

// 获取变身卡收集进度
export function getCollectionProgress(deck: TransformationCard[]): {
  total: number;
  owned: number;
  byRarity: Record<string, { total: number; owned: number }>;
  percentage: number;
} {
  const result = {
    total: deck.length,
    owned: deck.filter(c => c.obtained && c.quantity > 0).length,
    byRarity: {} as Record<string, { total: number; owned: number }>,
    percentage: 0,
  };
  
  const rarities: TransformationCard['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  
  rarities.forEach(rarity => {
    const cards = deck.filter(c => c.rarity === rarity);
    result.byRarity[rarity] = {
      total: cards.length,
      owned: cards.filter(c => c.obtained && c.quantity > 0).length,
    };
  });
  
  result.percentage = Math.floor((result.owned / result.total) * 100);
  
  return result;
}
