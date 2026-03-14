/**
 * v0.15 成就系统扩展单元测试
 * Achievement System Extension Unit Tests
 */

import { AchievementSystem, AchievementCategory, ConditionType } from './achievements';

describe('AchievementSystem - 成就系统', () => {
  let achievementSystem: AchievementSystem;

  beforeEach(() => {
    achievementSystem = new AchievementSystem();
  });

  describe('玩家状态管理 - Player State Management', () => {
    test('应该初始化玩家成就状态', () => {
      const state = achievementSystem.initializePlayerState('player_1');
      
      expect(state.userId).toBe('player_1');
      expect(state.totalPoints).toBe(0);
      expect(state.unlockedTitles).toEqual([]);
      expect(state.equippedTitle).toBeUndefined();
    });

    test('应该为玩家初始化所有成就进度', () => {
      const state = achievementSystem.initializePlayerState('player_1');
      
      // 应该初始化所有默认成就
      expect(state.achievements.size).toBeGreaterThan(0);
      
      state.achievements.forEach((playerAchievement, id) => {
        expect(playerAchievement.progress).toBe(0);
        expect(playerAchievement.isCompleted).toBe(false);
        expect(playerAchievement.isClaimed).toBe(false);
      });
    });

    test('不应该重复初始化玩家状态', () => {
      const state1 = achievementSystem.initializePlayerState('player_1');
      const state2 = achievementSystem.initializePlayerState('player_1');
      
      expect(state1).toBe(state2);
    });
  });

  describe('成就进度更新 - Achievement Progress Update', () => {
    beforeEach(() => {
      achievementSystem.initializePlayerState('player_1');
    });

    test('应该更新战斗胜利成就进度', () => {
      const result = achievementSystem.updateProgress('player_1', 'battle_win', 5);
      
      expect(result.completed).toEqual([]);
      
      // 获取战斗成就
      const achievements = achievementSystem.getPlayerAchievements('player_1', {
        category: 'combat',
      });
      
      const firstCombat = achievements.find(a => a.achievement.id === 'combat_001');
      expect(firstCombat?.playerData.progress).toBe(5);
      expect(firstCombat?.playerData.isCompleted).toBe(false);
    });

    test('应该完成成就当进度达到目标', () => {
      const result = achievementSystem.updateProgress('player_1', 'battle_win', 10);
      
      expect(result.completed).toContain('combat_001');
      
      const achievements = achievementSystem.getPlayerAchievements('player_1', {
        status: 'completed',
      });
      
      expect(achievements.some(a => a.achievement.id === 'combat_001')).toBe(true);
    });

    test('应该增加成就点数', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 10);
      
      const stats = achievementSystem.getPlayerStats('player_1');
      expect(stats!.totalPoints).toBeGreaterThan(0);
    });

    test('应该解锁称号', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 100);
      
      const stats = achievementSystem.getPlayerStats('player_1');
      expect(stats!.unlockedTitles).toBeGreaterThan(0);
    });

    test('进度不应该超过目标值', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 1000);
      
      const achievements = achievementSystem.getPlayerAchievements('player_1');
      const firstCombat = achievements.find(a => a.achievement.id === 'combat_001');
      
      expect(firstCombat?.playerData.progress).toBe(10); // 目标是 10
    });

    test('应该更新等级成就进度', () => {
      const result = achievementSystem.updateProgress('player_1', 'level_reach', 10);
      
      expect(result.completed).toContain('growth_001');
    });

    test('应该更新好友成就进度', () => {
      const result = achievementSystem.updateProgress('player_1', 'friend_count', 10);
      
      expect(result.completed).toContain('social_001');
    });

    test('应该更新金币获得成就进度', () => {
      const result = achievementSystem.updateProgress('player_1', 'gold_earn', 10000);
      
      expect(result.completed).toContain('collection_001');
    });
  });

  describe('奖励领取 - Claim Rewards', () => {
    beforeEach(() => {
      achievementSystem.initializePlayerState('player_1');
    });

    test('应该成功领取成就奖励', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 10);
      
      const result = achievementSystem.claimReward('player_1', 'combat_001');
      
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
      expect(result.rewards!.length).toBe(1);
      expect(result.rewards![0].type).toBe('gold');
    });

    test('不能领取未完成的成就奖励', () => {
      const result = achievementSystem.claimReward('player_1', 'combat_001');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('成就未完成');
    });

    test('不能重复领取奖励（非可重复成就）', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 10);
      achievementSystem.claimReward('player_1', 'combat_001');
      
      const result = achievementSystem.claimReward('player_1', 'combat_001');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('奖励已领取');
    });

    test('应该一键领取所有可领取奖励', () => {
      // 完成多个成就
      achievementSystem.updateProgress('player_1', 'battle_win', 10);
      achievementSystem.updateProgress('player_1', 'level_reach', 10);
      achievementSystem.updateProgress('player_1', 'friend_count', 10);
      
      const result = achievementSystem.claimAllRewards('player_1');
      
      expect(result.success).toBe(true);
      expect(result.claimedCount).toBe(3);
      expect(result.rewards.length).toBe(3);
    });
  });

  describe('成就查询 - Achievement Queries', () => {
    beforeEach(() => {
      achievementSystem.initializePlayerState('player_1');
    });

    test('应该获取玩家成就列表', () => {
      const achievements = achievementSystem.getPlayerAchievements('player_1');
      
      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements[0]).toHaveProperty('achievement');
      expect(achievements[0]).toHaveProperty('playerData');
    });

    test('应该按分类筛选成就', () => {
      const combatAchievements = achievementSystem.getPlayerAchievements('player_1', {
        category: 'combat',
      });
      
      expect(combatAchievements.every(a => a.achievement.category === 'combat')).toBe(true);
      
      const socialAchievements = achievementSystem.getPlayerAchievements('player_1', {
        category: 'social',
      });
      
      expect(socialAchievements.every(a => a.achievement.category === 'social')).toBe(true);
    });

    test('应该按状态筛选成就', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 10);
      
      const completed = achievementSystem.getPlayerAchievements('player_1', {
        status: 'completed',
      });
      
      expect(completed.every(a => a.playerData.isCompleted)).toBe(true);
      expect(completed.some(a => a.achievement.id === 'combat_001')).toBe(true);
      
      const incomplete = achievementSystem.getPlayerAchievements('player_1', {
        status: 'incomplete',
      });
      
      expect(incomplete.every(a => !a.playerData.isCompleted)).toBe(true);
    });

    test('应该隐藏未完成的隐藏成就', () => {
      const achievements = achievementSystem.getPlayerAchievements('player_1', {
        hideHidden: true,
      });
      
      expect(achievements.every(a => !a.achievement.isHidden || a.playerData.isCompleted)).toBe(true);
    });

    test('应该显示已完成的隐藏成就', () => {
      achievementSystem.updateProgress('player_1', 'achievement_points', 1000);
      
      const achievements = achievementSystem.getPlayerAchievements('player_1', {
        hideHidden: true,
      });
      
      const specialAchievement = achievements.find(a => a.achievement.id === 'special_001');
      expect(specialAchievement).toBeDefined();
    });

    test('应该获取成就详情', () => {
      const result = achievementSystem.getAchievement('combat_001', 'player_1');
      
      expect(result).toBeDefined();
      expect(result!.achievement.id).toBe('combat_001');
      expect(result!.playerData).toBeDefined();
    });

    test('成就列表应该按点数排序', () => {
      const achievements = achievementSystem.getPlayerAchievements('player_1');
      
      for (let i = 1; i < achievements.length; i++) {
        expect(achievements[i - 1].achievement.points)
          .toBeGreaterThanOrEqual(achievements[i].achievement.points);
      }
    });
  });

  describe('称号系统 - Title System', () => {
    beforeEach(() => {
      achievementSystem.initializePlayerState('player_1');
    });

    test('应该装备称号', () => {
      // 先解锁称号
      achievementSystem.updateProgress('player_1', 'battle_win', 100);
      
      const result = achievementSystem.equipTitle('player_1', '战场精英');
      
      expect(result).toBe(true);
      
      const stats = achievementSystem.getPlayerStats('player_1');
      expect(stats!.equippedTitle).toBe('战场精英');
    });

    test('不能装备未解锁的称号', () => {
      const result = achievementSystem.equipTitle('player_1', '未解锁称号');
      
      expect(result).toBe(false);
    });

    test('应该卸下称号', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 100);
      achievementSystem.equipTitle('player_1', '战场精英');
      
      const result = achievementSystem.unequipTitle('player_1');
      
      expect(result).toBe(true);
      
      const stats = achievementSystem.getPlayerStats('player_1');
      expect(stats!.equippedTitle).toBeUndefined();
    });
  });

  describe('玩家统计 - Player Stats', () => {
    beforeEach(() => {
      achievementSystem.initializePlayerState('player_1');
    });

    test('应该获取玩家成就统计', () => {
      const stats = achievementSystem.getPlayerStats('player_1');
      
      expect(stats).toBeDefined();
      expect(stats!.totalPoints).toBe(0);
      expect(stats!.completedCount).toBe(0);
      expect(stats!.claimedCount).toBe(0);
      expect(stats!.totalAchievements).toBeGreaterThan(0);
      expect(stats!.completionRate).toBe(0);
    });

    test('统计应该反映完成情况', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 10);
      achievementSystem.claimReward('player_1', 'combat_001');
      
      const stats = achievementSystem.getPlayerStats('player_1');
      
      expect(stats!.completedCount).toBe(1);
      expect(stats!.claimedCount).toBe(1);
      expect(stats!.totalPoints).toBeGreaterThan(0);
    });

    test('应该计算完成率', () => {
      // 完成所有成就（理论上）
      achievementSystem.updateProgress('player_1', 'battle_win', 1000);
      achievementSystem.updateProgress('player_1', 'level_reach', 100);
      achievementSystem.updateProgress('player_1', 'friend_count', 50);
      achievementSystem.updateProgress('player_1', 'gold_earn', 1000000);
      
      const stats = achievementSystem.getPlayerStats('player_1');
      expect(stats!.completionRate).toBeGreaterThan(0);
    });
  });

  describe('分类统计 - Category Stats', () => {
    beforeEach(() => {
      achievementSystem.initializePlayerState('player_1');
    });

    test('应该获取分类统计', () => {
      const stats = achievementSystem.getCategoryStats('player_1');
      
      expect(stats.combat).toBeDefined();
      expect(stats.social).toBeDefined();
      expect(stats.collection).toBeDefined();
      expect(stats.growth).toBeDefined();
      expect(stats.special).toBeDefined();
      
      expect(stats.combat.total).toBeGreaterThan(0);
    });

    test('分类统计应该反映完成情况', () => {
      achievementSystem.updateProgress('player_1', 'battle_win', 10);
      
      const stats = achievementSystem.getCategoryStats('player_1');
      
      expect(stats.combat.completed).toBeGreaterThan(0);
    });
  });

  describe('全服广播 - Global Broadcast', () => {
    let broadcastSystem: AchievementSystem;

    beforeEach(() => {
      broadcastSystem = new AchievementSystem({
        enableGlobalBroadcast: true,
        broadcastTiers: ['gold', 'platinum', 'diamond'],
      });
      broadcastSystem.initializePlayerState('player_1');
    });

    test('应该广播高等级成就', () => {
      // 完成一个 gold 等级成就
      broadcastSystem.updateProgress('player_1', 'battle_win', 1000);
      
      const broadcasts = broadcastSystem.getGlobalBroadcasts();
      
      expect(broadcasts.length).toBeGreaterThan(0);
      expect(broadcasts[0].achievementName).toBe('战神降临');
      expect(broadcasts[0].tier).toBe('gold');
    });

    test('不应该广播低等级成就', () => {
      // 完成一个 bronze 等级成就
      broadcastSystem.updateProgress('player_1', 'battle_win', 10);
      
      const broadcasts = broadcastSystem.getGlobalBroadcasts();
      
      expect(broadcasts.length).toBe(0);
    });

    test('应该限制广播数量', () => {
      // 触发多次广播
      for (let i = 0; i < 150; i++) {
        broadcastSystem.updateProgress(`player_${i}`, 'battle_win', 1000);
      }
      
      const broadcasts = broadcastSystem.getGlobalBroadcasts(200);
      
      expect(broadcasts.length).toBeLessThanOrEqual(100);
    });

    test('应该支持禁用广播', () => {
      const noBroadcastSystem = new AchievementSystem({
        enableGlobalBroadcast: false,
      });
      noBroadcastSystem.initializePlayerState('player_1');
      
      noBroadcastSystem.updateProgress('player_1', 'battle_win', 1000);
      
      const broadcasts = noBroadcastSystem.getGlobalBroadcasts();
      expect(broadcasts.length).toBe(0);
    });
  });

  describe('添加成就 - Add Achievement', () => {
    test('应该添加自定义成就', () => {
      const result = achievementSystem.addAchievement({
        id: 'custom_001',
        name: '自定义成就',
        description: '这是一个自定义成就',
        category: 'special',
        tier: 'gold',
        points: 100,
        condition: {
          type: 'custom',
          target: 1,
          description: '完成自定义条件',
        },
        rewards: [{ type: 'gold', amount: 5000 }],
        isHidden: false,
        isRepeatable: false,
      });
      
      expect(result).toBe(true);
      
      const achievement = achievementSystem.getAchievement('custom_001');
      expect(achievement).toBeDefined();
      expect(achievement!.achievement.name).toBe('自定义成就');
    });

    test('不应该添加重复成就', () => {
      achievementSystem.addAchievement({
        id: 'duplicate_001',
        name: '重复成就',
        description: '测试',
        category: 'special',
        tier: 'bronze',
        points: 10,
        condition: {
          type: 'custom',
          target: 1,
          description: '测试',
        },
        rewards: [],
        isHidden: false,
        isRepeatable: false,
      });
      
      const result = achievementSystem.addAchievement({
        id: 'duplicate_001',
        name: '重复成就',
        description: '测试',
        category: 'special',
        tier: 'bronze',
        points: 10,
        condition: {
          type: 'custom',
          target: 1,
          description: '测试',
        },
        rewards: [],
        isHidden: false,
        isRepeatable: false,
      });
      
      expect(result).toBe(false);
    });
  });

  describe('配置管理 - Configuration Management', () => {
    test('应该使用默认配置', () => {
      const config = achievementSystem.getConfig();
      
      expect(config.enableGlobalBroadcast).toBe(true);
      expect(config.broadcastTiers).toEqual(['gold', 'platinum', 'diamond']);
      expect(config.maxEquippedTitles).toBe(1);
    });

    test('应该可以更新配置', () => {
      achievementSystem.updateConfig({
        enableGlobalBroadcast: false,
        maxEquippedTitles: 3,
      });
      
      const config = achievementSystem.getConfig();
      expect(config.enableGlobalBroadcast).toBe(false);
      expect(config.maxEquippedTitles).toBe(3);
      expect(config.broadcastTiers).toEqual(['gold', 'platinum', 'diamond']); // 未改变
    });
  });

  describe('数据导出导入 - Data Export/Import', () => {
    beforeEach(() => {
      achievementSystem.initializePlayerState('player_1');
      achievementSystem.updateProgress('player_1', 'battle_win', 10);
    });

    test('应该导出成就数据', () => {
      const data = achievementSystem.exportData();
      
      expect(data).toBeDefined();
      expect((data as any).achievements.length).toBeGreaterThan(0);
      expect((data as any).playerStates.length).toBe(1);
    });

    test('应该导入成就数据', () => {
      const newData = {
        achievements: Array.from(achievementSystem['achievements'].entries()),
        playerStates: [[
          'player_2',
          {
            userId: 'player_2',
            achievements: Array.from(achievementSystem['achievements'].entries()).map(([id, _]) => [
              id,
              { achievementId: id, progress: 50, isCompleted: false, isClaimed: false, completedCount: 0 },
            ]),
            totalPoints: 0,
            unlockedTitles: [],
          },
        ]] as [string, any][],
        config: { enableGlobalBroadcast: false, broadcastTiers: ['gold', 'platinum', 'diamond'], maxEquippedTitles: 1 } as any,
      };

      achievementSystem.importData(newData);
      
      const stats = achievementSystem.getPlayerStats('player_2');
      expect(stats).toBeDefined();
      
      const config = achievementSystem.getConfig();
      expect(config.enableGlobalBroadcast).toBe(false);
    });
  });
});
