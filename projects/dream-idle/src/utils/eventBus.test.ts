/**
 * v0.60 事件系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createEventBus, on, once, off, offAll, emit, emitBatch,
  pause, resume, getHistory, clearHistory,
  getSubscriptionCount, getEventBusStats,
  EventBusState,
} from './eventBus'

describe('v0.60 事件系统', () => {
  let bus: EventBusState

  beforeEach(() => { bus = createEventBus() })

  describe('订阅与发射', () => {
    it('应该订阅并接收事件', () => {
      let received = false
      on(bus, 'player:levelup', () => { received = true })
      emit(bus, 'player:levelup', { level: 10 })
      expect(received).toBe(true)
    })

    it('应该传递事件数据', () => {
      let eventData: any = null
      on(bus, 'player:levelup', (e) => { eventData = e.data })
      emit(bus, 'player:levelup', { level: 10 })
      expect(eventData.level).toBe(10)
    })

    it('不匹配的事件类型不触发', () => {
      let received = false
      on(bus, 'player:levelup', () => { received = true })
      emit(bus, 'battle:win')
      expect(received).toBe(false)
    })

    it('多个订阅者都能接收', () => {
      let count = 0
      on(bus, 'player:levelup', () => { count++ })
      on(bus, 'player:levelup', () => { count++ })
      on(bus, 'player:levelup', () => { count++ })
      emit(bus, 'player:levelup')
      expect(count).toBe(3)
    })

    it('通配符 * 接收所有事件', () => {
      let count = 0
      on(bus, '*', () => { count++ })
      emit(bus, 'player:levelup')
      emit(bus, 'battle:win')
      emit(bus, 'hero:summon')
      expect(count).toBe(3)
    })

    it('emit 返回处理的订阅者数', () => {
      on(bus, 'player:levelup', () => {})
      on(bus, 'player:levelup', () => {})
      const handled = emit(bus, 'player:levelup')
      expect(handled).toBe(2)
    })
  })

  describe('一次性订阅', () => {
    it('once 只触发一次', () => {
      let count = 0
      once(bus, 'player:levelup', () => { count++ })
      emit(bus, 'player:levelup')
      emit(bus, 'player:levelup')
      expect(count).toBe(1)
    })

    it('once 触发后自动移除', () => {
      once(bus, 'player:levelup', () => {})
      emit(bus, 'player:levelup')
      expect(getSubscriptionCount(bus)).toBe(0)
    })
  })

  describe('取消订阅', () => {
    it('应该取消订阅', () => {
      let count = 0
      const id = on(bus, 'player:levelup', () => { count++ })
      off(bus, id)
      emit(bus, 'player:levelup')
      expect(count).toBe(0)
    })

    it('取消不存在的订阅返回 false', () => {
      expect(off(bus, 'nonexistent')).toBe(false)
    })

    it('应该取消某类型所有订阅', () => {
      on(bus, 'player:levelup', () => {})
      on(bus, 'player:levelup', () => {})
      on(bus, 'battle:win', () => {})

      const removed = offAll(bus, 'player:levelup')
      expect(removed).toBe(2)
      expect(getSubscriptionCount(bus)).toBe(1)
    })
  })

  describe('优先级', () => {
    it('高优先级先执行', () => {
      const order: number[] = []
      on(bus, 'player:levelup', () => { order.push(1) }, { priority: 1 })
      on(bus, 'player:levelup', () => { order.push(3) }, { priority: 3 })
      on(bus, 'player:levelup', () => { order.push(2) }, { priority: 2 })

      emit(bus, 'player:levelup')
      expect(order).toEqual([3, 2, 1])
    })
  })

  describe('事件过滤', () => {
    it('应该按条件过滤事件', () => {
      let received = false
      on(bus, 'player:levelup', () => { received = true }, {
        filter: (e) => e.data.level >= 50
      })

      emit(bus, 'player:levelup', { level: 10 })
      expect(received).toBe(false)

      emit(bus, 'player:levelup', { level: 50 })
      expect(received).toBe(true)
    })
  })

  describe('批量事件', () => {
    it('应该批量发射事件', () => {
      let count = 0
      on(bus, '*', () => { count++ })

      emitBatch(bus, [
        { type: 'player:levelup', data: { level: 10 } },
        { type: 'battle:win' },
        { type: 'hero:summon' },
      ])

      expect(count).toBe(3)
    })
  })

  describe('暂停与恢复', () => {
    it('暂停时事件不分发', () => {
      let count = 0
      on(bus, 'player:levelup', () => { count++ })

      pause(bus)
      emit(bus, 'player:levelup')
      expect(count).toBe(0)
    })

    it('恢复时处理待处理事件', () => {
      let count = 0
      on(bus, 'player:levelup', () => { count++ })

      pause(bus)
      emit(bus, 'player:levelup')
      emit(bus, 'player:levelup')

      const handled = resume(bus)
      expect(count).toBe(2)
      expect(handled).toBe(2)
    })

    it('恢复后正常工作', () => {
      let count = 0
      on(bus, 'player:levelup', () => { count++ })

      pause(bus)
      resume(bus)
      emit(bus, 'player:levelup')
      expect(count).toBe(1)
    })
  })

  describe('事件历史', () => {
    it('应该记录事件历史', () => {
      emit(bus, 'player:levelup', { level: 10 })
      emit(bus, 'battle:win')

      const history = getHistory(bus)
      expect(history.length).toBe(2)
      expect(history[0].type).toBe('battle:win') // 最新在前
    })

    it('应该按类型过滤历史', () => {
      emit(bus, 'player:levelup')
      emit(bus, 'battle:win')
      emit(bus, 'player:levelup')

      const history = getHistory(bus, 'player:levelup')
      expect(history.length).toBe(2)
    })

    it('应该限制历史条目', () => {
      const smallBus = createEventBus(5)
      for (let i = 0; i < 10; i++) {
        emit(smallBus, 'player:levelup', { i })
      }
      expect(smallBus.history.length).toBe(5)
    })

    it('应该清空历史', () => {
      emit(bus, 'player:levelup')
      clearHistory(bus)
      expect(bus.history.length).toBe(0)
    })
  })

  describe('统计信息', () => {
    it('应该获取事件总线统计', () => {
      on(bus, 'player:levelup', () => {})
      on(bus, 'battle:win', () => {})
      emit(bus, 'player:levelup')

      const stats = getEventBusStats(bus)
      expect(stats.totalSubscriptions).toBe(2)
      expect(stats.totalEventsEmitted).toBe(1)
      expect(stats.totalEventsHandled).toBe(1)
      expect(stats.isPaused).toBe(false)
    })
  })
})
