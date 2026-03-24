/**
 * v0.56 存档系统
 * 
 * 功能特性：
 * - 多存档管理（最多 5 个存档槽）
 * - 自动存档（定时保存）
 * - 手动存档/读档
 * - 存档压缩（JSON 序列化）
 * - 存档校验（防篡改）
 * - 云端存档（预留接口）
 * - 存档元数据（等级/时间/截图）
 */

export interface SaveSlot {
  id: number                       // 存档槽 ID (1-5)
  name: string                     // 存档名称
  isEmpty: boolean                 // 是否为空
  metadata: SaveMetadata | null    // 存档元数据
  data: string | null              // 序列化的游戏数据
  checksum: string | null          // 校验和
  createdAt: number                // 创建时间
  updatedAt: number                // 最后更新时间
  version: string                  // 游戏版本号
  size: number                     // 数据大小（字节）
}

export interface SaveMetadata {
  playerName: string
  level: number
  playTime: number                 // 游玩时长（分钟）
  rebirthCount: number
  chapter: string                  // 当前章节
  gold: number
  diamonds: number
}

export interface SaveSystemState {
  slots: SaveSlot[]
  autoSaveSlot: number             // 自动存档使用的槽位 (0=禁用)
  autoSaveInterval: number         // 自动存档间隔（秒）
  lastAutoSave: number             // 上次自动存档时间
  cloudSyncEnabled: boolean        // 云端同步开关
  lastCloudSync: number            // 上次云端同步时间
  maxSlots: number                 // 最大存档数
}

// ========== 核心函数 ==========

/**
 * 创建存档系统状态
 */
export function createSaveSystemState(maxSlots: number = 5): SaveSystemState {
  const slots: SaveSlot[] = []
  for (let i = 1; i <= maxSlots; i++) {
    slots.push(createEmptySlot(i))
  }

  return {
    slots,
    autoSaveSlot: 1,
    autoSaveInterval: 60,
    lastAutoSave: 0,
    cloudSyncEnabled: false,
    lastCloudSync: 0,
    maxSlots,
  }
}

function createEmptySlot(id: number): SaveSlot {
  return {
    id,
    name: `存档 ${id}`,
    isEmpty: true,
    metadata: null,
    data: null,
    checksum: null,
    createdAt: 0,
    updatedAt: 0,
    version: '',
    size: 0,
  }
}

/**
 * 计算简单校验和
 */
