/**
 * v0.82 家园系统测试
 */

import {
  createInitialHome,
  calculateHomeLevelExp,
  calculateProductionRate,
  calculateDecorationScore,
  upgradeHome,
  addBuilding,
  addDecoration,
  collectHomeProduction,
  visitHome,
  giveVisitorGift,
  clearExpiredVisitors,
  getHomeStatus,
  HOME_CONFIG,
  HomeDecoration,
  HomeVisitor,
} from './homeSystem';

describe('v0.82 家园系统', () => {
  describe('初始家园创建', () => {
    it('应该创建初始家园', () => {
      const home = createInitialHome();
      expect(home.level).toBe(1);
      expect(home.exp).toBe(0);
      expect(home.maxExp).toBe(100);
      expect(home.decorationScore).toBe(0);
      expect(home.buildings.length).toBe(1);
      expect(home.buildings[0].type).toBe('house');
      expect(home.buildings[0].level).toBe(1);
      expect(home.decorations.length).toBe(0);
      expect(home.visitors.length).toBe(0);
      expect(home.productionRate).toBe(100);
    });
  });

  describe('家园等级经验计算', () => {
    it('应该正确计算各级所需经验', () => {
      expect(calculateHomeLevelExp(1)).toBe(100);
      expect(calculateHomeLevelExp(2)).toBe(150);
      expect(calculateHomeLevelExp(3)).toBe(225);
      expect(calculateHomeLevelExp(4)).toBe(337);
      expect(calculateHomeLevelExp(5)).toBe(506);
    });

    it('应该随等级指数增长', () => {
      expect(calculateHomeLevelExp(5)).toBeGreaterThan(calculateHomeLevelExp(1));
      expect(calculateHomeLevelExp(10)).toBeGreaterThan(calculateHomeLevelExp(5));
    });
  });

  describe('产出率计算', () => {
    it('应该计算基础产出率', () => {
      const home = createInitialHome();
      expect(calculateProductionRate(home.buildings, home.decorations)).toBe(100);
    });

    it('应该包含建筑产出加成', () => {
      const home = createInitialHome();
      home.level = 10;
      addBuilding(home, 'farm');
      expect(calculateProductionRate(home.buildings, home.decorations)).toBe(150);
      addBuilding(home, 'farm');
      expect(calculateProductionRate(home.buildings, home.decorations)).toBe(200);
    });

    it('应该包含装饰产出加成', () => {
      const home = createInitialHome();
      addDecoration(home, { id: 'd1', name: '花瓶', type: 'furniture', rarity: 'common', decorationScore: 10, obtained: true });
      expect(calculateProductionRate(home.buildings, home.decorations)).toBe(105);
    });

    it('应该正确计算稀有度加成', () => {
      const home = createInitialHome();
      const decorations: HomeDecoration[] = [
        { id: 'common', name: '普通', type: 'furniture', rarity: 'common', decorationScore: 10, obtained: true },
        { id: 'uncommon', name: '优秀', type: 'furniture', rarity: 'uncommon', decorationScore: 25, obtained: true },
        { id: 'rare', name: '稀有', type: 'furniture', rarity: 'rare', decorationScore: 50, obtained: true },
        { id: 'epic', name: '史诗', type: 'furniture', rarity: 'epic', decorationScore: 100, obtained: true },
        { id: 'legendary', name: '传说', type: 'furniture', rarity: 'legendary', decorationScore: 200, obtained: true },
      ];
      decorations.forEach(d => addDecoration(home, d));
      expect(calculateProductionRate(home.buildings, home.decorations)).toBe(220);
    });

    it('不应该计算未获得的装饰', () => {
      const home = createInitialHome();
      addDecoration(home, { id: 'd1', name: '传说', type: 'furniture', rarity: 'legendary', decorationScore: 200, obtained: false });
      expect(calculateProductionRate(home.buildings, home.decorations)).toBe(100);
    });
  });

  describe('装饰度计算', () => {
    it('应该计算总装饰度', () => {
      const home = createInitialHome();
      const decorations: HomeDecoration[] = [
        { id: '1', name: '装饰 1', type: 'furniture', rarity: 'common', decorationScore: 10, obtained: true },
        { id: '2', name: '装饰 2', type: 'furniture', rarity: 'rare', decorationScore: 50, obtained: true },
        { id: '3', name: '装饰 3', type: 'furniture', rarity: 'legendary', decorationScore: 200, obtained: true },
      ];
      decorations.forEach(d => addDecoration(home, d));
      expect(home.decorationScore).toBe(260);
    });

    it('应该只计算已获得的装饰', () => {
      const home = createInitialHome();
      addDecoration(home, { id: '1', name: '有', type: 'furniture', rarity: 'common', decorationScore: 10, obtained: true });
      addDecoration(home, { id: '2', name: '无', type: 'furniture', rarity: 'legendary', decorationScore: 200, obtained: false });
      expect(home.decorationScore).toBe(10);
    });
  });

  describe('家园升级', () => {
    it('应该成功升级家园', () => {
      const home = createInitialHome();
      home.exp = 100;
      upgradeHome(home);
      expect(home.level).toBe(2);
      expect(home.exp).toBe(0);
      expect(home.maxExp).toBe(150);
    });

    it('应该失败当经验不足', () => {
      const home = createInitialHome();
      home.exp = 50;
      const result = upgradeHome(home);
      expect(result.success).toBe(false);
      expect(home.level).toBe(1);
    });

    it('应该连续升级', () => {
      const home = createInitialHome();
      home.exp = 100; upgradeHome(home);
      home.exp = 150; upgradeHome(home);
      home.exp = 225; upgradeHome(home);
      expect(home.level).toBe(4);
    });
  });

  describe('建筑系统', () => {
    it('应该添加新建筑', () => {
      const home = createInitialHome();
      home.level = 10;
      const result = addBuilding(home, 'farm');
      expect(result.success).toBe(true);
      expect(home.buildings.length).toBe(2);
    });

    it('应该升级现有建筑', () => {
      const home = createInitialHome();
      home.level = 10;
      addBuilding(home, 'farm');
      addBuilding(home, 'farm');
      addBuilding(home, 'farm');
      expect(home.buildings[1].level).toBe(3);
    });

    it('应该检查解锁等级', () => {
      const home = createInitialHome();
      const result = addBuilding(home, 'mine');
      expect(result.success).toBe(false);
      expect(result.message).toContain('需要家园等级 5 级');
    });

    it('应该更新产出率', () => {
      const home = createInitialHome();
      home.level = 10;
      const initial = home.productionRate;
      addBuilding(home, 'farm');
      expect(home.productionRate).toBeGreaterThan(initial);
    });
  });

  describe('装饰系统', () => {
    it('应该添加装饰', () => {
      const home = createInitialHome();
      const result = addDecoration(home, { id: 'd1', name: '花瓶', type: 'furniture', rarity: 'common', decorationScore: 10, obtained: true });
      expect(result.success).toBe(true);
      expect(home.decorations.length).toBe(1);
    });

    it('应该防止重复添加', () => {
      const home = createInitialHome();
      const deco: HomeDecoration = { id: 'd1', name: '花瓶', type: 'furniture', rarity: 'common', decorationScore: 10, obtained: true };
      addDecoration(home, deco);
      expect(addDecoration(home, deco).success).toBe(false);
    });

    it('应该获得装饰经验', () => {
      const home = createInitialHome();
      addDecoration(home, { id: 'd1', name: '花瓶', type: 'furniture', rarity: 'common', decorationScore: 10, obtained: true });
      expect(home.exp).toBe(100);
    });
  });

  describe('离线收益收取', () => {
    it('应该计算正确的收益', () => {
      const home = createInitialHome();
      home.productionRate = 100;
      home.lastCollectTime = Date.now() - (2 * 60 * 60 * 1000);
      const result = collectHomeProduction(home);
      expect(result.gold).toBe(200);
      expect(result.hours).toBe(2);
    });

    it('应该更新收取时间', () => {
      const home = createInitialHome();
      const before = home.lastCollectTime;
      home.lastCollectTime = Date.now() - (60 * 60 * 1000);
      collectHomeProduction(home);
      expect(home.lastCollectTime).toBeGreaterThanOrEqual(before);
    });

    it('应该拒绝短时间内重复收取', () => {
      const home = createInitialHome();
      home.lastCollectTime = Date.now();
      const result = collectHomeProduction(home);
      expect(result.gold).toBe(0);
    });
  });

  describe('访客系统', () => {
    it('应该允许访客来访', () => {
      const home = createInitialHome();
      visitHome(home, { id: 'v1', name: '小明', relationship: 'friend', lastVisitTime: Date.now(), giftGiven: false });
      expect(home.visitors.length).toBe(1);
    });

    it('应该检查访客数量上限', () => {
      const home = createInitialHome();
      for (let i = 0; i < 10; i++) {
        visitHome(home, { id: `v${i}`, name: `访客${i}`, relationship: 'stranger', lastVisitTime: Date.now(), giftGiven: false });
      }
      const result = visitHome(home, { id: 'v11', name: '访客 11', relationship: 'stranger', lastVisitTime: Date.now(), giftGiven: false });
      expect(result.success).toBe(false);
    });

    it('应该赠送礼物并获得奖励', () => {
      const home = createInitialHome();
      visitHome(home, { id: 'v1', name: '好友', relationship: 'friend', lastVisitTime: Date.now(), giftGiven: false });
      const result = giveVisitorGift(home, 'v1');
      expect(result.success).toBe(true);
      expect(result.reward).toBe(500);
    });

    it('应该根据关系给予不同奖励', () => {
      const home = createInitialHome();
      const visitors: HomeVisitor[] = [
        { id: 'friend', name: '好友', relationship: 'friend', lastVisitTime: Date.now(), giftGiven: false },
        { id: 'stranger', name: '陌生人', relationship: 'stranger', lastVisitTime: Date.now(), giftGiven: false },
        { id: 'npc', name: 'NPC', relationship: 'npc', lastVisitTime: Date.now(), giftGiven: false },
      ];
      visitors.forEach(v => visitHome(home, v));
      expect(giveVisitorGift(home, 'friend').reward).toBe(500);
      expect(giveVisitorGift(home, 'stranger').reward).toBe(100);
      expect(giveVisitorGift(home, 'npc').reward).toBe(200);
    });

    it('应该防止重复赠送', () => {
      const home = createInitialHome();
      visitHome(home, { id: 'v1', name: '好友', relationship: 'friend', lastVisitTime: Date.now(), giftGiven: false });
      giveVisitorGift(home, 'v1');
      expect(giveVisitorGift(home, 'v1').success).toBe(false);
    });

    it('应该清理过期访客', () => {
      const home = createInitialHome();
      visitHome(home, { id: 'old', name: '旧', relationship: 'stranger', lastVisitTime: Date.now() - (25 * 60 * 60 * 1000), giftGiven: false });
      visitHome(home, { id: 'new', name: '新', relationship: 'friend', lastVisitTime: Date.now() - (1 * 60 * 60 * 1000), giftGiven: false });
      const cleared = clearExpiredVisitors(home);
      expect(cleared).toBe(1);
      expect(home.visitors.length).toBe(1);
    });
  });

  describe('家园状态', () => {
    it('应该返回正确的状态摘要', () => {
      const home = createInitialHome();
      home.level = 10;
      addBuilding(home, 'farm');
      addBuilding(home, 'garden');
      addDecoration(home, { id: 'd1', name: '花瓶', type: 'furniture', rarity: 'rare', decorationScore: 50, obtained: true });
      home.lastCollectTime = Date.now() - (3 * 60 * 60 * 1000);
      const status = getHomeStatus(home);
      expect(status.level).toBe(10);
      expect(status.buildingCount).toBe(3);
      expect(status.decorationCount).toBe(1);
      expect(status.pendingGold).toBeGreaterThanOrEqual(500);
    });
  });

  describe('建筑类型配置', () => {
    it('应该包含所有建筑类型', () => {
      expect(HOME_CONFIG.buildingTypes.length).toBe(5);
      const types = HOME_CONFIG.buildingTypes.map(t => t.type);
      expect(types).toEqual(expect.arrayContaining(['house', 'farm', 'mine', 'garden', 'workshop']));
    });

    it('应该有正确的解锁等级', () => {
      expect(HOME_CONFIG.buildingTypes.find(t => t.type === 'house')?.unlockLevel).toBe(1);
      expect(HOME_CONFIG.buildingTypes.find(t => t.type === 'farm')?.unlockLevel).toBe(2);
      expect(HOME_CONFIG.buildingTypes.find(t => t.type === 'mine')?.unlockLevel).toBe(5);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的家园发展流程', () => {
      const home = createInitialHome();
      const decorations: HomeDecoration[] = [
        { id: '1', name: '装饰 1', type: 'furniture', rarity: 'common', decorationScore: 10, obtained: true },
        { id: '2', name: '装饰 2', type: 'furniture', rarity: 'uncommon', decorationScore: 25, obtained: true },
        { id: '3', name: '装饰 3', type: 'furniture', rarity: 'rare', decorationScore: 50, obtained: true },
      ];
      decorations.forEach(d => addDecoration(home, d));
      expect(home.exp).toBe(850);
      home.exp = 100;
      upgradeHome(home);
      expect(home.level).toBe(2);
      const tempLevel = home.level;
      home.level = 10;
      addBuilding(home, 'farm');
      home.level = tempLevel;
      expect(home.buildings.length).toBe(2);
      home.lastCollectTime = Date.now() - (5 * 60 * 60 * 1000);
      expect(collectHomeProduction(home).gold).toBeGreaterThanOrEqual(750);
      visitHome(home, { id: 'v1', name: '好友', relationship: 'friend', lastVisitTime: Date.now(), giftGiven: false });
      expect(giveVisitorGift(home, 'v1').reward).toBe(500);
      const status = getHomeStatus(home);
      expect(status.level).toBe(2);
      expect(status.buildingCount).toBe(2);
      expect(status.decorationCount).toBe(3);
      expect(status.visitorCount).toBe(1);
    });
  });
});
