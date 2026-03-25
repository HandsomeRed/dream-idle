// 聊天系统测试 - v0.75

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  NPC_DATABASE,
  DEFAULT_SETTINGS,
  createChatState,
  addMessage,
  markMessageRead,
  markAllRead,
  deleteMessage,
  cleanupExpiredMessages,
  getNPC,
  getDialogue,
  updateNPCRelationship,
  unlockDialogue,
  getUnreadMessages,
  getImportantMessages,
  getMessagesByType,
  getChatStats,
  updateChatSettings,
  exportChatData,
  importChatData,
  getMessageTypeLabel,
  getPriorityLabel,
  type ChatState,
  type MessageType,
} from './chatSystem';

describe('聊天系统 v0.75', () => {
  let state: ChatState;

  beforeEach(() => {
    state = createChatState('player_001');
  });

  // ==================== 配置测试 ====================
  describe('配置', () => {
    it('应有 3 个 NPC', () => {
      expect(NPC_DATABASE).toHaveLength(3);
    });

    it('每个 NPC 应有必要字段', () => {
      NPC_DATABASE.forEach(npc => {
        expect(npc).toHaveProperty('id');
        expect(npc).toHaveProperty('name');
        expect(npc).toHaveProperty('dialogues');
      });
    });

    it('默认设置应合理', () => {
      expect(DEFAULT_SETTINGS.maxMessages).toBe(500);
      expect(DEFAULT_SETTINGS.autoCleanupDays).toBe(7);
    });

    it('消息类型标签应正确', () => {
      expect(getMessageTypeLabel('system')).toBe('系统');
      expect(getMessageTypeLabel('npc')).toBe('NPC');
    });

    it('优先级标签应正确', () => {
      expect(getPriorityLabel('urgent')).toBe('紧急');
      expect(getPriorityLabel('low')).toBe('低');
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.messages).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
      expect(state.importantCount).toBe(0);
    });

    it('默认设置应正确', () => {
      expect(state.settings.showSystemMessages).toBe(true);
      expect(state.settings.maxMessages).toBe(500);
    });
  });

  // ==================== 添加消息测试 ====================
  describe('添加消息', () => {
    it('应成功添加消息', () => {
      const newState = addMessage(state, 'system', '系统', '欢迎游戏！');
      expect(newState.messages).toHaveLength(1);
      expect(newState.messages[0].content).toBe('欢迎游戏！');
    });

    it('新消息应未读', () => {
      const newState = addMessage(state, 'system', '系统', '测试');
      expect(newState.messages[0].isRead).toBe(false);
      expect(newState.unreadCount).toBe(1);
    });

    it('可添加重要消息', () => {
      const newState = addMessage(state, 'broadcast', '公告', '重要通知', { isImportant: true });
      expect(newState.messages[0].isImportant).toBe(true);
      expect(newState.importantCount).toBe(1);
    });

    it('可设置优先级', () => {
      const newState = addMessage(state, 'system', '系统', '紧急', { priority: 'urgent' });
      expect(newState.messages[0].priority).toBe('urgent');
    });

    it('可添加元数据', () => {
      const newState = addMessage(state, 'reward', '系统', '获得奖励', {
        metadata: { gold: 1000, diamond: 50 },
      });
      expect(newState.messages[0].metadata).toBeDefined();
    });

    it('系统消息关闭时不应添加', () => {
      const s1 = updateChatSettings(state, { showSystemMessages: false });
      const s2 = addMessage(s1, 'system', '系统', '测试');
      expect(s2.messages).toHaveLength(0);
    });

    it('超过最大数量应删除旧消息', () => {
      const s1 = updateChatSettings(state, { maxMessages: 3 });
      let s = s1;
      for (let i = 0; i < 5; i++) {
        s = addMessage(s, 'system', '系统', `消息${i}`);
      }
      expect(s.messages).toHaveLength(3);
      expect(s.messages.length).toBe(3); // 最新的在前面
    });
  });

  // ==================== 标记已读测试 ====================
  describe('标记已读', () => {
    it('应能标记单条已读', () => {
      const s1 = addMessage(state, 'system', '系统', '测试');
      const s2 = markMessageRead(s1, s1.messages[0].id);
      expect(s2.messages[0].isRead).toBe(true);
      expect(s2.unreadCount).toBe(0);
    });

    it('重复标记应无变化', () => {
      const s1 = addMessage(state, 'system', '系统', '测试');
      const s2 = markMessageRead(s1, s1.messages[0].id);
      const s3 = markMessageRead(s2, s1.messages[0].id);
      expect(s3.unreadCount).toBe(0);
    });

    it('不存在的消息应无变化', () => {
      const s1 = addMessage(state, 'system', '系统', '测试');
      const s2 = markMessageRead(s1, 'nonexistent');
      expect(s2.unreadCount).toBe(1);
    });

    it('应能批量标记已读', () => {
      let s = state;
      for (let i = 0; i < 5; i++) {
        s = addMessage(s, 'system', '系统', `消息${i}`);
      }
      const s2 = markAllRead(s);
      expect(s2.unreadCount).toBe(0);
    });

    it('可按类型批量标记', () => {
      let s = state;
      s = addMessage(s, 'system', '系统', '系统消息');
      s = addMessage(s, 'combat', '战斗', '战斗消息');
      const s2 = markAllRead(s, 'system');
      expect(s2.messages.find(m => m.type === 'system')?.isRead).toBe(true);
      expect(s2.messages.find(m => m.type === 'combat')?.isRead).toBe(false);
    });
  });

  // ==================== 删除消息测试 ====================
  describe('删除消息', () => {
    it('应能删除消息', () => {
      const s1 = addMessage(state, 'system', '系统', '测试');
      const s2 = deleteMessage(s1, s1.messages[0].id);
      expect(s2.messages).toHaveLength(0);
    });

    it('删除不存在的消息应无变化', () => {
      const s1 = addMessage(state, 'system', '系统', '测试');
      const s2 = deleteMessage(s1, 'nonexistent');
      expect(s2.messages).toHaveLength(1);
    });
  });

  // ==================== 清理过期测试 ====================
  describe('清理过期', () => {
    it('应清理过期消息', () => {
      const now = Date.now();
      let s = state;
      // 添加一条过期消息
      s = addMessage(s, 'system', '系统', '过期', { expiresAt: now - 1000 }, now);
      // 添加一条正常消息
      s = addMessage(s, 'system', '系统', '正常', { expiresAt: now + 100000 }, now);
      const s2 = cleanupExpiredMessages(s, now);
      expect(s2.messages).toHaveLength(1);
      expect(s2.messages[0].content).toBe('正常');
    });

    it('重要消息应保留更久', () => {
      const now = Date.now();
      const oldTime = now - 8 * 24 * 60 * 60 * 1000; // 8 天前
      let s = state;
      s = addMessage(s, 'system', '系统', '旧重要', { isImportant: true }, oldTime);
      const s2 = cleanupExpiredMessages(s, now);
      expect(s2.messages).toHaveLength(1); // 重要消息保留
    });

    it('永不过期消息应保留', () => {
      const now = Date.now();
      const oldTime = now - 30 * 24 * 60 * 60 * 1000; // 30 天前
      let s = state;
      s = addMessage(s, 'system', '系统', '永久', { expiresAt: 0 }, oldTime);
      const s2 = cleanupExpiredMessages(s, now);
      expect(s2.messages).toHaveLength(1);
    });
  });

  // ==================== NPC 功能测试 ====================
  describe('NPC 功能', () => {
    it('应能获取 NPC', () => {
      const npc = getNPC('npc_guide');
      expect(npc).toBeDefined();
      expect(npc!.name).toBe('引导精灵');
    });

    it('不存在的 NPC 应返回 undefined', () => {
      const npc = getNPC('nonexistent');
      expect(npc).toBeUndefined();
    });

    it('应能获取对话', () => {
      const dialogue = getDialogue('npc_guide', 'greet_001');
      expect(dialogue).toBeDefined();
      expect(dialogue!.text).toContain('欢迎来到梦幻放置');
    });

    it('应能更新关系', () => {
      const s1 = updateNPCRelationship(state, 'npc_guide', 10);
      expect(s1.npcRelationships['npc_guide']).toBe(10);
    });

    it('关系应限制在 0-100', () => {
      const s1 = updateNPCRelationship(state, 'npc_guide', 150);
      expect(s1.npcRelationships['npc_guide']).toBe(100);
      const s2 = updateNPCRelationship(s1, 'npc_guide', -200);
      expect(s2.npcRelationships['npc_guide']).toBe(0);
    });

    it('应能解锁对话', () => {
      const s1 = unlockDialogue(state, 'howto_001');
      expect(s1.unlockedDialogues).toContain('howto_001');
    });
  });

  // ==================== 查询功能测试 ====================
  describe('查询功能', () => {
    it('获取未读消息', () => {
      let s = state;
      s = addMessage(s, 'system', '系统', '未读 1');
      s = addMessage(s, 'system', '系统', '未读 2');
      s = markMessageRead(s, s.messages[0].id);
      const unread = getUnreadMessages(s);
      expect(unread).toHaveLength(1);
    });

    it('获取重要消息', () => {
      let s = state;
      s = addMessage(s, 'broadcast', '公告', '重要', { isImportant: true });
      s = addMessage(s, 'system', '系统', '普通');
      const important = getImportantMessages(s);
      expect(important).toHaveLength(1);
    });

    it('按类型筛选', () => {
      let s = state;
      s = addMessage(s, 'system', '系统', '系统');
      s = addMessage(s, 'combat', '战斗', '战斗');
      const system = getMessagesByType(s, 'system');
      expect(system).toHaveLength(1);
      expect(system[0].type).toBe('system');
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('初始统计', () => {
      const stats = getChatStats(state);
      expect(stats.totalMessages).toBe(0);
      expect(stats.unreadCount).toBe(0);
    });

    it('添加消息后统计更新', () => {
      let s = state;
      s = addMessage(s, 'system', '系统', '1');
      s = addMessage(s, 'combat', '战斗', '2');
      const stats = getChatStats(s);
      expect(stats.totalMessages).toBe(2);
      expect(stats.messagesByType['system']).toBe(1);
      expect(stats.messagesByType['combat']).toBe(1);
    });

    it('NPC 关系统计', () => {
      let s = state;
      s = updateNPCRelationship(s, 'npc_guide', 50);
      s = updateNPCRelationship(s, 'npc_merchant', 30);
      const stats = getChatStats(s);
      expect(stats.npcCount).toBe(2);
      expect(stats.avgRelationship).toBe(40);
    });
  });

  // ==================== 设置测试 ====================
  describe('设置', () => {
    it('更新设置', () => {
      const s1 = updateChatSettings(state, { maxMessages: 100 });
      expect(s1.settings.maxMessages).toBe(100);
    });

    it('部分更新应保留其他设置', () => {
      const s1 = updateChatSettings(state, { maxMessages: 100 });
      expect(s1.settings.showSystemMessages).toBe(true); // 保留默认
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回 JSON', () => {
      const json = exportChatData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      const s1 = addMessage(state, 'system', '系统', '测试');
      const json = exportChatData(s1);
      const imported = importChatData(json);
      expect(imported).toBeDefined();
      expect(imported!.messages).toHaveLength(1);
    });

    it('无效数据应返回 null', () => {
      expect(importChatData('nope')).toBeNull();
      expect(importChatData('{}')).toBeNull();
    });
  });
});
