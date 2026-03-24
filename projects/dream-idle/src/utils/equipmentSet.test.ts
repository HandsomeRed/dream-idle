/**
 * v0.39 装备套装系统单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  EQUIPMENT_SETS,
  initializeSetSystemState,
  equipItem,
  unequipItem,
  calculateSetActivation,
  calculateSetBonuses,
  updateSetState,
  getSetInfo,
  getSetBonusDescription,
  isSetActivated,
  getActivatedSetCount,
  saveSetSystemState,
  loadSetSystemState,
  getSetName,
  getSetRarityColor,
  type SetSystemState,
  type EquippedItem
} from './equipmentSet';

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const mockLocalStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('v0.39 装备套装系统', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('套装配置', () => {
    it('应该有 5 个套装', () => {
      expect(EQUIPMENT_SETS.length).toBe(5);
    });

    it('每个套装都应该有必要的字段', () => {
      EQUIPMENT_SETS.forEach(set => {
        expect(set.id).toBeDefined();
        expect(set.name).toBeDefined();
        expect(set.description).toBeDefined();
        expect(set.pieces).toBeDefined();
        expect(set.bonuses).toBeDefined();
      });
    });

    it('每个套装都应该有 6 件装备', () => {
      EQUIPMENT_SETS.forEach(set => {
        expect(set.pieces.length).toBe(6);
      });
    });

    it('套装效果应该有 2/4/6 件梯度', () => {
      EQUIPMENT_SETS.forEach(set => {
        const pieceRequirements = set.bonuses.map(b => b.pieces);
        expect(pieceRequirements).toContain(2);
        expect(pieceRequirements).toContain(4);
        expect(pieceRequirements).toContain(6);
      });
    });
  });

  describe('状态初始化', () => {
    it('应该返回初始状态', () => {
      const state = initializeSetSystemState();

      expect(state.equippedItems).toEqual([]);
      expect(state.activatedSets).toEqual([]);
      expect(state.totalSetBonus.attack).toBe(0);
      expect(state.totalSetBonus.defense).toBe(0);
      expect(state.totalSetBonus.hp).toBe(0);
      expect(state.totalSetBonus.specialEffects).toEqual([]);
    });
  });

  describe('装备物品', () => {
    it('应该成功装备物品', () => {
      const state = initializeSetSystemState();
      const item: EquippedItem = {
        slot: 'helm',
        itemId: 'warrior-helm',
        setId: 'warrior'
      };

      const newState = equipItem(state, item);
      expect(newState.equippedItems.length).toBe(1);
      expect(newState.equippedItems[0].slot).toBe('helm');
    });

    it('同槽位装备应该被替换', () => {
      const state = initializeSetSystemState();
      const item1: EquippedItem = {
        slot: 'helm',
        itemId: 'warrior-helm',
        setId: 'warrior'
      };
      const item2: EquippedItem = {
        slot: 'helm',
        itemId: 'mage-helm',
        setId: 'mage'
      };

      const state1 = equipItem(state, item1);
      const state2 = equipItem(state1, item2);

      expect(state2.equippedItems.length).toBe(1);
      expect(state2.equippedItems[0].itemId).toBe('mage-helm');
    });
  });

  describe('卸下装备', () => {
    it('应该成功卸下装备', () => {
      const state = initializeSetSystemState();
      const item: EquippedItem = {
        slot: 'helm',
        itemId: 'warrior-helm',
        setId: 'warrior'
      };

      const state1 = equipItem(state, item);
      const state2 = unequipItem(state1, 'helm');

      expect(state2.equippedItems.length).toBe(0);
    });
  });

  describe('套装激活计算', () => {
    it('应该正确计算套装激活状态', () => {
      const state: SetSystemState = {
        equippedItems: [
          { slot: 'helm', itemId: 'warrior-helm', setId: 'warrior' },
          { slot: 'armor', itemId: 'warrior-armor', setId: 'warrior' }
        ],
        activatedSets: [],
        totalSetBonus: {
          attack: 0, defense: 0, hp: 0, speed: 0, crit: 0, critDmg: 0, specialEffects: []
        }
      };

      const activated = calculateSetActivation(state);
      expect(activated.length).toBe(1);
      expect(activated[0].setId).toBe('warrior');
      expect(activated[0].activePieces).toBe(2);
      expect(activated[0].activatedBonuses).toContain(0); // 2 件套效果激活
    });

    it('4 件套应该激活 2 件和 4 件效果', () => {
      const state: SetSystemState = {
        equippedItems: [
          { slot: 'helm', itemId: 'warrior-helm', setId: 'warrior' },
          { slot: 'armor', itemId: 'warrior-armor', setId: 'warrior' },
          { slot: 'boots', itemId: 'warrior-boots', setId: 'warrior' },
          { slot: 'weapon', itemId: 'warrior-sword', setId: 'warrior' }
        ],
        activatedSets: [],
        totalSetBonus: {
          attack: 0, defense: 0, hp: 0, speed: 0, crit: 0, critDmg: 0, specialEffects: []
        }
      };

      const activated = calculateSetActivation(state);
      expect(activated[0].activePieces).toBe(4);
      expect(activated[0].activatedBonuses).toContain(0); // 2 件套
      expect(activated[0].activatedBonuses).toContain(1); // 4 件套
    });

    it('6 件套应该激活所有效果', () => {
      const state: SetSystemState = {
        equippedItems: [
          { slot: 'helm', itemId: 'warrior-helm', setId: 'warrior' },
          { slot: 'armor', itemId: 'warrior-armor', setId: 'warrior' },
          { slot: 'boots', itemId: 'warrior-boots', setId: 'warrior' },
          { slot: 'weapon', itemId: 'warrior-sword', setId: 'warrior' },
          { slot: 'ring', itemId: 'warrior-ring', setId: 'warrior' },
          { slot: 'necklace', itemId: 'warrior-necklace', setId: 'warrior' }
        ],
        activatedSets: [],
        totalSetBonus: {
          attack: 0, defense: 0, hp: 0, speed: 0, crit: 0, critDmg: 0, specialEffects: []
        }
      };

      const activated = calculateSetActivation(state);
      expect(activated[0].activePieces).toBe(6);
      expect(activated[0].activatedBonuses.length).toBe(3); // 2/4/6 件套
    });
  });

  describe('套装属性计算', () => {
    it('应该正确计算属性加成', () => {
      const activated: SetSystemState['activatedSets'] = [
        {
          setId: 'warrior',
          activePieces: 2,
          activatedBonuses: [0] // 2 件套效果
        }
      ];

      const bonus = calculateSetBonuses(activated);
      expect(bonus.attack).toBe(10); // 战士 2 件套 +10 攻击
    });

    it('应该累加多个套装效果', () => {
      const activated: SetSystemState['activatedSets'] = [
        {
          setId: 'warrior',
          activePieces: 4,
          activatedBonuses: [0, 1] // 2 件 +4 件套效果
        }
      ];

      const bonus = calculateSetBonuses(activated);
      expect(bonus.attack).toBe(25); // 10 + 15
      expect(bonus.crit).toBe(5); // 4 件套 +5% 暴击
    });
  });

  describe('状态更新', () => {
    it('应该更新套装激活状态和属性加成', () => {
      const state: SetSystemState = {
        equippedItems: [
          { slot: 'helm', itemId: 'warrior-helm', setId: 'warrior' },
          { slot: 'armor', itemId: 'warrior-armor', setId: 'warrior' }
        ],
        activatedSets: [],
        totalSetBonus: {
          attack: 0, defense: 0, hp: 0, speed: 0, crit: 0, critDmg: 0, specialEffects: []
        }
      };

      const updated = updateSetState(state);
      expect(updated.activatedSets.length).toBe(1);
      expect(updated.activatedSets[0].setId).toBe('warrior');
      expect(updated.totalSetBonus.attack).toBe(10);
    });
  });

  describe('套装信息查询', () => {
    it('应该正确获取套装信息', () => {
      const set = getSetInfo('warrior');
      expect(set).toBeDefined();
      expect(set?.name).toBe('战士套装');
    });

    it('无效套装 ID 应该返回 undefined', () => {
      const set = getSetInfo('invalid');
      expect(set).toBeUndefined();
    });

    it('应该正确获取套装名称', () => {
      expect(getSetName('warrior')).toBe('战士套装');
      expect(getSetName('mage')).toBe('法师套装');
      expect(getSetName('invalid')).toBe('未知套装');
    });
  });

  describe('套装效果描述', () => {
    it('应该正确获取套装效果描述', () => {
      const desc = getSetBonusDescription('warrior', 2);
      expect(desc).toContain('攻击');
    });

    it('无效套装应该返回空字符串', () => {
      const desc = getSetBonusDescription('invalid', 2);
      expect(desc).toBe('');
    });
  });

  describe('激活状态检查', () => {
    it('应该正确检查套装是否激活', () => {
      const state: SetSystemState = {
        equippedItems: [
          { slot: 'helm', itemId: 'warrior-helm', setId: 'warrior' },
          { slot: 'armor', itemId: 'warrior-armor', setId: 'warrior' }
        ],
        activatedSets: [{ setId: 'warrior', activePieces: 2, activatedBonuses: [0] }],
        totalSetBonus: {
          attack: 10, defense: 0, hp: 0, speed: 0, crit: 0, critDmg: 0, specialEffects: []
        }
      };

      expect(isSetActivated(state, 'warrior')).toBe(true);
      expect(isSetActivated(state, 'mage')).toBe(false);
    });

    it('应该正确获取已激活套装数量', () => {
      const state: SetSystemState = {
        equippedItems: [
          { slot: 'helm', itemId: 'warrior-helm', setId: 'warrior' },
          { slot: 'armor', itemId: 'warrior-armor', setId: 'warrior' },
          { slot: 'helm', itemId: 'mage-helm', setId: 'mage' },
          { slot: 'robe', itemId: 'mage-robe', setId: 'mage' }
        ],
        activatedSets: [
          { setId: 'warrior', activePieces: 2, activatedBonuses: [0] },
          { setId: 'mage', activePieces: 2, activatedBonuses: [0] }
        ],
        totalSetBonus: {
          attack: 18, defense: 0, hp: 0, speed: 0, crit: 0, critDmg: 0, specialEffects: []
        }
      };

      expect(getActivatedSetCount(state)).toBe(2);
    });
  });

  describe('稀有度颜色', () => {
    it('应该正确获取套装颜色', () => {
      expect(getSetRarityColor(1)).toBe('text-gray-500');
      expect(getSetRarityColor(2)).toBe('text-blue-500');
      expect(getSetRarityColor(3)).toBe('text-blue-500');
      expect(getSetRarityColor(4)).toBe('text-purple-500');
      expect(getSetRarityColor(5)).toBe('text-purple-500');
      expect(getSetRarityColor(6)).toBe('text-orange-500');
    });
  });

  describe('状态保存和加载', () => {
    it('应该正确保存和加载状态', () => {
      const originalState: SetSystemState = {
        equippedItems: [
          { slot: 'helm', itemId: 'warrior-helm', setId: 'warrior' },
          { slot: 'armor', itemId: 'warrior-armor', setId: 'warrior' }
        ],
        activatedSets: [{ setId: 'warrior', activePieces: 2, activatedBonuses: [0] }],
        totalSetBonus: {
          attack: 10, defense: 0, hp: 0, speed: 0, crit: 0, critDmg: 0, specialEffects: ['狂战士']
        }
      };

      saveSetSystemState(originalState);
      const loadedState = loadSetSystemState();

      expect(loadedState.equippedItems.length).toBe(2);
      expect(loadedState.activatedSets.length).toBe(1);
      expect(loadedState.totalSetBonus.attack).toBe(10);
    });

    it('没有保存时应该返回初始状态', () => {
      mockLocalStorage.clear();
      const state = loadSetSystemState();

      expect(state.equippedItems).toEqual([]);
      expect(state.activatedSets).toEqual([]);
    });
  });
});
