import {
  addFriend,
  acceptFriendRequest,
  removeFriend,
  giftStamina,
  increaseFriendship,
  getFriendList,
  getGiftableFriends,
  FriendRelation
} from './friends';

describe('好友系统 v0.8', () => {
  let friends: any[] = [];
  
  beforeEach(() => {
    friends = [];
  });
  
  describe('添加好友', () => {
    test('成功添加好友', () => {
      const request = addFriend(friends, 'user123', '测试用户', 10);
      expect(request).not.toBeNull();
      expect(request?.fromUserId).toBe('user123');
    });
    
    test('好友数量达到上限', () => {
      for (let i = 0; i < 50; i++) {
        friends.push({
          id: `friend_${i}`,
          userId: `user_${i}`,
          relation: FriendRelation.Friend
        });
      }
      
      const request = addFriend(friends, 'newuser', '新用户', 5);
      expect(request).toBeNull();
    });
  });
  
  describe('接受好友请求', () => {
    test('成功接受请求', () => {
      const request = addFriend(friends, 'user123', '测试用户', 10);
      const friend = acceptFriendRequest(friends, request!);
      
      expect(friend.relation).toBe(FriendRelation.Friend);
      expect(friend.friendship).toBe(0);
      expect(friends.length).toBe(1);
    });
  });
  
  describe('删除好友', () => {
    test('成功删除好友', () => {
      const request = addFriend(friends, 'user123', '测试用户', 10);
      acceptFriendRequest(friends, request!);
      
      const removed = removeFriend(friends, 'user123');
      expect(removed).toBe(true);
      expect(friends.length).toBe(0);
    });
  });
  
  describe('赠送体力', () => {
    test('成功赠送体力', () => {
      const request = addFriend(friends, 'user123', '测试用户', 10);
      const friend = acceptFriendRequest(friends, request!);
      
      const gifted = giftStamina(friends, 'user123');
      expect(gifted).toBe(true);
      expect(friend.lastGiftTime).not.toBeNull();
      expect(friend.friendship).toBe(10);
    });
    
    test('冷却时间内不能赠送', () => {
      const request = addFriend(friends, 'user123', '测试用户', 10);
      const friend = acceptFriendRequest(friends, request!);
      
      giftStamina(friends, 'user123');
      const giftedAgain = giftStamina(friends, 'user123');
      
      expect(giftedAgain).toBe(false);
    });
  });
  
  describe('好友度系统', () => {
    test('增加好友度', () => {
      const request = addFriend(friends, 'user123', '测试用户', 10);
      acceptFriendRequest(friends, request!);
      
      increaseFriendship(friends, 'user123', 20);
      const friend = getFriendList(friends)[0];
      
      expect(friend.friendship).toBe(20);
    });
    
    test('好友度不超过上限', () => {
      const request = addFriend(friends, 'user123', '测试用户', 10);
      acceptFriendRequest(friends, request!);
      
      increaseFriendship(friends, 'user123', 150);
      const friend = getFriendList(friends)[0];
      
      expect(friend.friendship).toBe(100); // 上限
    });
  });
  
  describe('好友列表排序', () => {
    test('按好友度降序排列', () => {
      const r1 = addFriend(friends, 'user1', '用户 1', 5);
      const r2 = addFriend(friends, 'user2', '用户 2', 15);
      const r3 = addFriend(friends, 'user3', '用户 3', 10);
      
      acceptFriendRequest(friends, r1!);
      acceptFriendRequest(friends, r2!);
      acceptFriendRequest(friends, r3!);
      
      increaseFriendship(friends, 'user1', 50);
      increaseFriendship(friends, 'user3', 30);
      
      const list = getFriendList(friends);
      expect(list[0].userId).toBe('user1'); // 好友度最高
      expect(list[1].userId).toBe('user3');
      expect(list[2].userId).toBe('user2');
    });
  });
});
