/**
 * v0.11 聊天系统 - Chat System
 * 梦幻放置游戏聊天功能
 * 
 * Features:
 * - 世界频道 (World Channel)
 * - 公会频道 (Guild Channel)
 * - 好友私聊 (Private Messages)
 * - 聊天禁言系统 (Mute System)
 * - 敏感词过滤 (Profanity Filter)
 * - 聊天记录保存 (Chat History)
 */

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'item' | 'trade';
  isMuted?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'world' | 'guild' | 'private' | 'system';
  members: string[]; // userIds
  isMuted: boolean;
  maxHistory: number;
}

export interface PlayerChatState {
  userId: string;
  isMuted: boolean;
  muteUntil?: number;
  mutedChannels: string[];
  blockedUsers: string[];
  unreadCounts: Record<string, number>;
}

export class ChatSystem {
  private channels: Map<string, ChatChannel>;
  private messages: Map<string, ChatMessage[]>; // channelId -> messages
  private playerStates: Map<string, PlayerChatState>;
  private profanityWords: Set<string>;
  private readonly MAX_HISTORY = 100;
  private readonly MUTE_DURATION = 3600000; // 1 hour

  constructor() {
    this.channels = new Map();
    this.messages = new Map();
    this.playerStates = new Map();
    this.profanityWords = new Set();
    this.initializeDefaultChannels();
    this.initializeProfanityFilter();
  }

  /**
   * 初始化默认频道
   */
  private initializeDefaultChannels() {
    // 世界频道
    this.createChannel({
      id: 'world',
      name: '世界频道',
      type: 'world',
      members: [],
      isMuted: false,
      maxHistory: this.MAX_HISTORY,
    });

    // 系统频道
    this.createChannel({
      id: 'system',
      name: '系统消息',
      type: 'system',
      members: [],
      isMuted: false,
      maxHistory: 50,
    });
  }

  /**
   * 初始化敏感词过滤
   */
  private initializeProfanityFilter() {
    // 基础敏感词列表（示例）
    const basicProfanity = ['广告', '私服', '外挂', '作弊', '刷金'];
    basicProfanity.forEach(word => this.profanityWords.add(word));
  }

  /**
   * 创建频道
   */
  createChannel(channel: ChatChannel): boolean {
    if (this.channels.has(channel.id)) {
      return false;
    }
    this.channels.set(channel.id, channel);
    this.messages.set(channel.id, []);
    return true;
  }

  /**
   * 创建公会频道
   */
  createGuildChannel(guildId: string, guildName: string): boolean {
    const channelId = `guild_${guildId}`;
    return this.createChannel({
      id: channelId,
      name: `${guildName}公会`,
      type: 'guild',
      members: [],
      isMuted: false,
      maxHistory: this.MAX_HISTORY,
    });
  }

  /**
   * 创建私聊频道
   */
  createPrivateChannel(user1Id: string, user2Id: string): string {
    // 确保频道 ID 一致（按字母顺序）
    const channelId = [user1Id, user2Id].sort().join('_');
    
    if (!this.channels.has(channelId)) {
      this.createChannel({
        id: channelId,
        name: '私聊',
        type: 'private',
        members: [user1Id, user2Id],
        isMuted: false,
        maxHistory: this.MAX_HISTORY,
      });
    }
    
    return channelId;
  }

  /**
   * 初始化玩家聊天状态
   */
  initializePlayerState(userId: string, playerName: string): PlayerChatState {
    if (!this.playerStates.has(userId)) {
      const state: PlayerChatState = {
        userId,
        isMuted: false,
        mutedChannels: [],
        blockedUsers: [],
        unreadCounts: {},
      };
      this.playerStates.set(userId, state);
      
      // 自动加入世界频道
      this.joinChannel(userId, 'world');
    }
    
    return this.playerStates.get(userId)!;
  }

  /**
   * 加入频道
   */
  joinChannel(userId: string, channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    if (!channel.members.includes(userId)) {
      channel.members.push(userId);
    }
    
    // 初始化未读数
    const state = this.playerStates.get(userId);
    if (state && state.unreadCounts[channelId] === undefined) {
      state.unreadCounts[channelId] = 0;
    }
    
    return true;
  }

  /**
   * 离开频道
   */
  leaveChannel(userId: string, channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel || channel.type === 'world') return false; // 不能离开世界频道
    
