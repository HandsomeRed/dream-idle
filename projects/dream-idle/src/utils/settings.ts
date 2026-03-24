/**
 * v0.55 设置系统
 * 
 * 功能特性：
 * - 游戏设置管理（音效/画质/通知/战斗）
 * - 设置分类（通用/画面/音效/战斗/通知/账号）
 * - 设置持久化（导出/导入）
 * - 设置重置（恢复默认）
 * - 设置变更事件
 */

export type SettingCategory = '通用' | '画面' | '音效' | '战斗' | '通知' | '账号'
export type SettingType = 'toggle' | 'slider' | 'select' | 'text'

export interface SettingDefinition {
  id: string
  name: string
  description: string
  category: SettingCategory
  type: SettingType
  defaultValue: any
  options?: string[]           // select 类型的选项
  min?: number                 // slider 最小值
  max?: number                 // slider 最大值
  step?: number                // slider 步进
}

export interface SettingChange {
  settingId: string
  oldValue: any
  newValue: any
  timestamp: number
}

export interface SettingsState {
  values: Map<string, any>
  changeHistory: SettingChange[]
  lastModified: number
}

// ========== 设置定义 ==========

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // 通用
  { id: 'language', name: '语言', description: '游戏语言', category: '通用', type: 'select', defaultValue: '中文', options: ['中文', 'English', '日本語'] },
  { id: 'auto_save', name: '自动保存', description: '每隔一段时间自动保存', category: '通用', type: 'toggle', defaultValue: true },
  { id: 'auto_save_interval', name: '自动保存间隔', description: '自动保存间隔（秒）', category: '通用', type: 'slider', defaultValue: 60, min: 30, max: 300, step: 30 },
  { id: 'confirm_purchase', name: '购买确认', description: '购买物品前确认', category: '通用', type: 'toggle', defaultValue: true },

  // 画面
  { id: 'quality', name: '画质', description: '游戏画面质量', category: '画面', type: 'select', defaultValue: '中', options: ['低', '中', '高', '极高'] },
  { id: 'fps_limit', name: '帧率限制', description: '最大帧率', category: '画面', type: 'select', defaultValue: '60', options: ['30', '60', '120', '无限制'] },
  { id: 'show_damage', name: '显示伤害数字', description: '战斗中显示伤害数字', category: '画面', type: 'toggle', defaultValue: true },
  { id: 'show_effects', name: '显示特效', description: '显示技能特效', category: '画面', type: 'toggle', defaultValue: true },
  { id: 'ui_scale', name: 'UI 缩放', description: '界面缩放比例', category: '画面', type: 'slider', defaultValue: 100, min: 50, max: 200, step: 10 },

  // 音效
  { id: 'master_volume', name: '主音量', description: '总体音量', category: '音效', type: 'slider', defaultValue: 80, min: 0, max: 100, step: 5 },
  { id: 'bgm_volume', name: '背景音乐', description: '背景音乐音量', category: '音效', type: 'slider', defaultValue: 70, min: 0, max: 100, step: 5 },
  { id: 'sfx_volume', name: '音效音量', description: '游戏音效音量', category: '音效', type: 'slider', defaultValue: 80, min: 0, max: 100, step: 5 },
  { id: 'mute_all', name: '静音', description: '关闭所有声音', category: '音效', type: 'toggle', defaultValue: false },

  // 战斗
  { id: 'auto_battle', name: '自动战斗', description: '自动进行战斗', category: '战斗', type: 'toggle', defaultValue: true },
  { id: 'battle_speed', name: '战斗速度', description: '战斗播放速度', category: '战斗', type: 'select', defaultValue: '1x', options: ['0.5x', '1x', '2x', '3x'] },
  { id: 'skip_animation', name: '跳过动画', description: '跳过战斗动画', category: '战斗', type: 'toggle', defaultValue: false },
  { id: 'auto_skill', name: '自动释放技能', description: '自动使用技能', category: '战斗', type: 'toggle', defaultValue: true },
  { id: 'auto_potion', name: '自动使用药水', description: 'HP 低于阈值时自动使用', category: '战斗', type: 'toggle', defaultValue: true },
  { id: 'potion_threshold', name: '药水使用阈值', description: 'HP 低于此百分比时使用', category: '战斗', type: 'slider', defaultValue: 30, min: 10, max: 80, step: 5 },

  // 通知
  { id: 'push_enabled', name: '推送通知', description: '接收游戏推送', category: '通知', type: 'toggle', defaultValue: true },
  { id: 'stamina_notify', name: '体力满通知', description: '体力恢复满时通知', category: '通知', type: 'toggle', defaultValue: true },
  { id: 'event_notify', name: '活动通知', description: '新活动开始时通知', category: '通知', type: 'toggle', defaultValue: true },
  { id: 'mail_notify', name: '邮件通知', description: '收到新邮件时通知', category: '通知', type: 'toggle', defaultValue: true },

  // 账号
  { id: 'player_name', name: '玩家昵称', description: '游戏中显示的名称', category: '账号', type: 'text', defaultValue: '冒险者' },
  { id: 'show_online', name: '在线状态', description: '是否显示在线状态', category: '账号', type: 'toggle', defaultValue: true },
]

