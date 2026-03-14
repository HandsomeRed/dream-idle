/**
 * v0.14 邮件系统 - Mail System
 * 梦幻放置游戏邮件功能
 * 
 * Features:
 * - 系统邮件
 * - 玩家间邮件
 * - 邮件附件（金币/物品）
 * - 邮件已读/未读状态
 * - 邮件删除
 * - 附件领取
 * - 邮件过期处理
 */

export interface MailAttachment {
  type: 'gold' | 'item';
  amount: number;
  itemId?: string;
  itemName?: string;
  itemCount?: number;
}

export interface MailMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName?: string;
  title: string;
  content: string;
  attachments: MailAttachment[];
  isRead: boolean;
  isClaimed: boolean; // 附件是否已领取
  status: 'unread' | 'read' | 'claimed' | 'deleted';
  createdAt: number;
  expiresAt: number;
  mailType: MailType;
}

export type MailType = 'system' | 'player' | 'reward' | 'notification';

export interface MailConfig {
  maxMailBoxSize: number; // 邮箱最大容量
  mailExpirationDays: number; // 邮件过期天数
  maxAttachments: number; // 最大附件数量
  maxGoldPerMail: number; // 单封邮件最大金币数
  canSendPlayerMail: boolean; // 是否允许玩家间邮件
  minLevelToSendMail: number; // 发送邮件最小等级
}

export interface PlayerMailState {
  userId: string;
  unreadCount: number;
  totalReceived: number;
  totalSent: number;
  blockedSenders: string[]; // 发件人黑名单
}

export class MailSystem {
  private mails: Map<string, MailMessage>;
  private playerInboxes: Map<string, string[]>; // userId -> mailIds
  private playerStates: Map<string, PlayerMailState>;
  private config: MailConfig;

  constructor(config?: Partial<MailConfig>) {
    this.mails = new Map();
    this.playerInboxes = new Map();
    this.playerStates = new Map();
    this.config = {
      maxMailBoxSize: 100,
      mailExpirationDays: 30,
      maxAttachments: 10,
      maxGoldPerMail: 100000,
      canSendPlayerMail: true,
      minLevelToSendMail: 1,
      ...config,
    };
  }

  /**
   * 初始化玩家邮箱状态
   */
  initializePlayerState(userId: string): PlayerMailState {
    if (!this.playerStates.has(userId)) {
      const state: PlayerMailState = {
        userId,
        unreadCount: 0,
        totalReceived: 0,
        totalSent: 0,
        blockedSenders: [],
      };
      this.playerStates.set(userId, state);
      this.playerInboxes.set(userId, []);
    }
    return this.playerStates.get(userId)!;
  }

  /**
   * 发送系统邮件
   */
  sendSystemMail(
    receiverId: string,
    title: string,
    content: string,
    attachments: MailAttachment[] = [],
    expirationDays: number = this.config.mailExpirationDays
  ): { success: boolean; mailId?: string; error?: string } {
    return this.createMail(
      'system',
      '系统',
      receiverId,
      title,
      content,
      attachments,
      expirationDays
    );
  }

  /**
   * 发送玩家邮件
   */
  sendPlayerMail(
    senderId: string,
    senderName: string,
    receiverId: string,
    title: string,
    content: string,
    attachments: MailAttachment[] = [],
    expirationDays: number = this.config.mailExpirationDays
  ): { success: boolean; mailId?: string; error?: string } {
    if (!this.config.canSendPlayerMail) {
      return { success: false, error: '玩家间邮件功能已禁用' };
    }

    // 检查收件人是否拉黑了发件人
    const receiverState = this.initializePlayerState(receiverId);
    if (receiverState.blockedSenders.includes(senderId)) {
      return { success: false, error: '对方已将您拉入黑名单' };
    }

    return this.createMail(
      'player',
      senderName,
      receiverId,
      title,
      content,
      attachments,
      expirationDays,
      senderId
    );
  }

  /**
   * 发送奖励邮件
   */
  sendRewardMail(
    receiverId: string,
    title: string,
    content: string,
    attachments: MailAttachment[]
  ): { success: boolean; mailId?: string; error?: string } {
    return this.createMail(
      'reward',
      '系统',
      receiverId,
      title,
      content,
      attachments,
      this.config.mailExpirationDays
    );
  }

