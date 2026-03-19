/**
 * Mail System - v0.33
 * 邮件系统：系统邮件、奖励领取、邮件管理
 */

// ==================== 枚举和类型定义 ====================

/**
 * 邮件类型
 */
export enum MailType {
  System = 'system',     // 系统邮件
  Reward = 'reward',     // 奖励邮件
  Event = 'event',       // 活动邮件
  Maintenance = 'maintenance', // 维护通知
}

/**
 * 邮件优先级
 */
export enum MailPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Urgent = 'urgent',
}

/**
 * 邮件奖励
 */
export interface MailReward {
  type: string;
  amount: number;
  itemId?: string;
}

/**
 * 邮件定义
 */
export interface Mail {
  id: string;
  type: MailType;
  priority: MailPriority;
  title: string;
  content: string;
  sender: string;
  rewards: MailReward[];
  createdAt: number;
  expiresAt?: number;  // 过期时间
  isRead: boolean;
  isClaimed: boolean;  // 奖励是否已领取
  isLocked?: boolean;  // 是否锁定（不可删除）
}

/**
 * 玩家邮件状态
 */
export interface MailState {
  mails: Mail[];
  maxMails: number;  // 邮箱容量上限
  autoDeleteDays: number;  // 自动删除天数
}

/**
 * 发送邮件结果
 */
export interface SendMailResult {
  success: boolean;
  mail?: Mail;
  message: string;
}

/**
 * 领取奖励结果
 */
export interface ClaimRewardResult {
  success: boolean;
  rewards?: MailReward[];
  message: string;
}

/**
 * 邮件操作结果
 */
export interface MailOperationResult {
  success: boolean;
  message: string;
}

// ==================== 常量配置 ====================

/**
 * 邮箱容量上限
 */
export const MAX_MAILS = 100;

/**
 * 自动删除天数（30 天）
 */
export const AUTO_DELETE_DAYS = 30;

/**
 * 默认发件人
 */
export const DEFAULT_SENDER = '梦幻放置项目组';

// ==================== 邮件状态管理 ====================

/**
 * 初始化邮件状态
 */
export function initializeMailState(): MailState {
  return {
    mails: [],
    maxMails: MAX_MAILS,
    autoDeleteDays: AUTO_DELETE_DAYS,
  };
}

/**
 * 生成邮件 ID
 */
