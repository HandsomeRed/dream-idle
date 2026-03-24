/**
 * v0.54 公告系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createAnnouncementState,
  addAnnouncement,
  removeAnnouncement,
  markAsRead,
  markAllAsRead,
  dismissPopup,
  getPendingPopups,
  getActiveAnnouncements,
  getSortedAnnouncements,
  getUnreadCount,
  hasRedDot,
  getAnnouncementsByType,
  cleanExpiredAnnouncements,
  getAnnouncementStats,
  exportAnnouncementState,
  importAnnouncementState,
  AnnouncementState,
} from './announcement'

describe('v0.54 公告系统', () => {
  let state: AnnouncementState
  const now = Date.now()

  beforeEach(() => {
    state = createAnnouncementState()
  })

  describe('初始化', () => {
    it('应该创建空的公告状态', () => {
      expect(state.announcements.length).toBe(0)
      expect(state.readIds.size).toBe(0)
      expect(state.dismissedPopups.size).toBe(0)
    })
  })

  describe('公告管理', () => {
    it('应该添加公告', () => {
      const ann = addAnnouncement(state, {
        title: '测试公告',
        content: '这是一条测试公告',
        type: '系统',
        priority: 'normal',
        expiresAt: 0,
        popup: false,
        pinned: false,
        tags: [],
      })

      expect(ann.id).toBeDefined()
      expect(ann.title).toBe('测试公告')
      expect(state.announcements.length).toBe(1)
    })

    it('应该删除公告', () => {
      const ann = addAnnouncement(state, {
        title: '测试', content: '内容', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      const result = removeAnnouncement(state, ann.id)
      expect(result).toBe(true)
      expect(state.announcements.length).toBe(0)
    })

    it('删除不存在的公告返回 false', () => {
      expect(removeAnnouncement(state, 'nonexistent')).toBe(false)
    })

    it('新公告应该排在前面', () => {
      addAnnouncement(state, {
        title: '公告1', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })
      addAnnouncement(state, {
        title: '公告2', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      expect(state.announcements[0].title).toBe('公告2')
    })
  })

  describe('已读管理', () => {
    it('应该标记公告为已读', () => {
      const ann = addAnnouncement(state, {
        title: '测试', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      const result = markAsRead(state, ann.id)
      expect(result).toBe(true)
      expect(state.readIds.has(ann.id)).toBe(true)
    })

    it('标记不存在的公告返回 false', () => {
      expect(markAsRead(state, 'nonexistent')).toBe(false)
    })

    it('应该标记所有公告为已读', () => {
      for (let i = 0; i < 5; i++) {
        addAnnouncement(state, {
          title: `公告${i}`, content: '', type: '系统',
          priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
        })
      }

      const count = markAllAsRead(state)
      expect(count).toBe(5)
      expect(getUnreadCount(state)).toBe(0)
    })
  })

  describe('未读与红点', () => {
    it('新公告应该是未读状态', () => {
      addAnnouncement(state, {
        title: '测试', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      expect(getUnreadCount(state)).toBe(1)
      expect(hasRedDot(state)).toBe(true)
    })

    it('读完后红点消失', () => {
      const ann = addAnnouncement(state, {
        title: '测试', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      markAsRead(state, ann.id)
      expect(getUnreadCount(state)).toBe(0)
      expect(hasRedDot(state)).toBe(false)
    })

    it('无公告时没有红点', () => {
      expect(hasRedDot(state)).toBe(false)
    })
  })

  describe('弹窗公告', () => {
    it('应该获取待弹出的公告', () => {
      addAnnouncement(state, {
        title: '弹窗公告', content: '', type: '系统',
        priority: 'high', expiresAt: 0, popup: true, pinned: false, tags: [],
      })
      addAnnouncement(state, {
        title: '普通公告', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      const popups = getPendingPopups(state)
      expect(popups.length).toBe(1)
      expect(popups[0].title).toBe('弹窗公告')
    })

    it('关闭弹窗后不再显示', () => {
      const ann = addAnnouncement(state, {
        title: '弹窗', content: '', type: '系统',
        priority: 'high', expiresAt: 0, popup: true, pinned: false, tags: [],
      })

      dismissPopup(state, ann.id)
      expect(getPendingPopups(state).length).toBe(0)
      expect(state.readIds.has(ann.id)).toBe(true) // 同时标记已读
    })

    it('非弹窗公告不能关闭弹窗', () => {
      const ann = addAnnouncement(state, {
        title: '普通', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      expect(dismissPopup(state, ann.id)).toBe(false)
    })

    it('弹窗应该按优先级排序', () => {
      addAnnouncement(state, {
        title: '普通弹窗', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: true, pinned: false, tags: [],
      })
      addAnnouncement(state, {
        title: '紧急弹窗', content: '', type: '紧急',
        priority: 'urgent', expiresAt: 0, popup: true, pinned: false, tags: [],
      })

      const popups = getPendingPopups(state)
      expect(popups[0].title).toBe('紧急弹窗')
    })
  })

  describe('排序', () => {
    it('置顶公告应该排在前面', () => {
      addAnnouncement(state, {
        title: '普通公告', content: '', type: '系统',
        priority: 'high', expiresAt: 0, popup: false, pinned: false, tags: [],
      })
      addAnnouncement(state, {
        title: '置顶公告', content: '', type: '系统',
        priority: 'low', expiresAt: 0, popup: false, pinned: true, tags: [],
      })

      const sorted = getSortedAnnouncements(state)
      expect(sorted[0].title).toBe('置顶公告')
    })

    it('同级别按优先级排序', () => {
      addAnnouncement(state, {
        title: '低优先级', content: '', type: '系统',
        priority: 'low', expiresAt: 0, popup: false, pinned: false, tags: [],
      })
      addAnnouncement(state, {
        title: '高优先级', content: '', type: '紧急',
        priority: 'urgent', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      const sorted = getSortedAnnouncements(state)
      expect(sorted[0].title).toBe('高优先级')
    })
  })

  describe('过期管理', () => {
    it('过期公告不应出现在有效列表', () => {
      addAnnouncement(state, {
        title: '过期公告', content: '', type: '系统',
        priority: 'normal', expiresAt: now - 1000, popup: false, pinned: false, tags: [],
      })
      addAnnouncement(state, {
        title: '有效公告', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      const active = getActiveAnnouncements(state, now)
      expect(active.length).toBe(1)
      expect(active[0].title).toBe('有效公告')
    })

    it('应该清理过期公告', () => {
      addAnnouncement(state, {
        title: '过期1', content: '', type: '系统',
        priority: 'normal', expiresAt: now - 1000, popup: false, pinned: false, tags: [],
      })
      addAnnouncement(state, {
        title: '过期2', content: '', type: '系统',
        priority: 'normal', expiresAt: now - 2000, popup: false, pinned: false, tags: [],
      })
      addAnnouncement(state, {
        title: '有效', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      const cleaned = cleanExpiredAnnouncements(state, now)
      expect(cleaned).toBe(2)
      expect(state.announcements.length).toBe(1)
    })

    it('永不过期的公告不会被清理', () => {
      addAnnouncement(state, {
        title: '永久公告', content: '', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [],
      })

      const cleaned = cleanExpiredAnnouncements(state, now + 999999999)
      expect(cleaned).toBe(0)
    })
  })

  describe('类型筛选', () => {
    beforeEach(() => {
      addAnnouncement(state, { title: '系统1', content: '', type: '系统', priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [] })
      addAnnouncement(state, { title: '活动1', content: '', type: '活动', priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [] })
      addAnnouncement(state, { title: '更新1', content: '', type: '更新', priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [] })
      addAnnouncement(state, { title: '系统2', content: '', type: '系统', priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [] })
    })

    it('应该按类型筛选', () => {
      const system = getAnnouncementsByType(state, '系统')
      expect(system.length).toBe(2)

      const events = getAnnouncementsByType(state, '活动')
      expect(events.length).toBe(1)
    })

    it('空类型返回空数组', () => {
      const maintenance = getAnnouncementsByType(state, '维护')
      expect(maintenance.length).toBe(0)
    })
  })

  describe('统计信息', () => {
    it('应该获取公告统计', () => {
      addAnnouncement(state, { title: '系统', content: '', type: '系统', priority: 'normal', expiresAt: 0, popup: true, pinned: false, tags: [] })
      addAnnouncement(state, { title: '活动', content: '', type: '活动', priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: [] })

      const stats = getAnnouncementStats(state)

      expect(stats.total).toBe(2)
      expect(stats.active).toBe(2)
      expect(stats.unread).toBe(2)
      expect(stats.byType['系统']).toBe(1)
      expect(stats.byType['活动']).toBe(1)
      expect(stats.pendingPopups).toBe(1)
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入公告状态', () => {
      const ann = addAnnouncement(state, {
        title: '测试', content: '内容', type: '系统',
        priority: 'normal', expiresAt: 0, popup: false, pinned: false, tags: ['tag1'],
      })
      markAsRead(state, ann.id)

      const exported = exportAnnouncementState(state)
      expect(exported.announcements.length).toBe(1)
      expect(exported.readIds.length).toBe(1)

      const imported = importAnnouncementState(exported)
      expect(imported.announcements.length).toBe(1)
      expect(imported.readIds.has(ann.id)).toBe(true)
    })
  })
})