  /**
   * 创建邮件
   */
  private createMail(
    mailType: MailType,
    senderName: string,
    receiverId: string,
    title: string,
    content: string,
    attachments: MailAttachment[],
    expirationDays: number,
    senderId: string = 'system'
  ): { success: boolean; mailId?: string; error?: string } {
    const receiverState = this.initializePlayerState(receiverId);
    const inbox = this.playerInboxes.get(receiverId)!;

    // 检查邮箱容量
    if (inbox.length >= this.config.maxMailBoxSize) {
      return { 
        success: false, 
        error: `邮箱已满（最大容量：${this.config.maxMailBoxSize}）` 
      };
    }

    // 验证附件
    const validation = this.validateAttachments(attachments);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    // 创建邮件
    const mailId = this.generateMailId();
    const now = Date.now();
    
    const mail: MailMessage = {
      id: mailId,
      senderId,
      senderName,
      receiverId,
      title,
      content,
      attachments,
      isRead: false,
      isClaimed: false,
      status: 'unread',
      createdAt: now,
      expiresAt: now + (expirationDays * 24 * 3600000),
      mailType,
    };

    this.mails.set(mailId, mail);
    inbox.push(mailId);
    receiverState.unreadCount++;
    receiverState.totalReceived++;

    // 更新发件人状态（如果是玩家邮件）
    if (mailType === 'player' && senderId !== 'system') {
      const senderState = this.initializePlayerState(senderId);
      senderState.totalSent++;
    }

    return { success: true, mailId };
  }

  /**
   * 验证附件
   */
  private validateAttachments(attachments: MailAttachment[]): { valid: boolean; reason?: string } {
    if (attachments.length > this.config.maxAttachments) {
      return { 
        valid: false, 
        reason: `附件数量超过限制（最大：${this.config.maxAttachments}）` 
      };
    }

    let totalGold = 0;
    for (const attachment of attachments) {
      if (attachment.type === 'gold') {
        totalGold += attachment.amount;
        if (attachment.amount <= 0) {
          return { valid: false, reason: '金币数量必须大于 0' };
        }
      } else if (attachment.type === 'item') {
        if (!attachment.itemId || !attachment.itemName) {
          return { valid: false, reason: '物品附件必须包含 itemId 和 itemName' };
        }
        if (!attachment.itemCount || attachment.itemCount <= 0) {
          return { valid: false, reason: '物品数量必须大于 0' };
        }
      }
    }

    if (totalGold > this.config.maxGoldPerMail) {
      return { 
        valid: false,
        reason: `邮件金币超过限制（最大：${this.config.maxGoldPerMail}）` 
      };
    }

    return { valid: true };
  }

  /**
   * 获取邮件列表
   */
  getMailList(
    userId: string,
    options: {
      mailType?: MailType;
      status?: MailMessage['status'];
      page?: number;
      pageSize?: number;
    } = {}
  ): MailMessage[] {
    const inbox = this.playerInboxes.get(userId) || [];
    let mails = inbox
      .map(id => this.mails.get(id))
      .filter((m): m is MailMessage => m !== undefined && m.status !== 'deleted');

    // 筛选
    if (options.mailType) {
      mails = mails.filter(m => m.mailType === options.mailType);
    }

    if (options.status) {
      mails = mails.filter(m => m.status === options.status);
    }

    // 排序（新邮件在前）
    mails.sort((a, b) => b.createdAt - a.createdAt);

    // 分页
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return mails.slice(start, end);
  }

  /**
   * 获取邮件详情
   */
  getMail(mailId: string, userId: string): MailMessage | null {
    const mail = this.mails.get(mailId);
    if (!mail || mail.receiverId !== userId || mail.status === 'deleted') {
      return null;
    }

    // 标记为已读
    if (!mail.isRead) {
      mail.isRead = true;
      mail.status = 'read';
      const state = this.playerStates.get(userId);
      if (state) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    }

    return mail;
  }

  /**
   * 领取附件
   */
  claimAttachments(mailId: string, userId: string): { 
    success: boolean; 
    attachments?: MailAttachment[]; 
    error?: string 
  } {
    const mail = this.mails.get(mailId);
    if (!mail || mail.receiverId !== userId) {
      return { success: false, error: '邮件不存在' };
    }

    if (mail.status === 'deleted') {
      return { success: false, error: '邮件已删除' };
    }

    if (mail.isClaimed) {
      return { success: false, error: '附件已领取' };
    }

    if (mail.attachments.length === 0) {
      return { success: false, error: '邮件没有附件' };
    }

    // 标记为已领取
    mail.isClaimed = true;
    if (mail.status === 'read') {
      mail.status = 'claimed';
    }

    return { success: true, attachments: mail.attachments };
  }

  /**
   * 删除邮件
   */
  deleteMail(mailId: string, userId: string): boolean {
    const mail = this.mails.get(mailId);
    if (!mail || mail.receiverId !== userId) {
      return false;
    }

    mail.status = 'deleted';
    
    // 从邮箱列表中移除
    const inbox = this.playerInboxes.get(userId);
    if (inbox) {
      const index = inbox.indexOf(mailId);
      if (index > -1) {
        inbox.splice(index, 1);
      }
    }

    // 如果是未读邮件，减少未读数
    if (!mail.isRead) {
      const state = this.playerStates.get(userId);
      if (state) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    }

    return true;
  }

