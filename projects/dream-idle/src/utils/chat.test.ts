/**
 * v0.11 聊天系统单元测试
 * Chat System Unit Tests
 */

import { ChatSystem, ChatChannel, ChatMessage } from './chat';

describe('ChatSystem - 聊天系统', () => {
  let chatSystem: ChatSystem;

  beforeEach(() => {
    chatSystem = new ChatSystem();
  });

  describe('频道管理 - Channel Management', () => {
    test('应该自动创建世界频道和系统频道', () => {
      const worldChannel = (chatSystem as any).channels.get('world');
      const systemChannel = (chatSystem as any).channels.get('system');

      expect(worldChannel).toBeDefined();
      expect(worldChannel.name).toBe('世界频道');
      expect(worldChannel.type).toBe('world');

      expect(systemChannel).toBeDefined();
      expect(systemChannel.name).toBe('系统消息');
      expect(systemChannel.type).toBe('system');
    });

    test('应该创建自定义频道', () => {
      const channel: ChatChannel = {
        id: 'test_channel',
        name: '测试频道',
        type: 'guild',
        members: [],
        isMuted: false,
        maxHistory: 100,
      };

      const result = chatSystem.createChannel(channel);
      
      expect(result).toBe(true);
      // 频道已创建，可以通过内部检查验证
      const createdChannel = (chatSystem as any).channels.get('test_channel');
      expect(createdChannel).toBeDefined();
      expect(createdChannel.name).toBe('测试频道');
    });

    test('不应该创建重复频道', () => {
      const channel: ChatChannel = {
        id: 'duplicate_channel',
        name: '重复频道',
        type: 'guild',
        members: [],
        isMuted: false,
        maxHistory: 100,
      };

      expect(chatSystem.createChannel(channel)).toBe(true);
      expect(chatSystem.createChannel(channel)).toBe(false);
    });

    test('应该创建公会频道', () => {
      const result = chatSystem.createGuildChannel('guild_123', '梦幻公会');
      
      expect(result).toBe(true);
      const guildChannel = (chatSystem as any).channels.get('guild_guild_123');
      expect(guildChannel).toBeDefined();
      expect(guildChannel.name).toBe('梦幻公会公会');
      expect(guildChannel.type).toBe('guild');
    });

    test('应该创建私聊频道', () => {
      const channelId1 = chatSystem.createPrivateChannel('user_a', 'user_b');
      const channelId2 = chatSystem.createPrivateChannel('user_b', 'user_a');
      
      // 确保频道 ID 一致（按字母顺序）
      expect(channelId1).toBe(channelId2);
      expect(channelId1).toBe('user_a_user_b');
    });
  });

  describe('玩家状态管理 - Player State Management', () => {
    test('应该初始化玩家聊天状态', () => {
      const state = chatSystem.initializePlayerState('player_1', '玩家 1');
      
      expect(state.userId).toBe('player_1');
      expect(state.isMuted).toBe(false);
      expect(state.mutedChannels).toEqual([]);
      expect(state.blockedUsers).toEqual([]);
    });

    test('应该自动加入世界频道', () => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
      
      const worldChannel = (chatSystem as any).channels.get('world');
      expect(worldChannel.members).toContain('player_1');
    });

    test('不应该重复初始化玩家状态', () => {
      const state1 = chatSystem.initializePlayerState('player_1', '玩家 1');
      const state2 = chatSystem.initializePlayerState('player_1', '玩家 1');
      
      expect(state1).toBe(state2);
    });

    test('应该加入频道', () => {
      chatSystem.createChannel({
        id: 'guild_1',
        name: '公会频道',
        type: 'guild',
        members: [],
        isMuted: false,
        maxHistory: 100,
      });

      chatSystem.initializePlayerState('player_1', '玩家 1');
      const result = chatSystem.joinChannel('player_1', 'guild_1');
      
      expect(result).toBe(true);
      const guildChannel = (chatSystem as any).channels.get('guild_1');
      expect(guildChannel.members).toContain('player_1');
    });

    test('应该离开频道', () => {
      chatSystem.createChannel({
        id: 'guild_1',
        name: '公会频道',
        type: 'guild',
        members: ['player_1'],
        isMuted: false,
        maxHistory: 100,
      });

      chatSystem.initializePlayerState('player_1', '玩家 1');
      const result = chatSystem.leaveChannel('player_1', 'guild_1');
      
      expect(result).toBe(true);
      const guildChannel = (chatSystem as any).channels.get('guild_1');
      expect(guildChannel.members).not.toContain('player_1');
    });

    test('不应该离开世界频道', () => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
      const result = chatSystem.leaveChannel('player_1', 'world');
      
      expect(result).toBe(false);
    });
  });

  describe('消息发送 - Message Sending', () => {
    beforeEach(() => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
      chatSystem.initializePlayerState('player_2', '玩家 2');
    });

    test('应该成功发送消息到世界频道', () => {
      const result = chatSystem.sendMessage('player_1', 'world', '大家好！', '玩家 1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message!.content).toBe('大家好！');
      expect(result.message!.senderId).toBe('player_1');
      expect(result.message!.channelId).toBe('world');
      expect(result.message!.type).toBe('text');
    });

    test('不应该发送到不存在的频道', () => {
      const result = chatSystem.sendMessage('player_1', 'nonexistent', '测试', '玩家 1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('频道不存在');
    });

    test('不应该在禁言时发送消息', () => {
      chatSystem.mutePlayer('player_1', 3600000); // 禁言 1 小时
      
      const result = chatSystem.sendMessage('player_1', 'world', '测试', '玩家 1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('禁言');
    });

    test('不应该在频道禁言时发送消息', () => {
      chatSystem.muteChannel('world');
      
      const result = chatSystem.sendMessage('player_1', 'world', '测试', '玩家 1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('该频道已被管理员禁言');
    });

    test('非世界频道应该检查成员资格', () => {
      chatSystem.createChannel({
        id: 'guild_1',
        name: '公会频道',
        type: 'guild',
        members: ['player_2'], // player_1 不在其中
        isMuted: false,
        maxHistory: 100,
      });

      const result = chatSystem.sendMessage('player_1', 'guild_1', '测试', '玩家 1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('您不在该频道中');
    });

    test('应该过滤敏感词', () => {
      const result = chatSystem.sendMessage('player_1', 'world', '这个广告很好', '玩家 1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('消息包含敏感词，请文明聊天');
    });

    test('应该限制消息历史记录数量', () => {
      const channel: ChatChannel = {
        id: 'test_channel',
        name: '测试频道',
        type: 'guild',
        members: ['player_1'],
        isMuted: false,
        maxHistory: 10,
      };
      chatSystem.createChannel(channel);

      // 发送 15 条消息
      for (let i = 0; i < 15; i++) {
        chatSystem.sendMessage('player_1', 'test_channel', `消息${i}`, '玩家 1');
      }

      const history = chatSystem.getChannelHistory('test_channel');
      expect(history.length).toBe(10); // 应该只保留 10 条
      expect(history[0].content).toBe('消息5'); // 第一条应该是第 6 条消息
    });
  });

  describe('系统消息 - System Messages', () => {
    test('应该发送系统消息', () => {
      const message = chatSystem.sendSystemMessage('world', '系统维护通知');
      
      expect(message).toBeDefined();
      expect(message!.senderId).toBe('system');
      expect(message!.senderName).toBe('系统');
      expect(message!.content).toBe('系统维护通知');
      expect(message!.type).toBe('system');
    });

    test('不应该发送到不存在的频道', () => {
      const message = chatSystem.sendSystemMessage('nonexistent', '测试');
      
      expect(message).toBeNull();
    });
  });

  describe('未读消息 - Unread Messages', () => {
    beforeEach(() => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
      chatSystem.initializePlayerState('player_2', '玩家 2');
    });

    test('应该增加未读消息计数', () => {
      chatSystem.sendMessage('player_1', 'world', '消息 1', '玩家 1');
      chatSystem.sendMessage('player_1', 'world', '消息 2', '玩家 1');
      
      const unreadCount = chatSystem.getUnreadCount('player_2', 'world');
      expect(unreadCount).toBe(2);
    });

    test('不应该增加发送者的未读计数', () => {
      chatSystem.sendMessage('player_1', 'world', '消息 1', '玩家 1');
      
      const unreadCount = chatSystem.getUnreadCount('player_1', 'world');
      expect(unreadCount).toBe(0);
    });

    test('应该标记消息为已读', () => {
      chatSystem.sendMessage('player_1', 'world', '消息 1', '玩家 1');
      
      expect(chatSystem.getUnreadCount('player_2', 'world')).toBe(1);
      
      chatSystem.markAsRead('player_2', 'world');
      expect(chatSystem.getUnreadCount('player_2', 'world')).toBe(0);
    });

    test('应该标记所有频道为已读', () => {
      chatSystem.sendMessage('player_1', 'world', '消息 1', '玩家 1');
      chatSystem.createChannel({
        id: 'guild_1',
        name: '公会',
        type: 'guild',
        members: ['player_1', 'player_2'],
        isMuted: false,
        maxHistory: 100,
      });
      chatSystem.sendMessage('player_1', 'guild_1', '消息 2', '玩家 1');
      
      chatSystem.markAllAsRead('player_2');
      
      expect(chatSystem.getUnreadCount('player_2', 'world')).toBe(0);
      expect(chatSystem.getUnreadCount('player_2', 'guild_1')).toBe(0);
    });
  });

  describe('禁言系统 - Mute System', () => {
    beforeEach(() => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
    });

    test('应该禁言玩家', () => {
      chatSystem.mutePlayer('player_1', 3600000); // 1 小时
      
      const state = (chatSystem as any).playerStates.get('player_1');
      expect(state.isMuted).toBe(true);
      expect(state.muteUntil).toBeDefined();
      expect(state.muteUntil).toBeGreaterThan(Date.now());
    });

    test('应该解除禁言', () => {
      chatSystem.mutePlayer('player_1', 3600000);
      chatSystem.unmutePlayer('player_1');
      
      const state = (chatSystem as any).playerStates.get('player_1');
      expect(state.isMuted).toBe(false);
      expect(state.muteUntil).toBeUndefined();
    });

    test('应该禁言频道', () => {
      const result = chatSystem.muteChannel('world');
      
      expect(result).toBe(true);
      const channel = (chatSystem as any).channels.get('world');
      expect(channel.isMuted).toBe(true);
    });

    test('应该解除频道禁言', () => {
      chatSystem.muteChannel('world');
      const result = chatSystem.unmuteChannel('world');
      
      expect(result).toBe(true);
      const channel = (chatSystem as any).channels.get('world');
      expect(channel.isMuted).toBe(false);
    });
  });

  describe('拉黑系统 - Block System', () => {
    beforeEach(() => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
    });

    test('应该拉黑用户', () => {
      const result = chatSystem.blockUser('player_1', 'player_2');
      
      expect(result).toBe(true);
      const state = (chatSystem as any).playerStates.get('player_1');
      expect(state.blockedUsers).toContain('player_2');
    });

    test('应该取消拉黑', () => {
      chatSystem.blockUser('player_1', 'player_2');
      const result = chatSystem.unblockUser('player_1', 'player_2');
      
      expect(result).toBe(true);
      const state = (chatSystem as any).playerStates.get('player_1');
      expect(state.blockedUsers).not.toContain('player_2');
    });

    test('不应该重复拉黑', () => {
      chatSystem.blockUser('player_1', 'player_2');
      chatSystem.blockUser('player_1', 'player_2');
      
      const state = (chatSystem as any).playerStates.get('player_1');
      expect(state.blockedUsers.filter(id => id === 'player_2').length).toBe(1);
    });
  });

  describe('敏感词过滤 - Profanity Filter', () => {
    test('应该过滤敏感词', () => {
      const result = chatSystem.filterProfanity('这个广告很好');
      
      expect(result.isFiltered).toBe(true);
      expect(result.content).toBe('这个***很好');
    });

    test('应该过滤多个敏感词', () => {
      const result = chatSystem.filterProfanity('广告和私服都不好');
      
      expect(result.isFiltered).toBe(true);
      expect(result.content).toBe('***和***都不好');
    });

    test('不应该过滤正常内容', () => {
      const result = chatSystem.filterProfanity('今天天气真好');
      
      expect(result.isFiltered).toBe(false);
      expect(result.content).toBe('今天天气真好');
    });

    test('应该添加敏感词', () => {
      chatSystem.addProfanityWord('测试词');
      const result = chatSystem.filterProfanity('这个测试词不好');
      
      expect(result.isFiltered).toBe(true);
      expect(result.content).toBe('这个***不好');
    });

    test('应该移除敏感词', () => {
      chatSystem.removeProfanityWord('广告');
      const result = chatSystem.filterProfanity('这个广告很好');
      
      expect(result.isFiltered).toBe(false);
      expect(result.content).toBe('这个广告很好');
    });
  });

  describe('频道查询 - Channel Queries', () => {
    beforeEach(() => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
      chatSystem.createChannel({
        id: 'guild_1',
        name: '公会频道',
        type: 'guild',
        members: ['player_1'],
        isMuted: false,
        maxHistory: 100,
      });
    });

    test('应该获取玩家所在频道列表', () => {
      const channels = chatSystem.getPlayerChannels('player_1');
      
      expect(channels.length).toBeGreaterThanOrEqual(2); // world + guild_1
      expect(channels.some(c => c.id === 'world')).toBe(true);
      expect(channels.some(c => c.id === 'guild_1')).toBe(true);
    });

    test('应该获取世界频道在线人数', () => {
      chatSystem.initializePlayerState('player_2', '玩家 2');
      chatSystem.initializePlayerState('player_3', '玩家 3');
      
      const count = chatSystem.getOnlineCount();
      expect(count).toBe(3); // player_1, player_2, player_3
    });
  });

  describe('消息历史 - Message History', () => {
    beforeEach(() => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
    });

    test('应该获取频道消息历史', () => {
      chatSystem.sendMessage('player_1', 'world', '消息 1', '玩家 1');
      chatSystem.sendMessage('player_1', 'world', '消息 2', '玩家 1');
      chatSystem.sendMessage('player_1', 'world', '消息 3', '玩家 1');
      
      const history = chatSystem.getChannelHistory('world');
      expect(history.length).toBe(3);
      expect(history[0].content).toBe('消息 1');
      expect(history[2].content).toBe('消息 3');
    });

    test('应该限制返回的消息数量', () => {
      for (let i = 0; i < 10; i++) {
        chatSystem.sendMessage('player_1', 'world', `消息${i}`, '玩家 1');
      }
      
      const history = chatSystem.getChannelHistory('world', 5);
      expect(history.length).toBe(5);
      expect(history[0].content).toBe('消息5');
    });

    test('空频道应该返回空数组', () => {
      const history = chatSystem.getChannelHistory('world');
      expect(history).toEqual([]);
    });
  });

  describe('数据导出导入 - Data Export/Import', () => {
    beforeEach(() => {
      chatSystem.initializePlayerState('player_1', '玩家 1');
      chatSystem.sendMessage('player_1', 'world', '测试消息', '玩家 1');
    });

    test('应该导出频道数据', () => {
      const data = chatSystem.exportChannelData('world');
      
      expect(data).toBeDefined();
      expect((data as any).channel.id).toBe('world');
      expect((data as any).messages.length).toBe(1);
      expect((data as any).messages[0].content).toBe('测试消息');
    });

    test('不应该导出不存在的频道', () => {
      const data = chatSystem.exportChannelData('nonexistent');
      expect(data).toBeNull();
    });

    test('应该导入频道数据', () => {
      const newData = {
        channel: {
          id: 'imported_channel',
          name: '导入频道',
          type: 'guild' as const,
          members: ['player_1'],
          isMuted: false,
          maxHistory: 100,
        },
        messages: [
          {
            id: 'msg_1',
            channelId: 'imported_channel',
            senderId: 'player_1',
            senderName: '玩家 1',
            content: '导入的消息',
            timestamp: Date.now(),
            type: 'text' as const,
          },
        ],
      };

      chatSystem.importChannelData('imported_channel', newData);
      
      const channels = chatSystem.getPlayerChannels('player_1');
      expect(channels.some(c => c.id === 'imported_channel')).toBe(true);
      
      const history = chatSystem.getChannelHistory('imported_channel');
      expect(history.length).toBe(1);
      expect(history[0].content).toBe('导入的消息');
    });
  });
});
