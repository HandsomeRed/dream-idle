/**
 * v0.83 变身卡系统测试
 */

import {
  createTransformationDeck,
  getRandomCardByRarity,
  getRandomCardDrop,
  obtainCard,
  transform,
  cancelTransformation,
  checkTransformationExpired,
  getTransformationRemainingTime,
  getTransformationBuffs,
  useCard,
  getOwnedCards,
  filterCardsByRarity,
  getCollectionProgress,
  CARD_DATABASE,
  TRANSFORMATION_CONFIG,
  TransformationCard,
  ActiveTransformation,
} from './transformationSystem';

describe('v0.83 变身卡系统', () => {
  describe('初始卡组创建', () => {
    it('应该创建完整的变身卡卡组', () => {
      const deck = createTransformationDeck();
      
      expect(deck.length).toBeGreaterThan(0);
      expect(deck.length).toBe(CARD_DATABASE.length);
    });

    it('应该包含所有稀有度的卡片', () => {
      const deck = createTransformationDeck();
      
      const rarities = new Set(deck.map(c => c.rarity));
      expect(rarities.has('common')).toBe(true);
      expect(rarities.has('uncommon')).toBe(true);
      expect(rarities.has('rare')).toBe(true);
      expect(rarities.has('epic')).toBe(true);
      expect(rarities.has('legendary')).toBe(true);
    });

    it('初始卡片应该未获得', () => {
      const deck = createTransformationDeck();
      
      deck.forEach(card => {
        expect(card.obtained).toBe(false);
        expect(card.quantity).toBe(0);
      });
    });
  });

  describe('卡片掉落', () => {
    it('应该根据稀有度获取卡片', () => {
      const commonCard = getRandomCardByRarity('common');
      expect(commonCard).toBeTruthy();
      expect(commonCard!.rarity).toBe('common');
      
      const legendaryCard = getRandomCardByRarity('legendary');
      expect(legendaryCard).toBeTruthy();
      expect(legendaryCard!.rarity).toBe('legendary');
    });

    it('应该根据掉落率随机掉落', () => {
      const drops: Record<string, number> = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
      
      // 模拟 1000 次掉落
      for (let i = 0; i < 1000; i++) {
        const card = getRandomCardDrop();
        if (card) {
          drops[card.rarity]++;
        }
      }
      
      // 验证掉落分布大致符合配置
      expect(drops.common).toBeGreaterThan(drops.uncommon);
      expect(drops.uncommon).toBeGreaterThan(drops.rare);
      expect(drops.rare).toBeGreaterThan(drops.epic);
      expect(drops.epic).toBeGreaterThan(drops.legendary);
    });

    it('普通卡掉落率应该约 50%', () => {
      let commonCount = 0;
      const trials = 1000;
      
      for (let i = 0; i < trials; i++) {
        const card = getRandomCardDrop();
        if (card?.rarity === 'common') {
          commonCount++;
        }
      }
      
      const rate = commonCount / trials;
      expect(rate).toBeGreaterThan(0.40);
      expect(rate).toBeLessThan(0.60);
    });
  });

  describe('获得卡片', () => {
    it('应该首次获得卡片', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      
      const result = obtainCard(deck, cardId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('首次获得');
      expect(deck.find(c => c.id === cardId)?.obtained).toBe(true);
      expect(deck.find(c => c.id === cardId)?.quantity).toBe(1);
    });

    it('应该累加已有卡片数量', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      
      obtainCard(deck, cardId);
      const result = obtainCard(deck, cardId);
      
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(2);
      expect(deck.find(c => c.id === cardId)?.quantity).toBe(2);
    });

    it('应该失败当卡片不存在', () => {
      const deck = createTransformationDeck();
      
      const result = obtainCard(deck, 'invalid_id');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });
  });

  describe('变身', () => {
    it('应该成功变身', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      obtainCard(deck, cardId);
      
      const result = transform(deck, cardId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('变身为');
      expect(result.transformation).toBeTruthy();
      expect(result.transformation?.isActive).toBe(true);
    });

    it('应该失败当未拥有卡片', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      
      const result = transform(deck, cardId);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未拥有');
    });

    it('应该设置正确的变身时间', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      obtainCard(deck, cardId);
      
      const now = Date.now();
      const result = transform(deck, cardId, now);
      
      expect(result.transformation?.startTime).toBe(now);
      expect(result.transformation?.endTime).toBe(now + (180 * 1000)); // card_001 duration is 180s
    });

    it('应该包含变身效果', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_021'; // 天兵变身卡
      obtainCard(deck, cardId);
      
      const result = transform(deck, cardId);
      
      expect(result.transformation?.effects.length).toBeGreaterThan(0);
      expect(result.transformation?.effects[0].name).toContain('力量');
    });
  });

  describe('取消变身', () => {
    it('应该成功取消变身', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      obtainCard(deck, cardId);
      
      const transformResult = transform(deck, cardId);
      const transformation = transformResult.transformation!;
      
      const result = cancelTransformation(transformation);
      
      expect(result.success).toBe(true);
      expect(transformation.isActive).toBe(false);
    });

    it('应该失败当未变身', () => {
      const result = cancelTransformation(null);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未变身');
    });

    it('应该失败当变身已过期', () => {
      const transformation: ActiveTransformation = {
        cardId: 'card_001',
        name: '强盗变身卡',
        monsterType: '强盗',
        startTime: Date.now() - 1000000,
        endTime: Date.now() - 1000,
        effects: [],
        isActive: false,
      };
      
      const result = cancelTransformation(transformation);
      
      expect(result.success).toBe(false);
    });
  });

  describe('变身过期检查', () => {
    it('应该检测到过期变身', () => {
      const transformation: ActiveTransformation = {
        cardId: 'card_001',
        name: '强盗变身卡',
        monsterType: '强盗',
        startTime: Date.now() - 1000000,
        endTime: Date.now() - 1000,
        effects: [],
        isActive: true,
      };
      
      const expired = checkTransformationExpired(transformation);
      
      expect(expired).toBe(true);
      expect(transformation.isActive).toBe(false);
    });

    it('应该检测到有效变身', () => {
      const transformation: ActiveTransformation = {
        cardId: 'card_001',
        name: '强盗变身卡',
        monsterType: '强盗',
        startTime: Date.now(),
        endTime: Date.now() + (180 * 1000),
        effects: [],
        isActive: true,
      };
      
      const expired = checkTransformationExpired(transformation);
      
      expect(expired).toBe(false);
      expect(transformation.isActive).toBe(true);
    });

    it('应该处理 null 变身', () => {
      expect(checkTransformationExpired(null)).toBe(true);
    });
  });

  describe('变身剩余时间', () => {
    it('应该计算正确的剩余时间', () => {
      const transformation: ActiveTransformation = {
        cardId: 'card_001',
        name: '强盗变身卡',
        monsterType: '强盗',
        startTime: Date.now(),
        endTime: Date.now() + (120 * 1000), // 2 分钟
        effects: [],
        isActive: true,
      };
      
      const remaining = getTransformationRemainingTime(transformation);
      
      expect(remaining).toBeGreaterThanOrEqual(119);
      expect(remaining).toBeLessThanOrEqual(120);
    });

    it('应该返回 0 当变身过期', () => {
      const transformation: ActiveTransformation = {
        cardId: 'card_001',
        name: '强盗变身卡',
        monsterType: '强盗',
        startTime: Date.now() - 1000000,
        endTime: Date.now() - 1000,
        effects: [],
        isActive: false,
      };
      
      const remaining = getTransformationRemainingTime(transformation);
      
      expect(remaining).toBe(0);
    });

    it('应该返回 0 当未变身', () => {
      expect(getTransformationRemainingTime(null)).toBe(0);
    });
  });

  describe('变身效果加成', () => {
    it('应该解析属性加成', () => {
      const transformation: ActiveTransformation = {
        cardId: 'card_001',
        name: '强盗变身卡',
        monsterType: '强盗',
        startTime: Date.now(),
        endTime: Date.now() + 100000,
        effects: [
          { type: 'stat_boost', name: '力量 +5', description: '力量 +5', value: 5 },
          { type: 'stat_boost', name: '敏捷 +3', description: '敏捷 +3', value: 3 },
        ],
        isActive: true,
      };
      
      const buffs = getTransformationBuffs(transformation);
      
      expect(buffs.statBoosts['力量']).toBe(5);
      expect(buffs.statBoosts['敏捷']).toBe(3);
    });

    it('应该分类技能效果', () => {
      const transformation: ActiveTransformation = {
        cardId: 'card_022',
        name: '小龙女变身卡',
        monsterType: '小龙女',
        startTime: Date.now(),
        endTime: Date.now() + 100000,
        effects: [
          { type: 'skill', name: '龙卷雨击', description: '群体法术攻击' },
          { type: 'passive', name: '感知', description: '可检测隐身单位' },
        ],
        isActive: true,
      };
      
      const buffs = getTransformationBuffs(transformation);
      
      expect(buffs.skills.length).toBe(1);
      expect(buffs.skills[0].name).toBe('龙卷雨击');
      expect(buffs.passives.length).toBe(1);
    });

    it('应该返回空效果当未变身', () => {
      const buffs = getTransformationBuffs(null);
      
      expect(buffs.statBoosts).toEqual({});
      expect(buffs.skills).toEqual([]);
      expect(buffs.passives).toEqual([]);
      expect(buffs.specials).toEqual([]);
    });
  });

  describe('使用卡片 (消耗)', () => {
    it('应该消耗一张卡片并变身', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      obtainCard(deck, cardId);
      obtainCard(deck, cardId); // 获得第 2 张
      
      expect(deck.find(c => c.id === cardId)?.quantity).toBe(2);
      
      const result = useCard(deck, cardId);
      
      expect(result.success).toBe(true);
      expect(deck.find(c => c.id === cardId)?.quantity).toBe(1);
      expect(result.transformation).toBeTruthy();
    });

    it('应该用完卡片后标记为未获得', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      obtainCard(deck, cardId);
      
      useCard(deck, cardId);
      
      const card = deck.find(c => c.id === cardId);
      expect(card?.quantity).toBe(0);
      expect(card?.obtained).toBe(false);
    });

    it('应该失败当卡片不足', () => {
      const deck = createTransformationDeck();
      const cardId = 'card_001';
      
      const result = useCard(deck, cardId);
      
      expect(result.success).toBe(false);
    });
  });

  describe('已拥有卡片列表', () => {
    it('应该返回已拥有的卡片', () => {
      const deck = createTransformationDeck();
      
      obtainCard(deck, 'card_001');
      obtainCard(deck, 'card_002');
      obtainCard(deck, 'card_003');
      
      const owned = getOwnedCards(deck);
      
      expect(owned.length).toBe(3);
      expect(owned.map(c => c.id)).toEqual(expect.arrayContaining(['card_001', 'card_002', 'card_003']));
    });

    it('应该只返回数量大于 0 的卡片', () => {
      const deck = createTransformationDeck();
      
      obtainCard(deck, 'card_001');
      useCard(deck, 'card_001'); // 用完
      
      const owned = getOwnedCards(deck);
      
      expect(owned.length).toBe(0);
    });
  });

  describe('按稀有度筛选', () => {
    it('应该筛选指定稀有度的卡片', () => {
      const deck = createTransformationDeck();
      
      const commons = filterCardsByRarity(deck, 'common');
      const legendaries = filterCardsByRarity(deck, 'legendary');
      
      expect(commons.length).toBeGreaterThan(legendaries.length);
      expect(commons.every(c => c.rarity === 'common')).toBe(true);
      expect(legendaries.every(c => c.rarity === 'legendary')).toBe(true);
    });
  });

  describe('收集进度', () => {
    it('应该计算正确的收集进度', () => {
      const deck = createTransformationDeck();
      
      // 获得一半卡片
      const half = Math.floor(deck.length / 2);
      for (let i = 0; i < half; i++) {
        obtainCard(deck, deck[i].id);
      }
      
      const progress = getCollectionProgress(deck);
      
      expect(progress.total).toBe(deck.length);
      expect(progress.owned).toBe(half);
      expect(progress.percentage).toBeGreaterThanOrEqual(45);
      expect(progress.percentage).toBeLessThanOrEqual(55);
    });

    it('应该按稀有度统计', () => {
      const deck = createTransformationDeck();
      
      // 获得所有普通卡
      filterCardsByRarity(deck, 'common').forEach(c => obtainCard(deck, c.id));
      
      const progress = getCollectionProgress(deck);
      
      expect(progress.byRarity['common'].owned).toBe(progress.byRarity['common'].total);
      expect(progress.byRarity['legendary'].owned).toBe(0);
    });

    it('应该处理 0% 和 100% 进度', () => {
      const deck = createTransformationDeck();
      
      // 0%
      const progress0 = getCollectionProgress(deck);
      expect(progress0.percentage).toBe(0);
      expect(progress0.owned).toBe(0);
      
      // 100%
      deck.forEach(c => obtainCard(deck, c.id));
      const progress100 = getCollectionProgress(deck);
      expect(progress100.percentage).toBe(100);
      expect(progress100.owned).toBe(progress100.total);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的变身卡使用流程', () => {
      const deck = createTransformationDeck();
      
      // 1. 获得卡片
      const dropCard = getRandomCardDrop();
      expect(dropCard).toBeTruthy();
      obtainCard(deck, dropCard!.id);
      
      // 2. 变身
      const transformResult = transform(deck, dropCard!.id);
      expect(transformResult.success).toBe(true);
      const transformation = transformResult.transformation!;
      
      // 3. 检查变身效果
      const buffs = getTransformationBuffs(transformation);
      expect(buffs).toBeTruthy();
      
      // 4. 检查剩余时间
      const remaining = getTransformationRemainingTime(transformation);
      expect(remaining).toBeGreaterThan(0);
      
      // 5. 等待过期 (模拟)
      transformation.endTime = Date.now() - 1000;
      const expired = checkTransformationExpired(transformation);
      expect(expired).toBe(true);
      expect(transformation.isActive).toBe(false);
      
      // 6. 收集进度
      const progress = getCollectionProgress(deck);
      expect(progress.owned).toBeGreaterThanOrEqual(1);
    });
  });

  describe('卡片数据库验证', () => {
    it('应该包含孙悟空变身卡', () => {
      const deck = createTransformationDeck();
      const wukong = deck.find(c => c.name === '孙悟空变身卡');
      
      expect(wukong).toBeTruthy();
      expect(wukong?.rarity).toBe('epic');
      expect(wukong?.effects.length).toBeGreaterThanOrEqual(3);
    });

    it('应该包含传说卡片', () => {
      const deck = createTransformationDeck();
      const legendaries = filterCardsByRarity(deck, 'legendary');
      
      expect(legendaries.length).toBeGreaterThan(0);
      legendaries.forEach(card => {
        expect(card.effects.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('应该配置正确的掉落率', () => {
      const rates = TRANSFORMATION_CONFIG.dropRates;
      
      expect(rates.common).toBe(0.50);
      expect(rates.uncommon).toBe(0.30);
      expect(rates.rare).toBe(0.15);
      expect(rates.epic).toBe(0.04);
      expect(rates.legendary).toBe(0.01);
      
      // 验证总和为 1
      const total = Object.values(rates).reduce((sum, rate) => sum + rate, 0);
      expect(total).toBe(1);
    });
  });
});