// ========== 核心函数 ==========

/**
 * 创建设置状态（使用默认值）
 */
export function createSettingsState(): SettingsState {
  const values = new Map<string, any>()

  for (const def of SETTING_DEFINITIONS) {
    values.set(def.id, def.defaultValue)
  }

  return {
    values,
    changeHistory: [],
    lastModified: Date.now(),
  }
}

/**
 * 获取设置值
 */
export function getSetting(state: SettingsState, settingId: string): any {
  if (state.values.has(settingId)) {
    return state.values.get(settingId)
  }

  const def = SETTING_DEFINITIONS.find(d => d.id === settingId)
  return def?.defaultValue ?? null
}

/**
 * 设置值
 */
export function setSetting(
  state: SettingsState,
  settingId: string,
  value: any
): { success: boolean; reason?: string } {
  const def = SETTING_DEFINITIONS.find(d => d.id === settingId)
  if (!def) return { success: false, reason: '设置项不存在' }

  // 验证值
  const validation = validateSettingValue(def, value)
  if (!validation.valid) {
    return { success: false, reason: validation.reason }
  }

  const oldValue = state.values.get(settingId)

  // 值没有变化
  if (oldValue === value) return { success: true }

  // 记录变更
  state.changeHistory.unshift({
    settingId,
    oldValue,
    newValue: value,
    timestamp: Date.now(),
  })

  if (state.changeHistory.length > 100) {
    state.changeHistory = state.changeHistory.slice(0, 100)
  }

  state.values.set(settingId, value)
  state.lastModified = Date.now()

  return { success: true }
}

/**
 * 验证设置值
 */
function validateSettingValue(def: SettingDefinition, value: any): { valid: boolean; reason?: string } {
  switch (def.type) {
    case 'toggle':
      if (typeof value !== 'boolean') {
        return { valid: false, reason: '需要布尔值' }
      }
      break

    case 'slider':
      if (typeof value !== 'number') {
        return { valid: false, reason: '需要数字' }
      }
      if (def.min !== undefined && value < def.min) {
        return { valid: false, reason: `不能小于 ${def.min}` }
      }
      if (def.max !== undefined && value > def.max) {
        return { valid: false, reason: `不能大于 ${def.max}` }
      }
      break

    case 'select':
      if (def.options && !def.options.includes(value)) {
        return { valid: false, reason: `无效选项，可选：${def.options.join(', ')}` }
      }
      break

    case 'text':
      if (typeof value !== 'string') {
        return { valid: false, reason: '需要字符串' }
      }
      if (value.length > 20) {
        return { valid: false, reason: '不能超过 20 个字符' }
      }
      break
  }

  return { valid: true }
}

/**
 * 重置单个设置为默认值
 */
export function resetSetting(state: SettingsState, settingId: string): boolean {
  const def = SETTING_DEFINITIONS.find(d => d.id === settingId)
  if (!def) return false

  setSetting(state, settingId, def.defaultValue)
  return true
}

/**
 * 重置所有设置为默认值
 */
export function resetAllSettings(state: SettingsState): void {
  for (const def of SETTING_DEFINITIONS) {
    state.values.set(def.id, def.defaultValue)
  }
  state.lastModified = Date.now()
}

/**
 * 获取分类设置
 */
export function getSettingsByCategory(category: SettingCategory): SettingDefinition[] {
  return SETTING_DEFINITIONS.filter(d => d.category === category)
}

/**
 * 获取所有分类
 */
export function getAllCategories(): SettingCategory[] {
  const categories = new Set<SettingCategory>()
  for (const def of SETTING_DEFINITIONS) {
    categories.add(def.category)
  }
  return Array.from(categories)
}

/**
 * 获取设置变更历史
 */
export function getChangeHistory(state: SettingsState, limit: number = 20): SettingChange[] {
  return state.changeHistory.slice(0, limit)
}

/**
 * 检查设置是否为默认值
 */
export function isDefault(state: SettingsState, settingId: string): boolean {
  const def = SETTING_DEFINITIONS.find(d => d.id === settingId)
  if (!def) return false
  return state.values.get(settingId) === def.defaultValue
}

/**
 * 获取非默认设置数量
 */
export function getNonDefaultCount(state: SettingsState): number {
  let count = 0
  for (const def of SETTING_DEFINITIONS) {
    if (state.values.get(def.id) !== def.defaultValue) {
      count++
    }
  }
  return count
}

/**
 * 导出设置
 */
export function exportSettingsState(state: SettingsState): any {
  return {
    values: Array.from(state.values.entries()),
    changeHistory: state.changeHistory,
    lastModified: state.lastModified,
  }
}

/**
 * 导入设置
 */
export function importSettingsState(data: any): SettingsState {
  return {
    values: new Map(data.values),
    changeHistory: data.changeHistory || [],
    lastModified: data.lastModified,
  }
}
