// 公会系统测试 - v0.69

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  GUILD_LEVELS,
  GUILD_SKILLS_CONFIG,
  DONATION_RATES,
  CHECKIN_REWARD,
  ROLE_NAMES,
  createGuild,
  addGuildExp,
  donate,
  upgradeGuildSkill,
  guildCheckin,
  setAnnouncement,
  setMemberRole,
  kickMember,
  recruitNPC,
  getMaxMembers,
  getSkillBonus,
  getAllBonuses,
  getGuildStats,
  checkDailyReset,
  getRoleName,
  exportGuildData,
  importGuildData,
  type GuildState,
} from './guildSystem';

describe('公会系统 v0.69', () => {
  let state: GuildState;

  beforeEach(() => {
    state = createGuild('测试公会', '小红', 30, Date.now());
  });

  // ==================== 创建测试 ====================
  describe('公会创建', () => {
    it('应创建初始公会', () => {
      expect(state.name).toBe('测试公会');
      expect(state.level).toBe(1);
      expect(state.funds).toBe(0);
    });

    it('应包含玩家作为会长', () => {
      const player = state.members.find(m => m.isPlayer);
      expect(player).toBeDefined();
      expect(player!.role).toBe('leader');
      expect(player!.name).toBe('小红');
    });

    it('应包含NPC成员', () => {
      const npcs = state.members.filter(m => !m.isPlayer);
      expect(npcs.length).toBe(5);
    });

    it('应包含公会技能', () => {
      expect(state.skills.length).toBe(GUILD_SKILLS_CONFIG.length);
      state.skills.forEach(s => expect(s.currentLevel).toBe(0));
    });

    it('应有默认公告', () => {
      expect(state.announcement).toContain('测试公会');
    });
  });

  // ==================== 等级配置测试 ====================
  describe('等级配置', () => {
    it('应有10个等级', () => {
      expect(GUILD_LEVELS.length).toBe(10);
    });

    it('经验要求应递增', () => {
      for (let i = 1; i < GUILD_LEVELS.length; i++) {
        expect(GUILD_LEVELS[i].expRequired).toBeGreaterThan(GUILD_LEVELS[i - 1].expRequired);
      }
    });

    it('成员上限应递增', () => {
      for (let i = 1; i < GUILD_LEVELS.length; i++) {
        expect(GUILD_LEVELS[i].maxMembers).toBeGreaterThanOrEqual(GUILD_LEVELS[i - 1].maxMembers);
      }
    });
  });

  // ==================== 经验测试 ====================
  describe('公会经验', () => {
    it('添加经验应正确', () => {
      const { state: s1 } = addGuildExp(state, 500);
      expect(s1.exp).toBe(500);
    });

    it('经验足够应自动升级', () => {
      const { state: s1, levelsGained } = addGuildExp(state, 1500);
      expect(s1.level).toBeGreaterThan(1);
      expect(levelsGained).toBeGreaterThan(0);
    });

    it('大量经验应连续升级', () => {
      const { state: s1 } = addGuildExp(state, 50000);
      expect(s1.level).toBeGreaterThan(3);
    });
  });

  // ==================== 捐献测试 ====================
  describe('捐献', () => {
    it('金币捐献应成功', () => {
      const result = donate(state, 'player', 'gold');
      expect(result.success).toBe(true);
      expect(result.contribution).toBe(DONATION_RATES.gold.contribution);
      expect(result.guildExp).toBe(DONATION_RATES.gold.guildExp);
    });

    it('钻石捐献应给更多贡献', () => {
      const result = donate(state, 'player', 'diamond');
      expect(result.success).toBe(true);
      expect(result.contribution).toBeGreaterThan(DONATION_RATES.gold.contribution);
    });

    it('捐献应增加公会资金', () => {
      const { state: s1 } = donate(state, 'player', 'gold');
      expect(s1.funds).toBe(DONATION_RATES.gold.guildFunds);
    });

    it('捐献应记录历史', () => {
      const { state: s1 } = donate(state, 'player', 'gold');
      expect(s1.donations).toHaveLength(1);
    });

    it('不存在的成员不能捐献', () => {
      const result = donate(state, 'nonexist', 'gold');
      expect(result.success).toBe(false);
    });
  });

  // ==================== 技能测试 ====================
  describe('公会技能', () => {
    it('升级技能应成功（有资金）', () => {
      state.funds = 10000;
      const result = upgradeGuildSkill(state, 'atk_boost');
      expect(result.success).toBe(true);
      expect(result.newLevel).toBe(1);
    });

    it('资金不足不能升级', () => {
      const result = upgradeGuildSkill(state, 'atk_boost');
      expect(result.success).toBe(false);
      expect(result.error).toContain('资金不足');
    });

    it('满级不能继续升级', () => {
      state.funds = 1000000;
      let s = state;
      for (let i = 0; i < 10; i++) {
        const { state: ns } = upgradeGuildSkill(s, 'atk_boost');
        s = ns;
      }
      const result = upgradeGuildSkill(s, 'atk_boost');
      expect(result.success).toBe(false);
      expect(result.error).toContain('满级');
    });

    it('技能加成应正确计算', () => {
      state.funds = 10000;
      const { state: s1 } = upgradeGuildSkill(state, 'atk_boost');
      expect(getSkillBonus(s1, 'atk_boost')).toBe(2);
    });

    it('获取所有加成', () => {
      state.funds = 100000;
      let s = state;
      const { state: s1 } = upgradeGuildSkill(s, 'atk_boost');
      const { state: s2 } = upgradeGuildSkill(s1, 'exp_boost');
      const bonuses = getAllBonuses(s2);
      expect(bonuses['atk_boost']).toBe(2);
      expect(bonuses['exp_boost']).toBe(5);
    });
  });

  // ==================== 签到测试 ====================
  describe('每日签到', () => {
    it('签到应成功', () => {
      const result = guildCheckin(state, 'player');
      expect(result.success).toBe(true);
      expect(result.rewards).toEqual(CHECKIN_REWARD);
    });

    it('重复签到应失败', () => {
      const { state: s1 } = guildCheckin(state, 'player');
      const result = guildCheckin(s1, 'player');
      expect(result.success).toBe(false);
      expect(result.error).toContain('已签到');
    });

    it('签到应增加贡献', () => {
      const { state: s1 } = guildCheckin(state, 'player');
      const player = s1.members.find(m => m.isPlayer);
      expect(player!.contribution).toBe(CHECKIN_REWARD.contribution);
    });
  });

  // ==================== 成员管理测试 ====================
  describe('成员管理', () => {
    it('修改NPC职位应成功', () => {
      const npcId = state.members.find(m => !m.isPlayer)!.id;
      const result = setMemberRole(state, npcId, 'elite');
      expect(result.success).toBe(true);
    });

    it('不能修改自己的职位', () => {
      const result = setMemberRole(state, 'player', 'member');
      expect(result.success).toBe(false);
    });

    it('不能设置成员为会长', () => {
      const npcId = state.members.find(m => !m.isPlayer)!.id;
      const result = setMemberRole(state, npcId, 'leader');
      expect(result.success).toBe(false);
    });

    it('踢出NPC应成功', () => {
      const npcId = state.members.find(m => !m.isPlayer)!.id;
      const result = kickMember(state, npcId);
      expect(result.success).toBe(true);
      expect(result.state.members.length).toBe(state.members.length - 1);
    });

    it('不能踢出自己', () => {
      const result = kickMember(state, 'player');
      expect(result.success).toBe(false);
    });

    it('招募NPC应成功', () => {
      const result = recruitNPC(state);
      expect(result.success).toBe(true);
      expect(result.member).toBeDefined();
      expect(result.state.members.length).toBe(state.members.length + 1);
    });

    it('成员满员不能招募', () => {
      // Fill to max
      let s = state;
      const max = getMaxMembers(s);
      while (s.members.length < max) {
        const { state: ns } = recruitNPC(s);
        s = ns;
      }
      const result = recruitNPC(s);
      expect(result.success).toBe(false);
    });
  });

  // ==================== 公告测试 ====================
  describe('公告', () => {
    it('设置公告应成功', () => {
      const s = setAnnouncement(state, '新公告！');
      expect(s.announcement).toBe('新公告！');
    });

    it('公告应限制200字', () => {
      const longText = 'A'.repeat(300);
      const s = setAnnouncement(state, longText);
      expect(s.announcement.length).toBe(200);
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('同一天不应重置', () => {
      const { state: s1 } = guildCheckin(state, 'player');
      const s2 = checkDailyReset(s1);
      expect(Object.keys(s2.dailyCheckins).length).toBeGreaterThan(0);
    });

    it('跨天应重置签到', () => {
      const { state: s1 } = guildCheckin(state, 'player');
      s1.lastResetDate = '2020-01-01';
      const s2 = checkDailyReset(s1);
      expect(Object.keys(s2.dailyCheckins)).toHaveLength(0);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('获取公会统计', () => {
      const stats = getGuildStats(state);
      expect(stats.name).toBe('测试公会');
      expect(stats.memberCount).toBe(6);
      expect(stats.level).toBe(1);
    });

    it('贡献排行应正确', () => {
      // Give player some contribution
      const { state: s1 } = guildCheckin(state, 'player');
      const stats = getGuildStats(s1);
      expect(stats.topContributors.length).toBeGreaterThan(0);
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('职位名称应返回中文', () => {
      expect(getRoleName('leader')).toBe('会长');
      expect(getRoleName('member')).toBe('成员');
    });

    it('获取不存在的技能加成应返回0', () => {
      expect(getSkillBonus(state, 'nonexist')).toBe(0);
    });

    it('最大成员数应匹配等级', () => {
      expect(getMaxMembers(state)).toBe(GUILD_LEVELS[0].maxMembers);
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportGuildData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).name).toBe('测试公会');
    });

    it('导入应还原数据', () => {
      const json = exportGuildData(state);
      const imported = importGuildData(json);
      expect(imported).toBeDefined();
      expect(imported!.name).toBe('测试公会');
    });

    it('无效数据应返回null', () => {
      expect(importGuildData('not json')).toBeNull();
      expect(importGuildData('{}')).toBeNull();
    });
  });
});
