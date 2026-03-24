/**
 * v0.49 世界地图系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createWorldMapState,
  canUnlockRegion,
  unlockRegion,
  exploreNode,
  teleportToRegion,
  triggerEvent,
  collectResource,
  getRegionInfo,
  getAllRegions,
  getUnlockableRegions,
  exportWorldMapState,
  importWorldMapState,
  REGION_CONFIGS,
  MAP_EVENTS,
  WorldMapState,
} from './worldMap'

describe('v0.49 世界地图系统', () => {
  describe('地图初始化', () => {
    it('应该创建包含 6 个区域的世界地图', () => {
      const state = createWorldMapState()

      expect(state.regions.size).toBe(6)
      expect(state.currentRegion).toBe('plains')
      expect(state.currentNode).toBe('plains_node_0')
      expect(state.regionsUnlocked).toBe(1)
    })

    it('初始只有新手平原解锁', () => {
      const state = createWorldMapState()

      const plains = state.regions.get('plains')!
      expect(plains.status).not.toBe('locked')

      const forest = state.regions.get('forest')!
      expect(forest.status).toBe('locked')

      const desert = state.regions.get('desert')!
      expect(desert.status).toBe('locked')
    })

    it('每个区域应该有正确数量的节点', () => {
      const state = createWorldMapState()

      for (const config of REGION_CONFIGS) {
        const region = state.regions.get(config.id)!
        expect(region.nodes.length).toBe(config.totalNodes)
        expect(region.totalNodes).toBe(config.totalNodes)
      }
    })

    it('新手平原第一个节点应该已探索', () => {
      const state = createWorldMapState()

      const plains = state.regions.get('plains')!
      expect(plains.nodes[0].status).toBe('explored')
      expect(plains.exploredNodes).toBe(1)
    })

    it('每个区域最后一个节点应该是 BOSS', () => {
      const state = createWorldMapState()

      for (const region of state.regions.values()) {
        const lastNode = region.nodes[region.nodes.length - 1]
        expect(lastNode.type).toBe('boss')
      }
    })
  })

  describe('区域解锁', () => {
    let state: WorldMapState

    beforeEach(() => {
      state = createWorldMapState()
    })

    it('等级不足时不能解锁区域', () => {
      const result = canUnlockRegion(state, 'forest', 5)

      expect(result.canUnlock).toBe(false)
      expect(result.reason).toContain('等级不足')
    })

    it('前置区域 BOSS 未击败时不能解锁', () => {
      const result = canUnlockRegion(state, 'forest', 20)

      expect(result.canUnlock).toBe(false)
      expect(result.reason).toContain('BOSS')
    })

    it('满足条件时可以解锁区域', () => {
      // 先击败新手平原 BOSS
      const plains = state.regions.get('plains')!
      plains.bossDefeated = true

      const result = canUnlockRegion(state, 'forest', 15)
      expect(result.canUnlock).toBe(true)
    })

    it('解锁区域后状态正确', () => {
      const plains = state.regions.get('plains')!
      plains.bossDefeated = true

      const success = unlockRegion(state, 'forest', 15)
      expect(success).toBe(true)

      const forest = state.regions.get('forest')!
      expect(forest.status).toBe('fog')
      expect(forest.nodes[0].status).toBe('explored')
      expect(forest.exploredNodes).toBe(1)
      expect(state.regionsUnlocked).toBe(2)
    })

    it('不能重复解锁区域', () => {
      const plains = state.regions.get('plains')!
      plains.bossDefeated = true

      unlockRegion(state, 'forest', 15)
      const result = canUnlockRegion(state, 'forest', 15)
      expect(result.canUnlock).toBe(false)
      expect(result.reason).toContain('已解锁')
    })
  })

  describe('节点探索', () => {
    let state: WorldMapState

    beforeEach(() => {
      state = createWorldMapState()
    })

    it('应该能探索已探索状态的节点', () => {
      // 第一个节点已经是 explored 状态
      const result = exploreNode(state, 'plains_node_0')

      expect(result.success).toBe(true)
      expect(result.rewards.length).toBeGreaterThan(0)
    })

    it('探索后节点变为 completed', () => {
      exploreNode(state, 'plains_node_0')

      const plains = state.regions.get('plains')!
      expect(plains.nodes[0].status).toBe('completed')
    })

    it('探索节点后解锁相邻节点', () => {
      exploreNode(state, 'plains_node_0')

      const plains = state.regions.get('plains')!
      // 第二个节点应该变为 explored
      expect(plains.nodes[1].status).toBe('explored')
    })

    it('不能探索已完成的节点', () => {
      exploreNode(state, 'plains_node_0')
      const result = exploreNode(state, 'plains_node_0')

      expect(result.success).toBe(false)
      expect(result.reason).toContain('已完成')
    })

    it('不能探索没有已探索邻居的节点', () => {
      // 跳过中间节点直接探索远处节点
      const result = exploreNode(state, 'plains_node_5')

      expect(result.success).toBe(false)
      expect(result.reason).toContain('相邻节点')
    })

    it('连续探索更新进度', () => {
      exploreNode(state, 'plains_node_0')
      exploreNode(state, 'plains_node_1')

      const plains = state.regions.get('plains')!
      expect(plains.exploredNodes).toBe(3) // 初始 1 + 探索 2
    })

    it('探索 BOSS 节点标记区域 BOSS 击败', () => {
      const plains = state.regions.get('plains')!

      // 将所有节点设为可探索
      plains.nodes.forEach(n => { n.status = 'explored' })

      const bossNode = plains.nodes[plains.nodes.length - 1]
      exploreNode(state, bossNode.id)

      expect(plains.bossDefeated).toBe(true)
    })

    it('不存在的节点返回错误', () => {
      const result = exploreNode(state, 'nonexistent_node')
      expect(result.success).toBe(false)
      expect(result.reason).toContain('不存在')
    })
  })

  describe('传送系统', () => {
    let state: WorldMapState

    beforeEach(() => {
      state = createWorldMapState()
      // 解锁森林
      const plains = state.regions.get('plains')!
      plains.bossDefeated = true
      unlockRegion(state, 'forest', 15)
    })

    it('应该能传送到已解锁的区域', () => {
      const result = teleportToRegion(state, 'forest')

      expect(result.success).toBe(true)
      expect(state.currentRegion).toBe('forest')
    })

    it('不能传送到锁定的区域', () => {
      const result = teleportToRegion(state, 'desert')

      expect(result.success).toBe(false)
      expect(result.reason).toContain('未解锁')
    })

    it('传送有冷却时间', () => {
      teleportToRegion(state, 'forest')
      const result = teleportToRegion(state, 'plains')

      expect(result.success).toBe(false)
      expect(result.reason).toContain('冷却')
    })

    it('冷却结束后可以再次传送', () => {
      teleportToRegion(state, 'forest')
      // 手动设置冷却为过去时间
      state.teleportCooldown = Date.now() - 1000

      const result = teleportToRegion(state, 'plains')
      expect(result.success).toBe(true)
    })

    it('不能传送到不存在的区域', () => {
      const result = teleportToRegion(state, 'nonexistent')
      expect(result.success).toBe(false)
      expect(result.reason).toContain('不存在')
    })
  })

  describe('地图事件', () => {
    let state: WorldMapState

    beforeEach(() => {
      state = createWorldMapState()
    })

    it('应该能触发事件', () => {
      const result = triggerEvent(state, 'treasure_chest', 10)

      expect(result.success).toBe(true)
      expect(result.rewards.length).toBeGreaterThan(0)
    })

    it('等级不足不能触发事件', () => {
      const result = triggerEvent(state, 'ancient_ruins', 5)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('等级不足')
    })

    it('不可重复事件只能触发一次', () => {
      triggerEvent(state, 'ancient_ruins', 25)
      const result = triggerEvent(state, 'ancient_ruins', 25)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('不可重复')
    })

    it('可重复事件有冷却时间', () => {
      triggerEvent(state, 'treasure_chest', 10)
      const result = triggerEvent(state, 'treasure_chest', 10)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('冷却')
    })

    it('冷却结束后可重复事件可以再次触发', () => {
      triggerEvent(state, 'treasure_chest', 10)
      // 手动设置为过去时间
      state.eventsCompleted.set('treasure_chest', Date.now() - 4000000)

      const result = triggerEvent(state, 'treasure_chest', 10)
      expect(result.success).toBe(true)
    })

    it('不存在的事件返回错误', () => {
      const result = triggerEvent(state, 'nonexistent', 10)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('不存在')
    })
  })

  describe('资源采集', () => {
    let state: WorldMapState

    beforeEach(() => {
      state = createWorldMapState()
      // 探索前几个节点
      exploreNode(state, 'plains_node_0')
      exploreNode(state, 'plains_node_1')
      exploreNode(state, 'plains_node_2')
    })

    it('应该能在资源节点采集', () => {
      // 找一个资源节点
      const plains = state.regions.get('plains')!
      const resourceNode = plains.nodes.find(n => n.type === 'resource' && (n.status === 'explored' || n.status === 'completed'))

      if (resourceNode) {
        const result = collectResource(state, resourceNode.id)
        expect(result.success).toBe(true)
        expect(result.rewards.length).toBeGreaterThan(0)
      }
    })

    it('不能在非资源节点采集', () => {
      const result = collectResource(state, 'plains_node_0')
      // plains_node_0 是 normal 类型
      expect(result.success).toBe(false)
    })

    it('不能在未探索的节点采集', () => {
      const plains = state.regions.get('plains')!
      const lockedResource = plains.nodes.find(n => n.type === 'resource' && n.status === 'fog')

      if (lockedResource) {
        const result = collectResource(state, lockedResource.id)
        expect(result.success).toBe(false)
        expect(result.reason).toContain('未探索')
      }
    })

    it('采集记录应该更新', () => {
      const plains = state.regions.get('plains')!
      const resourceNode = plains.nodes.find(n => n.type === 'resource' && (n.status === 'explored' || n.status === 'completed'))

      if (resourceNode) {
        collectResource(state, resourceNode.id)
        collectResource(state, resourceNode.id)

        expect(state.resourcesCollected.get(resourceNode.id)).toBe(2)
      }
    })
  })

  describe('查询功能', () => {
    let state: WorldMapState

    beforeEach(() => {
      state = createWorldMapState()
    })

    it('应该获取区域信息', () => {
      const info = getRegionInfo(state, 'plains')

      expect(info).not.toBeNull()
      expect(info!.name).toBe('新手平原')
      expect(info!.type).toBe('平原')
    })

    it('不存在的区域返回 null', () => {
      const info = getRegionInfo(state, 'nonexistent')
      expect(info).toBeNull()
    })

    it('应该获取所有区域', () => {
      const regions = getAllRegions(state)

      expect(regions.length).toBe(6)
      expect(regions.map(r => r.type)).toContain('平原')
      expect(regions.map(r => r.type)).toContain('深渊')
    })

    it('应该获取可解锁区域列表', () => {
      const plains = state.regions.get('plains')!
      plains.bossDefeated = true

      const unlockable = getUnlockableRegions(state, 15)

      expect(unlockable.length).toBe(1)
      expect(unlockable[0].id).toBe('forest')
    })

    it('无可解锁区域时返回空数组', () => {
      const unlockable = getUnlockableRegions(state, 1)
      expect(unlockable.length).toBe(0)
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入地图状态', () => {
      const state = createWorldMapState()
      exploreNode(state, 'plains_node_0')
      exploreNode(state, 'plains_node_1')

      const exported = exportWorldMapState(state)

      expect(exported.regions.length).toBe(6)
      expect(exported.currentRegion).toBe('plains')
      expect(exported.regionsUnlocked).toBe(1)

      const imported = importWorldMapState(exported)

      expect(imported.regions.size).toBe(6)
      expect(imported.currentRegion).toBe('plains')
      expect(imported.regionsUnlocked).toBe(1)
    })
  })

  describe('区域配置', () => {
    it('应该有 6 个区域配置', () => {
      expect(REGION_CONFIGS.length).toBe(6)
    })

    it('区域等级应该递增', () => {
      for (let i = 1; i < REGION_CONFIGS.length; i++) {
        expect(REGION_CONFIGS[i].level).toBeGreaterThan(REGION_CONFIGS[i - 1].level)
      }
    })

    it('区域解锁等级应该递增', () => {
      for (let i = 1; i < REGION_CONFIGS.length; i++) {
        expect(REGION_CONFIGS[i].unlockLevel).toBeGreaterThan(REGION_CONFIGS[i - 1].unlockLevel)
      }
    })

    it('每个区域应该有前置区域（除了新手平原）', () => {
      expect(REGION_CONFIGS[0].prerequisiteRegions.length).toBe(0)

      for (let i = 1; i < REGION_CONFIGS.length; i++) {
        expect(REGION_CONFIGS[i].prerequisiteRegions.length).toBeGreaterThan(0)
      }
    })
  })

  describe('事件配置', () => {
    it('应该有 5 个地图事件', () => {
      expect(MAP_EVENTS.length).toBe(5)
    })

    it('每个事件都应该有奖励', () => {
      for (const event of MAP_EVENTS) {
        expect(event.rewards.length).toBeGreaterThan(0)
      }
    })

    it('不可重复事件冷却时间为 0', () => {
      const nonRepeatable = MAP_EVENTS.filter(e => !e.repeatable)
      for (const event of nonRepeatable) {
        expect(event.cooldownMs).toBe(0)
      }
    })
  })

  describe('边界情况', () => {
    it('应该正确计算总探索百分比', () => {
      const state = createWorldMapState()

      // 初始只有 plains 的 1 个节点被探索
      expect(state.totalExplored).toBe(0) // 初始计算

      // 探索所有 plains 节点
      const plains = state.regions.get('plains')!
      plains.nodes.forEach(n => { n.status = 'explored' })
      exploreNode(state, 'plains_node_0')

      expect(state.totalExplored).toBeGreaterThan(0)
    })

    it('空节点 ID 应该返回错误', () => {
      const state = createWorldMapState()
      const result = exploreNode(state, '')
      expect(result.success).toBe(false)
    })
  })
})
