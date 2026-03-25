// 邮件系统 - v0.79
// Mail System - 系统邮件/附件领取/过期清理/批量操作

/**
 * 邮件类型
 */
export type MailType = 'system' | 'reward' | 'notification' | 'event' | 'maintenance' | 'gift';

/**
 * 邮件状态
 */
export type MailStatus = 'unread' | 'read' | 'claimed' | 'deleted';

/**
 * 邮件附件
 */
export interface MailAttachment {
  type: 'gold' | 'diamond' | 'exp' | 'stamina' | 'item' | 'equip' | 'petShard' | 'heroShard' | 'summonTicket';
  amount: number;
  name: string;
  itemId?: string;
}

/**
 * 邮件配置
 */
export interface MailConfig {
  id: string;
  title: string;
  content: string;
  sender: string;
  type: MailType;
  attachments?: MailAttachment[];
  createdAt: number;
  expiresAt: number;
  priority: 'low' | 'normal' | 'high';
}

/**
 * 玩家邮件
 */
export interface PlayerMail {
  id: string;
  configId: string;
  title: string;
  content: string;
  sender: string;
  type: MailType;
  attachments?: MailAttachment[];
  status: MailStatus;
  createdAt: number;
  expiresAt: number;
  readAt?: number;
  claimedAt?: number;
  priority: 'low' | 'normal' | 'high';
}

/**
 * 邮件系统状态
 */
export interface MailState {
  playerId: string;
  /** 所有邮件 */
  mails: PlayerMail[];
  /** 未读邮件数 */
  unreadCount: number;
  /** 可领取附件邮件数 */
  claimableCount: number;
  /** 已删除邮件数 */
  deletedCount: number;
  /** 最后清理时间 */
  lastCleanupTime: number;
  /** 邮件模板 */
  templates: Record<string, MailConfig>;
}

// ==================== 邮件模板 ====================

export const MAIL_TEMPLATES: Record<string, Omit<MailConfig, 'id' | 'createdAt' | 'expiresAt'>> = {
  welcome: {
    title: '欢迎来到梦幻放置！',
    content: '亲爱的玩家，欢迎加入梦幻放置的世界！这是您的新手礼包，请查收。',
    sender: '系统',
    type: 'gift',
    attachments: [
      { type: 'diamond', amount: 100, name: '钻石' },
      { type: 'summonTicket', amount: 5, name: '召唤券' },
      { type: 'gold', amount: 10000, name: '金币' },
    ],
    priority: 'high',
  },
  maintenance: {
    title: '维护补偿通知',
    content: '尊敬的玩家，今日维护已完成，感谢您的耐心等待。这是维护补偿，请查收。',
    sender: '运营团队',
    type: 'maintenance',
    attachments: [
      { type: 'diamond', amount: 200, name: '钻石' },
      { type: 'stamina', amount: 100, name: '体力' },
    ],
    priority: 'normal',
  },
  achievement: {
    title: '成就达成通知',
    content: '恭喜您达成了新的成就！这是您的成就奖励。',
    sender: '系统',
    type: 'reward',
    attachments: [],
    priority: 'low',
  },
  event: {
    title: '活动开启通知',
    content: '全新活动已开启，快来参与赢取丰厚奖励吧！',
    sender: '运营团队',
    type: 'event',
    attachments: [],
    priority: 'normal',
  },
};

export const MAIL_EXPIRY_DAYS = 30; // 邮件保留 30 天
export const MAX_MAILS = 100; // 最大邮件数

// ==================== 工具函数 ====================

