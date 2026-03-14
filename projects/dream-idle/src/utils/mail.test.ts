/**
 * v0.14 邮件系统单元测试
 * Mail System Unit Tests
 */

import { MailSystem, MailAttachment } from './mail';

describe('MailSystem - 邮件系统', () => {
  let mailSystem: MailSystem;

  beforeEach(() => {
    mailSystem = new MailSystem();
  });

  describe('玩家状态管理 - Player State Management', () => {
    test('应该初始化玩家邮箱状态', () => {
      const state = mailSystem.initializePlayerState('player_1');
      
      expect(state.userId).toBe('player_1');
      expect(state.unreadCount).toBe(0);
      expect(state.totalReceived).toBe(0);
      expect(state.totalSent).toBe(0);
      expect(state.blockedSenders).toEqual([]);
    });

    test('不应该重复初始化玩家状态', () => {
      const state1 = mailSystem.initializePlayerState('player_1');
      const state2 = mailSystem.initializePlayerState('player_1');
      
      expect(state1).toBe(state2);
    });
  });

  describe('发送系统邮件 - Send System Mail', () => {
    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
    });

    test('应该成功发送系统邮件', () => {
      const result = mailSystem.sendSystemMail(
        'player_1',
        '欢迎邮件',
        '欢迎来到游戏！'
      );
      
      expect(result.success).toBe(true);
      expect(result.mailId).toBeDefined();
      
      const unreadCount = mailSystem.getUnreadCount('player_1');
      expect(unreadCount).toBe(1);
    });

    test('应该成功发送带附件的系统邮件', () => {
      const attachments: MailAttachment[] = [
        { type: 'gold', amount: 1000 },
        { type: 'item', amount: 10, itemId: 'item_1', itemName: '生命药水', itemCount: 10 },
      ];
      
      const result = mailSystem.sendSystemMail(
        'player_1',
        '奖励邮件',
        '这是您的奖励',
        attachments
      );
      
      expect(result.success).toBe(true);
      
      const mail = mailSystem.getMail(result.mailId!, 'player_1');
      expect(mail).toBeDefined();
      expect(mail!.attachments.length).toBe(2);
    });

    test('邮箱已满时不能发送邮件', () => {
      const smallMailSystem = new MailSystem({ maxMailBoxSize: 2 });
      smallMailSystem.initializePlayerState('player_1');
      
      smallMailSystem.sendSystemMail('player_1', '邮件 1', '内容 1');
      smallMailSystem.sendSystemMail('player_1', '邮件 2', '内容 2');
      
      const result = smallMailSystem.sendSystemMail('player_1', '邮件 3', '内容 3');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱已满');
    });
  });

  describe('发送玩家邮件 - Send Player Mail', () => {
    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
      mailSystem.initializePlayerState('player_2');
    });

    test('应该成功发送玩家邮件', () => {
      const result = mailSystem.sendPlayerMail(
        'player_1',
        '玩家 1',
        'player_2',
        '你好',
        '这是一封测试邮件'
      );
      
      expect(result.success).toBe(true);
      expect(result.mailId).toBeDefined();
      
      const stats = mailSystem.getMailStats('player_1');
      expect(stats!.totalSent).toBe(1);
      
      const receiverStats = mailSystem.getMailStats('player_2');
      expect(receiverStats!.totalReceived).toBe(1);
    });

    test('玩家间邮件禁用时不能发送', () => {
      const noPlayerMailSystem = new MailSystem({ canSendPlayerMail: false });
      noPlayerMailSystem.initializePlayerState('player_1');
      noPlayerMailSystem.initializePlayerState('player_2');
      
      const result = noPlayerMailSystem.sendPlayerMail(
        'player_1',
        '玩家 1',
        'player_2',
        '你好',
        '测试'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('玩家间邮件功能已禁用');
    });

    test('被拉黑时不能发送邮件', () => {
      mailSystem.blockSender('player_2', 'player_1');
      
      const result = mailSystem.sendPlayerMail(
        'player_1',
        '玩家 1',
        'player_2',
        '你好',
        '测试'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('对方已将您拉入黑名单');
    });
  });

  describe('发送邮件验证 - Send Mail Validation', () => {
    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
    });

    test('附件数量不能超过限制', () => {
      const attachments: MailAttachment[] = Array(15).fill(null).map((_, i) => ({
        type: 'item' as const,
        amount: 1,
        itemId: `item_${i}`,
        itemName: `物品${i}`,
        itemCount: 1,
      }));
      
      const result = mailSystem.sendSystemMail(
        'player_1',
        '测试',
        '内容',
        attachments
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('附件数量超过限制');
    });

    test('金币数量不能超过限制', () => {
      const attachments: MailAttachment[] = [
        { type: 'gold', amount: 200000 }, // 超过 10 万限制
      ];
      
      const result = mailSystem.sendSystemMail(
        'player_1',
        '测试',
        '内容',
        attachments
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮件金币超过限制');
    });

    test('金币数量不能为负数', () => {
      const attachments: MailAttachment[] = [
        { type: 'gold', amount: -100 },
      ];
      
      const result = mailSystem.sendSystemMail(
        'player_1',
        '测试',
        '内容',
        attachments
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('金币数量必须大于 0');
    });

    test('物品附件必须包含完整信息', () => {
      const attachments: MailAttachment[] = [
        { type: 'item', amount: 1 }, // 缺少 itemId 和 itemName
      ];
      
      const result = mailSystem.sendSystemMail(
        'player_1',
        '测试',
        '内容',
        attachments
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('物品附件必须包含 itemId 和 itemName');
    });
  });

  describe('获取邮件 - Get Mail', () => {
    let mailId: string;

    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
      
      const result = mailSystem.sendSystemMail(
        'player_1',
        '测试邮件',
        '这是一封测试邮件'
      );
      mailId = result.mailId!;
    });

    test('应该获取邮件列表', () => {
      const mails = mailSystem.getMailList('player_1');
      
      expect(mails.length).toBe(1);
      expect(mails[0].title).toBe('测试邮件');
    });

    test('应该获取邮件详情并标记为已读', () => {
      const mail = mailSystem.getMail(mailId, 'player_1');
      
      expect(mail).toBeDefined();
      expect(mail!.isRead).toBe(true);
      expect(mail!.status).toBe('read');
      
      const unreadCount = mailSystem.getUnreadCount('player_1');
      expect(unreadCount).toBe(0);
    });

    test('不能获取不存在的邮件', () => {
      const mail = mailSystem.getMail('nonexistent', 'player_1');
      
      expect(mail).toBeNull();
    });

    test('不能获取其他人的邮件', () => {
      mailSystem.initializePlayerState('player_2');
      const mail = mailSystem.getMail(mailId, 'player_2');
      
      expect(mail).toBeNull();
    });

    test('应该支持按类型筛选', () => {
      mailSystem.sendPlayerMail('player_2', '玩家 2', 'player_1', '玩家邮件', '内容');
      
      const systemMails = mailSystem.getMailList('player_1', { mailType: 'system' });
      const playerMails = mailSystem.getMailList('player_1', { mailType: 'player' });
      
      expect(systemMails.length).toBe(1);
      expect(playerMails.length).toBe(1);
    });

    test('应该支持按状态筛选', () => {
      mailSystem.getMail(mailId, 'player_1'); // 标记为已读
      
      const unreadMails = mailSystem.getMailList('player_1', { status: 'unread' });
      const readMails = mailSystem.getMailList('player_1', { status: 'read' });
      
      expect(unreadMails.length).toBe(0);
      expect(readMails.length).toBe(1);
    });

    test('应该支持分页', () => {
      // 创建 25 封邮件
      for (let i = 0; i < 24; i++) {
        mailSystem.sendSystemMail('player_1', `邮件${i}`, `内容${i}`);
      }
      
      const page1 = mailSystem.getMailList('player_1', { page: 1, pageSize: 20 });
      const page2 = mailSystem.getMailList('player_1', { page: 2, pageSize: 20 });
      
      expect(page1.length).toBe(20);
      expect(page2.length).toBe(5);
    });
  });

  describe('领取附件 - Claim Attachments', () => {
    let mailId: string;

    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
      
      const attachments: MailAttachment[] = [
        { type: 'gold', amount: 1000 },
        { type: 'item', amount: 5, itemId: 'item_1', itemName: '生命药水', itemCount: 5 },
      ];
      
      const result = mailSystem.sendSystemMail(
        'player_1',
        '奖励邮件',
        '这是您的奖励',
        attachments
      );
      mailId = result.mailId!;
    });

    test('应该成功领取附件', () => {
      const result = mailSystem.claimAttachments(mailId, 'player_1');
      
      expect(result.success).toBe(true);
      expect(result.attachments).toBeDefined();
      expect(result.attachments!.length).toBe(2);
      
      const mail = mailSystem.getMail(mailId, 'player_1');
      expect(mail!.isClaimed).toBe(true);
    });

    test('不能重复领取附件', () => {
      mailSystem.claimAttachments(mailId, 'player_1');
      
      const result = mailSystem.claimAttachments(mailId, 'player_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('附件已领取');
    });

    test('没有附件的邮件不能领取', () => {
      const result2 = mailSystem.sendSystemMail('player_1', '无附件邮件', '内容');
      
      const result = mailSystem.claimAttachments(result2.mailId!, 'player_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('邮件没有附件');
    });

    test('不能领取不存在的邮件附件', () => {
      const result = mailSystem.claimAttachments('nonexistent', 'player_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('邮件不存在');
    });
  });

  describe('删除邮件 - Delete Mail', () => {
    let mailId: string;

    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
      
      const result = mailSystem.sendSystemMail('player_1', '测试邮件', '内容');
      mailId = result.mailId!;
    });

    test('应该成功删除邮件', () => {
      const result = mailSystem.deleteMail(mailId, 'player_1');
      
      expect(result).toBe(true);
      
      const mail = mailSystem.getMail(mailId, 'player_1');
      expect(mail).toBeNull(); // 删除后获取不到
    });

    test('删除未读邮件应该减少未读数', () => {
      const unreadBefore = mailSystem.getUnreadCount('player_1');
      expect(unreadBefore).toBe(1);
      
      mailSystem.deleteMail(mailId, 'player_1');
      
      const unreadAfter = mailSystem.getUnreadCount('player_1');
      expect(unreadAfter).toBe(0);
    });

    test('不能删除不存在的邮件', () => {
      const result = mailSystem.deleteMail('nonexistent', 'player_1');
      
      expect(result).toBe(false);
    });
  });

  describe('一键操作 - Bulk Operations', () => {
    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
      
      // 创建多封带附件的邮件
      for (let i = 0; i < 5; i++) {
        mailSystem.sendSystemMail(
          'player_1',
          `奖励${i}`,
          `内容${i}`,
          [{ type: 'gold', amount: 100 * (i + 1) }]
        );
      }
    });

    test('应该一键领取所有附件', () => {
      const result = mailSystem.claimAllAttachments('player_1');
      
      expect(result.success).toBe(true);
      expect(result.claimedCount).toBe(5);
      expect(result.attachments.length).toBe(5);
    });

    test('应该一键删除所有已读邮件', () => {
      // 先读取所有邮件
      const mails = mailSystem.getMailList('player_1');
      mails.forEach(mail => mailSystem.getMail(mail.id, 'player_1'));
      
      const deletedCount = mailSystem.deleteAllRead('player_1');
      
      expect(deletedCount).toBe(5);
      
      const remainingMails = mailSystem.getMailList('player_1');
      expect(remainingMails.length).toBe(0);
    });
  });

  describe('过期邮件检查 - Expired Mail Check', () => {
    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
    });

    test('应该处理过期邮件', () => {
      const result = mailSystem.sendSystemMail(
        'player_1',
        '测试邮件',
        '内容',
        [],
        0.00001 // 非常短的过期时间
      );
      
      // 手动设置过期
      const mail = mailSystem.getMail(result.mailId!, 'player_1');
      if (mail) {
        mail.expiresAt = Date.now() - 1000; // 1 秒前过期
      }
      
      const expiredCount = mailSystem.checkExpiredMails();
      expect(expiredCount).toBe(1);
    });
  });

  describe('发件人黑名单 - Sender Block List', () => {
    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
    });

    test('应该拉黑发件人', () => {
      const result = mailSystem.blockSender('player_1', 'player_2');
      
      expect(result).toBe(true);
      const blocked = mailSystem.getBlockedSenders('player_1');
      expect(blocked).toContain('player_2');
    });

    test('应该取消拉黑', () => {
      mailSystem.blockSender('player_1', 'player_2');
      mailSystem.unblockSender('player_1', 'player_2');
      
      const blocked = mailSystem.getBlockedSenders('player_1');
      expect(blocked).not.toContain('player_2');
    });
  });

  describe('邮箱统计 - Mail Stats', () => {
    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
      mailSystem.initializePlayerState('player_2');
      
      mailSystem.sendSystemMail('player_1', '邮件 1', '内容 1');
      mailSystem.sendSystemMail('player_1', '邮件 2', '内容 2');
      mailSystem.sendPlayerMail('player_2', '玩家 2', 'player_1', '玩家邮件', '内容');
    });

    test('应该获取邮箱统计', () => {
      const stats = mailSystem.getMailStats('player_1');
      
      expect(stats).toBeDefined();
      expect(stats!.totalMails).toBe(3);
      expect(stats!.unreadCount).toBe(3);
      expect(stats!.totalReceived).toBe(3);
      expect(stats!.totalSent).toBe(0);
      
      const senderStats = mailSystem.getMailStats('player_2');
      expect(senderStats!.totalSent).toBe(1);
    });
  });

  describe('配置管理 - Configuration Management', () => {
    test('应该使用默认配置', () => {
      const config = mailSystem.getConfig();
      
      expect(config.maxMailBoxSize).toBe(100);
      expect(config.mailExpirationDays).toBe(30);
      expect(config.maxAttachments).toBe(10);
      expect(config.maxGoldPerMail).toBe(100000);
      expect(config.canSendPlayerMail).toBe(true);
    });

    test('应该可以更新配置', () => {
      mailSystem.updateConfig({
        maxMailBoxSize: 50,
        mailExpirationDays: 7,
      });
      
      const config = mailSystem.getConfig();
      expect(config.maxMailBoxSize).toBe(50);
      expect(config.mailExpirationDays).toBe(7);
      expect(config.maxAttachments).toBe(10); // 未改变
    });
  });

  describe('数据导出导入 - Data Export/Import', () => {
    beforeEach(() => {
      mailSystem.initializePlayerState('player_1');
      mailSystem.sendSystemMail('player_1', '测试邮件', '内容', [
        { type: 'gold', amount: 1000 }
      ]);
    });

    test('应该导出邮箱数据', () => {
      const data = mailSystem.exportData();
      
      expect(data).toBeDefined();
      expect((data as any).mails.length).toBe(1);
      expect((data as any).playerInboxes.length).toBe(1);
      expect((data as any).config.maxMailBoxSize).toBe(100);
    });

    test('应该导入邮箱数据', () => {
      const newData = {
        mails: [
          {
            id: 'imported_mail',
            senderId: 'system',
            senderName: '系统',
            receiverId: 'player_1',
            title: '导入邮件',
            content: '内容',
            attachments: [],
            isRead: false,
            isClaimed: false,
            status: 'unread' as const,
            createdAt: Date.now(),
            expiresAt: Date.now() + 2592000000,
            mailType: 'system' as const,
          },
        ],
        playerInboxes: [['player_1', ['imported_mail']]] as [string, string[]][],
        playerStates: [
          { userId: 'player_1', unreadCount: 1, totalReceived: 1, totalSent: 0, blockedSenders: [] },
        ],
        config: { maxMailBoxSize: 200, mailExpirationDays: 30, maxAttachments: 10, maxGoldPerMail: 100000, canSendPlayerMail: true, minLevelToSendMail: 1 },
      };

      mailSystem.importData(newData);
      
      const mail = mailSystem.getMail('imported_mail', 'player_1');
      expect(mail).toBeDefined();
      expect(mail!.title).toBe('导入邮件');
      
      const config = mailSystem.getConfig();
      expect(config.maxMailBoxSize).toBe(200);
    });
  });
});
