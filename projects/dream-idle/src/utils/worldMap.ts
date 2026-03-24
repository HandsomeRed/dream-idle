/**
 * v0.49 世界地图系统
 * 
 * 功能特性：
 * - 多区域世界地图（6大区域）
 * - 区域解锁系统（等级/前置区域）
 * - 地图探索（迷雾解锁）
 * - 区域事件（随机事件/宝箱/NPC）
 * - 传送系统（已解锁区域间传送）
 * - 区域资源采集
 * - 区域BOSS
 */

export type RegionType = '平原' | '森林' | '沙漠' | '雪山' | '火山' | '深渊'
export type TerrainType = '草地' | '沼泽' | '岩石' | '冰面' | '熔岩' | '虚空' | '水域' | '沙地'
export type NodeType = 'normal' | 'boss' | 'treasure' | 'npc' | 'resource' | 'portal' | 'event'
export type ExploreStatus = 'locked' | 'fog' | 'explored' | 'completed'

export interface WorldRegion {
  id: string
  name: string
  type: RegionType
  description: string
  level: number              // 推荐等级
  unlockLevel: number        // 解锁等级
  prerequisiteRegions: string[] // 前置区域 ID
  nodes: MapNode[]
  status: ExploreStatus
  exploredPercent: number    // 探索进度 0-100
  bossDefeated: boolean
  totalNodes: number
  exploredNodes: number
}

export interface MapNode {
  id: string
  regionId: string
  x: number                  // 坐标 x (0-100)
  y: number                  // 坐标 y (0-100)
  type: NodeType
  terrain: TerrainType
  status: ExploreStatus
  name: string
  description: string
  rewards: NodeReward[]
  enemyLevel?: number
  bossId?: string
  npcId?: string
  eventId?: string
  connectedNodes: string[]   // 相邻节点
}

export interface NodeReward {
  type: 'gold' | 'diamond' | 'exp' | 'item' | 'pet_shard' | 'hero_shard'
  amount: number
  itemId?: string
}

export interface MapEvent {
  id: string
  name: string
  description: string
  type: 'combat' | 'treasure' | 'quiz' | 'rescue' | 'gather'
  rewards: NodeReward[]
  requireLevel: number
  repeatable: boolean
  cooldownMs: number         // 冷却时间
}

export interface WorldMapState {
  regions: Map<string, WorldRegion>
  currentRegion: string | null
  currentNode: string | null
  totalExplored: number      // 总探索百分比
  regionsUnlocked: number
  eventsCompleted: Map<string, number> // eventId -> 完成时间戳
  teleportCooldown: number   // 传送冷却时间戳
  resourcesCollected: Map<string, number> // resourceType -> count
}

// ========== 区域配置 ==========

export const REGION_CONFIGS: Omit<WorldRegion, 'status' | 'exploredPercent' | 'bossDefeated' | 'exploredNodes' | 'nodes'>[] = [
  {
    id: 'plains',
    name: '新手平原',
    type: '平原',
    description: '广阔的绿色平原，适合新手冒险者探索。',
    level: 1,
    unlockLevel: 1,
    prerequisiteRegions: [],
    totalNodes: 12,
  },
  {
    id: 'forest',
    name: '幽暗森林',
    type: '森林',
    description: '古老而幽暗的森林，隐藏着未知的危险。',
    level: 15,
    unlockLevel: 10,
    prerequisiteRegions: ['plains'],
    totalNodes: 15,
  },
  {
    id: 'desert',
    name: '灼热沙漠',
    type: '沙漠',
    description: '无尽的沙丘和灼热的阳光，传说中藏有宝藏。',
    level: 30,
    unlockLevel: 25,
    prerequisiteRegions: ['forest'],
    totalNodes: 14,
  },
  {
    id: 'snow',
    name: '冰封雪山',
    type: '雪山',
    description: '终年积雪的雪山，极寒之地蕴含强大力量。',
    level: 45,
    unlockLevel: 40,
    prerequisiteRegions: ['desert'],
    totalNodes: 13,
  },
  {
    id: 'volcano',
    name: '烈焰火山',
    type: '火山',
    description: '岩浆喷涌的活火山，最强战士的试炼场。',
    level: 60,
    unlockLevel: 55,
    prerequisiteRegions: ['snow'],
    totalNodes: 16,
  },
  {
    id: 'abyss',
    name: '无底深渊',
    type: '深渊',
    description: '世界的尽头，黑暗与混沌的源头。传说的终点。',
    level: 80,
    unlockLevel: 75,
    prerequisiteRegions: ['volcano'],
    totalNodes: 18,
  },
]

