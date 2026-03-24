// 称号系统测试 - v0.68

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  TITLE_CONFIGS,
  RARITY_ORDER,
  RARITY_NAMES,
  RARITY_COLORS,
  SOURCE_NAMES,
  STAT_NAMES,
  createTitleState,
  grantTitle,
  equipTitle,
  unequipTitle,
  toggleFavorite,
  getEquippedBonuses,
  calculateTotalBonuses,
  cleanExpiredTitles,
  getOwnedTitlesList,
  filterBySource,
  filterByRarity,
  searchTitles,
  getTitleStats,
  formatBonus,
  formatAllBonuses,
  exportTitleData,
  importTitleData,
  type TitleState,
} from './titleSystem';

describe('称号系统 v0.68', () => {
  let state: TitleState;

  beforeEach(() => {
    state = createTitleState('player_001');
  });

  // ==================== 配置测试 ====================
  describe('称号配置', () => {
    it('应包含多个称号', () => {
      expect(Object.keys(TITLE_CONFIGS).length).toBeGreaterThanOrEqual(10);
    });

    it('每个称号应包含必要字段', () => {
      Object.values(TITLE_CONFIGS).forEach(config => {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('source');
        expect(config).toHaveProperty('rarity');
        expect(config).toHaveProperty('bonuses');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('priority');
      });
    });

    it('每个称号应有至少一个属性加成', () => {
      Object.values(TITLE_CONFIGS).forEach(config => {
        expect(config.bonuses.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('称号ID应唯一', () => {
      const ids = Object.keys(TITLE_CONFIGS);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('应覆盖多种稀有度', () => {
      const rarities = new Set(Object.values(TITLE_CONFIGS).map(c => c.rarity));
      expect(rarities.size).toBeGreaterThanOrEqual(4);
    });

    it('应覆盖多种来源', () => {
      const sources = new Set(Object.values(TITLE_CONFIGS).map(c => c.source));
      expect(sources.size).toBeGreaterThanOrEqual(4);
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建空状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.equippedTitle).toBeNull();
      expect(state.ownedTitles).toHaveLength(0);
      expect(state.favorites).toHaveLength(0);
    });
  });

  // ==================== 授予称号测试 ====================
  describe('授予称号', () => {
    it('应成功授予新称号', () => {
      const { state: s1, isNew } = grantTitle(state, 'title_newbie');
      expect(isNew).toBe(true);
      expect(s1.ownedTitles).toHaveLength(1);
      expect(s1.ownedTitles[0].titleId).toBe('title_newbie');
    });

    it('重复授予应返回isNew=false', () => {
      const { state: s1 } = grantTitle(state, 'title_newbie');
      const { state: s2, isNew } = grantTitle(s1, 'title_newbie');
      expect(isNew).toBe(false);
      expect(s2.ownedTitles).toHaveLength(1);
    });

    it('不存在的称号应返回isNew=false', () => {
      const { isNew } = grantTitle(state, 'nonexistent');
      expect(isNew).toBe(false);
    });

    it('授予应记录最近获得', () => {
      const { state: s1 } = grantTitle(state, 'title_newbie');
      expect(s1.recentlyObtained).toContain('title_newbie');
    });

    it('最近获得应限制10条', () => {
      let s = state;
      const titleIds = Object.keys(TITLE_CONFIGS);
      for (const id of titleIds) {
        const result = grantTitle(s, id);
        s = result.state;
      }
      expect(s.recentlyObtained.length).toBeLessThanOrEqual(10);
    });

    it('应记录获得时间', () => {
      const now = 1234567890;
      const { state: s1 } = grantTitle(state, 'title_newbie', undefined, now);
      expect(s1.ownedTitles[0].obtainedAt).toBe(now);
    });
  });

  // ==================== 装备称号测试 ====================
  describe('装备称号', () => {
    it('应成功装备已拥有的称号', () => {
      const { state: s1 } = grantTitle(state, 'title_newbie');
      const { state: s2, success } = equipTitle(s1, 'title_newbie');
      expect(success).toBe(true);
      expect(s2.equippedTitle).toBe('title_newbie');
    });

    it('装备未拥有的称号应失败', () => {
      const { success, error } = equipTitle(state, 'title_newbie');
      expect(success).toBe(false);
      expect(error).toContain('未拥有');
    });

    it('应能切换装备', () => {
      let s = state;
      s = grantTitle(s, 'title_newbie').state;
      s = grantTitle(s, 'title_warrior').state;
      s = equipTitle(s, 'title_newbie').state;
      expect(s.equippedTitle).toBe('title_newbie');
      s = equipTitle(s, 'title_warrior').state;
      expect(s.equippedTitle).toBe('title_warrior');
    });

    it('卸下称号', () => {
      let s = grantTitle(state, 'title_newbie').state;
      s = equipTitle(s, 'title_newbie').state;
      s = unequipTitle(s);
      expect(s.equippedTitle).toBeNull();
    });
  });

  // ==================== 收藏测试 ====================
  describe('收藏', () => {
    it('应能收藏称号', () => {
      const { state: s1 } = grantTitle(state, 'title_newbie');
      const s2 = toggleFavorite(s1, 'title_newbie');
      expect(s2.favorites).toContain('title_newbie');
    });

    it('再次点击应取消收藏', () => {
      let s = grantTitle(state, 'title_newbie').state;
      s = toggleFavorite(s, 'title_newbie');
      expect(s.favorites).toContain('title_newbie');
      s = toggleFavorite(s, 'title_newbie');
      expect(s.favorites).not.toContain('title_newbie');
    });

    it('未拥有的称号不能收藏', () => {
      const s = toggleFavorite(state, 'title_newbie');
      expect(s.favorites).toHaveLength(0);
    });
  });

  // ==================== 属性加成测试 ====================
  describe('属性加成', () => {
    it('未装备称号应无加成', () => {
      const bonuses = getEquippedBonuses(state);
      expect(bonuses).toHaveLength(0);
    });

    it('装备称号应返回加成', () => {
      let s = grantTitle(state, 'title_warrior').state;
      s = equipTitle(s, 'title_warrior').state;
      const bonuses = getEquippedBonuses(s);
      expect(bonuses.length).toBeGreaterThan(0);
    });

    it('计算总加成应正确', () => {
      let s = grantTitle(state, 'title_tower_master').state;
      s = equipTitle(s, 'title_tower_master').state;
      const totals = calculateTotalBonuses(s);
      expect(totals['attack']).toBeDefined();
      expect(totals['attack'].flat).toBe(100);
    });

    it('百分比加成应正确分类', () => {
      let s = grantTitle(state, 'title_newbie').state;
      s = equipTitle(s, 'title_newbie').state;
      const totals = calculateTotalBonuses(s);
      expect(totals['expBonus'].percent).toBe(5);
    });
  });

  // ==================== 过期清理测试 ====================
  describe('过期清理', () => {
    it('未过期的称号不应被清理', () => {
      const { state: s1 } = grantTitle(state, 'title_newbie');
      const s2 = cleanExpiredTitles(s1);
      expect(s2.ownedTitles).toHaveLength(1);
    });

    it('过期的限时称号应被清理', () => {
      let s = state;
      s = {
        ...s,
        ownedTitles: [{ titleId: 'title_season_1', obtainedAt: 1000, expiresAt: 2000 }],
      };
      const cleaned = cleanExpiredTitles(s, 3000);
      expect(cleaned.ownedTitles).toHaveLength(0);
    });

    it('过期称号如果正在装备应自动卸下', () => {
      let s = state;
      s = {
        ...s,
        ownedTitles: [{ titleId: 'title_season_1', obtainedAt: 1000, expiresAt: 2000 }],
        equippedTitle: 'title_season_1',
      };
      const cleaned = cleanExpiredTitles(s, 3000);
      expect(cleaned.equippedTitle).toBeNull();
    });

    it('过期称号应从收藏中移除', () => {
      let s = state;
      s = {
        ...s,
        ownedTitles: [{ titleId: 'title_season_1', obtainedAt: 1000, expiresAt: 2000 }],
        favorites: ['title_season_1'],
      };
      const cleaned = cleanExpiredTitles(s, 3000);
      expect(cleaned.favorites).not.toContain('title_season_1');
    });
  });

  // ==================== 列表和筛选测试 ====================
  describe('列表和筛选', () => {
    let fullState: TitleState;

    beforeEach(() => {
      let s = state;
      s = grantTitle(s, 'title_newbie').state;
      s = grantTitle(s, 'title_warrior').state;
      s = grantTitle(s, 'title_tower_master').state;
      s = grantTitle(s, 'title_pet_lover').state;
      fullState = s;
    });

    it('列表应按优先级排序', () => {
      const list = getOwnedTitlesList(fullState);
      expect(list.length).toBe(4);
      // 优先级高的在前
      for (let i = 1; i < list.length; i++) {
        expect(list[i - 1].config.priority).toBeGreaterThanOrEqual(list[i].config.priority);
      }
    });

    it('收藏的称号应排在最前', () => {
      const s = toggleFavorite(fullState, 'title_newbie');
      const list = getOwnedTitlesList(s);
      expect(list[0].titleId).toBe('title_newbie');
    });

    it('按来源筛选', () => {
      const combat = filterBySource(fullState, 'combat');
      expect(combat.length).toBeGreaterThanOrEqual(2);
    });

    it('按稀有度筛选', () => {
      const rare = filterByRarity(fullState, 'rare');
      expect(rare.length).toBe(1); // title_warrior
    });

    it('搜索称号', () => {
      const results = searchTitles('战斗');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.id === 'title_warrior')).toBe(true);
    });

    it('搜索不存在的词应返回空', () => {
      const results = searchTitles('xyznotfound');
      expect(results).toHaveLength(0);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('初始统计应正确', () => {
      const stats = getTitleStats(state);
      expect(stats.totalOwned).toBe(0);
      expect(stats.totalAvailable).toBe(Object.keys(TITLE_CONFIGS).length);
      expect(stats.completionRate).toBe(0);
      expect(stats.equippedTitle).toBeNull();
    });

    it('授予后统计应更新', () => {
      let s = grantTitle(state, 'title_newbie').state;
      s = grantTitle(s, 'title_warrior').state;
      const stats = getTitleStats(s);
      expect(stats.totalOwned).toBe(2);
      expect(stats.completionRate).toBeGreaterThan(0);
    });

    it('稀有度分布应正确', () => {
      let s = grantTitle(state, 'title_newbie').state; // common
      s = grantTitle(s, 'title_warrior').state; // rare
      const stats = getTitleStats(s);
      expect(stats.rarityBreakdown.common.owned).toBe(1);
      expect(stats.rarityBreakdown.rare.owned).toBe(1);
    });

    it('装备的称号应显示', () => {
      let s = grantTitle(state, 'title_newbie').state;
      s = equipTitle(s, 'title_newbie').state;
      const stats = getTitleStats(s);
      expect(stats.equippedTitle).toBeDefined();
      expect(stats.equippedTitle!.id).toBe('title_newbie');
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('formatBonus 固定值', () => {
      const text = formatBonus({ stat: 'attack', value: 50, isPercent: false });
      expect(text).toBe('攻击+50');
    });

    it('formatBonus 百分比', () => {
      const text = formatBonus({ stat: 'expBonus', value: 10, isPercent: true });
      expect(text).toBe('经验加成+10%');
    });

    it('formatAllBonuses 多个加成', () => {
      const texts = formatAllBonuses([
        { stat: 'attack', value: 100, isPercent: false },
        { stat: 'hp', value: 5, isPercent: true },
      ]);
      expect(texts).toHaveLength(2);
    });

    it('稀有度名称应正确', () => {
      expect(RARITY_NAMES['mythic']).toBe('神话');
    });

    it('来源名称应正确', () => {
      expect(SOURCE_NAMES['combat']).toBe('战斗');
    });

    it('稀有度排序应正确', () => {
      expect(RARITY_ORDER['common']).toBeLessThan(RARITY_ORDER['mythic']);
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportTitleData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      let s = grantTitle(state, 'title_newbie').state;
      s = equipTitle(s, 'title_newbie').state;
      const json = exportTitleData(s);
      const imported = importTitleData(json);
      expect(imported).toBeDefined();
      expect(imported!.equippedTitle).toBe('title_newbie');
      expect(imported!.ownedTitles).toHaveLength(1);
    });

    it('无效数据应返回null', () => {
      expect(importTitleData('not json')).toBeNull();
      expect(importTitleData('{}')).toBeNull();
    });
  });
});
