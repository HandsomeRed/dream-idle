/**
 * v0.39 装备套装系统
 * 
 * 功能：
 * - 装备套装识别
 * - 套装效果激活
 * - 多件套效果（2/4/6 件）
 * - 套装效果叠加
 * - 套装属性加成
 */

export interface EquipmentSet {
  id: string;
  name: string;
  description: string;
  pieces: string[]; // 装备 ID 列表
  bonuses: {
    pieces: number; // 需要几件激活
    effects: SetBonus[];
  }[];
}

export interface SetBonus {
  type: 'stat' | 'special' | 'skill' | 'resistance';
  stat?: {
    name: 'attack' | 'defense' | 'hp' | 'speed' | 'crit' | 'critDmg';
    value: number;
    isPercent: boolean;
  };
  special?: {
    name: string;
    description: string;
    trigger?: string;
    effect: string;
  };
}

export interface EquippedItem {
  slot: string;
  itemId: string;
  setId?: string; // 所属套装 ID
}

export interface SetActivationState {
  setId: string;
  activePieces: number;
  activatedBonuses: number[]; // 已激活的套装效果索引
}

export interface SetSystemState {
  equippedItems: EquippedItem[];
  activatedSets: SetActivationState[];
  totalSetBonus: {
    attack: number;
    defense: number;
    hp: number;
    speed: number;
    crit: number;
    critDmg: number;
    specialEffects: string[];
  };
}

/**
 * 套装配置
 */