// ========== 事件配置 ==========

export const MAP_EVENTS: MapEvent[] = [
  {
    id: 'treasure_chest',
    name: '神秘宝箱',
    description: '发现了一个闪闪发光的宝箱！',
    type: 'treasure',
    rewards: [{ type: 'gold', amount: 5000 }, { type: 'diamond', amount: 10 }],
    requireLevel: 1,
    repeatable: true,
    cooldownMs: 3600000, // 1 小时
  },
  {
    id: 'wandering_merchant',
    name: '流浪商人',
    description: '一位神秘的商人，出售稀有物品。',
    type: 'treasure',
    rewards: [{ type: 'item', amount: 1, itemId: 'rare_scroll' }],
    requireLevel: 10,
    repeatable: true,
    cooldownMs: 7200000, // 2 小时
  },
  {
    id: 'bandit_ambush',
    name: '强盗伏击',
    description: '一群强盗从暗处冲出！击退他们！',
    type: 'combat',
    rewards: [{ type: 'gold', amount: 3000 }, { type: 'exp', amount: 500 }],
    requireLevel: 5,
    repeatable: true,
    cooldownMs: 1800000, // 30 分钟
  },
  {
    id: 'ancient_ruins',
    name: '远古遗迹',
    description: '发现了远古文明的遗迹，探索其中的秘密。',
    type: 'gather',
    rewards: [{ type: 'hero_shard', amount: 5 }, { type: 'exp', amount: 1000 }],
    requireLevel: 20,
    repeatable: false,
    cooldownMs: 0,
  },
  {
    id: 'lost_pet',
    name: '迷路的宠物',
    description: '一只可爱的宠物在此迷路，帮助它回家吧。',
    type: 'rescue',
    rewards: [{ type: 'pet_shard', amount: 10 }, { type: 'diamond', amount: 20 }],
    requireLevel: 15,
    repeatable: false,
    cooldownMs: 0,
  },
]

// ========== 核心函数 ==========

/**
 * 生成区域的节点
 */
function generateNodes(regionConfig: typeof REGION_CONFIGS[0]): MapNode[] {
  const nodes: MapNode[] = []
  const terrainMap: Record<RegionType, TerrainType> = {
    '平原': '草地',
    '森林': '沼泽',
    '沙漠': '沙地',
    '雪山': '冰面',
    '火山': '熔岩',
    '深渊': '虚空',
  }

  const baseTerrain = terrainMap[regionConfig.type]

  for (let i = 0; i < regionConfig.totalNodes; i++) {
    let nodeType: NodeType = 'normal'
    if (i === regionConfig.totalNodes - 1) nodeType = 'boss'
    else if (i % 4 === 1) nodeType = 'treasure'
    else if (i % 4 === 2) nodeType = 'resource'
    else if (i % 5 === 3) nodeType = 'event'

    const connected: string[] = []
    if (i > 0) connected.push(`${regionConfig.id}_node_${i - 1}`)
    if (i < regionConfig.totalNodes - 1) connected.push(`${regionConfig.id}_node_${i + 1}`)

    nodes.push({
      id: `${regionConfig.id}_node_${i}`,
      regionId: regionConfig.id,
      x: Math.round((i / (regionConfig.totalNodes - 1)) * 100),
      y: 50 + Math.round(Math.sin(i * 0.8) * 30),
      type: nodeType,
      terrain: baseTerrain,
      status: i === 0 && regionConfig.id === 'plains' ? 'explored' : 'fog',
      name: `${regionConfig.name} - ${getNodeTypeName(nodeType)} ${i + 1}`,
      description: `${regionConfig.name}的${getNodeTypeName(nodeType)}`,
      rewards: generateNodeRewards(nodeType, regionConfig.level),
      enemyLevel: nodeType === 'boss' ? regionConfig.level + 10 : regionConfig.level + i,
      connectedNodes: connected,
    })
  }

  return nodes
}

