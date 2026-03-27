/**
 * v0.81 - 坐骑系统 (Mount System)
 * 
 * 功能：
 * - 坐骑获取与培养
 * - 坐骑技能
 * - 属性加成
 * - 坐骑进阶
 */

export interface Mount {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  level: number;
  exp: number;
  star: number; // 1-10 星
  stats: {
    attack: number;
    defense: number;
    health: number;
    speed: number;
  };
  skills: string[];
  isEquipped: boolean;
  obtainDate: number;
}

export interface MountSkill {
  id: string;
  name: string;
  description: string;
  effect: {
    type: 'stat_boost' | 'exp_bonus' | 'gold_bonus' | 'speed_boost';
    value: number;
  };
  minStar: number; // 最低星级要求
}

export interface MountExpItem {
  id: string;
  name: string;
  expValue: number;
  rarity: 'common' | 'rare' | 'epic';
}

// 坐骑进阶配置
const MOUNT_ADVANCE_CONFIG = [
  { star: 1, minExp: 0, maxExp: 1000, statMultiplier: 1.0 },
  { star: 2, minExp: 1000, maxExp: 2500, statMultiplier: 1.1 },
  { star: 3, minExp: 2500, maxExp: 5000, statMultiplier: 1.2 },
  { star: 4, minExp: 5000, maxExp: 8000, statMultiplier: 1.3 },
  { star: 5, minExp: 8000, maxExp: 12000, statMultiplier: 1.5 },
  { star: 6, minExp: 12000, maxExp: 17000, statMultiplier: 1.7 },
  { star: 7, minExp: 17000, maxExp: 23000, statMultiplier: 1.9 },
  { star: 8, minExp: 23000, maxExp: 30000, statMultiplier: 2.1 },
  { star: 9, minExp: 30000, maxExp: 38000, statMultiplier: 2.3 },
  { star: 10, minExp: 38000, maxExp: Infinity, statMultiplier: 2.5 },
];

// 坐骑技能库
const MOUNT_SKILLS: MountSkill[] = [
  {
    id: 'mount_skill_1',
    name: '疾风',
    description: '速度提升 10%',
    effect: { type: 'speed_boost', value: 0.1 },
    minStar: 1,
  },
  {
    id: 'mount_skill_2',
    name: '强壮',
    description: '生命值提升 15%',
    effect: { type: 'stat_boost', value: 0.15 },
    minStar: 3,
  },
  {
    id: 'mount_skill_3',
    name: '锐利',
    description: '攻击力提升 12%',
    effect: { type: 'stat_boost', value: 0.12 },
    minStar: 5,
  },
  {
    id: 'mount_skill_4',
    name: '铁壁',
    description: '防御力提升 15%',
    effect: { type: 'stat_boost', value: 0.15 },
    minStar: 7,
  },
  {
    id: 'mount_skill_5',
    name: '幸运',
    description: '金币获取提升 20%',
    effect: { type: 'gold_bonus', value: 0.2 },
    minStar: 9,
  },
];

// 坐骑经验道具
const MOUNT_EXP_ITEMS: MountExpItem[] = [
  { id: 'mount_exp_small', name: '坐骑经验丹 (小)', expValue: 100, rarity: 'common' },
  { id: 'mount_exp_medium', name: '坐骑经验丹 (中)', expValue: 500, rarity: 'common' },
  { id: 'mount_exp_large', name: '坐骑经验丹 (大)', expValue: 2000, rarity: 'rare' },
  { id: 'mount_exp_huge', name: '坐骑经验丹 (特大)', expValue: 10000, rarity: 'epic' },
];

// 基础坐骑模板
const MOUNT_TEMPLATES = {
  'mount_horse': {
    id: 'mount_horse',
    name: '赤兔马',
    rarity: 'rare' as const,
    baseStats: { attack: 50, defense: 30, health: 200, speed: 100 },
  },
  'mount_dragon': {
    id: 'mount_dragon',
    name: '青龙',
    rarity: 'legendary' as const,
    baseStats: { attack: 100, defense: 80, health: 500, speed: 150 },
  },
  'mount_tiger': {
    id: 'mount_tiger',
    name: '白虎',
    rarity: 'epic' as const,
    baseStats: { attack: 80, defense: 60, health: 350, speed: 120 },
  },
  'mount_bird': {
    id: 'mount_bird',
    name: '朱雀',
    rarity: 'epic' as const,
    baseStats: { attack: 70, defense: 50, health: 300, speed: 180 },
  },
  'mount_turtle': {
    id: 'mount_turtle',
    name: '玄武',
    rarity: 'legendary' as const,
    baseStats: { attack: 60, defense: 100, health: 600, speed: 80 },
  },
};

export class MountSystem {
  private mounts: Map<string, Mount> = new Map(); // playerId -> Mount
  private playerMountList: Map<string, string[]> = new Map(); // playerId -> mountIds

