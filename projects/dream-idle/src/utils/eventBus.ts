/**
 * v0.60 事件系统（EventBus）
 * 
 * 游戏内事件总线，用于各系统间解耦通信
 * - 发布/订阅模式
 * - 事件类型安全
 * - 一次性监听
 * - 事件历史记录
 * - 事件过滤
 * - 批量事件处理
 */

export type GameEventType =
  | 'player:levelup' | 'player:rebirth' | 'player:login' | 'player:logout'
  | 'battle:win' | 'battle:lose' | 'battle:boss_kill'
  | 'hero:summon' | 'hero:levelup' | 'hero:star_up'
  | 'pet:summon' | 'pet:evolve'
  | 'equip:enhance' | 'equip:reforge' | 'equip:craft'
  | 'tower:clear' | 'tower:new_record'
  | 'arena:win' | 'arena:rank_up'
  | 'quest:complete' | 'quest:daily_reset'
  | 'achievement:unlock' | 'badge:unlock'
  | 'shop:purchase' | 'mail:receive'
  | 'idle:claim' | 'map:explore' | 'map:unlock_region'
  | 'system:save' | 'system:load' | 'system:error'

export interface GameEvent {
  type: GameEventType
  data: any
  timestamp: number
  source: string                   // 事件来源模块
}

export type EventHandler = (event: GameEvent) => void

interface EventSubscription {
  id: string
  type: GameEventType | '*'        // * = 监听所有事件
  handler: EventHandler
  once: boolean                    // 是否只触发一次
  priority: number                 // 优先级（越大越先执行）
  filter?: (event: GameEvent) => boolean  // 过滤条件
}

export interface EventBusState {
  subscriptions: EventSubscription[]
  history: GameEvent[]             // 事件历史
  maxHistory: number               // 最大历史条目
  totalEventsEmitted: number
  totalEventsHandled: number
  paused: boolean                  // 暂停事件分发
  pendingEvents: GameEvent[]       // 暂停期间的待处理事件
}

// ========== 核心函数 ==========

let nextSubId = 1

/**
 * 创建事件总线
 */
export function createEventBus(maxHistory: number = 200): EventBusState {
  nextSubId = 1
  return {
    subscriptions: [],
    history: [],
    maxHistory,
    totalEventsEmitted: 0,
    totalEventsHandled: 0,
    paused: false,
    pendingEvents: [],
  }
}

/**
 * 订阅事件
 */
export function on(
  bus: EventBusState,
  type: GameEventType | '*',
  handler: EventHandler,
  options?: { priority?: number; filter?: (event: GameEvent) => boolean }
): string {
  const subId = `sub_${nextSubId++}`

  bus.subscriptions.push({
    id: subId,
    type,
    handler,
    once: false,
    priority: options?.priority ?? 0,
    filter: options?.filter,
  })

  // 按优先级排序（高优先级在前）
  bus.subscriptions.sort((a, b) => b.priority - a.priority)

  return subId
}

/**
 * 一次性订阅
 */
export function once(
  bus: EventBusState,
  type: GameEventType | '*',
  handler: EventHandler
): string {
  const subId = `sub_${nextSubId++}`

  bus.subscriptions.push({
    id: subId,
    type,
    handler,
    once: true,
    priority: 0,
  })

  return subId
}

/**
 * 取消订阅
 */
export function off(bus: EventBusState, subscriptionId: string): boolean {
  const index = bus.subscriptions.findIndex(s => s.id === subscriptionId)
  if (index === -1) return false

  bus.subscriptions.splice(index, 1)
  return true
}

/**
 * 取消某事件类型的所有订阅
 */
export function offAll(bus: EventBusState, type: GameEventType): number {
  const before = bus.subscriptions.length
  bus.subscriptions = bus.subscriptions.filter(s => s.type !== type)
  return before - bus.subscriptions.length
}

/**
 * 发射事件
 */
export function emit(
  bus: EventBusState,
  type: GameEventType,
  data: any = {},
  source: string = 'system'
): number {
  const event: GameEvent = {
    type,
    data,
    timestamp: Date.now(),
    source,
  }

  // 记录历史
  bus.history.unshift(event)
  if (bus.history.length > bus.maxHistory) {
    bus.history = bus.history.slice(0, bus.maxHistory)
  }
  bus.totalEventsEmitted++

  // 暂停时存入待处理队列
  if (bus.paused) {
    bus.pendingEvents.push(event)
    return 0
  }

  return dispatchEvent(bus, event)
}

/**
 * 分发事件给订阅者
 */
function dispatchEvent(bus: EventBusState, event: GameEvent): number {
  let handled = 0
  const toRemove: string[] = []

  for (const sub of bus.subscriptions) {
    // 匹配事件类型
    if (sub.type !== '*' && sub.type !== event.type) continue

    // 过滤检查
    if (sub.filter && !sub.filter(event)) continue

    // 执行处理器
    sub.handler(event)
    handled++
    bus.totalEventsHandled++

    // 一次性订阅标记移除
    if (sub.once) {
      toRemove.push(sub.id)
    }
  }

  // 移除一次性订阅
  if (toRemove.length > 0) {
    bus.subscriptions = bus.subscriptions.filter(s => !toRemove.includes(s.id))
  }

  return handled
}

/**
 * 批量发射事件
 */
export function emitBatch(
  bus: EventBusState,
  events: { type: GameEventType; data?: any; source?: string }[]
): number {
  let totalHandled = 0
  for (const e of events) {
    totalHandled += emit(bus, e.type, e.data, e.source)
  }
  return totalHandled
}

/**
 * 暂停事件分发
 */
export function pause(bus: EventBusState): void {
  bus.paused = true
}

/**
 * 恢复事件分发（处理待处理事件）
 */
export function resume(bus: EventBusState): number {
  bus.paused = false
  let handled = 0

  for (const event of bus.pendingEvents) {
    handled += dispatchEvent(bus, event)
  }

  bus.pendingEvents = []
  return handled
}

/**
 * 获取事件历史
 */
export function getHistory(
  bus: EventBusState,
  type?: GameEventType,
  limit: number = 50
): GameEvent[] {
  let events = bus.history

  if (type) {
    events = events.filter(e => e.type === type)
  }

  return events.slice(0, limit)
}

/**
 * 清空事件历史
 */
export function clearHistory(bus: EventBusState): void {
  bus.history = []
}

/**
 * 获取订阅数量
 */
export function getSubscriptionCount(bus: EventBusState, type?: GameEventType): number {
  if (type) {
    return bus.subscriptions.filter(s => s.type === type || s.type === '*').length
  }
  return bus.subscriptions.length
}

/**
 * 获取事件总线统计
 */
export function getEventBusStats(bus: EventBusState): {
  totalSubscriptions: number
  totalEventsEmitted: number
  totalEventsHandled: number
  historySize: number
  isPaused: boolean
  pendingCount: number
} {
  return {
    totalSubscriptions: bus.subscriptions.length,
    totalEventsEmitted: bus.totalEventsEmitted,
    totalEventsHandled: bus.totalEventsHandled,
    historySize: bus.history.length,
    isPaused: bus.paused,
    pendingCount: bus.pendingEvents.length,
  }
}