function getNodeTypeName(type: NodeType): string {
  const names: Record<NodeType, string> = {
    normal: '路径',
    boss: 'BOSS',
    treasure: '宝箱',
    npc: 'NPC',
    resource: '资源点',
    portal: '传送门',
    event: '事件',
  }
  return names[type]
}

function generateNodeRewards(type: NodeType, level: number): NodeReward[] {
  const baseGold = level * 100
  const baseDiamond = Math.floor(level / 5)
  const baseExp = level * 50

  switch (type) {
    case 'boss':
      return [
        { type: 'gold', amount: baseGold * 10 },
        { type: 'diamond', amount: baseDiamond * 5 },
        { type: 'exp', amount: baseExp * 5 },
      ]
    case 'treasure':
      return [
        { type: 'gold', amount: baseGold * 3 },
        { type: 'diamond', amount: baseDiamond * 2 },
      ]
    case 'resource':
      return [
        { type: 'gold', amount: baseGold * 2 },
        { type: 'item', amount: 1, itemId: 'material' },
      ]
    case 'event':
      return [
        { type: 'exp', amount: baseExp * 3 },
        { type: 'diamond', amount: baseDiamond },
      ]
    default:
      return [
        { type: 'gold', amount: baseGold },
        { type: 'exp', amount: baseExp },
      ]
  }
}

/**
 * 创建世界地图状态
 */
export function createWorldMapState(): WorldMapState {
  const regions = new Map<string, WorldRegion>()

  for (const config of REGION_CONFIGS) {
    const nodes = generateNodes(config)
    const isFirst = config.id === 'plains'

    regions.set(config.id, {
      ...config,
      nodes,
      status: isFirst ? 'explored' : 'locked',
      exploredPercent: isFirst ? Math.round((1 / config.totalNodes) * 100) : 0,
      bossDefeated: false,
      exploredNodes: isFirst ? 1 : 0,
    })
  }

  return {
    regions,
    currentRegion: 'plains',
    currentNode: 'plains_node_0',
    totalExplored: 0,
    regionsUnlocked: 1,
    eventsCompleted: new Map(),
    teleportCooldown: 0,
    resourcesCollected: new Map(),
  }
}

/**
 * 检查区域是否可以解锁
 */
export function canUnlockRegion(
  state: WorldMapState,
  regionId: string,
  playerLevel: number
): { canUnlock: boolean; reason?: string } {
  const region = state.regions.get(regionId)
  if (!region) return { canUnlock: false, reason: '区域不存在' }
  if (region.status !== 'locked') return { canUnlock: false, reason: '区域已解锁' }

  if (playerLevel < region.unlockLevel) {
    return { canUnlock: false, reason: `等级不足，需要 ${region.unlockLevel} 级` }
  }

  for (const prereqId of region.prerequisiteRegions) {
    const prereq = state.regions.get(prereqId)
    if (!prereq || !prereq.bossDefeated) {
      return { canUnlock: false, reason: `需要先击败 ${prereq?.name || prereqId} 的BOSS` }
    }
  }

  return { canUnlock: true }
}

/**
 * 解锁区域
 */
