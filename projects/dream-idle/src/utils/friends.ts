/**
 * v0.23 好友助战系统 (Friend Support System)
 * 
 * 功能：
 * - 好友列表管理
 * - 助战宠物借用
 * - 助战收益分享
 * - 好友推荐
 * - 友情点系统
 */

// ==================== 类型定义 ====================

export interface Friend {
  playerId: string;
  playerName: string;
  level: number;
  power: number;
  isOnline: boolean;
  friendshipPoints: number;
  addedAt: number;
  lastActiveTime: number;
  supportPet?: {
    petId: string;
    petName: string;
    power: number;
  };
}

export interface SupportRequest {
  requestId: string;
  requesterId: string;
  requesterName: string;
  targetFriendId: string;
  petId: string;
  purpose: 'tower' | 'arena' | 'level';
  createdAt: number;
  expiresAt: number;
  isAccepted: boolean;
}

export interface BorrowedPet {
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  power: number;
  borrowedAt: number;
  expiresAt: number;
  usedIn: 'tower' | 'arena' | 'level';
  usedCount: number;
  maxUses: number;
}

export interface FriendshipReward {
  lenderGold: number;
  lenderFriendshipPoints: number;
  borrowerCost: number;
}

export interface FriendConfig {
  maxFriends: number;
  maxBorrowedPets: number;
  borrowDurationHours: number;
  maxPetUses: number;
  friendshipPointsPerBorrow: number;
  lenderGoldReward: number;
  requestExpiryHours: number;
  dailyFriendshipLimit: number;
}

// ==================== 配置 ====================

export const FRIEND_CONFIG: FriendConfig = {
  maxFriends: 50,
  maxBorrowedPets: 3,
  borrowDurationHours: 24,
  maxPetUses: 5,
  friendshipPointsPerBorrow: 10,
  lenderGoldReward: 50,
  requestExpiryHours: 24,
  dailyFriendshipLimit: 100,
};

// ==================== 工具函数 ====================

/**
 * 创建好友关系
 */
export function createFriend(
  playerId: string,
  playerName: string,
  level: number,
  power: number
): Friend {
  return {
    playerId,
    playerName,
    level,
    power,
    isOnline: false,
    friendshipPoints: 0,
    addedAt: Date.now(),
    lastActiveTime: Date.now(),
  };
}

/**
 * 添加好友
 */
export function addFriend(
  friends: Friend[],
  newFriend: Friend
): { friends: Friend[]; success: boolean; error?: string } {
  if (friends.length >= FRIEND_CONFIG.maxFriends) {
    return { friends, success: false, error: '好友列表已满' };
  }

  if (friends.some((f) => f.playerId === newFriend.playerId)) {
    return { friends, success: false, error: '已是好友' };
  }

  return {
    friends: [...friends, newFriend],
    success: true,
  };
}

/**
 * 删除好友
 */
export function removeFriend(friends: Friend[], playerId: string): Friend[] {
  return friends.filter((f) => f.playerId !== playerId);
}

/**
 * 设置助战宠物
 */
export function setSupportPet(
  friend: Friend,
  petId: string,
  petName: string,
  power: number
): Friend {
  return {
    ...friend,
    supportPet: {
      petId,
      petName,
      power,
    },
  };
}

/**
 * 清除助战宠物
 */
export function clearSupportPet(friend: Friend): Friend {
  return {
    ...friend,
    supportPet: undefined,
  };
}

/**
 * 创建助战请求
 */
export function createSupportRequest(
  requesterId: string,
  requesterName: string,
  targetFriendId: string,
  petId: string,
  purpose: 'tower' | 'arena' | 'level'
): SupportRequest {
  const now = Date.now();
  return {
    requestId: `support_${now}_${requesterId}`,
    requesterId,
    requesterName,
    targetFriendId,
    petId,
    purpose,
    createdAt: now,
    expiresAt: now + FRIEND_CONFIG.requestExpiryHours * 60 * 60 * 1000,
    isAccepted: false,
  };
}

/**
 * 接受助战请求
 */
export function acceptSupportRequest(request: SupportRequest): SupportRequest {
  return {
    ...request,
    isAccepted: true,
  };
}

/**
 * 拒绝助战请求
 */
export function rejectSupportRequest(request: SupportRequest): SupportRequest {
  return {
    ...request,
    isAccepted: false,
  };
}

/**
 * 检查请求是否过期
 */
export function isRequestExpired(request: SupportRequest): boolean {
  return Date.now() > request.expiresAt;
}

/**
 * 借用宠物
 */
