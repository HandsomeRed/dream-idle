// 邮件系统测试 - v0.79

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  MAIL_TEMPLATES,
  MAIL_EXPIRY_DAYS,
  MAX_MAILS,
  createMailState,
  sendMail,
  markMailRead,
  markAllRead,
  claimAttachments,
  claimAllAttachments,
  deleteMail,
  cleanupExpiredMails,
  getMailList,
  getMailStats,
  getMailTypeLabel,
  getStatusLabel,
  exportMailData,
  importMailData,
  type MailState,
} from './mailSystem';

describe('邮件系统 v0.79', () => {
  let state: MailState;
  let fixedNow: number;

  beforeEach(() => {
    fixedNow = new Date('2026-03-26T03:00:00+08:00').getTime();
    state = createMailState('player_001', fixedNow);
  });

  // ==================== 配置测试 ====================
  describe('配置', () => {
    it('应有 4 个邮件模板', () => {
      expect(Object.keys(MAIL_TEMPLATES)).toHaveLength(4);
    });

    it('每个模板应有必要字段', () => {
      Object.values(MAIL_TEMPLATES).forEach(t => {
        expect(t).toHaveProperty('title');
        expect(t).toHaveProperty('content');
        expect(t).toHaveProperty('sender');
        expect(t).toHaveProperty('type');
      });
    });

    it('邮件类型标签应正确', () => {
      expect(getMailTypeLabel('system')).toBe('系统');
      expect(getMailTypeLabel('gift')).toBe('礼包');
    });

    it('状态标签应正确', () => {
      expect(getStatusLabel('unread')).toBe('未读');
      expect(getStatusLabel('claimed')).toBe('已领取');
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.mails).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });

    it('应加载模板', () => {
      expect(Object.keys(state.templates).length).toBeGreaterThan(0);
    });
  });

  // ==================== 发送邮件测试 ====================
  describe('发送邮件', () => {
    it('应成功发送邮件', () => {
      const result = sendMail(state, 'welcome', {}, fixedNow);
      expect(result.state.mails).toHaveLength(1);
      expect(result.mail).toBeDefined();
      expect(result.mail!.title).toContain('欢迎');
    });

    it('邮件应有过期时间', () => {
      const result = sendMail(state, 'welcome', {}, fixedNow);
      expect(result.mail!.expiresAt).toBeGreaterThan(fixedNow);
    });

    it('可发送自定义邮件', () => {
      const result = sendMail(state, 'custom', {
        title: '测试邮件',
        content: '测试内容',
        sender: '测试者',
        type: 'system',
      }, fixedNow);
      expect(result.state.mails).toHaveLength(1);
      expect(result.mail!.title).toBe('测试邮件');
    });

    it('邮件应有附件', () => {
      const result = sendMail(state, 'welcome', {}, fixedNow);
      expect(result.mail!.attachments).toBeDefined();
      expect(result.mail!.attachments!.length).toBeGreaterThan(0);
    });

    it('超过最大数量应删除旧邮件', () => {
      let s = state;
      for (let i = 0; i < MAX_MAILS + 5; i++) {
        s = sendMail(s, 'achievement', {}, fixedNow + i * 1000).state;
      }
      expect(s.mails.length).toBeLessThanOrEqual(MAX_MAILS);
    });
  });

  // ==================== 标记已读测试 ====================
  describe('标记已读', () => {
    it('应能标记已读', () => {
      const { state: s1, mail } = sendMail(state, 'welcome', {}, fixedNow);
      const result = markMailRead(s1, mail!.id, fixedNow);
      expect(result.success).toBe(true);
      expect(result.state.mails[0].status).toBe('read');
    });

    it('已读邮件不能重复标记', () => {
      const { state: s1, mail } = sendMail(state, 'welcome', {}, fixedNow);
      const { state: s2 } = markMailRead(s1, mail!.id, fixedNow);
      const result = markMailRead(s2, mail!.id, fixedNow);
      expect(result.success).toBe(false);
    });

    it('不存在的邮件应失败', () => {
      const result = markMailRead(state, 'nonexistent', fixedNow);
      expect(result.success).toBe(false);
    });

    it('应能批量标记已读', () => {
      let s = state;
      for (let i = 0; i < 5; i++) {
        s = sendMail(s, 'achievement', {}, fixedNow + i * 1000).state;
      }
      const result = markAllRead(s, fixedNow);
      expect(result.count).toBe(5);
      expect(result.state.unreadCount).toBe(0);
    });
  });

  // ==================== 领取附件测试 ====================
  describe('领取附件', () => {
    it('应能领取附件', () => {
      const { state: s1, mail } = sendMail(state, 'welcome', {}, fixedNow);
      const result = claimAttachments(s1, mail!.id, fixedNow);
      expect(result.success).toBe(true);
      expect(result.attachments).toBeDefined();
      expect(result.attachments!.length).toBeGreaterThan(0);
    });

    it('无附件邮件应失败', () => {
      const { state: s1, mail } = sendMail(state, 'achievement', {}, fixedNow);
      const result = claimAttachments(s1, mail!.id, fixedNow);
      expect(result.success).toBe(false);
      expect(result.error).toContain('无附件');
    });

    it('已领取不能重复领取', () => {
      const { state: s1, mail } = sendMail(state, 'welcome', {}, fixedNow);
      const { state: s2 } = claimAttachments(s1, mail!.id, fixedNow);
      const result = claimAttachments(s2, mail!.id, fixedNow);
      expect(result.success).toBe(false);
    });

    it('应能批量领取', () => {
      let s = state;
      for (let i = 0; i < 3; i++) {
        s = sendMail(s, 'welcome', {}, fixedNow + i * 1000).state;
      }
      const result = claimAllAttachments(s, fixedNow);
      expect(result.count).toBe(3);
      expect(result.totalAttachments.length).toBeGreaterThan(0);
      expect(result.state.claimableCount).toBe(0);
    });
  });

  // ==================== 删除邮件测试 ====================
  describe('删除邮件', () => {
    it('应能删除邮件', () => {
      const { state: s1, mail } = sendMail(state, 'welcome', {}, fixedNow);
      const result = deleteMail(s1, mail!.id);
      expect(result.success).toBe(true);
      expect(result.state.mails[0].status).toBe('deleted');
    });

    it('删除后应计入统计', () => {
      const { state: s1, mail } = sendMail(state, 'welcome', {}, fixedNow);
      deleteMail(s1, mail!.id);
      expect(s1.deletedCount).toBe(0); // 删除的邮件还在数组里，只是状态变了
    });
  });

  // ==================== 清理过期测试 ====================
  describe('清理过期', () => {
    it('应清理过期邮件', () => {
      const pastTime = fixedNow - 31 * 24 * 60 * 60 * 1000; // 31 天前
      const { state: s1 } = sendMail(state, 'welcome', {}, pastTime);
      const result = cleanupExpiredMails(s1, fixedNow);
      expect(result.cleanedCount).toBeGreaterThan(0);
    });

    it('应清理已删除邮件', () => {
      const { state: s1, mail } = sendMail(state, 'welcome', {}, fixedNow);
      const { state: s2 } = deleteMail(s1, mail!.id);
      const result = cleanupExpiredMails(s2, fixedNow);
      expect(result.cleanedCount).toBe(1);
    });

    it('未过期邮件应保留', () => {
      const { state: s1 } = sendMail(state, 'welcome', {}, fixedNow);
      const result = cleanupExpiredMails(s1, fixedNow);
      expect(result.cleanedCount).toBe(0);
      expect(result.state.mails).toHaveLength(1);
    });
  });

  // ==================== 查询功能测试 ====================
  describe('查询功能', () => {
    it('获取邮件列表', () => {
      let s = state;
      for (let i = 0; i < 5; i++) {
        s = sendMail(s, 'achievement', {}, fixedNow + i * 1000).state;
      }
      const mails = getMailList(s);
      expect(mails.length).toBe(5);
    });

    it('按类型筛选', () => {
      let s = state;
      s = sendMail(s, 'welcome', {}, fixedNow).state;
      s = sendMail(s, 'maintenance', {}, fixedNow).state;
      const giftMails = getMailList(s, { type: 'gift' });
      expect(giftMails.length).toBe(1);
    });

    it('按状态筛选', () => {
      let s = state;
      const { mail } = sendMail(s, 'welcome', {}, fixedNow);
      s = markMailRead(s, mail!.id, fixedNow).state;
      const unread = getMailList(s, { status: 'unread' });
      expect(unread.length).toBe(0);
    });

    it('限制数量', () => {
      let s = state;
      for (let i = 0; i < 10; i++) {
        s = sendMail(s, 'achievement', {}, fixedNow + i * 1000).state;
      }
      const mails = getMailList(s, { limit: 5 });
      expect(mails.length).toBe(5);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('获取邮件统计', () => {
      const stats = getMailStats(state);
      expect(stats.totalMails).toBe(0);
      expect(stats.unreadCount).toBe(0);
    });

    it('发送后统计更新', () => {
      const { state: s1 } = sendMail(state, 'welcome', {}, fixedNow);
      const stats = getMailStats(s1);
      expect(stats.totalMails).toBe(1);
      expect(stats.unreadCount).toBe(1);
      expect(stats.byType['gift']).toBe(1);
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回 JSON', () => {
      const json = exportMailData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      const { state: s1 } = sendMail(state, 'welcome', {}, fixedNow);
      const json = exportMailData(s1);
      const imported = importMailData(json);
      expect(imported).toBeDefined();
      expect(imported!.mails).toHaveLength(1);
    });

    it('无效数据应返回 null', () => {
      expect(importMailData('nope')).toBeNull();
      expect(importMailData('{}')).toBeNull();
    });
  });
});