export function unlockRegion(
  state: WorldMapState,
  regionId: string,
  playerLevel: number
): boolean {
  const check = canUnlockRegion(state, regionId, playerLevel)
  if (!check.canUnlock) return false

  const region = state.regions.get(regionId)!
  region.status = 'fog'
  if (region.nodes.length > 0) {
    region.nodes[0].status = 'explored'
    region.exploredNodes = 1
    region.exploredPercent = Math.round((1 / region.totalNodes) * 100)
  }
  state.regionsUnlocked++
  updateTotalExplored(state)

  return true
}

/**
 * 探索节点
 */
export function exploreNode(
  state: WorldMapState,
  nodeId: string
): { success: boolean; rewards: NodeReward[]; reason?: string } {
  const region = findNodeRegion(state, nodeId)
  if (!region) return { success: false, rewards: [], reason: '节点不存在' }

  const node = region.nodes.find(n => n.id === nodeId)
  if (!node) return { success: false, rewards: [], reason: '节点不存在' }

  if (node.status === 'completed') {
    return { success: false, rewards: [], reason: '节点已完成' }
  }

  if (node.status === 'locked') {
    return { success: false, rewards: [], reason: '节点未解锁' }
  }

  // 检查是否有已探索的相邻节点
  const hasExploredNeighbor = node.connectedNodes.some(connId => {
    const connNode = region.nodes.find(n => n.id === connId)
    return connNode && (connNode.status === 'explored' || connNode.status === 'completed')
  })

  if (!hasExploredNeighbor && node.status === 'fog') {
    return { success: false, rewards: [], reason: '需要先探索相邻节点' }
  }

  // 探索成功
  node.status = 'completed'
  region.exploredNodes++
  region.exploredPercent = Math.round((region.exploredNodes / region.totalNodes) * 100)

  // 解锁相邻节点
  for (const connId of node.connectedNodes) {
    const connNode = region.nodes.find(n => n.id === connId)
    if (connNode && connNode.status === 'fog') {
      connNode.status = 'explored'
    }
  }

  // 如果是 BOSS 节点
  if (node.type === 'boss') {
    region.bossDefeated = true
  }

  // 检查区域是否完成
  if (region.exploredNodes >= region.totalNodes) {
    region.status = 'completed'
  }

  state.currentNode = nodeId
  state.currentRegion = region.id
  updateTotalExplored(state)

  return { success: true, rewards: node.rewards }
}

/**
 * 传送到已探索区域
 */
export function teleportToRegion(
  state: WorldMapState,
  targetRegionId: string
): { success: boolean; reason?: string } {
  const now = Date.now()
  if (now < state.teleportCooldown) {
    const remaining = Math.ceil((state.teleportCooldown - now) / 1000)
    return { success: false, reason: `传送冷却中，剩余 ${remaining} 秒` }
  }

  const region = state.regions.get(targetRegionId)
  if (!region) return { success: false, reason: '区域不存在' }
  if (region.status === 'locked') return { success: false, reason: '区域未解锁' }

  const exploredNode = region.nodes.find(n => n.status === 'explored' || n.status === 'completed')
  if (!exploredNode) return { success: false, reason: '没有已探索的节点' }

  state.currentRegion = targetRegionId
  state.currentNode = exploredNode.id
  state.teleportCooldown = now + 300000 // 5 分钟冷却

  return { success: true }
}

/**
 * 触发地图事件
 */