export function borrowPet(
  friend: Friend,
  purpose: 'tower' | 'arena' | 'level'
): { borrowedPet: BorrowedPet | null; error?: string } {
  if (!friend.supportPet) {
    return { borrowedPet: null, error: '好友未设置助战宠物' };
  }

  const now = Date.now();
  return {
    borrowedPet: {
      petId: friend.supportPet.petId,
      petName: friend.supportPet.petName,
      ownerId: friend.playerId,
      ownerName: friend.playerName,
      power: friend.supportPet.power,
      borrowedAt: now,
      expiresAt: now + FRIEND_CONFIG.borrowDurationHours * 60 * 60 * 1000,
      usedIn: purpose,
      usedCount: 0,
      maxUses: FRIEND_CONFIG.maxPetUses,
    },
  };
}

/**
 * 使用借用的宠物
 */
export function useBorrowedPet(borrowedPet: BorrowedPet): { 
  borrowedPet: BorrowedPet | null; 
  success: boolean; 
  error?: string 
} {
  if (borrowedPet.usedCount >= borrowedPet.maxUses) {
    return { borrowedPet: null, success: false, error: '使用次数已用尽' };
  }

  if (Date.now() > borrowedPet.expiresAt) {
    return { borrowedPet: null, success: false, error: '借用已过期' };
  }

  return {
    borrowedPet: {
      ...borrowedPet,
      usedCount: borrowedPet.usedCount + 1,
    },
    success: true,
  };
}

/**
 * 检查借用是否有效
 */
export function isBorrowValid(borrowedPet: BorrowedPet): boolean {
  return (
    Date.now() <= borrowedPet.expiresAt &&
    borrowedPet.usedCount < borrowedPet.maxUses
  );
}

/**
 * 计算助战奖励
 */
export function calculateSupportReward(
  borrowedPet: BorrowedPet,
  battleRewards: { gold: number; exp: number }
): FriendshipReward {
  const lenderGoldReward = FRIEND_CONFIG.lenderGoldReward;
  const lenderFriendshipPoints = FRIEND_CONFIG.friendshipPointsPerBorrow;
  const borrowerCost = 0; // 免费借用

  return {
    lenderGold: lenderGoldReward,
    lenderFriendshipPoints,
    borrowerCost,
  };
}

/**
 * 增加友情点
 */
export function addFriendshipPoints(
  friend: Friend,
  points: number,
  dailyEarned: number
): { friend: Friend; actualPoints: number } {
  const remainingLimit = FRIEND_CONFIG.dailyFriendshipLimit - dailyEarned;
  const actualPoints = Math.min(points, remainingLimit);

  return {
    friend: {
      ...friend,
      friendshipPoints: friend.friendshipPoints + actualPoints,
    },
    actualPoints,
  };
}

/**
 * 获取可借用宠物的好友列表
 */
export function getAvailableSupportFriends(friends: Friend[]): Friend[] {
  return friends.filter(
    (f) => f.supportPet && f.isOnline && f.friendshipPoints >= 0
  );
}

/**
 * 推荐好友（根据活跃度和战力）
 */
export function recommendFriends(
  friends: Friend[],
  count: number = 5
): Friend[] {
  // 按活跃度和战力排序
  const sorted = [...friends].sort((a, b) => {
    // 在线优先
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;

    // 有助战宠物优先
    if (a.supportPet && !b.supportPet) return -1;
    if (!a.supportPet && b.supportPet) return 1;

    // 战力高的优先
    return b.power - a.power;
  });

  return sorted.slice(0, count);
}

/**
 * 获取好友统计
 */
export function getFriendStats(friends: Friend[]): {
  totalFriends: number;
  onlineFriends: number;
  friendsWithSupportPet: number;
  averagePower: number;
  totalFriendshipPoints: number;
} {
  const onlineFriends = friends.filter((f) => f.isOnline).length;
  const friendsWithSupportPet = friends.filter((f) => f.supportPet).length;
  const totalPower = friends.reduce((sum, f) => sum + f.power, 0);
  const totalFriendshipPoints = friends.reduce(
    (sum, f) => sum + f.friendshipPoints,
    0
  );

  return {
    totalFriends: friends.length,
    onlineFriends,
    friendsWithSupportPet,
    averagePower: friends.length > 0 ? Math.floor(totalPower / friends.length) : 0,
    totalFriendshipPoints,
  };
}

/**
 * 更新好友在线状态
 */
export function updateFriendOnlineStatus(
  friends: Friend[],
  playerId: string,
  isOnline: boolean
): Friend[] {
  return friends.map((f) =>
    f.playerId === playerId
      ? { ...f, isOnline, lastActiveTime: Date.now() }
      : f
  );
}

/**
 * 清理过期助战请求
 */
export function cleanupExpiredRequests(requests: SupportRequest[]): SupportRequest[] {
  return requests.filter((r) => !isRequestExpired(r));
}

/**
 * 搜索好友
 */
export function searchFriends(
  friends: Friend[],
  query: string
): Friend[] {
  const lowerQuery = query.toLowerCase();
  return friends.filter(
    (f) =>
      f.playerName.toLowerCase().includes(lowerQuery) ||
      f.playerId.toLowerCase().includes(lowerQuery)
  );
}


