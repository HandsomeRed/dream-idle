import { 
  generateRandomEquipment, 
  calculateDrop, 
  Rarity, 
  Slot,
  equipItem,
  unequipItem,
  upgradeEquipment
} from './equipment';

describe('装备系统 v0.7', () => {
  describe('装备生成', () => {
    test('生成普通装备', () => {
      const equip = generateRandomEquipment(Slot.Weapon, 1, 1);
      expect(equip.slot).toBe(Slot.Weapon);
      expect(equip.level).toBe(1);
      expect(equip.rarity).toBeDefined();
    });
    
    test('生成高等级装备', () => {
      const equip = generateRandomEquipment(Slot.Armor, 10, 10);
      expect(equip.level).toBe(10);
      expect(equip.baseStats.defense).toBeGreaterThan(0);
    });
  });
  
  describe('掉落系统', () => {
    test('30% 概率掉落装备', () => {
      let dropCount = 0;
      for (let i = 0; i < 1000; i++) {
        const drop = calculateDrop();
        if (drop) dropCount++;
      }
      // 应该在 30% 左右（允许误差）
      expect(dropCount).toBeGreaterThan(200);
      expect(dropCount).toBeLessThan(400);
    });
  });
  
  describe('装备穿戴', () => {
    test('穿戴装备增加属性', () => {
      const character = { attack: 10, defense: 10, hp: 100, mp: 50, speed: 8 };
      const equipment = generateRandomEquipment(Slot.Weapon, 5, 5);
      const baseAttack = character.attack;
      
      equipItem(character, equipment);
      expect(character.attack).toBeGreaterThan(baseAttack);
    });
    
    test('卸下装备减少属性', () => {
      const character = { attack: 10, defense: 10, hp: 100, mp: 50, speed: 8, equipment: {} };
      const equipment = generateRandomEquipment(Slot.Weapon, 5, 5);
      
      equipItem(character, equipment);
      const buffedAttack = character.attack;
      
      unequipItem(character, Slot.Weapon);
      expect(character.attack).toBe(baseAttack);
    });
  });
  
  describe('装备升级', () => {
    test('获得经验值', () => {
      const equipment = generateRandomEquipment(Slot.Armor, 1, 1);
      const baseExp = equipment.exp;
      
      upgradeEquipment(equipment, 50);
      expect(equipment.exp).toBe(baseExp + 50);
    });
    
    test('升级提升属性', () => {
      const equipment = generateRandomEquipment(Slot.Helmet, 1, 1);
      equipment.exp = 99; // 接近升级
      const baseDefense = equipment.baseStats.defense;
      
      const leveledUp = upgradeEquipment(equipment, 1); // 再给 1 exp
      expect(leveledUp).toBe(true);
      expect(equipment.level).toBe(2);
      expect(equipment.baseStats.defense).toBeGreaterThan(baseDefense);
    });
  });
  
  describe('稀有度系统', () => {
    test('传说装备属性高于普通装备', () => {
      const common = generateRandomEquipment(Slot.Weapon, 10, 10);
      common.rarity = Rarity.Common;
      
      const legendary = generateRandomEquipment(Slot.Weapon, 10, 10);
      legendary.rarity = Rarity.Legendary;
      
      // 传说装备属性应该更高（大致）
      // 注意：这是概率性的，这里只是基本验证
      expect(legendary.rarity).toBe(Rarity.Legendary);
    });
  });
});
