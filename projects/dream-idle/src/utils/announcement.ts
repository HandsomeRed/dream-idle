/**
 * v0.54 公告系统
 * 
 * 功能特性：
 * - 游戏公告管理（系统/活动/更新/维护）
 * - 公告优先级排序
 * - 公告已读/未读追踪
 * - 弹窗公告（登录后自动弹出）
 * - 公告过期自动清理
 * - 红点提示
 */

export type AnnouncementType = '系统' | '活动' | '更新' | '维护' | '紧急'
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Announcement {
  id: string
  title: string
  content: string
  type: AnnouncementType
  priority: AnnouncementPriority
  createdAt: number
  expiresAt: number            // 过期时间（0=永不过期）
  popup: boolean               // 是否弹窗显示
  pinned: boolean              // 是否置顶
  tags: string[]
}

export interface AnnouncementState {
  announcements: Announcement[]
  readIds: Set<string>          // 已读公告 ID
  dismissedPopups: Set<string>  // 已关闭弹窗的公告 ID
  lastCheckTime: number         // 上次检查时间
}

// ========== 核心函数 ==========

/**
 * 创建公告系统状态
 */
export function createAnnouncementState(): AnnouncementState {
  return {
    announcements: [],
    readIds: new Set(),
    dismissedPopups: new Set(),
    lastCheckTime: Date.now(),
  }
}

/**
 * 添加公告
 */
export function addAnnouncement(
  state: AnnouncementState,
  announcement: Omit<Announcement, 'id' | 'createdAt'>
): Announcement {
  const newAnnouncement: Announcement = {
    ...announcement,
    id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: Date.now(),
  }

  state.announcements.unshift(newAnnouncement)
  return newAnnouncement
}

/**
 * 删除公告
 */
export function removeAnnouncement(state: AnnouncementState, announcementId: string): boolean {
  const index = state.announcements.findIndex(a => a.id === announcementId)
  if (index === -1) return false

  state.announcements.splice(index, 1)
  state.readIds.delete(announcementId)
  state.dismissedPopups.delete(announcementId)
  return true
}

/**
 * 标记公告为已读
 */
export function markAsRead(state: AnnouncementState, announcementId: string): boolean {
  const announcement = state.announcements.find(a => a.id === announcementId)
  if (!announcement) return false

  state.readIds.add(announcementId)
  return true
}

/**
 * 标记所有公告为已读
 */
export function markAllAsRead(state: AnnouncementState): number {
  let count = 0
  for (const ann of state.announcements) {
    if (!state.readIds.has(ann.id)) {
      state.readIds.add(ann.id)
      count++
    }
  }
  return count
}

/**
 * 关闭弹窗公告
 */
export function dismissPopup(state: AnnouncementState, announcementId: string): boolean {
  const announcement = state.announcements.find(a => a.id === announcementId)
  if (!announcement || !announcement.popup) return false

  state.dismissedPopups.add(announcementId)
  state.readIds.add(announcementId)
  return true
}

/**
 * 获取待弹出的公告（登录时）
 */
export function getPendingPopups(state: AnnouncementState, now?: number): Announcement[] {
  const currentTime = now || Date.now()

  return getActiveAnnouncements(state, currentTime)
    .filter(a => a.popup && !state.dismissedPopups.has(a.id))
    .sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))
}

/**
 * 获取有效公告（未过期）
 */
export function getActiveAnnouncements(state: AnnouncementState, now?: number): Announcement[] {
  const currentTime = now || Date.now()

  return state.announcements.filter(a =>
    a.expiresAt === 0 || a.expiresAt > currentTime
  )
}

/**
 * 获取排序后的公告列表
 */
export function getSortedAnnouncements(state: AnnouncementState, now?: number): Announcement[] {
  const active = getActiveAnnouncements(state, now)

  return active.sort((a, b) => {
    // 置顶优先
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    // 然后按优先级
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
    if (priorityDiff !== 0) return priorityDiff
    // 最后按时间
    return b.createdAt - a.createdAt
  })
}

/**
 * 获取未读公告数量
 */
export function getUnreadCount(state: AnnouncementState, now?: number): number {
  const active = getActiveAnnouncements(state, now)
  return active.filter(a => !state.readIds.has(a.id)).length
}

/**
 * 是否有红点提示
 */
export function hasRedDot(state: AnnouncementState, now?: number): boolean {
  return getUnreadCount(state, now) > 0
}

/**
 * 按类型筛选公告
 */
export function getAnnouncementsByType(
  state: AnnouncementState,
  type: AnnouncementType,
  now?: number
): Announcement[] {
  return getActiveAnnouncements(state, now).filter(a => a.type === type)
}

/**
 * 清理过期公告
 */
export function cleanExpiredAnnouncements(state: AnnouncementState, now?: number): number {
  const currentTime = now || Date.now()
  const before = state.announcements.length

  state.announcements = state.announcements.filter(a =>
    a.expiresAt === 0 || a.expiresAt > currentTime
  )

  // 清理已删除公告的已读记录
  const activeIds = new Set(state.announcements.map(a => a.id))
  for (const readId of state.readIds) {
    if (!activeIds.has(readId)) state.readIds.delete(readId)
  }
  for (const popupId of state.dismissedPopups) {
    if (!activeIds.has(popupId)) state.dismissedPopups.delete(popupId)
  }

  return before - state.announcements.length
}

/**
 * 获取公告统计
 */
export function getAnnouncementStats(state: AnnouncementState, now?: number): {
  total: number
  active: number
  unread: number
  byType: Record<AnnouncementType, number>
  pendingPopups: number
} {
  const active = getActiveAnnouncements(state, now)
  const unread = getUnreadCount(state, now)
  const popups = getPendingPopups(state, now)

  const byType: Record<AnnouncementType, number> = {
    '系统': 0, '活动': 0, '更新': 0, '维护': 0, '紧急': 0,
  }
  for (const ann of active) {
    byType[ann.type]++
  }

  return {
    total: state.announcements.length,
    active: active.length,
    unread,
    byType,
    pendingPopups: popups.length,
  }
}

// ========== 辅助函数 ==========

function getPriorityWeight(priority: AnnouncementPriority): number {
  const weights: Record<AnnouncementPriority, number> = {
    low: 1,
    normal: 2,
    high: 3,
    urgent: 4,
  }
  return weights[priority]
}

/**
 * 导出公告状态
 */
export function exportAnnouncementState(state: AnnouncementState): any {
  return {
    announcements: state.announcements,
    readIds: Array.from(state.readIds),
    dismissedPopups: Array.from(state.dismissedPopups),
    lastCheckTime: state.lastCheckTime,
  }
}

/**
 * 导入公告状态
 */
export function importAnnouncementState(data: any): AnnouncementState {
  return {
    announcements: data.announcements,
    readIds: new Set(data.readIds),
    dismissedPopups: new Set(data.dismissedPopups),
    lastCheckTime: data.lastCheckTime,
  }
}