    channel.members = channel.members.filter(id => id !== userId);
    return true;
  }

  /**
   * 发送消息
   */
  sendMessage(
    userId: string,
    channelId: string,
    content: string,
    playerName: string
  ): { success: boolean; message?: ChatMessage; error?: string } {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return { success: false, error: '频道不存在' };
    }

    const playerState = this.playerStates.get(userId);
    
    // 检查玩家是否被禁言
    if (playerState?.isMuted && playerState.muteUntil && Date.now() < playerState.muteUntil) {
      return { success: false, error: `您已被禁言，解除时间：${new Date(playerState.muteUntil).toLocaleTimeString()}` };
    }

    // 检查频道是否被禁言
    if (channel.isMuted) {
      return { success: false, error: '该频道已被管理员禁言' };
    }

    // 检查玩家是否在频道中
    if (!channel.members.includes(userId) && channel.type !== 'world') {
      return { success: false, error: '您不在该频道中' };
    }

    // 敏感词过滤
    const filteredContent = this.filterProfanity(content);
    if (filteredContent.isFiltered) {
      return { success: false, error: '消息包含敏感词，请文明聊天' };
    }

    // 创建消息
    const message: ChatMessage = {
      id: this.generateMessageId(),
      channelId,
      senderId: userId,
      senderName: playerName,
      content: filteredContent.content,
      timestamp: Date.now(),
      type: 'text',
    };

    // 保存消息
    const channelMessages = this.messages.get(channelId) || [];
    channelMessages.push(message);
    
    // 限制历史记录数量
    if (channelMessages.length > channel.maxHistory) {
      channelMessages.shift();
    }
    
    this.messages.set(channelId, channelMessages);

    // 更新未读计数（对其他玩家）
    channel.members.forEach(memberId => {
      if (memberId !== userId) {
        const memberState = this.playerStates.get(memberId);
        if (memberState && !memberState.blockedUsers.includes(userId)) {
          memberState.unreadCounts[channelId] = (memberState.unreadCounts[channelId] || 0) + 1;
        }
      }
    });

    return { success: true, message };
  }

  /**
   * 发送系统消息
   */
  sendSystemMessage(channelId: string, content: string): ChatMessage | null {
    const channel = this.channels.get(channelId);
    if (!channel) return null;

    const message: ChatMessage = {
      id: this.generateMessageId(),
      channelId,
      senderId: 'system',
      senderName: '系统',
      content,
      timestamp: Date.now(),
      type: 'system',
    };

    const channelMessages = this.messages.get(channelId) || [];
    channelMessages.push(message);
    
    if (channelMessages.length > channel.maxHistory) {
      channelMessages.shift();
    }
    
    this.messages.set(channelId, channelMessages);

    return message;
  }

  /**
   * 获取频道消息历史
   */
  getChannelHistory(channelId: string, limit: number = 50): ChatMessage[] {
    const messages = this.messages.get(channelId) || [];
    return messages.slice(-limit);
  }

  /**
   * 获取未读消息数
   */
  getUnreadCount(userId: string, channelId: string): number {
    const state = this.playerStates.get(userId);
    return state?.unreadCounts[channelId] || 0;
  }

  /**
   * 标记消息为已读
   */
  markAsRead(userId: string, channelId: string): void {
    const state = this.playerStates.get(userId);
    if (state) {
      state.unreadCounts[channelId] = 0;
    }
  }

  /**
   * 标记所有频道为已读
   */
  markAllAsRead(userId: string): void {
    const state = this.playerStates.get(userId);
    if (state) {
      Object.keys(state.unreadCounts).forEach(channelId => {
        state.unreadCounts[channelId] = 0;
      });
    }
  }

  /**
   * 禁言玩家
   */
  mutePlayer(userId: string, durationMs: number = this.MUTE_DURATION): void {
    const state = this.playerStates.get(userId);
    if (state) {
      state.isMuted = true;
      state.muteUntil = Date.now() + durationMs;
    }
  }

  /**
   * 解除禁言
   */
  unmutePlayer(userId: string): void {
    const state = this.playerStates.get(userId);
    if (state) {
      state.isMuted = false;
      state.muteUntil = undefined;
    }
  }

  /**
   * 禁言频道
   */
  muteChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    channel.isMuted = true;
    return true;
  }

  /**
   * 解除频道禁言
   */
  unmuteChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    channel.isMuted = false;
    return true;
  }

  /**
   * 拉黑玩家
   */
  blockUser(userId: string, targetUserId: string): boolean {
    const state = this.playerStates.get(userId);
    if (!state) return false;
    
    if (!state.blockedUsers.includes(targetUserId)) {
      state.blockedUsers.push(targetUserId);
    }
    return true;
  }

  /**
   * 取消拉黑
   */
  unblockUser(userId: string, targetUserId: string): boolean {
    const state = this.playerStates.get(userId);
    if (!state) return false;
    
    state.blockedUsers = state.blockedUsers.filter(id => id !== targetUserId);
    return true;
  }

  /**
   * 敏感词过滤
   */
  filterProfanity(content: string): { content: string; isFiltered: boolean } {
    let filtered = content;
    let isFiltered = false;

    this.profanityWords.forEach(word => {
      if (filtered.includes(word)) {
        isFiltered = true;
        filtered = filtered.replace(new RegExp(word, 'g'), '***');
      }
    });

    return { content: filtered, isFiltered };
  }

  /**
   * 添加敏感词
   */
  addProfanityWord(word: string): void {
    this.profanityWords.add(word.toLowerCase());
  }

  /**
   * 移除敏感词
   */
  removeProfanityWord(word: string): void {
    this.profanityWords.delete(word.toLowerCase());
  }

  /**
   * 获取玩家所在频道列表
   */
  getPlayerChannels(userId: string): ChatChannel[] {
    const channels: ChatChannel[] = [];
    this.channels.forEach(channel => {
      if (channel.members.includes(userId) || channel.type === 'world') {
        channels.push(channel);
      }
    });
    return channels;
  }

  /**
   * 获取在线玩家数（世界频道）
   */
  getOnlineCount(): number {
    const worldChannel = this.channels.get('world');
    return worldChannel?.members.length || 0;
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出频道数据（用于持久化）
   */
  exportChannelData(channelId: string): object | null {
    const channel = this.channels.get(channelId);
    const messages = this.messages.get(channelId);
    
    if (!channel) return null;
    
    return {
      channel,
      messages: messages || [],
    };
  }

  /**
   * 导入频道数据（用于恢复）
   */
  importChannelData(channelId: string, data: { channel: ChatChannel; messages: ChatMessage[] }): void {
    this.channels.set(channelId, data.channel);
    this.messages.set(channelId, data.messages);
  }
}

// 导出单例实例
export const chatSystem = new ChatSystem();