  /**
   * 获得坐骑
   */
  obtainMount(playerId: string, mountTemplateId: string): Mount {
    const template = MOUNT_TEMPLATES[mountTemplateId as keyof typeof MOUNT_TEMPLATES];
    if (!template) {
      throw new Error('坐骑模板不存在');
    }

    // 解锁 1 星技能
    const initialSkills = MOUNT_SKILLS.filter(s => s.minStar <= 1).map(s => s.id);

    const mount: Mount = {
      id: `${mountTemplateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      rarity: template.rarity,
      level: 1,
      exp: 0,
      star: 1,
      stats: { ...template.baseStats },
      skills: initialSkills,
      isEquipped: false,
      obtainDate: Date.now(),
    };

    // 添加到玩家坐骑列表
    const mountList = this.playerMountList.get(playerId) || [];
    mountList.push(mount.id);
    this.playerMountList.set(playerId, mountList);

    // 如果是第一个坐骑，自动装备
    if (mountList.length === 1) {
      mount.isEquipped = true;
    }

    this.mounts.set(mount.id, mount);
    return mount;
  }

  /**
   * 获取玩家的坐骑列表
   */
  getPlayerMounts(playerId: string): Mount[] {
    const mountIds = this.playerMountList.get(playerId) || [];
    return mountIds.map(id => this.mounts.get(id)!).filter(Boolean);
  }

  /**
   * 获取已装备的坐骑
   */
  getEquippedMount(playerId: string): Mount | null {
    const mounts = this.getPlayerMounts(playerId);
    return mounts.find(m => m.isEquipped) || null;
  }

  /**
   * 装备坐骑
   */
  equipMount(playerId: string, mountId: string): Mount {
    const mount = this.mounts.get(mountId);
    if (!mount) {
      throw new Error('坐骑不存在');
    }

    // 检查是否属于该玩家
    const mountIds = this.playerMountList.get(playerId) || [];
    if (!mountIds.includes(mountId)) {
      throw new Error('该坐骑不属于你');
    }

    // 卸下当前装备的坐骑
    const currentEquipped = this.getEquippedMount(playerId);
    if (currentEquipped) {
      currentEquipped.isEquipped = false;
      this.mounts.set(currentEquipped.id, currentEquipped);
    }

    // 装备新坐骑
    mount.isEquipped = true;
    this.mounts.set(mountId, mount);

    return mount;
  }

  /**
   * 给坐骑增加经验
   */
  addExp(playerId: string, mountId: string, exp: number): { mount: Mount; leveledUp: boolean; advanced: boolean } {
    const mount = this.mounts.get(mountId);
    if (!mount) {
      throw new Error('坐骑不存在');
    }

    // 检查是否属于该玩家
    const mountIds = this.playerMountList.get(playerId) || [];
    if (!mountIds.includes(mountId)) {
      throw new Error('该坐骑不属于你');
    }

    let leveledUp = false;
    let advanced = false;

    mount.exp += exp;

    // 检查是否升级 (每 1000 exp 升一级)
    const newLevel = Math.floor(mount.exp / 1000) + 1;
    if (newLevel > mount.level) {
      mount.level = newLevel;
      leveledUp = true;
      
      // 升级增加属性
      const levelBonus = (mount.level - 1) * 0.05; // 每级 5% 加成
      mount.stats.attack = Math.floor(MOUNT_TEMPLATES[mount.id.split('_')[0] + '_' + mount.id.split('_')[1] as keyof typeof MOUNT_TEMPLATES]?.baseStats.attack * (1 + levelBonus) || mount.stats.attack * 1.05);
      mount.stats.defense = Math.floor(mount.stats.defense * 1.05);
      mount.stats.health = Math.floor(mount.stats.health * 1.05);
      mount.stats.speed = Math.floor(mount.stats.speed * 1.05);
    }

    // 检查是否进阶 (支持连续进阶)
    while (mount.star < 10) {
      const currentConfig = MOUNT_ADVANCE_CONFIG.find(c => c.star === mount.star);
      if (!currentConfig || mount.exp < currentConfig.maxExp) {
        break;
      }
      
      mount.star++;
      advanced = true;

      // 进阶大幅增加属性
      const starMultiplier = MOUNT_ADVANCE_CONFIG[mount.star - 1].statMultiplier;
      const baseStats = MOUNT_TEMPLATES[mount.id.split('_')[0] + '_' + mount.id.split('_')[1] as keyof typeof MOUNT_TEMPLATES]?.baseStats;
      if (baseStats) {
        mount.stats.attack = Math.floor(baseStats.attack * starMultiplier);
        mount.stats.defense = Math.floor(baseStats.defense * starMultiplier);
        mount.stats.health = Math.floor(baseStats.health * starMultiplier);
        mount.stats.speed = Math.floor(baseStats.speed * starMultiplier);
      }

      // 解锁新技能
      const newSkill = MOUNT_SKILLS.find(s => s.minStar === mount.star);
      if (newSkill && !mount.skills.includes(newSkill.id)) {
        mount.skills.push(newSkill.id);
      }
    }

    this.mounts.set(mountId, mount);
    return { mount, leveledUp, advanced };
  }

  /**
   * 使用经验道具
   */
  useExpItem(playerId: string, mountId: string, itemId: string): { mount: Mount; leveledUp: boolean; advanced: boolean } {
    const expItem = MOUNT_EXP_ITEMS.find(item => item.id === itemId);
    if (!expItem) {
      throw new Error('经验道具不存在');
    }

    return this.addExp(playerId, mountId, expItem.expValue);
  }

  /**
   * 获取坐骑技能
   */
  getMountSkills(mount: Mount): MountSkill[] {
    return MOUNT_SKILLS.filter(skill => mount.skills.includes(skill.id));
  }

  /**
   * 激活坐骑技能
   */
  activateSkill(playerId: string, mountId: string, skillId: string): { success: boolean; effect?: any; message: string } {
    const mount = this.mounts.get(mountId);
    if (!mount) {
      return { success: false, message: '坐骑不存在' };
    }

    // 检查是否属于该玩家
    const mountIds = this.playerMountList.get(playerId) || [];
    if (!mountIds.includes(mountId)) {
      return { success: false, message: '该坐骑不属于你' };
    }

    // 检查是否是已装备的坐骑
    if (!mount.isEquipped) {
      return { success: false, message: '只有已装备的坐骑才能激活技能' };
    }

    const skill = MOUNT_SKILLS.find(s => s.id === skillId);
    if (!skill) {
      return { success: false, message: '技能不存在' };
    }

    // 检查星级要求
    if (mount.star < skill.minStar) {
      return { success: false, message: `坐骑星级不足，需要 ${skill.minStar} 星` };
    }

    // 检查技能是否已解锁
    if (!mount.skills.includes(skillId)) {
      return { success: false, message: '技能未解锁' };
    }

    return {
      success: true,
      effect: skill.effect,
      message: `激活技能：${skill.name}`,
    };
  }

  /**
   * 获取坐骑属性加成（基于已装备坐骑）
   */
  getMountBonus(playerId: string): {
    attack: number;
    defense: number;
    health: number;
    speed: number;
    expBonus: number;
    goldBonus: number;
  } {
    const mount = this.getEquippedMount(playerId);
    if (!mount) {
      return { attack: 0, defense: 0, health: 0, speed: 0, expBonus: 0, goldBonus: 0 };
    }

    const bonus = {
      attack: mount.stats.attack,
      defense: mount.stats.defense,
      health: mount.stats.health,
      speed: mount.stats.speed,
      expBonus: 0,
      goldBonus: 0,
    };

    // 计算技能加成
    const skills = this.getMountSkills(mount);
    for (const skill of skills) {
      if (skill.effect.type === 'exp_bonus') {
        bonus.expBonus += skill.effect.value;
      } else if (skill.effect.type === 'gold_bonus') {
        bonus.goldBonus += skill.effect.value;
      }
    }

    return bonus;
  }

  /**
   * 获取坐骑进阶信息
   */
  getAdvanceInfo(mount: Mount): {
    currentStar: number;
    currentExp: number;
    nextStarExp: number;
    progress: number;
    statMultiplier: number;
  } {
    const config = MOUNT_ADVANCE_CONFIG.find(c => c.star === mount.star);
    const nextConfig = MOUNT_ADVANCE_CONFIG.find(c => c.star === mount.star + 1);

    return {
      currentStar: mount.star,
      currentExp: mount.exp,
      nextStarExp: nextConfig ? nextConfig.minExp : Infinity,
      progress: config ? ((mount.exp - config.minExp) / (config.maxExp - config.minExp)) * 100 : 0,
      statMultiplier: config ? config.statMultiplier : 1,
    };
  }

  /**
   * 获取所有可获得的坐骑
   */
  getAvailableMounts(): Array<{ id: string; name: string; rarity: string; baseStats: any }> {
    return Object.values(MOUNT_TEMPLATES).map(template => ({
      id: template.id,
      name: template.name,
      rarity: template.rarity,
      baseStats: template.baseStats,
    }));
  }

  /**
   * 获取坐骑统计
   */
  getStats(playerId: string): {
    totalMounts: number;
    equippedMount: string | null;
    highestStar: number;
    averageLevel: number;
  } {
    const mounts = this.getPlayerMounts(playerId);
    const equipped = mounts.find(m => m.isEquipped);
    const highestStar = mounts.reduce((max, m) => Math.max(max, m.star), 0);
    const averageLevel = mounts.length > 0
      ? Math.round(mounts.reduce((sum, m) => sum + m.level, 0) / mounts.length)
      : 0;

    return {
      totalMounts: mounts.length,
      equippedMount: equipped ? equipped.name : null,
      highestStar,
      averageLevel,
    };
  }
}

// 导出单例
export const mountSystem = new MountSystem();
