/**
 * v0.56 存档系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createSaveSystemState,
  calculateChecksum,
  verifyChecksum,
  saveGame,
  loadGame,
  deleteGame,
  renameSave,
  copySave,
  autoSave,
  needsAutoSave,
  configureAutoSave,
  getSaveList,
  getEmptySlots,
  getSaveStats,
  exportSaveSystemState,
  importSaveSystemState,
  SaveSystemState,
  SaveMetadata,
} from './saveSystem'

const mockMetadata: SaveMetadata = {
  playerName: '测试玩家',
  level: 50,
  playTime: 1200,
  rebirthCount: 3,
  chapter: '第五章',
  gold: 100000,
  diamonds: 500,
}

const mockGameData = {
  player: { name: '测试玩家', level: 50 },
  inventory: { gold: 100000 },
  progress: { chapter: 5 },
}

describe('v0.56 存档系统', () => {
  let state: SaveSystemState

  beforeEach(() => {
    state = createSaveSystemState()
  })

  describe('初始化', () => {
    it('应该创建 5 个空存档槽', () => {
      expect(state.slots.length).toBe(5)
      expect(state.slots.every(s => s.isEmpty)).toBe(true)
    })

    it('默认自动存档到槽位 1', () => {
      expect(state.autoSaveSlot).toBe(1)
      expect(state.autoSaveInterval).toBe(60)
    })
  })

  describe('校验和', () => {
    it('应该计算校验和', () => {
      const checksum = calculateChecksum('hello world')
      expect(checksum).toBeDefined()
      expect(checksum.length).toBeGreaterThan(0)
    })

    it('相同数据应该有相同校验和', () => {
      const c1 = calculateChecksum('test data')
      const c2 = calculateChecksum('test data')
      expect(c1).toBe(c2)
    })

    it('不同数据应该有不同校验和', () => {
      const c1 = calculateChecksum('data1')
      const c2 = calculateChecksum('data2')
      expect(c1).not.toBe(c2)
    })

    it('应该验证校验和', () => {
      const data = 'test data'
      const checksum = calculateChecksum(data)
      expect(verifyChecksum(data, checksum)).toBe(true)
      expect(verifyChecksum('tampered', checksum)).toBe(false)
    })
  })

  describe('保存游戏', () => {
    it('应该保存到指定槽位', () => {
      const result = saveGame(state, 1, mockGameData, mockMetadata)

      expect(result.success).toBe(true)
      expect(state.slots[0].isEmpty).toBe(false)
      expect(state.slots[0].metadata?.playerName).toBe('测试玩家')
      expect(state.slots[0].size).toBeGreaterThan(0)
    })

    it('应该覆盖已有存档', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      saveGame(state, 1, { ...mockGameData, player: { name: '新玩家', level: 99 } }, { ...mockMetadata, level: 99 })

      expect(state.slots[0].metadata?.level).toBe(99)
    })

    it('不存在的槽位返回错误', () => {
      const result = saveGame(state, 99, mockGameData, mockMetadata)
      expect(result.success).toBe(false)
    })

    it('应该记录版本号', () => {
      saveGame(state, 1, mockGameData, mockMetadata, '0.56')
      expect(state.slots[0].version).toBe('0.56')
    })
  })

  describe('读取存档', () => {
    it('应该读取已保存的存档', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      const result = loadGame(state, 1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockGameData)
      expect(result.metadata?.playerName).toBe('测试玩家')
    })

    it('空存档返回错误', () => {
      const result = loadGame(state, 1)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('为空')
    })

    it('不存在的槽位返回错误', () => {
      const result = loadGame(state, 99)
      expect(result.success).toBe(false)
    })

    it('数据被篡改时校验失败', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      state.slots[0].data = '{"tampered": true}'

      const result = loadGame(state, 1)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('校验失败')
    })
  })

  describe('删除存档', () => {
    it('应该删除存档', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      const result = deleteGame(state, 1)

      expect(result).toBe(true)
      expect(state.slots[0].isEmpty).toBe(true)
      expect(state.slots[0].data).toBeNull()
    })

    it('删除不存在的槽位返回 false', () => {
      expect(deleteGame(state, 99)).toBe(false)
    })
  })

  describe('重命名存档', () => {
    it('应该重命名存档', () => {
      const result = renameSave(state, 1, '我的存档')
      expect(result.success).toBe(true)
      expect(state.slots[0].name).toBe('我的存档')
    })

    it('空名称返回错误', () => {
      const result = renameSave(state, 1, '')
      expect(result.success).toBe(false)
    })

    it('超长名称返回错误', () => {
      const result = renameSave(state, 1, '这是一个超级超级超级超级超级长的存档名称啊')
      expect(result.success).toBe(false)
    })
  })

  describe('复制存档', () => {
    it('应该复制存档', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      const result = copySave(state, 1, 2)

      expect(result.success).toBe(true)
      expect(state.slots[1].isEmpty).toBe(false)
      expect(state.slots[1].name).toContain('副本')
    })

    it('不能从空存档复制', () => {
      const result = copySave(state, 1, 2)
      expect(result.success).toBe(false)
    })

    it('不能复制到同一槽位', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      const result = copySave(state, 1, 1)
      expect(result.success).toBe(false)
    })
  })

  describe('自动存档', () => {
    it('应该自动存档', () => {
      const result = autoSave(state, mockGameData, mockMetadata)

      expect(result.success).toBe(true)
      expect(state.lastAutoSave).toBeGreaterThan(0)
    })

    it('禁用时不自动存档', () => {
      state.autoSaveSlot = 0
      const result = autoSave(state, mockGameData, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('禁用')
    })

    it('应该检查是否需要自动存档', () => {
      state.lastAutoSave = Date.now()
      expect(needsAutoSave(state)).toBe(false)

      state.lastAutoSave = Date.now() - 120000 // 2 分钟前
      expect(needsAutoSave(state)).toBe(true)
    })

    it('应该配置自动存档', () => {
      const result = configureAutoSave(state, 3, 120)

      expect(result.success).toBe(true)
      expect(state.autoSaveSlot).toBe(3)
      expect(state.autoSaveInterval).toBe(120)
    })

    it('无效间隔返回错误', () => {
      expect(configureAutoSave(state, 1, 5).success).toBe(false)
      expect(configureAutoSave(state, 1, 700).success).toBe(false)
    })
  })

  describe('查询功能', () => {
    it('应该获取非空存档列表', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      saveGame(state, 3, mockGameData, mockMetadata)

      const saves = getSaveList(state)
      expect(saves.length).toBe(2)
    })

    it('应该获取空存档槽', () => {
      saveGame(state, 1, mockGameData, mockMetadata)

      const empty = getEmptySlots(state)
      expect(empty.length).toBe(4)
    })

    it('应该获取存档统计', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      saveGame(state, 2, mockGameData, mockMetadata)

      const stats = getSaveStats(state)
      expect(stats.totalSlots).toBe(5)
      expect(stats.usedSlots).toBe(2)
      expect(stats.emptySlots).toBe(3)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.autoSaveEnabled).toBe(true)
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入存档系统', () => {
      saveGame(state, 1, mockGameData, mockMetadata)
      saveGame(state, 3, mockGameData, mockMetadata)

      const exported = exportSaveSystemState(state)
      const imported = importSaveSystemState(exported)

      expect(imported.slots.length).toBe(5)
      expect(imported.slots[0].isEmpty).toBe(false)
      expect(imported.slots[2].isEmpty).toBe(false)
      expect(imported.autoSaveSlot).toBe(1)
    })
  })
})