  /**
   * 一键领取所有附件
   */
  claimAllAttachments(userId: string): { 
    success: boolean; 
    claimedCount: number;
    attachments: MailAttachment[];
  } {
    const inbox = this.playerInboxes.get(userId) || [];
    const attachments: MailAttachment[] = [];
    let claimedCount = 0;

    inbox.forEach(mailId => {
      const mail = this.mails.get(mailId);
      if (mail && mail.status !== 'deleted' && !mail.isClaimed && mail.attachments.length > 0) {
        mail.isClaimed = true;
        if (mail.status === 'read') {
          mail.status = 'claimed';
        }
        attachments.push(...mail.attachments);
        claimedCount++;
      }
    });

    return { success: true, claimedCount, attachments };
  }

  /**
   * 一键删除所有已读邮件
   */
  deleteAllRead(userId: string): number {
    const inbox = this.playerInboxes.get(userId) || [];
    let deletedCount = 0;

    inbox.forEach(mailId => {
      const mail = this.mails.get(mailId);
      if (mail && mail.status === 'read' || mail.status === 'claimed') {
        mail.status = 'deleted';
        deletedCount++;
      }
    });

    // 清理邮箱列表
    this.playerInboxes.set(
      userId,
      inbox.filter(id => {
        const mail = this.mails.get(id);
        return mail && mail.status !== 'deleted';
      })
    );

    return deletedCount;
  }

  /**
   * 检查并处理过期邮件
   */
  checkExpiredMails(): number {
    const now = Date.now();
    let expiredCount = 0;

    this.mails.forEach((mail, mailId) => {
      if (now > mail.expiresAt && mail.status !== 'deleted') {
        mail.status = 'deleted';
        
        // 减少未读数
        if (!mail.isRead) {
          const state = this.playerStates.get(mail.receiverId);
          if (state) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }

        expiredCount++;
      }
    });

    return expiredCount;
  }

  /**
   * 拉黑发件人
   */
  blockSender(userId: string, senderId: string): boolean {
    const state = this.initializePlayerState(userId);
    
    if (!state.blockedSenders.includes(senderId)) {
      state.blockedSenders.push(senderId);
    }
    
    return true;
  }

  /**
   * 取消拉黑
   */
  unblockSender(userId: string, senderId: string): boolean {
    const state = this.playerStates.get(userId);
    if (!state) return false;
    
    state.blockedSenders = state.blockedSenders.filter(id => id !== senderId);
    return true;
  }

  /**
   * 获取拉黑列表
   */
  getBlockedSenders(userId: string): string[] {
    const state = this.playerStates.get(userId);
    return state?.blockedSenders || [];
  }

  /**
   * 获取玩家邮箱统计
   */
  getMailStats(userId: string): { 
    totalMails: number;
    unreadCount: number;
    totalReceived: number;
    totalSent: number;
  } | null {
    const state = this.playerStates.get(userId);
    const inbox = this.playerInboxes.get(userId) || [];
    
    if (!state) return null;

    const activeMails = inbox.filter(id => {
      const mail = this.mails.get(id);
      return mail && mail.status !== 'deleted';
    });

    return {
      totalMails: activeMails.length,
      unreadCount: state.unreadCount,
      totalReceived: state.totalReceived,
      totalSent: state.totalSent,
    };
  }

  /**
   * 获取未读邮件数
   */
  getUnreadCount(userId: string): number {
    const state = this.playerStates.get(userId);
    return state?.unreadCount || 0;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MailConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取配置
   */
  getConfig(): MailConfig {
    return { ...this.config };
  }

  /**
   * 生成邮件 ID
   */
  private generateMailId(): string {
    return `mail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出邮箱数据
   */
  exportData(): object {
    return {
      mails: Array.from(this.mails.values()),
      playerInboxes: Array.from(this.playerInboxes.entries()),
      playerStates: Array.from(this.playerStates.values()),
      config: this.config,
    };
  }

  /**
   * 导入邮箱数据
   */
  importData(data: { 
    mails: MailMessage[]; 
    playerInboxes: [string, string[]][]; 
    playerStates: PlayerMailState[];
    config?: MailConfig;
  }): void {
    this.mails.clear();
    this.playerInboxes.clear();
    this.playerStates.clear();

    data.mails.forEach(mail => {
      this.mails.set(mail.id, mail);
    });

    data.playerInboxes.forEach(([userId, mailIds]) => {
      this.playerInboxes.set(userId, mailIds);
    });

    data.playerStates.forEach(state => {
      this.playerStates.set(state.userId, state);
    });

    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
  }
}

// 导出单例实例
export const mailSystem = new MailSystem();
