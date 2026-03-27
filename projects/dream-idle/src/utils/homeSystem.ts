/**
 * v0.82 家园系统 (Home System)
 * 家园建造、装饰、等级、资源产出、访客互动
 */

export interface Home {
  level: number;
  exp: number;
  maxExp: number;
  decorationScore: number;
  buildings: HomeBuilding[];
  decorations: HomeDecoration[];
  visitors: HomeVisitor[];
  lastVisitTime: number;
  productionRate: number; // 每小时金币产出
  lastCollectTime: number;
}

export interface HomeBuilding {
  id: string;
  name: string;
  level: number;
  type: 'house' | 'farm' | 'mine' | 'garden' | 'workshop';
  productionBonus: number;
  unlockLevel: number;
}

export interface HomeDecoration {
  id: string;
  name: string;
  type: 'furniture' | 'plant' | 'art' | 'light';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  decorationScore: number;
  obtained: boolean;
}

export interface HomeVisitor {
  id: string;
  name: string;
  relationship: 'friend' | 'stranger' | 'npc';
  lastVisitTime: number;
  giftGiven: boolean;
  message?: string;
}

export interface HomeConfig {
  baseProductionRate: number;
  levelExpMultiplier: number;
  maxVisitors: number;
  maxBuildings: number;
  buildingTypes: HomeBuildingType[];
}

export interface HomeBuildingType {
  type: 'house' | 'farm' | 'mine' | 'garden' | 'workshop';
  name: string;
  description: string;
  baseProduction: number;
  unlockLevel: number;
}

// 默认配置
export const HOME_CONFIG: HomeConfig = {
  baseProductionRate: 100, // 每小时 100 金币
  levelExpMultiplier: 1.5,
  maxVisitors: 10,
  maxBuildings: 5,
  buildingTypes: [
    { type: 'house', name: '主屋', description: '提升家园等级上限', baseProduction: 0, unlockLevel: 1 },
    { type: 'farm', name: '农田', description: '种植作物获得金币', baseProduction: 50, unlockLevel: 2 },
    { type: 'mine', name: '矿场', description: '开采矿石获得金币', baseProduction: 80, unlockLevel: 5 },
    { type: 'garden', name: '花园', description: '种植花卉获得装饰度', baseProduction: 30, unlockLevel: 3 },
    { type: 'workshop', name: '工坊', description: '制作装饰品', baseProduction: 60, unlockLevel: 8 },
  ],
};

// 初始家园
export function createInitialHome(): Home {
  return {
    level: 1,
    exp: 0,
    maxExp: 100,
    decorationScore: 0,
    buildings: [
      {
        id: 'house_1',
        name: '简陋小屋',
        level: 1,
        type: 'house',
        productionBonus: 0,
        unlockLevel: 1,
      },
    ],
    decorations: [],
    visitors: [],
    lastVisitTime: Date.now(),
    productionRate: 100,
    lastCollectTime: Date.now(),
  };
}

// 计算家园等级所需经验
export function calculateHomeLevelExp(level: number): number {
  return Math.floor(100 * Math.pow(HOME_CONFIG.levelExpMultiplier, level - 1));
}

// 计算总产出加成
export function calculateProductionRate(buildings: HomeBuilding[], decorations: HomeDecoration[]): number {
  let rate = HOME_CONFIG.baseProductionRate;
  
  // 建筑加成
  buildings.forEach(building => {
    const buildingType = HOME_CONFIG.buildingTypes.find(t => t.type === building.type);
    if (buildingType) {
      rate += buildingType.baseProduction * building.level;
    }
  });
  
  // 装饰加成（稀有度越高加成越多）
  const rarityBonus: Record<string, number> = {
    common: 5,
    uncommon: 10,
    rare: 20,
    epic: 35,
    legendary: 50,
  };
  
  decorations.forEach(deco => {
    if (deco.obtained) {
      rate += rarityBonus[deco.rarity] || 0;
    }
  });
  
  return rate;
}

// 计算装饰度
export function calculateDecorationScore(decorations: HomeDecoration[]): number {
  const rarityScore: Record<string, number> = {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
    legendary: 200,
  };
  
  return decorations
    .filter(d => d.obtained)
    .reduce((total, deco) => total + (rarityScore[deco.rarity] || 0), 0);
}

// 升级家园
export function upgradeHome(home: Home): { success: boolean; message: string; cost?: number } {
  const cost = home.level * 1000; // 升级成本
  
  if (home.exp < home.maxExp) {
    return { success: false, message: '家园经验不足，需要更多装饰和建筑来提升等级' };
  }
  
  home.level += 1;
  home.exp = 0;
  home.maxExp = calculateHomeLevelExp(home.level);
  
  return { success: true, message: `家园升级到 ${home.level} 级！解锁更多建筑和装饰`, cost };
}

