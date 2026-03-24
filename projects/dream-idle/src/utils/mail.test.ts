/**
 * Mail System Tests - v0.33
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  MailType,
  MailPriority,
  MailState,
  MailReward,
  MAX_MAILS,
  AUTO_DELETE_DAYS,
  initializeMailState,
  sendMail,
  sendSystemMail,
  sendRewardMail,
  readMail,
  claimMailReward,
  claimAllRewards,
  deleteMail,
  deleteAllReadMails,
  cleanExpiredMails,
  deleteMultipleMails,
  getUnreadCount,
  getClaimableCount,
  getMailsByType,
  getUnreadMails,
  getClaimableMails,
  getMailById,
  sortMailsByPriority,
  getMailStatistics,
  calculateTotalRewards,
} from './mail';

describe('Mail System - v0.33', () => {
  
  // ==================== 邮件数据测试 ====================
  
  describe('Mail Data', () => {
    it('should have valid constants', () => {
      expect(MAX_MAILS).toBeGreaterThan(0);
      expect(AUTO_DELETE_DAYS).toBeGreaterThan(0);
    });
  });

  // ==================== 初始化测试 ====================
  
  describe('Initialization', () => {
    it('should initialize mail state correctly', () => {
      const state = initializeMailState();
      
      expect(state.mails).toEqual([]);
      expect(state.maxMails).toBe(MAX_MAILS);
      expect(state.autoDeleteDays).toBe(AUTO_DELETE_DAYS);
    });
  });

  // ==================== 发送邮件测试 ====================
  
  describe('Send Mail', () => {
    let state: MailState;

    beforeEach(() => {
      state = initializeMailState();
    });

    it('should send system mail successfully', () => {
      const result = sendSystemMail(state, '测试邮件', '这是一封测试邮件');
      
      expect(result.success).toBe(true);
      expect(state.mails).toHaveLength(1);
      expect(state.mails[0].type).toBe(MailType.System);
      expect(state.mails[0].title).toBe('测试邮件');
    });

    it('should send reward mail successfully', () => {
      const rewards: MailReward[] = [
        { type: 'gold', amount: 1000 },
        { type: 'diamond', amount: 50 },
      ];
      
      const result = sendRewardMail(state, '奖励邮件', '恭喜获得奖励', rewards);
      
      expect(result.success).toBe(true);
      expect(state.mails).toHaveLength(1);
      expect(state.mails[0].rewards).toHaveLength(2);
      expect(state.mails[0].priority).toBe(MailPriority.High);
    });

    it('should mark mail as unread initially', () => {
      sendSystemMail(state, '测试', '内容');
      expect(state.mails[0].isRead).toBe(false);
    });

    it('should mark reward mail as unclaimed', () => {
      const rewards: MailReward[] = [{ type: 'gold', amount: 1000 }];
      sendRewardMail(state, '奖励', '内容', rewards);
      
      expect(state.mails[0].isClaimed).toBe(false);
    });

    it('should mark mail without rewards as claimed', () => {
      sendSystemMail(state, '通知', '内容');
      expect(state.mails[0].isClaimed).toBe(true);
    });

    it('should handle mailbox full scenario', () => {
      // 填满邮箱
      for (let i = 0; i < MAX_MAILS; i++) {
        sendSystemMail(state, `邮件${i}`, `内容${i}`);
      }
      
      expect(state.mails).toHaveLength(MAX_MAILS);
      
      // 再发送一封（应该删除最早的未读邮件）
      const result = sendSystemMail(state, '新邮件', '新内容');
      
      expect(result.success).toBe(true);
      expect(state.mails).toHaveLength(MAX_MAILS);
    });
  });

  // ==================== 读取邮件测试 ====================
  
  describe('Read Mail', () => {
    let state: MailState;

    beforeEach(() => {
      state = initializeMailState();
      sendSystemMail(state, '测试邮件', '内容');
    });

    it('should mark mail as read', () => {
      const mailId = state.mails[0].id;
      const result = readMail(state, mailId);
      
      expect(result.success).toBe(true);
      expect(state.mails[0].isRead).toBe(true);
    });

    it('should fail for non-existent mail', () => {
      const result = readMail(state, 'non_existent');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });
  });

  // ==================== 领取奖励测试 ====================
  
  describe('Claim Rewards', () => {
    let state: MailState;

    beforeEach(() => {
      state = initializeMailState();
    });

    it('should claim reward successfully', () => {
      const rewards: MailReward[] = [{ type: 'gold', amount: 1000 }];
      sendRewardMail(state, '奖励', '内容', rewards);
      
      const mailId = state.mails[0].id;
      const result = claimMailReward(state, mailId);
      
      expect(result.success).toBe(true);
      expect(result.rewards).toHaveLength(1);
      expect(state.mails[0].isClaimed).toBe(true);
    });

    it('should fail to claim twice', () => {
      const rewards: MailReward[] = [{ type: 'gold', amount: 1000 }];
      sendRewardMail(state, '奖励', '内容', rewards);
      
      const mailId = state.mails[0].id;
      claimMailReward(state, mailId);
      
      const result = claimMailReward(state, mailId);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已领取');
    });

    it('should fail for mail without rewards', () => {
      sendSystemMail(state, '通知', '内容');
      
      // 无奖励邮件自动标记为已领取
      expect(state.mails[0].isClaimed).toBe(true);
      
      const result = claimMailReward(state, state.mails[0].id);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已领取');
    });

    it('should claim all rewards', () => {
      // 发送多封奖励邮件
      sendRewardMail(state, '奖励 1', '内容 1', [{ type: 'gold', amount: 1000 }]);
      sendRewardMail(state, '奖励 2', '内容 2', [{ type: 'diamond', amount: 50 }]);
      sendSystemMail(state, '通知', '内容');
      
      const results = claimAllRewards(state);
      
      expect(results).toHaveLength(2);  // 只有 2 封有奖励
      expect(state.mails.filter(m => m.isClaimed)).toHaveLength(3);
    });
  });

  // ==================== 删除邮件测试 ====================
  
  describe('Delete Mail', () => {
    let state: MailState;

    beforeEach(() => {
      state = initializeMailState();
    });

    it('should delete mail successfully', () => {
      sendSystemMail(state, '测试', '内容');
      readMail(state, state.mails[0].id);
      
      const result = deleteMail(state, state.mails[0].id);
      
      expect(result.success).toBe(true);
      expect(state.mails).toHaveLength(0);
    });

    it('should fail to delete locked mail', () => {
      sendMail(state, MailType.System, '紧急', '内容', [], MailPriority.Urgent);
      
      const result = deleteMail(state, state.mails[0].id);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('锁定');
    });

    it('should fail to delete unclaimed reward mail', () => {
      sendRewardMail(state, '奖励', '内容', [{ type: 'gold', amount: 1000 }]);
      
      const result = deleteMail(state, state.mails[0].id);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('领取奖励');
    });

    it('should delete all read mails', () => {
      sendSystemMail(state, '未读', '内容');
      sendSystemMail(state, '已读 1', '内容');
      readMail(state, state.mails[0].id);
      sendSystemMail(state, '已读 2', '内容');
      readMail(state, state.mails[0].id);
      readMail(state, state.mails[1].id);
      
      const result = deleteAllReadMails(state);
      
      expect(result.success).toBe(true);
      expect(state.mails.filter(m => !m.isRead)).toHaveLength(1);  // 只剩未读的
    });
  });

  // ==================== 查询统计测试 ====================
  
  describe('Query and Statistics', () => {
    let state: MailState;

    beforeEach(() => {
      state = initializeMailState();
      sendSystemMail(state, '未读', '内容');
      sendRewardMail(state, '奖励', '内容', [{ type: 'gold', amount: 1000 }]);
      sendMail(state, MailType.Event, '活动', '内容', [], MailPriority.High);
    });

    it('should get unread count', () => {
      const count = getUnreadCount(state);
      expect(count).toBe(3);
      
      readMail(state, state.mails[0].id);
      expect(getUnreadCount(state)).toBe(2);
    });

    it('should get claimable count', () => {
      const count = getClaimableCount(state);
      expect(count).toBe(1);  // 只有 1 封有未领取奖励
    });

    it('should get mails by type', () => {
      const systemMails = getMailsByType(state, MailType.System);
      expect(systemMails.length).toBe(1);
      
      const rewardMails = getMailsByType(state, MailType.Reward);
      expect(rewardMails.length).toBe(1);
    });

    it('should get unread mails', () => {
      const unread = getUnreadMails(state);
      expect(unread).toHaveLength(3);
      
      readMail(state, state.mails[0].id);
      expect(getUnreadMails(state)).toHaveLength(2);
    });

    it('should get claimable mails', () => {
      const claimable = getClaimableMails(state);
      expect(claimable).toHaveLength(1);
    });

    it('should get mail by id', () => {
      const mail = getMailById(state, state.mails[0].id);
      expect(mail).toBeDefined();
      expect(mail?.id).toBe(state.mails[0].id);
    });

    it('should sort mails by priority', () => {
      sendMail(state, MailType.System, '普通', '内容', [], MailPriority.Low);
      sendMail(state, MailType.System, '紧急', '内容', [], MailPriority.Urgent);
      
      const sorted = sortMailsByPriority(state.mails);
      
      expect(sorted[0].priority).toBe(MailPriority.Urgent);
      expect(sorted[sorted.length - 1].priority).toBe(MailPriority.Low);
    });

    it('should get mail statistics', () => {
      const stats = getMailStatistics(state);
      
      expect(stats.total).toBe(3);
      expect(stats.unread).toBe(3);
      expect(stats.claimable).toBe(1);
      expect(stats.capacity).toBe(MAX_MAILS);
      expect(stats.usagePercent).toBeGreaterThan(0);
    });

    it('should calculate total rewards', () => {
      sendRewardMail(state, '奖励 2', '内容', [{ type: 'diamond', amount: 50 }]);
      
      const totals = calculateTotalRewards(state);
      
      expect(totals['gold']).toBe(1000);
      expect(totals['diamond']).toBe(50);
    });
  });

  // ==================== 集成测试 ====================
  
  describe('Integration Tests', () => {
    it('should complete full mail lifecycle', () => {
      const state = initializeMailState();
      
      // 发送奖励邮件
      const sendResult = sendRewardMail(
        state,
        '新手礼包',
        '欢迎来到梦幻放置！',
        [
          { type: 'gold', amount: 5000 },
          { type: 'diamond', amount: 100 },
        ]
      );
      
      expect(sendResult.success).toBe(true);
      
      const mailId = state.mails[0].id;
      
      // 读取邮件
      const readResult = readMail(state, mailId);
      expect(readResult.success).toBe(true);
      expect(state.mails[0].isRead).toBe(true);
      
      // 领取奖励
      const claimResult = claimMailReward(state, mailId);
      expect(claimResult.success).toBe(true);
      expect(claimResult.rewards).toHaveLength(2);
      
      // 删除邮件
      const deleteResult = deleteMail(state, mailId);
      expect(deleteResult.success).toBe(true);
      expect(state.mails).toHaveLength(0);
    });

    it('should handle multiple operations', () => {
      const state = initializeMailState();
      
      // 发送多封邮件
      for (let i = 0; i < 10; i++) {
        sendSystemMail(state, `邮件${i}`, `内容${i}`);
      }
      
      // 读取前 5 封
      for (let i = 0; i < 5; i++) {
        readMail(state, state.mails[i].id);
      }
      
      // 统计
      const stats = getMailStatistics(state);
      expect(stats.total).toBe(10);
      expect(stats.unread).toBe(5);
      
      // 删除已读
      deleteAllReadMails(state);
      expect(state.mails).toHaveLength(5);
    });
  });
});
