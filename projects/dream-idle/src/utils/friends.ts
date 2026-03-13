/**
 * 好友系统 - v0.8
 * 功能：添加好友、好友列表、好友度、赠送体力
 */

// 好友关系类型
export enum FriendRelation {
  Stranger = 'stranger',    // 陌生人
  Pending = 'pending',      // 待确认
  Friend = 'friend',        // 好友
  Blacklisted = 'blacklisted' // 黑名单
}

// 好友信息
export interface Friend {
  id: string;
  userId: string;
  nickname: string;
  level: number;
  relation: FriendRelation;
  friendship: number;  // 好友度
  lastGiftTime: number | null;  // 上次赠送体力时间
  addedAt: number;
}

// 好友请求
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromNickname: string;
  fromLevel: number;
  createdAt: number;
}

// 最大好友数
const MAX_FRIENDS = 50;
// 好友度上限
const MAX_FRIENDSHIP = 100;
// 赠送体力冷却时间（毫秒）
const GIFT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 小时

/**
 * 添加好友
 */
export function addFriend(
  friends: Friend[],
  userId: string,
  nickname: string,
  level: number
): FriendRequest | null {
  // 检查是否已满
  const friendCount = friends.filter(f => f.relation === FriendRelation.Friend).length;
  if (friendCount >= MAX_FRIENDS) {
    return null; // 好友已满
  }
  
  // 检查是否已是好友
  const existing = friends.find(f => f.userId === userId);
  if (existing) {
    if (existing.relation === FriendRelation.Friend) {
      return null; // 已是好友
    }
    if (existing.relation === FriendRelation.Blacklisted) {
      return null; // 在黑名单中
    }
  }
  
  // 创建好友请求
  const request: FriendRequest = {
    id: `req_${Date.now()}`,
    fromUserId: userId,
    fromNickname: nickname,
    fromLevel: level,
    createdAt: Date.now()
  };
  
  return request;
}

/**
 * 接受好友请求
 */
export function acceptFriendRequest(
  friends: Friend[],
  request: FriendRequest
): Friend {
  const newFriend: Friend = {
    id: `friend_${Date.now()}`,
    userId: request.fromUserId,
    nickname: request.fromNickname,
    level: request.fromLevel,
    relation: FriendRelation.Friend,
    friendship: 0,
    lastGiftTime: null,
    addedAt: Date.now()
  };
  
  friends.push(newFriend);
  return newFriend;
}

/**
 * 删除好友
 */
export function removeFriend(friends: Friend[], userId: string): boolean {
  const index = friends.findIndex(f => f.userId === userId);
  if (index !== -1) {
    friends.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * 加入黑名单
 */
export function addToBlacklist(friends: Friend[], userId: string): boolean {
  const friend = friends.find(f => f.userId === userId);
  if (friend) {
    friend.relation = FriendRelation.Blacklisted;
    return true;
  }
  return false;
}

/**
 * 赠送体力
 */
export function giftStamina(friends: Friend[], userId: string): boolean {
  const friend = friends.find(f => f.userId === userId && f.relation === FriendRelation.Friend);
  if (!friend) {
    return false; // 不是好友
  }
  
  const now = Date.now();
  if (friend.lastGiftTime && (now - friend.lastGiftTime) < GIFT_COOLDOWN) {
    return false; // 冷却中
  }
  
  // 赠送体力
  friend.lastGiftTime = now;
  friend.friendship = Math.min(friend.friendship + 10, MAX_FRIENDSHIP);
  
  return true;
}

/**
 * 增加好友度
 */
export function increaseFriendship(friends: Friend[], userId: string, amount: number): boolean {
  const friend = friends.find(f => f.userId === userId && f.relation === FriendRelation.Friend);
  if (!friend) {
    return false;
  }
  
  friend.friendship = Math.min(friend.friendship + amount, MAX_FRIENDSHIP);
  return true;
}

/**
 * 获取好友列表
 */
export function getFriendList(friends: Friend[]): Friend[] {
  return friends
    .filter(f => f.relation === FriendRelation.Friend)
    .sort((a, b) => b.friendship - a.friendship); // 按好友度排序
}

/**
 * 获取可赠送体力的好友
 */
export function getGiftableFriends(friends: Friend[]): Friend[] {
  const now = Date.now();
  return friends.filter(f => 
    f.relation === FriendRelation.Friend && 
    (!f.lastGiftTime || (now - f.lastGiftTime) >= GIFT_COOLDOWN)
  );
}

/**
 * 查找好友
 */
export function findFriend(friends: Friend[], userId: string): Friend | null {
  return friends.find(f => f.userId === userId) || null;
}