export const EQUIPMENT_SETS: EquipmentSet[] = [
  {
    id: 'warrior',
    name: '战士套装',
    description: '为勇猛的战士设计，提升攻击和暴击',
    pieces: ['warrior-helm', 'warrior-armor', 'warrior-boots', 'warrior-sword', 'warrior-ring', 'warrior-necklace'],
    bonuses: [
      {
        pieces: 2,
        effects: [{ type: 'stat', stat: { name: 'attack', value: 10, isPercent: false } }]
      },
      {
        pieces: 4,
        effects: [
          { type: 'stat', stat: { name: 'attack', value: 15, isPercent: false } },
          { type: 'stat', stat: { name: 'crit', value: 5, isPercent: true } }
        ]
      },
      {
        pieces: 6,
        effects: [
          { type: 'stat', stat: { name: 'attack', value: 20, isPercent: false } },
          { type: 'stat', stat: { name: 'crit', value: 10, isPercent: true } },
          { type: 'stat', stat: { name: 'critDmg', value: 20, isPercent: true } },
          {
            type: 'special',
            special: {
              name: '狂战士',
              description: '生命值低于 30% 时，攻击力提升 50%',
              trigger: 'hp_below_30',
              effect: 'attack +50%'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'mage',
    name: '法师套装',
    description: '为智慧的法师设计，提升魔法和技能效果',
    pieces: ['mage-helm', 'mage-robe', 'mage-boots', 'mage-staff', 'mage-ring', 'mage-amulet'],
    bonuses: [
      {
        pieces: 2,
        effects: [{ type: 'stat', stat: { name: 'attack', value: 8, isPercent: false } }]
      },
      {
        pieces: 4,
        effects: [
          { type: 'stat', stat: { name: 'attack', value: 12, isPercent: false } },
          { type: 'stat', stat: { name: 'speed', value: 5, isPercent: true } }
        ]
      },
      {
        pieces: 6,
        effects: [
          { type: 'stat', stat: { name: 'attack', value: 18, isPercent: false } },
          { type: 'stat', stat: { name: 'speed', value: 10, isPercent: true } },
          {
            type: 'special',
            special: {
              name: '奥术 mastery',
              description: '技能伤害提升 25%',
              effect: 'skill_dmg +25%'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'tank',
    name: '坦克套装',
    description: '为坚韧的坦克设计，提升防御和生命',
    pieces: ['tank-helm', 'tank-plate', 'tank-boots', 'tank-shield', 'tank-ring', 'tank-cloak'],
    bonuses: [
      {
        pieces: 2,
        effects: [{ type: 'stat', stat: { name: 'defense', value: 15, isPercent: false } }]
      },
      {
        pieces: 4,
        effects: [
          { type: 'stat', stat: { name: 'defense', value: 25, isPercent: false } },
          { type: 'stat', stat: { name: 'hp', value: 10, isPercent: true } }
        ]
      },
      {
        pieces: 6,
        effects: [
          { type: 'stat', stat: { name: 'defense', value: 40, isPercent: false } },
          { type: 'stat', stat: { name: 'hp', value: 20, isPercent: true } },
          {
            type: 'special',
            special: {
              name: '铁壁',
              description: '受到暴击概率降低 30%',
              effect: 'crit_resist +30%'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'assassin',
    name: '刺客套装',
    description: '为敏捷的刺客设计，提升速度和暴击伤害',
    pieces: ['assassin-mask', 'assassin-suit', 'assassin-boots', 'assassin-dagger', 'assassin-ring', 'assassin-belt'],
    bonuses: [
      {
        pieces: 2,
        effects: [{ type: 'stat', stat: { name: 'speed', value: 5, isPercent: true } }]
      },
      {
        pieces: 4,
        effects: [
          { type: 'stat', stat: { name: 'speed', value: 10, isPercent: true } },
          { type: 'stat', stat: { name: 'crit', value: 8, isPercent: true } }
        ]
      },
      {
        pieces: 6,
        effects: [
          { type: 'stat', stat: { name: 'speed', value: 15, isPercent: true } },
          { type: 'stat', stat: { name: 'crit', value: 15, isPercent: true } },
          { type: 'stat', stat: { name: 'critDmg', value: 30, isPercent: true } },
          {
            type: 'special',
            special: {
              name: '暗杀',
              description: '首次攻击必定暴击',
              trigger: 'first_strike',
              effect: 'guaranteed_crit'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'support',
    name: '辅助套装',
    description: '为无私的辅助设计，提升生存和能力效果',
    pieces: ['support-helm', 'support-robe', 'support-boots', 'support-staff', 'support-ring', 'support-tome'],
    bonuses: [
      {
        pieces: 2,
        effects: [{ type: 'stat', stat: { name: 'hp', value: 8, isPercent: true } }]
      },
      {
        pieces: 4,
        effects: [
          { type: 'stat', stat: { name: 'hp', value: 15, isPercent: true } },
          { type: 'stat', stat: { name: 'defense', value: 10, isPercent: true } }
        ]
      },
      {
        pieces: 6,
        effects: [
          { type: 'stat', stat: { name: 'hp', value: 25, isPercent: true } },
          { type: 'stat', stat: { name: 'defense', value: 20, isPercent: true } },
          {
            type: 'special',
            special: {
              name: '祝福',
              description: '队友获得 10% 属性加成',
              effect: 'team_buff +10%'
            }
          }
        ]
      }
    ]
  }
];

/**
 * 初始化套装系统状态
 */
export function initializeSetSystemState(): SetSystemState {
  return {
    equippedItems: [],
    activatedSets: [],
    totalSetBonus: {
      attack: 0,
      defense: 0,
      hp: 0,
      speed: 0,
      crit: 0,
      critDmg: 0,
      specialEffects: []
    }
  };
}

/**
 * 装备物品
 */
export function equipItem(
  state: SetSystemState,
  item: EquippedItem
): SetSystemState {
  // 移除同槽位的装备
  const filtered = state.equippedItems.filter(i => i.slot !== item.slot);
  return {
    ...state,
    equippedItems: [...filtered, item]
  };
}

/**
 * 卸下装备
 */
export function unequipItem(
  state: SetSystemState,
  slot: string
): SetSystemState {
  return {
    ...state,
    equippedItems: state.equippedItems.filter(i => i.slot !== slot)
  };
}

/**
 * 计算套装激活状态
 */
export function calculateSetActivation(state: SetSystemState): SetActivationState[] {
  const activatedSets: SetActivationState[] = [];

  for (const set of EQUIPMENT_SETS) {
    // 计算该套装已装备的件数
    const setPieces = state.equippedItems.filter(
      item => item.setId === set.id
    );
    const activePieces = setPieces.length;

    if (activePieces === 0) continue;

    // 计算已激活的套装效果
    const activatedBonuses: number[] = [];
    set.bonuses.forEach((bonus, index) => {
      if (activePieces >= bonus.pieces) {
        activatedBonuses.push(index);
      }
    });

    activatedSets.push({
      setId: set.id,
      activePieces,
      activatedBonuses
    });
  }

  return activatedSets;
}

/**
 * 计算套装属性加成
 */
export function calculateSetBonuses(
  activatedSets: SetActivationState[]
): SetSystemState['totalSetBonus'] {
  const bonus: SetSystemState['totalSetBonus'] = {
    attack: 0,
    defense: 0,
    hp: 0,
    speed: 0,
    crit: 0,
    critDmg: 0,
    specialEffects: []
  };

  for (const activated of activatedSets) {
    const set = EQUIPMENT_SETS.find(s => s.id === activated.setId);
    if (!set) continue;

    for (const bonusIndex of activated.activatedBonuses) {
      const bonusConfig = set.bonuses[bonusIndex];
      if (!bonusConfig) continue;

      for (const effect of bonusConfig.effects) {
        if (effect.type === 'stat' && effect.stat) {
          const statName = effect.stat.name;
          if (statName in bonus) {
            (bonus as any)[statName] += effect.stat.isPercent
              ? effect.stat.value
              : effect.stat.value;
          }
        } else if (effect.type === 'special' && effect.special) {
          if (!bonus.specialEffects.includes(effect.special.name)) {
            bonus.specialEffects.push(effect.special.name);
          }
        }
      }
    }
  }

  return bonus;
}

/**
 * 更新套装状态
 */
export function updateSetState(state: SetSystemState): SetSystemState {
  const activatedSets = calculateSetActivation(state);
  const totalSetBonus = calculateSetBonuses(activatedSets);

  return {
    ...state,
    activatedSets,
    totalSetBonus
  };
}

/**
 * 获取套装信息
 */
export function getSetInfo(setId: string): EquipmentSet | undefined {
  return EQUIPMENT_SETS.find(s => s.id === setId);
}

/**
 * 获取套装效果描述
 */
export function getSetBonusDescription(setId: string, pieces: number): string {
  const set = getSetInfo(setId);
  if (!set) return '';

  const bonus = set.bonuses.find(b => b.pieces === pieces);
  if (!bonus) return '';

  const effects = bonus.effects.map(effect => {
    if (effect.type === 'stat' && effect.stat) {
      const percent = effect.stat.isPercent ? '%' : '';
      const statNames: Record<string, string> = {
        attack: '攻击',
        defense: '防御',
        hp: '生命',
        speed: '速度',
        crit: '暴击',
        critDmg: '暴击伤害'
      };
      return `${statNames[effect.stat.name]}+${effect.stat.value}${percent}`;
    } else if (effect.type === 'special' && effect.special) {
      return effect.special.name;
    }
    return '';
  }).filter(Boolean);

  return effects.join(', ');
}

/**
 * 检查套装是否激活
 */
export function isSetActivated(state: SetSystemState, setId: string): boolean {
  return state.activatedSets.some(s => s.setId === setId && s.activatedBonuses.length > 0);
}

/**
 * 获取已激活的套装数量
 */
export function getActivatedSetCount(state: SetSystemState): number {
  return state.activatedSets.filter(s => s.activatedBonuses.length > 0).length;
}

/**
 * 保存套装状态到 localStorage
 */
export function saveSetSystemState(state: SetSystemState): void {
  localStorage.setItem('dream-idle-set-system', JSON.stringify(state));
}

/**
 * 从 localStorage 加载套装状态
 */
export function loadSetSystemState(): SetSystemState {
  const saved = localStorage.getItem('dream-idle-set-system');
  if (saved) {
    return JSON.parse(saved);
  }
  return initializeSetSystemState();
}

/**
 * 获取套装名称
 */
export function getSetName(setId: string): string {
  const set = getSetInfo(setId);
  return set?.name || '未知套装';
}

/**
 * 获取套装颜色（按稀有度）
 */
export function getSetRarityColor(pieces: number): string {
  if (pieces >= 6) return 'text-orange-500'; // 传说
  if (pieces >= 4) return 'text-purple-500'; // 史诗
  if (pieces >= 2) return 'text-blue-500'; // 稀有
  return 'text-gray-500'; // 普通
}