// 添加/升级建筑
export function addBuilding(home: Home, buildingType: HomeBuilding['type']): { success: boolean; message: string; building?: HomeBuilding } {
  const config = HOME_CONFIG.buildingTypes.find(t => t.type === buildingType);
  if (!config) {
    return { success: false, message: '无效的建筑类型' };
  }
  
  if (home.level < config.unlockLevel) {
    return { success: false, message: `需要家园等级 ${config.unlockLevel} 级才能解锁 ${config.name}` };
  }
  
  const existingBuilding = home.buildings.find(b => b.type === buildingType);
  
  if (existingBuilding) {
    // 升级现有建筑
    existingBuilding.level += 1;
    home.productionRate = calculateProductionRate(home.buildings, home.decorations);
    return { 
      success: true, 
      message: `${existingBuilding.name} 升级到 ${existingBuilding.level} 级！`,
      building: existingBuilding,
    };
  } else {
    // 添加新建筑
    if (home.buildings.length >= HOME_CONFIG.maxBuildings) {
      return { success: false, message: '建筑数量已达上限' };
    }
    
    const newBuilding: HomeBuilding = {
      id: `${buildingType}_${home.buildings.length + 1}`,
      name: config.name,
      level: 1,
      type: buildingType,
      productionBonus: config.baseProduction,
      unlockLevel: config.unlockLevel,
    };
    
    home.buildings.push(newBuilding);
    home.productionRate = calculateProductionRate(home.buildings, home.decorations);
    
    return { success: true, message: `新建 ${config.name}！`, building: newBuilding };
  }
}

// 添加装饰
export function addDecoration(home: Home, decoration: HomeDecoration): { success: boolean; message: string } {
  const existing = home.decorations.find(d => d.id === decoration.id);
  
  if (existing) {
    return { success: false, message: '已拥有该装饰品' };
  }
  
  home.decorations.push(decoration);
  home.decorationScore = calculateDecorationScore(home.decorations);
  home.productionRate = calculateProductionRate(home.buildings, home.decorations);
  
  // 获得装饰度经验
  const expGain = decoration.decorationScore * 10;
  home.exp += expGain;
  
  return { success: true, message: `获得 ${decoration.name}！家园经验 +${expGain}` };
}

// 收取离线收益
export function collectHomeProduction(home: Home): { gold: number; hours: number } {
  const now = Date.now();
  const hoursPassed = (now - home.lastCollectTime) / (1000 * 60 * 60);
  
  if (hoursPassed < 0.1) { // 至少 6 分钟才能收取
    return { gold: 0, hours: 0 };
  }
  
  const gold = Math.floor(home.productionRate * hoursPassed);
  home.lastCollectTime = now;
  
  return { gold, hours: Math.floor(hoursPassed * 10) / 10 };
}

// 访客来访
export function visitHome(home: Home, visitor: HomeVisitor): { success: boolean; message: string } {
  if (home.visitors.length >= HOME_CONFIG.maxVisitors) {
    return { success: false, message: '访客已满' };
  }
  
  home.visitors.push(visitor);
  home.lastVisitTime = Date.now();
  
  return { success: true, message: `${visitor.name} 来访了你的家园！` };
}

// 赠送访客礼物
export function giveVisitorGift(home: Home, visitorId: string): { success: boolean; message: string; reward?: number } {
  const visitor = home.visitors.find(v => v.id === visitorId);
  
  if (!visitor) {
    return { success: false, message: '访客不存在' };
  }
  
  if (visitor.giftGiven) {
    return { success: false, message: '已赠送过礼物' };
  }
  
  visitor.giftGiven = true;
  
  // 根据关系获得不同奖励
  const relationshipBonus: Record<string, number> = {
    friend: 500,
    stranger: 100,
    npc: 200,
  };
  
  const reward = relationshipBonus[visitor.relationship] || 100;
  
  return { success: true, message: `赠送 ${visitor.name} 礼物，获得 ${reward} 金币！`, reward };
}

// 清理过期访客（24 小时后）
export function clearExpiredVisitors(home: Home): number {
  const now = Date.now();
  const expiredHours = 24;
  const expiredTimestamp = now - (expiredHours * 60 * 60 * 1000);
  
  const beforeCount = home.visitors.length;
  home.visitors = home.visitors.filter(v => v.lastVisitTime > expiredTimestamp);
  
  return beforeCount - home.visitors.length;
}

// 获取家园状态摘要
export function getHomeStatus(home: Home): {
  level: number;
  expProgress: string;
  decorationScore: number;
  productionRate: number;
  buildingCount: number;
  decorationCount: number;
  visitorCount: number;
  pendingGold: number;
} {
  const hoursSinceCollect = (Date.now() - home.lastCollectTime) / (1000 * 60 * 60);
  const pendingGold = Math.floor(home.productionRate * hoursSinceCollect);
  
  return {
    level: home.level,
    expProgress: `${home.exp}/${home.maxExp}`,
    decorationScore: home.decorationScore,
    productionRate: home.productionRate,
    buildingCount: home.buildings.length,
    decorationCount: home.decorations.filter(d => d.obtained).length,
    visitorCount: home.visitors.length,
    pendingGold,
  };
}