function generateMailId(): string {
  return `mail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 发送邮件
 */
export function sendMail(
  state: MailState,
  type: MailType,
  title: string,
  content: string,
  rewards: MailReward[] = [],
  priority: MailPriority = MailPriority.Normal,
  expiresAt?: number
): SendMailResult {
  // 检查邮箱容量
  if (state.mails.length >= state.maxMails) {
    // 删除最早的未锁定邮件
    const oldestIndex = state.mails.findIndex(m => !m.isLocked && !m.isRead);
    if (oldestIndex === -1) {
      return {
        success: false,
        message: '邮箱已满，无法接收新邮件',
      };
    }
    state.mails.splice(oldestIndex, 1);
  }
  
  const mail: Mail = {
    id: generateMailId(),
    type,
    priority,
    title,
    content,
    sender: DEFAULT_SENDER,
    rewards,
    createdAt: Date.now(),
    expiresAt,
    isRead: false,
    isClaimed: rewards.length === 0,  // 无奖励邮件标记为已领取
    isLocked: priority === MailPriority.Urgent,
  };
  
  state.mails.unshift(mail);  // 新邮件放在最前面
  
  return {
    success: true,
    mail,
    message: `邮件已发送：${title}`,
  };
}

/**
 * 发送系统邮件
 */
export function sendSystemMail(
  state: MailState,
  title: string,
  content: string,
  rewards: MailReward[] = []
): SendMailResult {
  return sendMail(state, MailType.System, title, content, rewards);
}

/**
 * 发送奖励邮件
 */
export function sendRewardMail(
  state: MailState,
  title: string,
  content: string,
  rewards: MailReward[]
): SendMailResult {
  return sendMail(state, MailType.Reward, title, content, rewards, MailPriority.High);
}

/**
 * 读取邮件
 */
export function readMail(state: MailState, mailId: string): MailOperationResult {
  const mail = state.mails.find(m => m.id === mailId);
  
  if (!mail) {
    return {
      success: false,
      message: '邮件不存在',
    };
  }
  
  mail.isRead = true;
  
  return {
    success: true,
    message: '邮件已读',
  };
}

/**
 * 领取邮件奖励
 */
export function claimMailReward(
  state: MailState,
  mailId: string
): ClaimRewardResult {
  const mail = state.mails.find(m => m.id === mailId);
  
  if (!mail) {
    return {
      success: false,
      message: '邮件不存在',
    };
  }
  
  if (mail.isClaimed) {
    return {
      success: false,
      message: '奖励已领取',
    };
  }
  
  if (mail.rewards.length === 0) {
    return {
      success: false,
      message: '该邮件没有奖励',
    };
  }
  
  mail.isClaimed = true;
  
  return {
    success: true,
    rewards: mail.rewards,
    message: `奖励已领取！共 ${mail.rewards.length} 项`,
  };
}

/**
 * 一键领取所有奖励
 */
export function claimAllRewards(state: MailState): ClaimRewardResult[] {
  const results: ClaimRewardResult[] = [];
  
  state.mails.forEach(mail => {
    if (!mail.isClaimed && mail.rewards.length > 0) {
      mail.isClaimed = true;
      results.push({
        success: true,
        rewards: mail.rewards,
        message: `已领取：${mail.title}`,
      });
    }
  });
  
  return results;
}

/**
 * 删除邮件
 */
export function deleteMail(state: MailState, mailId: string): MailOperationResult {
  const index = state.mails.findIndex(m => m.id === mailId);
  
  if (index === -1) {
    return {
      success: false,
      message: '邮件不存在',
    };
  }
  
  const mail = state.mails[index];
  
  if (mail.isLocked) {
    return {
      success: false,
      message: '锁定邮件无法删除',
    };
  }
  
  if (!mail.isClaimed && mail.rewards.length > 0) {
    return {
      success: false,
      message: '请先领取奖励再删除',
    };
  }
  
  state.mails.splice(index, 1);
  
  return {
    success: true,
    message: '邮件已删除',
  };
}

/**
 * 一键删除已读邮件
 */
export function deleteAllReadMails(state: MailState): MailOperationResult {
  const initialCount = state.mails.length;
  
  state.mails = state.mails.filter(mail => {
    if (mail.isLocked) return true;
    if (!mail.isRead) return true;
    if (!mail.isClaimed && mail.rewards.length > 0) return true;
    return false;
  });
  
  const deletedCount = initialCount - state.mails.length;
  
  return {
    success: true,
    message: `已删除 ${deletedCount} 封邮件`,
  };
}

/**
 * 清理过期邮件
 */
export function cleanExpiredMails(state: MailState): MailOperationResult {
  const now = Date.now();
  const initialCount = state.mails.length;
  
  state.mails = state.mails.filter(mail => {
    if (mail.isLocked) return true;
    if (mail.expiresAt && now >= mail.expiresAt) return false;
    
    // 检查是否超过自动删除天数
    const mailAge = now - mail.createdAt;
    const maxAge = state.autoDeleteDays * 24 * 60 * 60 * 1000;
    if (mailAge > maxAge) return false;
    
    return true;
  });
  
  const deletedCount = initialCount - state.mails.length;
  
  return {
    success: true,
    message: deletedCount > 0 ? `已清理 ${deletedCount} 封过期邮件` : '无需清理',
  };
}

/**
 * 批量删除邮件
 */
export function deleteMultipleMails(
  state: MailState,
  mailIds: string[]
): { success: number; failed: number; message: string } {
  let successCount = 0;
  let failedCount = 0;
  
  mailIds.forEach(mailId => {
    const result = deleteMail(state, mailId);
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
  });
  
  return {
    success: successCount,
    failed: failedCount,
    message: `删除完成：成功 ${successCount} 封，失败 ${failedCount} 封`,
  };
}

// ==================== 邮件查询 ====================

/**
 * 获取未读邮件数量
 */
export function getUnreadCount(state: MailState): number {
  return state.mails.filter(m => !m.isRead).length;
}

/**
 * 获取可领取奖励的邮件数量
 */
export function getClaimableCount(state: MailState): number {
  return state.mails.filter(m => !m.isClaimed && m.rewards.length > 0).length;
}

/**
 * 按类型获取邮件
 */
export function getMailsByType(state: MailState, type: MailType): Mail[] {
  return state.mails.filter(m => m.type === type);
}

/**
 * 获取未读邮件
 */
export function getUnreadMails(state: MailState): Mail[] {
  return state.mails.filter(m => !m.isRead);
}

/**
 * 获取可领取奖励的邮件
 */
export function getClaimableMails(state: MailState): Mail[] {
  return state.mails.filter(m => !m.isClaimed && m.rewards.length > 0);
}

/**
 * 获取邮件详情
 */
export function getMailById(state: MailState, mailId: string): Mail | undefined {
  return state.mails.find(m => m.id === mailId);
}

/**
 * 按优先级排序邮件
 */
export function sortMailsByPriority(mails: Mail[]): Mail[] {
  const priorityOrder: Record<MailPriority, number> = {
    [MailPriority.Urgent]: 0,
    [MailPriority.High]: 1,
    [MailPriority.Normal]: 2,
    [MailPriority.Low]: 3,
  };
  
  return [...mails].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ==================== 统计 ====================

/**
 * 获取邮箱统计信息
 */
export function getMailStatistics(state: MailState): {
  total: number;
  unread: number;
  claimable: number;
  locked: number;
  capacity: number;
  usagePercent: number;
} {
  const total = state.mails.length;
  const unread = getUnreadCount(state);
  const claimable = getClaimableCount(state);
  const locked = state.mails.filter(m => m.isLocked).length;
  
  return {
    total,
    unread,
    claimable,
    locked,
    capacity: state.maxMails,
    usagePercent: Math.floor((total / state.maxMails) * 100),
  };
}

/**
 * 计算总奖励
 */
export function calculateTotalRewards(state: MailState): Record<string, number> {
  const totals: Record<string, number> = {};
  
  state.mails.forEach(mail => {
    if (!mail.isClaimed) {
      mail.rewards.forEach(reward => {
        const key = `${reward.type}${reward.itemId ? `_${reward.itemId}` : ''}`;
        totals[key] = (totals[key] || 0) + reward.amount;
      });
    }
  });
  
  return totals;
}
