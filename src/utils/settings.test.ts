/**
 * v0.55 设置系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createSettingsState,
  getSetting,
  setSetting,
  resetSetting,
  resetAllSettings,
  getSettingsByCategory,
  getAllCategories,
  getChangeHistory,
  isDefault,
  getNonDefaultCount,
  exportSettingsState,
  importSettingsState,
  SETTING_DEFINITIONS,
  SettingsState,
} from './settings'

describe('v0.55 设置系统', () => {
  let state: SettingsState

  beforeEach(() => {
    state = createSettingsState()
  })

  describe('初始化', () => {
    it('应该创建包含所有默认值的设置', () => {
      expect(state.values.size).toBe(SETTING_DEFINITIONS.length)
    })

    it('所有设置应该有默认值', () => {
      for (const def of SETTING_DEFINITIONS) {
        expect(state.values.get(def.id)).toBe(def.defaultValue)
      }
    })
  })

  describe('获取设置', () => {
    it('应该获取设置值', () => {
      expect(getSetting(state, 'language')).toBe('中文')
      expect(getSetting(state, 'auto_battle')).toBe(true)
      expect(getSetting(state, 'master_volume')).toBe(80)
    })

    it('不存在的设置返回 null', () => {
      expect(getSetting(state, 'nonexistent')).toBeNull()
    })
  })

  describe('修改设置', () => {
    it('应该修改 toggle 设置', () => {
      const result = setSetting(state, 'auto_battle', false)

      expect(result.success).toBe(true)
      expect(getSetting(state, 'auto_battle')).toBe(false)
    })

    it('应该修改 slider 设置', () => {
      const result = setSetting(state, 'master_volume', 50)

      expect(result.success).toBe(true)
      expect(getSetting(state, 'master_volume')).toBe(50)
    })

    it('应该修改 select 设置', () => {
      const result = setSetting(state, 'language', 'English')

      expect(result.success).toBe(true)
      expect(getSetting(state, 'language')).toBe('English')
    })

    it('应该修改 text 设置', () => {
      const result = setSetting(state, 'player_name', '勇者')

      expect(result.success).toBe(true)
      expect(getSetting(state, 'player_name')).toBe('勇者')
    })

    it('不存在的设置返回错误', () => {
      const result = setSetting(state, 'nonexistent', true)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('不存在')
    })
  })

  describe('值验证', () => {
    it('toggle 类型必须是布尔值', () => {
      const result = setSetting(state, 'auto_battle', 'yes' as any)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('布尔值')
    })

    it('slider 不能小于最小值', () => {
      const result = setSetting(state, 'master_volume', -10)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('不能小于')
    })

    it('slider 不能大于最大值', () => {
      const result = setSetting(state, 'master_volume', 200)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('不能大于')
    })

    it('select 必须是有效选项', () => {
      const result = setSetting(state, 'language', '韩语')
      expect(result.success).toBe(false)
      expect(result.reason).toContain('无效选项')
    })

    it('text 不能超过 20 个字符', () => {
      const result = setSetting(state, 'player_name', '这是一个超级超级超级超级超级长的名字哈哈哈哈')
      expect(result.success).toBe(false)
      expect(result.reason).toContain('20')
    })

    it('slider 必须是数字', () => {
      const result = setSetting(state, 'master_volume', 'loud' as any)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('数字')
    })
  })

  describe('重置设置', () => {
    it('应该重置单个设置', () => {
      setSetting(state, 'master_volume', 30)
      resetSetting(state, 'master_volume')

      expect(getSetting(state, 'master_volume')).toBe(80) // 默认值
    })

    it('重置不存在的设置返回 false', () => {
      expect(resetSetting(state, 'nonexistent')).toBe(false)
    })

    it('应该重置所有设置', () => {
      setSetting(state, 'master_volume', 30)
      setSetting(state, 'language', 'English')
      setSetting(state, 'auto_battle', false)

      resetAllSettings(state)

      expect(getSetting(state, 'master_volume')).toBe(80)
      expect(getSetting(state, 'language')).toBe('中文')
      expect(getSetting(state, 'auto_battle')).toBe(true)
    })
  })

  describe('分类查询', () => {
    it('应该获取分类设置', () => {
      const audio = getSettingsByCategory('音效')
      expect(audio.length).toBeGreaterThan(0)
      expect(audio.every(d => d.category === '音效')).toBe(true)
    })

    it('应该获取所有分类', () => {
      const categories = getAllCategories()
      expect(categories).toContain('通用')
      expect(categories).toContain('画面')
      expect(categories).toContain('音效')
      expect(categories).toContain('战斗')
      expect(categories).toContain('通知')
      expect(categories).toContain('账号')
    })
  })

  describe('变更历史', () => {
    it('修改设置应该记录历史', () => {
      setSetting(state, 'master_volume', 50)

      const history = getChangeHistory(state)
      expect(history.length).toBe(1)
      expect(history[0].settingId).toBe('master_volume')
      expect(history[0].oldValue).toBe(80)
      expect(history[0].newValue).toBe(50)
    })

    it('相同值不记录历史', () => {
      setSetting(state, 'master_volume', 80) // 默认值就是 80

      const history = getChangeHistory(state)
      expect(history.length).toBe(0)
    })

    it('历史应该有数量限制', () => {
      for (let i = 0; i <= 100; i++) {
        setSetting(state, 'master_volume', i % 100)
      }

      const history = getChangeHistory(state, 200)
      expect(history.length).toBeLessThanOrEqual(100)
    })
  })

  describe('默认值检查', () => {
    it('初始时所有设置都是默认值', () => {
      expect(isDefault(state, 'master_volume')).toBe(true)
      expect(getNonDefaultCount(state)).toBe(0)
    })

    it('修改后不再是默认值', () => {
      setSetting(state, 'master_volume', 30)

      expect(isDefault(state, 'master_volume')).toBe(false)
      expect(getNonDefaultCount(state)).toBe(1)
    })

    it('重置后恢复默认值', () => {
      setSetting(state, 'master_volume', 30)
      resetSetting(state, 'master_volume')

      expect(isDefault(state, 'master_volume')).toBe(true)
    })
  })

  describe('配置', () => {
    it('应该有 25 个设置项', () => {
      expect(SETTING_DEFINITIONS.length).toBe(25)
    })

    it('每个设置都有有效的类型', () => {
      const validTypes = ['toggle', 'slider', 'select', 'text']
      for (const def of SETTING_DEFINITIONS) {
        expect(validTypes).toContain(def.type)
      }
    })

    it('select 类型应该有 options', () => {
      const selects = SETTING_DEFINITIONS.filter(d => d.type === 'select')
      for (const def of selects) {
        expect(def.options).toBeDefined()
        expect(def.options!.length).toBeGreaterThan(0)
      }
    })

    it('slider 类型应该有 min/max', () => {
      const sliders = SETTING_DEFINITIONS.filter(d => d.type === 'slider')
      for (const def of sliders) {
        expect(def.min).toBeDefined()
        expect(def.max).toBeDefined()
        expect(def.max!).toBeGreaterThan(def.min!)
      }
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入设置', () => {
      setSetting(state, 'master_volume', 50)
      setSetting(state, 'language', 'English')

      const exported = exportSettingsState(state)
      const imported = importSettingsState(exported)

      expect(getSetting(imported, 'master_volume')).toBe(50)
      expect(getSetting(imported, 'language')).toBe('English')
      expect(imported.values.size).toBe(state.values.size)
    })
  })
})
