/**
 * v0.36 宠物进化系统单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  PET_QUALITY_ORDER,
  getQualityIndex,
  getNextQuality,
  getEvolutionInfo,
  canEvolve,
  evolvePet,
  calculateEvolvedStats,
  getSuccessRateText,
  getQualityName,
  getQualityColor,
  getQualityBgColor,
  initializePetEvolutionState,
  updateEvolutionState,
  getEvolutionSuccessRate,
  savePetEvolutionState,
  loadPetEvolutionState,
  type PetEvolutionState
} from './petEvolution';
import { Pet, PetQuality } from './pets';

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

describe('v0.36 宠物进化系统', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('品质等级配置', () => {
    it('应该有 4 个品质等级', () => {
      expect(PET_QUALITY_ORDER.length).toBe(4);
    });

    it('品质顺序应该正确', () => {
      expect(PET_QUALITY_ORDER[0]).toBe('common');
      expect(PET_QUALITY_ORDER[1]).toBe('rare');
      expect(PET_QUALITY_ORDER[2]).toBe('epic');
      expect(PET_QUALITY_ORDER[3]).toBe('legendary');
    });

    it('应该正确获取品质索引', () => {
      expect(getQualityIndex('common')).toBe(0);
      expect(getQualityIndex('rare')).toBe(1);
      expect(getQualityIndex('epic')).toBe(2);
      expect(getQualityIndex('legendary')).toBe(3);
    });

    it('应该正确获取下一个品质', () => {
      expect(getNextQuality('common')).toBe('rare');
      expect(getNextQuality('rare')).toBe('epic');
      expect(getNextQuality('epic')).toBe('legendary');
      expect(getNextQuality('legendary')).toBeNull();
    });
  });

  describe('进化配置', () => {
    const createTestPet = (quality: PetQuality, level: number): Pet => ({
      id: 'pet-1',
      name: '测试宠物',
      quality,
      level,
      element: 'fire',
      baseAttack: 100,
      baseDefense: 80,
      baseHealth: 500,
      exp: 0,
      maxExp: 100,
      stars: 1,
      skills: [],
      currentAttack: 100,
      currentDefense: 80,
      currentHealth: 500,
      assistRate: 0,
      assistDamage: 0,
      obtainedAt: Date.now(),
      isLocked: false
    });

    it('应该正确获取进化信息', () => {
      const pet = createTestPet('common', 20);
      const info = getEvolutionInfo(pet);

      expect(info).not.toBeNull();
      expect(info?.currentQuality).toBe('common');
      expect(info?.nextQuality).toBe('rare');
      expect(info?.requiredLevel).toBe(20);
      expect(info?.successRate).toBe(100);
      expect(info?.statGrowth).toBe(1.2);
    });

    it('传说品质无法进化', () => {
      const pet = createTestPet('legendary', 100);
      const info = getEvolutionInfo(pet);

      expect(info).toBeNull();
    });

    it('应该正确获取进化材料', () => {
      const pet = createTestPet('rare', 40);
      const info = getEvolutionInfo(pet);

      expect(info?.requiredMaterials.length).toBe(3);
      expect(info?.requiredMaterials.some(m => m.type === 'essence')).toBe(true);
      expect(info?.requiredMaterials.some(m => m.type === 'stone')).toBe(true);
      expect(info?.requiredMaterials.some(m => m.type === 'fragment')).toBe(true);
    });

    it('进化成功率应该递减', () => {
      const commonPet = createTestPet('common', 20);
      const rarePet = createTestPet('rare', 40);
      const epicPet = createTestPet('epic', 60);

      const commonInfo = getEvolutionInfo(commonPet);
      const rareInfo = getEvolutionInfo(rarePet);
      const epicInfo = getEvolutionInfo(epicPet);

      expect(commonInfo?.successRate).toBe(100);
      expect(rareInfo?.successRate).toBe(80);
      expect(epicInfo?.successRate).toBe(60);
    });

    it('属性成长应该递增', () => {
      const commonInfo = getEvolutionInfo(createTestPet('common', 20));
      const rareInfo = getEvolutionInfo(createTestPet('rare', 40));
      const epicInfo = getEvolutionInfo(createTestPet('epic', 60));

      expect(commonInfo?.statGrowth).toBe(1.2);
      expect(rareInfo?.statGrowth).toBe(1.3);
      expect(epicInfo?.statGrowth).toBe(1.5);
    });
  });

  describe('进化条件检查', () => {
    const createTestPet = (quality: PetQuality, level: number): Pet => ({
      id: 'pet-1',
      name: '测试宠物',
      quality,
      level,
      element: 'fire',
      baseAttack: 100,
      baseDefense: 80,
      baseHealth: 500,
      exp: 0,
      maxExp: 100,
      stars: 1,
      skills: [],
      currentAttack: 100,
      currentDefense: 80,
      currentHealth: 500,
      assistRate: 0,
      assistDamage: 0,
      obtainedAt: Date.now(),
      isLocked: false
    });

    it('等级不足时无法进化', () => {
      const pet = createTestPet('common', 10); // 需要 20 级
      const result = canEvolve(pet, {});

      expect(result.canEvolve).toBe(false);
      expect(result.reason).toContain('等级不足');
    });

    it('材料不足时无法进化', () => {
      const pet = createTestPet('common', 20);
      const result = canEvolve(pet, {});

      expect(result.canEvolve).toBe(false);
      expect(result.reason).toContain('材料不足');
    });

    it('条件满足时可以进化', () => {
      const pet = createTestPet('common', 20);
      const materials = {
        'essence-common': 10,
        'stone-evolution': 5
      };
      const result = canEvolve(pet, materials);

      expect(result.canEvolve).toBe(true);
      expect(result.evolutionInfo).toBeDefined();
    });

    it('已达到最高品质无法进化', () => {
      const pet = createTestPet('legendary', 100);
      const result = canEvolve(pet, {});

      expect(result.canEvolve).toBe(false);
      expect(result.reason).toContain('最高品质');
    });
  });

  describe('执行进化', () => {
    const createTestPet = (quality: PetQuality, level: number): Pet => ({
      id: 'pet-1',
      name: '测试宠物',
      quality,
      level,
      element: 'fire',
      baseAttack: 100,
      baseDefense: 80,
      baseHealth: 500,
      exp: 0,
      maxExp: 100,
      stars: 1,
      skills: [],
      currentAttack: 100,
      currentDefense: 80,
      currentHealth: 500,
      assistRate: 0,
      assistDamage: 0,
      obtainedAt: Date.now(),
      isLocked: false
    });

    it('条件不满足时进化失败', () => {
      const pet = createTestPet('common', 10);
      const result = evolvePet(pet, {});

      expect(result.success).toBe(false);
    });

    it('100% 成功率应该总是成功', () => {
      const pet = createTestPet('common', 20);
      const materials = {
        'essence-common': 10,
        'stone-evolution': 5
      };

      // 多次测试确保 100% 成功率
      for (let i = 0; i < 10; i++) {
        const result = evolvePet(pet, materials);
        expect(result.success).toBe(true);
        expect(result.evolvedPet?.quality).toBe('rare');
      }
    });

    it('进化后品质应该提升', () => {
      const pet = createTestPet('common', 20);
      const materials = {
        'essence-common': 10,
        'stone-evolution': 5
      };

      const result = evolvePet(pet, materials);
      expect(result.success).toBe(true);
      expect(result.evolvedPet?.quality).toBe('rare');
    });

    it('进化后属性应该成长', () => {
      const pet = createTestPet('common', 20);
      const materials = {
        'essence-common': 10,
        'stone-evolution': 5
      };

      const result = evolvePet(pet, materials);
      expect(result.success).toBe(true);
      expect(result.evolvedPet?.baseAttack).toBeGreaterThan(pet.baseAttack);
      expect(result.evolvedPet?.baseDefense).toBeGreaterThan(pet.baseDefense);
      expect(result.evolvedPet?.baseHealth).toBeGreaterThan(pet.baseHealth);
    });

    it('应该消耗材料', () => {
      const pet = createTestPet('common', 20);
      const materials = {
        'essence-common': 10,
        'stone-evolution': 5
      };

      const result = evolvePet(pet, materials);
      expect(result.success).toBe(true);
      expect(result.consumedMaterials).toBeDefined();
      expect(result.consumedMaterials!['essence-common']).toBe(10);
      expect(result.consumedMaterials!['stone-evolution']).toBe(5);
    });
  });

  describe('进化后属性计算', () => {
    it('应该正确计算进化后属性', () => {
      const stats = { attack: 100, defense: 80, hp: 500 };
      const growthMultiplier = 1.2;
      const level = 1;

      const result = calculateEvolvedStats(stats, growthMultiplier, level);

      expect(result.attack).toBeGreaterThan(100);
      expect(result.defense).toBeGreaterThan(80);
      expect(result.hp).toBeGreaterThan(500);
    });

    it('等级越高属性越高', () => {
      const stats = { attack: 100, defense: 80, hp: 500 };
      const growthMultiplier = 1.2;

      const level1 = calculateEvolvedStats(stats, growthMultiplier, 1);
      const level50 = calculateEvolvedStats(stats, growthMultiplier, 50);

      expect(level50.attack).toBeGreaterThan(level1.attack);
      expect(level50.defense).toBeGreaterThan(level1.defense);
      expect(level50.hp).toBeGreaterThan(level1.hp);
    });
  });

  describe('成功率文本', () => {
    it('应该正确获取成功率文本', () => {
      expect(getSuccessRateText(95)).toContain('极高');
      expect(getSuccessRateText(80)).toContain('高');
      expect(getSuccessRateText(50)).toContain('中等');
      expect(getSuccessRateText(25)).toContain('低');
      expect(getSuccessRateText(10)).toContain('极低');
    });
  });

  describe('品质名称和颜色', () => {
    it('应该正确获取品质名称', () => {
      expect(getQualityName('common')).toBe('普通');
      expect(getQualityName('rare')).toBe('稀有');
      expect(getQualityName('epic')).toBe('史诗');
      expect(getQualityName('legendary')).toBe('传说');
    });

    it('应该正确获取品质颜色', () => {
      expect(getQualityColor('common')).toBe('text-gray-500');
      expect(getQualityColor('rare')).toBe('text-green-500');
      expect(getQualityColor('epic')).toBe('text-purple-500');
      expect(getQualityColor('legendary')).toBe('text-orange-500');
    });

    it('应该正确获取品质背景色', () => {
      expect(getQualityBgColor('common')).toBe('bg-gray-100');
      expect(getQualityBgColor('rare')).toBe('bg-green-100');
      expect(getQualityBgColor('epic')).toBe('bg-purple-100');
      expect(getQualityBgColor('legendary')).toBe('bg-orange-100');
    });
  });

  describe('进化状态管理', () => {
    it('应该正确初始化状态', () => {
      const state = initializePetEvolutionState();

      expect(state.evolutionCount).toBe(0);
      expect(state.successCount).toBe(0);
      expect(state.failedCount).toBe(0);
      expect(state.maxEvolutionStage).toBe(0);
    });

    it('应该正确更新状态（成功）', () => {
      const state = initializePetEvolutionState();
      const updated = updateEvolutionState(state, true, 2);

      expect(updated.evolutionCount).toBe(1);
      expect(updated.successCount).toBe(1);
      expect(updated.failedCount).toBe(0);
      expect(updated.maxEvolutionStage).toBe(2);
    });

    it('应该正确更新状态（失败）', () => {
      const state = initializePetEvolutionState();
      const updated = updateEvolutionState(state, false, 1);

      expect(updated.evolutionCount).toBe(1);
      expect(updated.successCount).toBe(0);
      expect(updated.failedCount).toBe(1);
      expect(updated.maxEvolutionStage).toBe(1);
    });

    it('应该正确计算成功率', () => {
      const state: PetEvolutionState = {
        evolutionCount: 10,
        successCount: 7,
        failedCount: 3,
        maxEvolutionStage: 3
      };

      expect(getEvolutionSuccessRate(state)).toBe(70);
    });

    it('0 次进化时成功率应该为 0', () => {
      const state = initializePetEvolutionState();
      expect(getEvolutionSuccessRate(state)).toBe(0);
    });
  });

  describe('状态保存和加载', () => {
    it('应该正确保存和加载状态', () => {
      const originalState: PetEvolutionState = {
        evolutionCount: 15,
        successCount: 10,
        failedCount: 5,
        maxEvolutionStage: 3
      };

      savePetEvolutionState(originalState);
      const loadedState = loadPetEvolutionState();

      expect(loadedState.evolutionCount).toBe(15);
      expect(loadedState.successCount).toBe(10);
      expect(loadedState.failedCount).toBe(5);
      expect(loadedState.maxEvolutionStage).toBe(3);
    });

    it('没有保存时应该返回初始状态', () => {
      mockLocalStorage.clear();
      const state = loadPetEvolutionState();

      expect(state.evolutionCount).toBe(0);
      expect(state.successCount).toBe(0);
    });
  });
});