export function calculateChecksum(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * 验证校验和
 */
export function verifyChecksum(data: string, checksum: string): boolean {
  return calculateChecksum(data) === checksum
}

/**
 * 保存游戏到指定槽位
 */
export function saveGame(
  state: SaveSystemState,
  slotId: number,
  gameData: any,
  metadata: SaveMetadata,
  gameVersion: string = '0.56'
): { success: boolean; reason?: string } {
  const slot = state.slots.find(s => s.id === slotId)
  if (!slot) return { success: false, reason: `存档槽 ${slotId} 不存在` }

  try {
    const serialized = JSON.stringify(gameData)
    const checksum = calculateChecksum(serialized)

    slot.isEmpty = false
    slot.metadata = { ...metadata }
    slot.data = serialized
    slot.checksum = checksum
    slot.updatedAt = Date.now()
    slot.version = gameVersion
    slot.size = serialized.length

    if (slot.createdAt === 0) {
      slot.createdAt = slot.updatedAt
    }

    return { success: true }
  } catch (e) {
    return { success: false, reason: '序列化失败' }
  }
}

/**
 * 读取存档
 */
export function loadGame(
  state: SaveSystemState,
  slotId: number
): { success: boolean; data: any | null; metadata: SaveMetadata | null; reason?: string } {
  const slot = state.slots.find(s => s.id === slotId)
  if (!slot) return { success: false, data: null, metadata: null, reason: `存档槽 ${slotId} 不存在` }

  if (slot.isEmpty || !slot.data) {
    return { success: false, data: null, metadata: null, reason: '存档为空' }
  }

  // 校验数据完整性
  if (slot.checksum && !verifyChecksum(slot.data, slot.checksum)) {
    return { success: false, data: null, metadata: null, reason: '存档数据校验失败，可能已损坏' }
  }

  try {
    const data = JSON.parse(slot.data)
    return { success: true, data, metadata: slot.metadata }
  } catch (e) {
    return { success: false, data: null, metadata: null, reason: '存档解析失败' }
  }
}

/**
 * 删除存档
 */
export function deleteGame(state: SaveSystemState, slotId: number): boolean {
  const slotIndex = state.slots.findIndex(s => s.id === slotId)
  if (slotIndex === -1) return false

  state.slots[slotIndex] = createEmptySlot(slotId)
  return true
}

/**
 * 重命名存档
 */
export function renameSave(
  state: SaveSystemState,
  slotId: number,
  newName: string
): { success: boolean; reason?: string } {
  const slot = state.slots.find(s => s.id === slotId)
  if (!slot) return { success: false, reason: '存档槽不存在' }

  if (newName.length === 0) return { success: false, reason: '名称不能为空' }
  if (newName.length > 20) return { success: false, reason: '名称不能超过 20 个字符' }

  slot.name = newName
  return { success: true }
}

/**
 * 复制存档到另一个槽位
 */
export function copySave(
  state: SaveSystemState,
  fromSlotId: number,
  toSlotId: number
): { success: boolean; reason?: string } {
  const fromSlot = state.slots.find(s => s.id === fromSlotId)
  const toSlot = state.slots.find(s => s.id === toSlotId)

  if (!fromSlot) return { success: false, reason: '源存档槽不存在' }
  if (!toSlot) return { success: false, reason: '目标存档槽不存在' }
  if (fromSlot.isEmpty) return { success: false, reason: '源存档为空' }
  if (fromSlotId === toSlotId) return { success: false, reason: '不能复制到同一槽位' }

  toSlot.isEmpty = false
  toSlot.metadata = fromSlot.metadata ? { ...fromSlot.metadata } : null
  toSlot.data = fromSlot.data
  toSlot.checksum = fromSlot.checksum
  toSlot.createdAt = Date.now()
  toSlot.updatedAt = Date.now()
  toSlot.version = fromSlot.version
  toSlot.size = fromSlot.size
  toSlot.name = `${fromSlot.name} (副本)`

  return { success: true }
}

/**
 * 自动存档
 */
export function autoSave(
  state: SaveSystemState,
  gameData: any,
  metadata: SaveMetadata,
  gameVersion: string = '0.56'
): { success: boolean; reason?: string } {
  if (state.autoSaveSlot === 0) {
    return { success: false, reason: '自动存档已禁用' }
  }

  const result = saveGame(state, state.autoSaveSlot, gameData, metadata, gameVersion)
  if (result.success) {
    state.lastAutoSave = Date.now()
  }
  return result
}

/**
 * 检查是否需要自动存档
 */
export function needsAutoSave(state: SaveSystemState, now?: number): boolean {
  if (state.autoSaveSlot === 0) return false

  const currentTime = now || Date.now()
  const elapsed = (currentTime - state.lastAutoSave) / 1000

  return elapsed >= state.autoSaveInterval
}

/**
 * 设置自动存档配置
 */
export function configureAutoSave(
  state: SaveSystemState,
  slotId: number,
  intervalSeconds: number
): { success: boolean; reason?: string } {
  if (slotId < 0 || slotId > state.maxSlots) {
    return { success: false, reason: '无效的存档槽 ID' }
  }
  if (intervalSeconds < 10 || intervalSeconds > 600) {
    return { success: false, reason: '间隔需要在 10-600 秒之间' }
  }

  state.autoSaveSlot = slotId
  state.autoSaveInterval = intervalSeconds
  return { success: true }
}

/**
 * 获取存档列表（非空）
 */
export function getSaveList(state: SaveSystemState): SaveSlot[] {
  return state.slots.filter(s => !s.isEmpty)
}

/**
 * 获取空存档槽
 */
export function getEmptySlots(state: SaveSystemState): SaveSlot[] {
  return state.slots.filter(s => s.isEmpty)
}

/**
 * 获取存档统计
 */
export function getSaveStats(state: SaveSystemState): {
  totalSlots: number
  usedSlots: number
  emptySlots: number
  totalSize: number
  autoSaveEnabled: boolean
  autoSaveSlot: number
  autoSaveInterval: number
} {
  const used = state.slots.filter(s => !s.isEmpty)
  return {
    totalSlots: state.maxSlots,
    usedSlots: used.length,
    emptySlots: state.maxSlots - used.length,
    totalSize: used.reduce((sum, s) => sum + s.size, 0),
    autoSaveEnabled: state.autoSaveSlot > 0,
    autoSaveSlot: state.autoSaveSlot,
    autoSaveInterval: state.autoSaveInterval,
  }
}

/**
 * 导出存档系统状态
 */
export function exportSaveSystemState(state: SaveSystemState): any {
  return { ...state, slots: state.slots.map(s => ({ ...s })) }
}

/**
 * 导入存档系统状态
 */
export function importSaveSystemState(data: any): SaveSystemState {
  return { ...data, slots: data.slots.map((s: any) => ({ ...s })) }
}
