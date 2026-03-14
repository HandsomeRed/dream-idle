/**
 * v0.16 社交系统扩展单元测试
 * Social System Extension Unit Tests
 */

import { SocialSystem } from './social';

describe('SocialSystem - 社交系统', () => {
  let socialSystem: SocialSystem;

  beforeEach(() => {
    socialSystem = new SocialSystem();
  });

  describe('玩家状态管理 - Player State Management', () => {
    test('应该初始化玩家社交状态', () => {
      const state = socialSystem.initializePlayerState('player_1');
      
      expect(state.userId).toBe('player_1');
      expect(state.socialPoints).toBe(0);
      expect(state.reputation).toBe(0);
      expect(state.visitedToday).toBe(0);
      expect(state.blockedUsers).toEqual([]);
    });

    test('不应该重复初始化玩家状态', () => {
      const state1 = socialSystem.initializePlayerState('player_1');
      const state2 = socialSystem.initializePlayerState('player_1');
      
      expect(state1).toBe(state2);
    });
  });

  describe('拜访玩家 - Visit Player', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
      socialSystem.initializePlayerState('player_2');
    });

    test('应该成功拜访玩家', () => {
      const result = socialSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(result.reward!.type).toBe('points');
      
      const stats = socialSystem.getSocialStats('player_1');
      expect(stats!.visitedToday).toBe(1);
      expect(stats!.socialPoints).toBeGreaterThan(0);
    });

    test('拜访应该增加被拜访者声望', () => {
      socialSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      
      const stats = socialSystem.getSocialStats('player_2');
      expect(stats!.reputation).toBeGreaterThan(0);
    });

    test('不能拜访超过每日次数限制', () => {
      const smallSystem = new SocialSystem({ maxDailyVisits: 2 });
      smallSystem.initializePlayerState('player_1');
      smallSystem.initializePlayerState('player_2');
      smallSystem.initializePlayerState('player_3');
      
      smallSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      smallSystem.visitPlayer('player_1', '玩家 1', 'player_3');
      
      const result = smallSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('今日拜访次数已达上限');
    });

    test('拜访有冷却时间', () => {
      const cooldownSystem = new SocialSystem({ visitCooldownMs: 60000 }); // 1 分钟
      cooldownSystem.initializePlayerState('player_1');
      cooldownSystem.initializePlayerState('player_2');
      
      cooldownSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      
      const result = cooldownSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('拜访冷却中');
    });

    test('不能拜访拉黑自己的玩家', () => {
      socialSystem.blockUser('player_2', 'player_1');
      
      const result = socialSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('对方已将您拉入黑名单');
    });
  });

  describe('赠送礼物 - Send Gift', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
      socialSystem.initializePlayerState('player_2');
    });

    test('应该成功赠送礼物', () => {
      const result = socialSystem.sendGift(
        'player_1',
        '玩家 1',
        'player_2',
        'gift_001',
        '鲜花',
        5
      );
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      
      const stats = socialSystem.getSocialStats('player_2');
      expect(stats!.totalReceivedGifts).toBe(5);
    });

    test('赠送礼物应该增加社交点数', () => {
      const result = socialSystem.sendGift(
        'player_1',
        '玩家 1',
        'player_2',
        'gift_001',
        '鲜花',
        5
      );
      
      const stats = socialSystem.getSocialStats('player_1');
      expect(stats!.socialPoints).toBeGreaterThan(0);
    });

    test('礼物系统禁用时不能赠送', () => {
      const noGiftSystem = new SocialSystem({ enableGiftSystem: false });
      noGiftSystem.initializePlayerState('player_1');
      noGiftSystem.initializePlayerState('player_2');
      
      const result = noGiftSystem.sendGift(
        'player_1',
        '玩家 1',
        'player_2',
        'gift_001',
        '鲜花'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('礼物系统已禁用');
    });

    test('不能赠送给拉黑自己的玩家', () => {
      socialSystem.blockUser('player_2', 'player_1');
      
      const result = socialSystem.sendGift(
        'player_1',
        '玩家 1',
        'player_2',
        'gift_001',
        '鲜花'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('对方已将您拉入黑名单');
    });
  });

  describe('点赞 - Like', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
      socialSystem.initializePlayerState('player_2');
    });

    test('应该成功点赞玩家', () => {
      const result = socialSystem.like('player_1', '玩家 1', 'player_2', 'player');
      
      expect(result.success).toBe(true);
      
      const stats = socialSystem.getSocialStats('player_2');
      expect(stats!.totalReceivedLikes).toBe(1);
      expect(stats!.reputation).toBe(1);
    });

    test('应该成功点赞帖子', () => {
      const result = socialSystem.like('player_1', '玩家 1', 'post_001', 'post');
      
      expect(result.success).toBe(true);
      
      const stats = socialSystem.getSocialStats('player_1');
      expect(stats!.socialPoints).toBeGreaterThan(0);
    });

    test('点赞成就', () => {
      const result = socialSystem.like('player_1', '玩家 1', 'achievement_001', 'achievement');
      
      expect(result.success).toBe(true);
    });
  });

  describe('评论 - Comment', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
      socialSystem.initializePlayerState('player_2');
    });

    test('应该成功评论', () => {
      const result = socialSystem.comment(
        'player_1',
        '玩家 1',
        'player_2',
        'player',
        '写得很好！'
      );
      
      expect(result.success).toBe(true);
      
      const stats = socialSystem.getSocialStats('player_2');
      expect(stats!.totalReceivedComments).toBe(1);
    });

    test('评论内容不能为空', () => {
      const result = socialSystem.comment(
        'player_1',
        '玩家 1',
        'player_2',
        'player',
        ''
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('评论内容长度');
    });

    test('评论内容不能超过 500 字符', () => {
      const longContent = 'a'.repeat(501);
      
      const result = socialSystem.comment(
        'player_1',
        '玩家 1',
        'player_2',
        'player',
        longContent
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('评论内容长度');
    });
  });

  describe('拉黑系统 - Block System', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
    });

    test('应该拉黑用户', () => {
      const result = socialSystem.blockUser('player_1', 'player_2');
      
      expect(result).toBe(true);
      
      const blocked = socialSystem.getBlockedUsers('player_1');
      expect(blocked).toContain('player_2');
    });

    test('应该取消拉黑', () => {
      socialSystem.blockUser('player_1', 'player_2');
      socialSystem.unblockUser('player_1', 'player_2');
      
      const blocked = socialSystem.getBlockedUsers('player_1');
      expect(blocked).not.toContain('player_2');
    });

    test('不应该重复拉黑', () => {
      socialSystem.blockUser('player_1', 'player_2');
      socialSystem.blockUser('player_1', 'player_2');
      
      const blocked = socialSystem.getBlockedUsers('player_1');
      expect(blocked.filter(id => id === 'player_2').length).toBe(1);
    });
  });

  describe('互动记录 - Interaction Records', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
      socialSystem.initializePlayerState('player_2');
    });

    test('应该获取互动记录', () => {
      socialSystem.visitPlayer('player_2', '玩家 2', 'player_1');
      
      const interactions = socialSystem.getInteractions('player_1');
      
      expect(interactions.length).toBe(1);
      expect(interactions[0].actionType).toBe('visit');
      expect(interactions[0].actorId).toBe('player_2');
    });

    test('应该按类型筛选互动记录', () => {
      socialSystem.visitPlayer('player_2', '玩家 2', 'player_1');
      socialSystem.sendGift('player_2', '玩家 2', 'player_1', 'gift_001', '鲜花');
      socialSystem.like('player_2', '玩家 2', 'player_1', 'player');
      
      const visits = socialSystem.getInteractions('player_1', { actionType: 'visit' });
      const gifts = socialSystem.getInteractions('player_1', { actionType: 'gift' });
      const likes = socialSystem.getInteractions('player_1', { actionType: 'like' });
      
      expect(visits.length).toBe(1);
      expect(gifts.length).toBe(1);
      expect(likes.length).toBe(1);
    });

    test('应该获取未读互动', () => {
      socialSystem.visitPlayer('player_2', '玩家 2', 'player_1');
      
      const unread = socialSystem.getInteractions('player_1', { isRead: false });
      
      expect(unread.length).toBe(1);
    });

    test('应该标记互动为已读', () => {
      socialSystem.visitPlayer('player_2', '玩家 2', 'player_1');
      
      const interactions = socialSystem.getInteractions('player_1', { isRead: false });
      socialSystem.markInteractionsAsRead('player_1', interactions.map(i => i.id));
      
      const unread = socialSystem.getInteractions('player_1', { isRead: false });
      expect(unread.length).toBe(0);
    });

    test('应该一键标记所有为已读', () => {
      socialSystem.visitPlayer('player_2', '玩家 2', 'player_1');
      socialSystem.sendGift('player_2', '玩家 2', 'player_1', 'gift_001', '鲜花');
      
      const count = socialSystem.markInteractionsAsRead('player_1');
      
      expect(count).toBe(2);
      
      const unreadCount = socialSystem.getUnreadInteractionCount('player_1');
      expect(unreadCount).toBe(0);
    });

    test('应该获取未读互动数', () => {
      socialSystem.visitPlayer('player_2', '玩家 2', 'player_1');
      socialSystem.sendGift('player_2', '玩家 2', 'player_1', 'gift_001', '鲜花');
      
      const count = socialSystem.getUnreadInteractionCount('player_1');
      
      expect(count).toBe(2);
    });
  });

  describe('社交统计 - Social Stats', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
      socialSystem.initializePlayerState('player_2');
    });

    test('应该获取社交统计', () => {
      socialSystem.visitPlayer('player_2', '玩家 2', 'player_1');
      socialSystem.sendGift('player_2', '玩家 2', 'player_1', 'gift_001', '鲜花', 3);
      socialSystem.like('player_2', '玩家 2', 'player_1', 'player');
      socialSystem.comment('player_2', '玩家 2', 'player_1', 'player', '很好！');
      
      const stats = socialSystem.getSocialStats('player_1');
      
      expect(stats).toBeDefined();
      expect(stats!.totalReceivedGifts).toBe(3);
      expect(stats!.totalReceivedLikes).toBe(1);
      expect(stats!.totalReceivedComments).toBe(1);
    });

    test('统计应该包含社交点数', () => {
      socialSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      socialSystem.like('player_1', '玩家 1', 'player_2', 'player');
      
      const stats = socialSystem.getSocialStats('player_1');
      
      expect(stats!.socialPoints).toBeGreaterThan(0);
    });
  });

  describe('好友推荐 - Friend Suggestions', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
    });

    test('应该更新好友推荐', () => {
      const suggestions = ['player_2', 'player_3', 'player_4'];
      socialSystem.updateFriendSuggestions('player_1', suggestions);
      
      const result = socialSystem.getFriendSuggestions('player_1');
      expect(result).toEqual(suggestions);
    });

    test('好友推荐最多 20 个', () => {
      const suggestions = Array(30).fill(null).map((_, i) => `player_${i}`);
      socialSystem.updateFriendSuggestions('player_1', suggestions);
      
      const result = socialSystem.getFriendSuggestions('player_1');
      expect(result.length).toBe(20);
    });
  });

  describe('社交点数兑换 - Points Redemption', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
      // 先获得一些点数
      socialSystem.visitPlayer('player_1', '玩家 1', 'player_2');
      socialSystem.visitPlayer('player_1', '玩家 1', 'player_3');
      socialSystem.initializePlayerState('player_3');
    });

    test('应该兑换金币奖励', () => {
      const stats = socialSystem.getSocialStats('player_1');
      const points = stats!.socialPoints;
      
      const result = socialSystem.redeemPoints('player_1', points, 'gold');
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(result.reward!.type).toBe('gold');
      
      const newStats = socialSystem.getSocialStats('player_1');
      expect(newStats!.socialPoints).toBe(0);
    });

    test('应该兑换物品奖励', () => {
      const stats = socialSystem.getSocialStats('player_1');
      const points = stats!.socialPoints;
      
      const result = socialSystem.redeemPoints('player_1', points, 'item');
      
      expect(result.success).toBe(true);
      expect(result.reward!.type).toBe('item');
      expect(result.reward!.itemName).toBe('社交礼盒');
    });

    test('点数不足不能兑换', () => {
      const result = socialSystem.redeemPoints('player_1', 1000, 'gold');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('社交点数不足');
    });
  });

  describe('配置管理 - Configuration Management', () => {
    test('应该使用默认配置', () => {
      const config = socialSystem.getConfig();
      
      expect(config.maxDailyVisits).toBe(20);
      expect(config.visitCooldownMs).toBe(300000);
      expect(config.maxFriends).toBe(100);
      expect(config.enableGiftSystem).toBe(true);
      expect(config.enableReputation).toBe(true);
    });

    test('应该可以更新配置', () => {
      socialSystem.updateConfig({
        maxDailyVisits: 10,
        enableGiftSystem: false,
      });
      
      const config = socialSystem.getConfig();
      expect(config.maxDailyVisits).toBe(10);
      expect(config.enableGiftSystem).toBe(false);
      expect(config.maxFriends).toBe(100); // 未改变
    });
  });

  describe('数据导出导入 - Data Export/Import', () => {
    beforeEach(() => {
      socialSystem.initializePlayerState('player_1');
      socialSystem.initializePlayerState('player_2');
      socialSystem.visitPlayer('player_1', '玩家 1', 'player_2');
    });

    test('应该导出社交数据', () => {
      const data = socialSystem.exportData();
      
      expect(data).toBeDefined();
      expect((data as any).interactions.length).toBeGreaterThan(0);
      expect((data as any).playerStates.length).toBe(2);
      expect((data as any).config.maxDailyVisits).toBe(20);
    });

    test('应该导入社交数据', () => {
      const newData = {
        interactions: Array.from(socialSystem['interactions'].entries()),
        playerStates: [[
          'player_3',
          {
            userId: 'player_3',
            socialPoints: 100,
            reputation: 50,
            visitedBy: [],
            visitedToday: 5,
            receivedGifts: [],
            receivedLikes: 10,
            receivedComments: 5,
            blockedUsers: ['player_4'],
            friendSuggestions: [],
          },
        ]] as [string, any][],
        config: { maxDailyVisits: 15, visitCooldownMs: 300000, maxFriends: 100, enableGiftSystem: true, enableReputation: true, socialPointRates: { visit: 1, gift: 5, like: 1, comment: 2 } },
      };

      socialSystem.importData(newData);
      
      const stats = socialSystem.getSocialStats('player_3');
      expect(stats).toBeDefined();
      expect(stats!.socialPoints).toBe(100);
      
      const config = socialSystem.getConfig();
      expect(config.maxDailyVisits).toBe(15);
    });
  });
});