export function triggerEvent(
  state: WorldMapState,
  eventId: string,
  playerLevel: number
): { success: boolean; rewards: NodeReward[]; reason?: string } {
  const event = MAP_EVENTS.find(e => e.id === eventId)
  if (!event) return { success: false, rewards: [], reason: '事件不存在' }

  if (playerLevel < event.requireLevel) {
    return { success: false, rewards: [], reason: `等级不足，需要 ${event.requireLevel} 级` }
  }

  if (!event.repeatable) {
    const lastCompleted = state.eventsCompleted.get(eventId)
    if (lastCompleted) {
      return { success: false, rewards: [], reason: '事件已完成且不可重复' }
    }
  }

  if (event.repeatable && event.cooldownMs > 0) {
    const lastCompleted = state.eventsCompleted.get(eventId)
    if (lastCompleted) {
      const now = Date.now()
      if (now - lastCompleted < event.cooldownMs) {
        return { success: false, rewards: [], reason: '事件冷却中' }
      }
    }
  }

  state.eventsCompleted.set(eventId, Date.now())
  return { success: true, rewards: event.rewards }
}

/**
 * 采集资源
 */
export function collectResource(
  state: WorldMapState,
  nodeId: string
): { success: boolean; rewards: NodeReward[]; reason?: string } {
  const region = findNodeRegion(state, nodeId)
  if (!region) return { success: false, rewards: [], reason: '节点不存在' }

  const node = region.nodes.find(n => n.id === nodeId)
  if (!node) return { success: false, rewards: [], reason: '节点不存在' }
  if (node.type !== 'resource') return { success: false, rewards: [], reason: '不是资源节点' }
  if (node.status !== 'completed' && node.status !== 'explored') {
    return { success: false, rewards: [], reason: '节点未探索' }
  }

  // 记录采集
  const current = state.resourcesCollected.get(nodeId) || 0
  state.resourcesCollected.set(nodeId, current + 1)

  return { success: true, rewards: node.rewards }
}

/**
 * 获取区域信息
 */
export function getRegionInfo(state: WorldMapState, regionId: string): WorldRegion | null {
  return state.regions.get(regionId) || null
}

/**
 * 获取所有区域概览
 */
export function getAllRegions(state: WorldMapState): WorldRegion[] {
  return Array.from(state.regions.values())
}

/**
 * 获取可解锁的区域列表
 */
export function getUnlockableRegions(state: WorldMapState, playerLevel: number): WorldRegion[] {
  return Array.from(state.regions.values()).filter(r => {
    const check = canUnlockRegion(state, r.id, playerLevel)
    return check.canUnlock
  })
}

// ========== 辅助函数 ==========

function findNodeRegion(state: WorldMapState, nodeId: string): WorldRegion | null {
  for (const region of state.regions.values()) {
    if (region.nodes.some(n => n.id === nodeId)) {
      return region
    }
  }
  return null
}

function updateTotalExplored(state: WorldMapState): void {
  const allRegions = Array.from(state.regions.values())
  const totalNodes = allRegions.reduce((sum, r) => sum + r.totalNodes, 0)
  const exploredNodes = allRegions.reduce((sum, r) => sum + r.exploredNodes, 0)
  state.totalExplored = totalNodes > 0 ? Math.round((exploredNodes / totalNodes) * 100) : 0
}

/**
 * 导出世界地图状态
 */
export function exportWorldMapState(state: WorldMapState): any {
  return {
    regions: Array.from(state.regions.entries()),
    currentRegion: state.currentRegion,
    currentNode: state.currentNode,
    totalExplored: state.totalExplored,
    regionsUnlocked: state.regionsUnlocked,
    eventsCompleted: Array.from(state.eventsCompleted.entries()),
    teleportCooldown: state.teleportCooldown,
    resourcesCollected: Array.from(state.resourcesCollected.entries()),
  }
}

/**
 * 导入世界地图状态
 */
export function importWorldMapState(data: any): WorldMapState {
  return {
    regions: new Map(data.regions),
    currentRegion: data.currentRegion,
    currentNode: data.currentNode,
    totalExplored: data.totalExplored,
    regionsUnlocked: data.regionsUnlocked,
    eventsCompleted: new Map(data.eventsCompleted),
    teleportCooldown: data.teleportCooldown,
    resourcesCollected: new Map(data.resourcesCollected),
  }
}
