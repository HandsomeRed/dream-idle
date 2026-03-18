/**
 * v0.23 好友助战系统测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  createFriend,
  addFriend,
  removeFriend,
  setSupportPet,
  clearSupportPet,
  createSupportRequest,
  acceptSupportRequest,
  rejectSupportRequest,
  isRequestExpired,
  borrowPet,
  useBorrowedPet,
  isBorrowValid,
  calculateSupportReward,
  addFriendshipPoints,
  getAvailableSupportFriends,
  recommendFriends,
  getFriendStats,
  updateFriendOnlineStatus,
  cleanupExpiredRequests,
  searchFriends,
  FRIEND_CONFIG,
  type Friend,
  type SupportRequest,
} from './friends';

describe('v0.23 好友助战系统', () => {
  // ==================== 好友管理测试 ====================

  describe('好友管理', () => {
    it('应该能创建好友', () => {
      const friend = createFriend('player_001', '玩家 1', 10, 1000);
      expect(friend.playerId).toBe('player_001');
      expect(friend.playerName).toBe('玩家 1');
      expect(friend.level).toBe(10);
      expect(friend.power).toBe(1000);
      expect(friend.isOnline).toBe(false);
    });

    it('应该能添加好友', () => {
      const friends: Friend[] = [];
      const newFriend = createFriend('player_001', '玩家 1', 10, 1000);

      const { friends: newFriends, success } = addFriend(friends, newFriend);
      expect(success).toBe(true);
      expect(newFriends).toHaveLength(1);
    });

    it('不能添加重复好友', () => {
      const friends: Friend[] = [createFriend('player_001', '玩家 1', 10, 1000)];
      const duplicate = createFriend('player_001', '玩家 1', 10, 1000);

      const { success, error } = addFriend(friends, duplicate);
      expect(success).toBe(false);
      expect(error).toBe('已是好友');
    });

    it('好友列表已满时不能添加', () => {
      const friends: Friend[] = [];
      for (let i = 0; i < FRIEND_CONFIG.maxFriends; i++) {
        friends.push(createFriend(`player_${i}`, `玩家${i}`, 10, 1000));
      }

      const newFriend = createFriend('player_new', '新玩家', 10, 1000);
      const { success, error } = addFriend(friends, newFriend);

      expect(success).toBe(false);
      expect(error).toBe('好友列表已满');
    });

    it('应该能删除好友', () => {
      const friends: Friend[] = [
        createFriend('player_001', '玩家 1', 10, 1000),
        createFriend('player_002', '玩家 2', 10, 1000),
      ];

      const newFriends = removeFriend(friends, 'player_001');
      expect(newFriends).toHaveLength(1);
      expect(newFriends[0].playerId).toBe('player_002');
    });
  });

  // ==================== 助战宠物测试 ====================

  describe('助战宠物', () => {
    it('应该能设置助战宠物', () => {
      const friend = createFriend('player_001', '玩家 1', 10, 1000);
      const updated = setSupportPet(friend, 'pet_001', '应龙', 5000);

      expect(updated.supportPet).toBeDefined();
      expect(updated.supportPet!.petId).toBe('pet_001');
      expect(updated.supportPet!.petName).toBe('应龙');
      expect(updated.supportPet!.power).toBe(5000);
    });

    it('应该能清除助战宠物', () => {
      let friend = createFriend('player_001', '玩家 1', 10, 1000);
      friend = setSupportPet(friend, 'pet_001', '应龙', 5000);

      const cleared = clearSupportPet(friend);
      expect(cleared.supportPet).toBeUndefined();
    });

    it('应该能获取可借用宠物的好友列表', () => {
      const friends: Friend[] = [
        setSupportPet(createFriend('player_001', '玩家 1', 10, 1000), 'pet_001', '应龙', 5000),
        createFriend('player_002', '玩家 2', 10, 1000),
        setSupportPet(createFriend('player_003', '玩家 3', 10, 1000), 'pet_002', '凤凰', 4500),
      ];
      // 设置在线状态
      friends[0].isOnline = true;
      friends[2].isOnline = true;

      const available = getAvailableSupportFriends(friends);
      expect(available).toHaveLength(2);
      expect(available.every((f) => f.supportPet !== undefined)).toBe(true);
    });
  });

  // ==================== 助战请求测试 ====================

  describe('助战请求', () => {
    it('应该能创建助战请求', () => {
      const request = createSupportRequest(
        'player_001',
        '玩家 1',
        'player_002',
        'pet_001',
        'tower'
      );

      expect(request.requesterId).toBe('player_001');
      expect(request.targetFriendId).toBe('player_002');
      expect(request.petId).toBe('pet_001');
      expect(request.purpose).toBe('tower');
      expect(request.isAccepted).toBe(false);
    });

    it('应该能接受助战请求', () => {
      const request = createSupportRequest('player_001', '玩家 1', 'player_002', 'pet_001', 'tower');
      const accepted = acceptSupportRequest(request);

      expect(accepted.isAccepted).toBe(true);
    });

    it('应该能拒绝助战请求', () => {
      const request = createSupportRequest('player_001', '玩家 1', 'player_002', 'pet_001', 'tower');
      const rejected = rejectSupportRequest(request);

      expect(rejected.isAccepted).toBe(false);
    });

    it('应该能检查请求是否过期', () => {
      const request = createSupportRequest('player_001', '玩家 1', 'player_002', 'pet_001', 'tower');
      expect(isRequestExpired(request)).toBe(false);

      // 模拟过期
      request.expiresAt = Date.now() - 1000;
      expect(isRequestExpired(request)).toBe(true);
    });

    it('应该能清理过期请求', () => {
      const requests: SupportRequest[] = [
        createSupportRequest('player_001', '玩家 1', 'player_002', 'pet_001', 'tower'),
        createSupportRequest('player_001', '玩家 1', 'player_003', 'pet_002', 'arena'),
      ];

      // 让第一个请求过期
      requests[0].expiresAt = Date.now() - 1000;

      const cleaned = cleanupExpiredRequests(requests);
      expect(cleaned).toHaveLength(1);
    });
  });

  // ==================== 借用宠物测试 ====================

  describe('借用宠物', () => {
    it('应该能借用宠物', () => {
      let friend = createFriend('player_001', '玩家 1', 10, 1000);
      friend = setSupportPet(friend, 'pet_001', '应龙', 5000);

      const { borrowedPet, error } = borrowPet(friend, 'tower');
      expect(error).toBeUndefined();
      expect(borrowedPet).not.toBeNull();
      expect(borrowedPet!.petId).toBe('pet_001');
      expect(borrowedPet!.ownerId).toBe('player_001');
      expect(borrowedPet!.usedCount).toBe(0);
      expect(borrowedPet!.maxUses).toBe(5);
    });

    it('好友未设置助战宠物时不能借用', () => {
      const friend = createFriend('player_001', '玩家 1', 10, 1000);
      const { borrowedPet, error } = borrowPet(friend, 'tower');

      expect(borrowedPet).toBeNull();
      expect(error).toBe('好友未设置助战宠物');
    });

    it('应该能使用借用的宠物', () => {
      let friend = createFriend('player_001', '玩家 1', 10, 1000);
      friend = setSupportPet(friend, 'pet_001', '应龙', 5000);

      const { borrowedPet } = borrowPet(friend, 'tower');
      const { borrowedPet: usedPet, success } = useBorrowedPet(borrowedPet!);

      expect(success).toBe(true);
      expect(usedPet!.usedCount).toBe(1);
    });

    it('使用次数用尽后不能继续使用', () => {
      let friend = createFriend('player_001', '玩家 1', 10, 1000);
      friend = setSupportPet(friend, 'pet_001', '应龙', 5000);

      const { borrowedPet } = borrowPet(friend, 'tower');
      let currentPet = borrowedPet!;

      // 使用 5 次
      for (let i = 0; i < 5; i++) {
        const result = useBorrowedPet(currentPet);
        if (result.borrowedPet) currentPet = result.borrowedPet;
      }

      const result = useBorrowedPet(currentPet);
      expect(result.success).toBe(false);
      expect(result.error).toBe('使用次数已用尽');
    });

    it('应该能检查借用是否有效', () => {
      let friend = createFriend('player_001', '玩家 1', 10, 1000);
      friend = setSupportPet(friend, 'pet_001', '应龙', 5000);

      const { borrowedPet } = borrowPet(friend, 'tower');
      expect(isBorrowValid(borrowedPet!)).toBe(true);

      // 模拟过期
      borrowedPet!.expiresAt = Date.now() - 1000;
      expect(isBorrowValid(borrowedPet!)).toBe(false);
    });
  });

  // ==================== 奖励测试 ====================

  describe('奖励系统', () => {
    it('应该能计算助战奖励', () => {
      let friend = createFriend('player_001', '玩家 1', 10, 1000);
      friend = setSupportPet(friend, 'pet_001', '应龙', 5000);

      const { borrowedPet } = borrowPet(friend, 'tower');
      const reward = calculateSupportReward(borrowedPet!, { gold: 1000, exp: 500 });

      expect(reward.lenderGold).toBe(50);
      expect(reward.lenderFriendshipPoints).toBe(10);
      expect(reward.borrowerCost).toBe(0);
    });

    it('应该能增加友情点', () => {
      const friend = createFriend('player_001', '玩家 1', 10, 1000);
      const { friend: updated, actualPoints } = addFriendshipPoints(friend, 50, 0);

      expect(actualPoints).toBe(50);
      expect(updated.friendshipPoints).toBe(50);
    });

    it('友情点增加有每日上限', () => {
      const friend = createFriend('player_001', '玩家 1', 10, 1000);
      const { actualPoints } = addFriendshipPoints(friend, 150, 0);

      expect(actualPoints).toBe(100); // 每日上限
    });
  });

  // ==================== 推荐系统测试 ====================

  describe('推荐系统', () => {
    it('应该能推荐好友', () => {
      const friends: Friend[] = [
        setSupportPet(createFriend('player_001', '玩家 1', 10, 1000), 'pet_001', '应龙', 5000),
        createFriend('player_002', '玩家 2', 10, 2000),
        setSupportPet(createFriend('player_003', '玩家 3', 10, 1500), 'pet_002', '凤凰', 4500),
      ];

      const recommended = recommendFriends(friends, 2);
      expect(recommended).toHaveLength(2);
      // 有助战宠物的应该优先
      expect(recommended[0].supportPet).toBeDefined();
    });

    it('应该能搜索好友', () => {
      const friends: Friend[] = [
        createFriend('player_001', '张三', 10, 1000),
        createFriend('player_002', '李四', 10, 1000),
        createFriend('player_003', '王五', 10, 1000),
      ];

      const results = searchFriends(friends, '张');
      expect(results).toHaveLength(1);
      expect(results[0].playerName).toBe('张三');
    });
  });

  // ==================== 统计测试 ====================

  describe('统计系统', () => {
    it('应该能获取好友统计', () => {
      const friends: Friend[] = [
        setSupportPet(createFriend('player_001', '玩家 1', 10, 1000), 'pet_001', '应龙', 5000),
        createFriend('player_002', '玩家 2', 10, 2000),
        setSupportPet(createFriend('player_003', '玩家 3', 10, 1500), 'pet_002', '凤凰', 4500),
      ];
      friends[0].isOnline = true;
      friends[1].isOnline = true;

      const stats = getFriendStats(friends);
      expect(stats.totalFriends).toBe(3);
      expect(stats.onlineFriends).toBe(2);
      expect(stats.friendsWithSupportPet).toBe(2);
      expect(stats.averagePower).toBe(1500);
    });
  });

  // ==================== 在线状态测试 ====================

  describe('在线状态', () => {
    it('应该能更新好友在线状态', () => {
      const friends: Friend[] = [
        createFriend('player_001', '玩家 1', 10, 1000),
        createFriend('player_002', '玩家 2', 10, 1000),
      ];

      const updated = updateFriendOnlineStatus(friends, 'player_001', true);
      expect(updated[0].isOnline).toBe(true);
      expect(updated[1].isOnline).toBe(false);
    });
  });

  // ==================== 配置测试 ====================

  describe('配置', () => {
    it('最大好友数应该为 50', () => {
      expect(FRIEND_CONFIG.maxFriends).toBe(50);
    });

    it('最大借用宠物数应该为 3', () => {
      expect(FRIEND_CONFIG.maxBorrowedPets).toBe(3);
    });

    it('借用时长应该为 24 小时', () => {
      expect(FRIEND_CONFIG.borrowDurationHours).toBe(24);
    });

    it('宠物最大使用次数应该为 5', () => {
      expect(FRIEND_CONFIG.maxPetUses).toBe(5);
    });

    it('每次借用友情点奖励应该为 10', () => {
      expect(FRIEND_CONFIG.friendshipPointsPerBorrow).toBe(10);
    });

    it('借出者金币奖励应该为 50', () => {
      expect(FRIEND_CONFIG.lenderGoldReward).toBe(50);
    });
  });

  // ==================== 集成测试 ====================

  describe('集成测试', () => {
    it('完整的好友助战流程', () => {
      // 1. 创建好友
      let friend = createFriend('player_001', '玩家 1', 10, 1000);

      // 2. 设置助战宠物
      friend = setSupportPet(friend, 'pet_001', '应龙', 5000);

      // 3. 创建助战请求
      const request = createSupportRequest(
        'player_002',
        '玩家 2',
        'player_001',
        'pet_001',
        'tower'
      );

      // 4. 接受请求
      const acceptedRequest = acceptSupportRequest(request);
      expect(acceptedRequest.isAccepted).toBe(true);

      // 5. 借用宠物
      const { borrowedPet } = borrowPet(friend, 'tower');
      expect(borrowedPet).not.toBeNull();

      // 6. 使用宠物
      const { borrowedPet: usedPet, success } = useBorrowedPet(borrowedPet!);
      expect(success).toBe(true);
      expect(usedPet!.usedCount).toBe(1);

      // 7. 计算奖励
      const reward = calculateSupportReward(usedPet!, { gold: 1000, exp: 500 });
      expect(reward.lenderGold).toBe(50);
      expect(reward.lenderFriendshipPoints).toBe(10);

      // 8. 增加友情点
      const { friend: updatedFriend, actualPoints } = addFriendshipPoints(friend, 10, 0);
      expect(actualPoints).toBe(10);
      expect(updatedFriend.friendshipPoints).toBe(10);
    });

    it('好友推荐和搜索', () => {
      const friends: Friend[] = [
        setSupportPet(createFriend('player_001', '张三', 10, 1000), 'pet_001', '应龙', 5000),
        createFriend('player_002', '李四', 10, 2000),
        setSupportPet(createFriend('player_003', '王五', 10, 1500), 'pet_002', '凤凰', 4500),
        setSupportPet(createFriend('player_004', '赵六', 10, 3000), 'pet_003', '麒麟', 6000),
      ];

      // 推荐
      const recommended = recommendFriends(friends, 3);
      expect(recommended).toHaveLength(3);

      // 搜索
      const searched = searchFriends(friends, '张');
      expect(searched).toHaveLength(1);
      expect(searched[0].playerName).toBe('张三');

      // 统计
      const stats = getFriendStats(friends);
      expect(stats.totalFriends).toBe(4);
      expect(stats.friendsWithSupportPet).toBe(3);
    });
  });
});