export function getNow(): number {
  return Date.now();
}

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? getNow());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function generateMailId(): string {
  return `mail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getMailTypeLabel(type: MailType): string {
  const labels: Record<MailType, string> = {
    system: '系统',
    reward: '奖励',
    notification: '通知',
    event: '活动',
    maintenance: '维护',
    gift: '礼包',
  };
  return labels[type];
}

export function getStatusLabel(status: MailStatus): string {
  const labels: Record<MailStatus, string> = {
    unread: '未读',
    read: '已读',
    claimed: '已领取',
    deleted: '已删除',
  };
  return labels[status];
}

// ==================== 核心函数 ====================

/**
 * 创建邮件系统状态
 */
export function createMailState(playerId: string, now?: number): MailState {
  const templates: Record<string, MailConfig> = {};
  Object.entries(MAIL_TEMPLATES).forEach(([key, template]) => {
    templates[key] = {
      ...template,
      id: key,
      createdAt: now ?? getNow(),
      expiresAt: 0, // 模板不过期
    };
  });

  return {
    playerId,
    mails: [],
    unreadCount: 0,
    claimableCount: 0,
    deletedCount: 0,
    lastCleanupTime: now ?? getNow(),
    templates,
  };
}

/**
 * 发送邮件
 */
export function sendMail(
  state: MailState,
  templateKey: string,
  customData?: Partial<MailConfig>,
  now?: number
): { state: MailState; mail?: PlayerMail; error?: string } {
  const template = state.templates[templateKey];
  if (!template) {
    // 尝试使用自定义数据创建
    if (!customData?.title || !customData?.content) {
      return { state, error: '邮件模板不存在' };
    }
  }

  const currentTime = now ?? getNow();
  const expiryDays = customData?.expiresAt ? 0 : MAIL_EXPIRY_DAYS;
  const expiresAt = customData?.expiresAt || (currentTime + expiryDays * 24 * 60 * 60 * 1000);

  const mail: PlayerMail = {
    id: generateMailId(),
    configId: templateKey,
    title: customData?.title || template?.title || '系统邮件',
    content: customData?.content || template?.content || '',
    sender: customData?.sender || template?.sender || '系统',
    type: customData?.type || template?.type || 'system',
    attachments: customData?.attachments || template?.attachments,
    status: 'unread',
    createdAt: currentTime,
    expiresAt,
    priority: customData?.priority || template?.priority || 'normal',
  };

  const newMails = [mail, ...state.mails].slice(0, MAX_MAILS);

  return {
    state: {
      ...state,
      mails: newMails,
      unreadCount: newMails.filter(m => m.status === 'unread').length,
      claimableCount: newMails.filter(m => m.status === 'unread' && m.attachments && m.attachments.length > 0).length,
    },
    mail,
  };
}

/**
 * 标记邮件为已读
 */
export function markMailRead(state: MailState, mailId: string, now?: number): { state: MailState; success: boolean; error?: string } {
  const mailIndex = state.mails.findIndex(m => m.id === mailId);
  if (mailIndex === -1) {
    return { state, success: false, error: '邮件不存在' };
  }

  const mail = state.mails[mailIndex];
  if (mail.status !== 'unread') {
    return { state, success: false, error: '邮件已读' };
  }

  const newMails = [...state.mails];
  newMails[mailIndex] = { ...mail, status: 'read', readAt: now ?? getNow() };

  return {
    state: {
      ...state,
      mails: newMails,
      unreadCount: newMails.filter(m => m.status === 'unread').length,
      claimableCount: newMails.filter(m => m.status !== 'claimed' && m.status !== 'deleted' && m.attachments && m.attachments.length > 0).length,
    },
    success: true,
  };
}

/**
 * 批量标记已读
 */
export function markAllRead(state: MailState, now?: number): { state: MailState; count: number } {
  const newMails: PlayerMail[] = state.mails.map(m => {
    if (m.status === 'unread') {
      return { ...m, status: 'read' as MailStatus, readAt: now ?? getNow() };
    }
    return m;
  });

  const count = state.mails.filter(m => m.status === 'unread').length;

  return {
    state: {
      ...state,
      mails: newMails,
      unreadCount: 0,
      claimableCount: newMails.filter(m => m.status !== 'claimed' && m.status !== 'deleted' && m.attachments && m.attachments.length > 0).length,
    },
    count,
  };
}

/**
 * 领取附件
 */
export function claimAttachments(
  state: MailState,
  mailId: string,
  now?: number
): { state: MailState; success: boolean; attachments?: MailAttachment[]; error?: string } {
  const mailIndex = state.mails.findIndex(m => m.id === mailId);
  if (mailIndex === -1) {
    return { state, success: false, error: '邮件不存在' };
  }

  const mail = state.mails[mailIndex];
  if (!mail.attachments || mail.attachments.length === 0) {
    return { state, success: false, error: '该邮件无附件' };
  }

  if (mail.status === 'claimed' || mail.status === 'deleted') {
    return { state, success: false, error: '附件已领取或邮件已删除' };
  }

  const newMails = [...state.mails];
  newMails[mailIndex] = {
    ...mail,
    status: 'claimed',
    claimedAt: now ?? getNow(),
  };

  return {
    state: {
      ...state,
      mails: newMails,
      unreadCount: newMails.filter(m => m.status === 'unread').length,
      claimableCount: newMails.filter(m => m.status !== 'claimed' && m.status !== 'deleted' && m.attachments && m.attachments.length > 0).length,
    },
    success: true,
    attachments: mail.attachments,
  };
}

/**
 * 批量领取附件
 */
export function claimAllAttachments(state: MailState, now?: number): { state: MailState; totalAttachments: MailAttachment[]; count: number } {
  const newMails = [...state.mails];
  const totalAttachments: MailAttachment[] = [];
  let count = 0;

  for (let i = 0; i < newMails.length; i++) {
    const mail = newMails[i];
    if (mail.attachments && mail.attachments.length > 0 && mail.status !== 'claimed' && mail.status !== 'deleted') {
      newMails[i] = { ...mail, status: 'claimed', claimedAt: now ?? getNow() };
      totalAttachments.push(...mail.attachments);
      count++;
    }
  }

  return {
    state: {
      ...state,
      mails: newMails,
      unreadCount: newMails.filter(m => m.status === 'unread').length,
      claimableCount: 0,
    },
    totalAttachments,
    count,
  };
}

/**
 * 删除邮件
 */
export function deleteMail(state: MailState, mailId: string): { state: MailState; success: boolean; error?: string } {
  const mailIndex = state.mails.findIndex(m => m.id === mailId);
  if (mailIndex === -1) {
    return { state, success: false, error: '邮件不存在' };
  }

  const newMails = [...state.mails];
  newMails[mailIndex] = { ...newMails[mailIndex], status: 'deleted' };

  return {
    state: {
      ...state,
      mails: newMails,
      deletedCount: newMails.filter(m => m.status === 'deleted').length,
      unreadCount: newMails.filter(m => m.status === 'unread').length,
      claimableCount: newMails.filter(m => m.status !== 'claimed' && m.status !== 'deleted' && m.attachments && m.attachments.length > 0).length,
    },
    success: true,
  };
}

/**
 * 清理过期邮件
 */
export function cleanupExpiredMails(state: MailState, now?: number): { state: MailState; cleanedCount: number } {
  const currentTime = now ?? getNow();
  const newMails = state.mails.filter(m => {
    if (m.status === 'deleted') return false; // 删除的邮件直接清理
    if (m.expiresAt > 0 && m.expiresAt < currentTime) return false; // 过期的邮件清理
    return true;
  });

  const cleanedCount = state.mails.length - newMails.length;

  return {
    state: {
      ...state,
      mails: newMails,
      deletedCount: newMails.filter(m => m.status === 'deleted').length,
      unreadCount: newMails.filter(m => m.status === 'unread').length,
      claimableCount: newMails.filter(m => m.status !== 'claimed' && m.status !== 'deleted' && m.attachments && m.attachments.length > 0).length,
      lastCleanupTime: currentTime,
    },
    cleanedCount,
  };
}

/**
 * 获取邮件列表
 */
export function getMailList(state: MailState, options?: { type?: MailType; status?: MailStatus; limit?: number }): PlayerMail[] {
  let mails = [...state.mails];

  if (options?.type) {
    mails = mails.filter(m => m.type === options.type);
  }

  if (options?.status) {
    mails = mails.filter(m => m.status === options.status);
  }

  // 按优先级和时间排序
  mails.sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.createdAt - a.createdAt;
  });

  if (options?.limit) {
    mails = mails.slice(0, options.limit);
  }

  return mails;
}

/**
 * 获取邮件统计
 */
export function getMailStats(state: MailState): {
  totalMails: number;
  unreadCount: number;
  readCount: number;
  claimedCount: number;
  deletedCount: number;
  claimableCount: number;
  byType: Record<MailType, number>;
} {
  const byType: Record<MailType, number> = {
    system: 0, reward: 0, notification: 0, event: 0, maintenance: 0, gift: 0,
  };

  state.mails.forEach(m => {
    byType[m.type]++;
  });

  return {
    totalMails: state.mails.length,
    unreadCount: state.unreadCount,
    readCount: state.mails.filter(m => m.status === 'read').length,
    claimedCount: state.mails.filter(m => m.status === 'claimed').length,
    deletedCount: state.deletedCount,
    claimableCount: state.claimableCount,
    byType,
  };
}

/**
 * 导出数据
 */
export function exportMailData(state: MailState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importMailData(json: string): MailState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !Array.isArray(data.mails)) return null;
    return data as MailState;
  } catch {
    return null;
  }
}
