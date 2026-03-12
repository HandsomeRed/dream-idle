import {
  initializeDailyTasks,
  initializeMainTasks,
  initializeAchievementTasks,
  updateTaskProgress,
  claimTaskReward,
  isTaskUnlocked,
  updateTasksByType,
  getTaskProgressPercent,
  getTaskStatusLabel,
  DAILY_TASKS,
  MAIN_TASKS,
  ACHIEVEMENT_TASKS
} from './tasks'

describe('任务系统', () => {
  describe('初始化任务', () => {
    it('应该正确初始化每日任务', () => {
      const tasks = initializeDailyTasks()
      
      expect(tasks.length).toBe(4)
      expect(tasks.every(t => t.type === 'daily')).toBe(true)
      expect(tasks.every(t => t.status === 'available')).toBe(true)
      expect(tasks.every(t => t.expiresAt)).toBeDefined()
    })

    it('应该正确初始化主线任务', () => {
      const tasks = initializeMainTasks()
      
      expect(tasks.length).toBe(5)
      expect(tasks.every(t => t.type === 'main')).toBe(true)
      expect(tasks[0].status).toBe('available') // 第一个任务可用
      expect(tasks.slice(1).every(t => t.status === 'locked')).toBe(true) // 其他锁定
    })

    it('应该正确初始化成就任务', () => {
      const tasks = initializeAchievementTasks()
      
      expect(tasks.length).toBe(3)
      expect(tasks.every(t => t.type === 'achievement')).toBe(true)
      expect(tasks.every(t => t.status === 'locked')).toBe(true)
    })

    it('每日任务应该有明天过期的时间', () => {
      const tasks = initializeDailyTasks()
      const now = Date.now()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      tasks.forEach(task => {
        expect(task.expiresAt).toBeGreaterThan(now)
        expect(task.expiresAt).toBeLessThanOrEqual(tomorrow.getTime())
      })
    })
  })

  describe('任务进度更新', () => {
    it('应该更新任务进度', () => {
      const tasks = initializeDailyTasks()
      const battleTask = tasks.find(t => t.id === 'daily_battle_5')!
      
      const updated = updateTaskProgress(battleTask, 3)
      
      expect(updated.objective.current).toBe(3)
      expect(updated.objective.required).toBe(5)
      expect(updated.status).toBe('in-progress')
    })

    it('进度不应该超过需求', () => {
      const tasks = initializeDailyTasks()
      const battleTask = tasks.find(t => t.id === 'daily_battle_5')!
      
      const updated = updateTaskProgress(battleTask, 10)
      
      expect(updated.objective.current).toBe(5)
      expect(updated.status).toBe('completed')
    })

    it('完成时状态应该变为 completed', () => {
      const tasks = initializeDailyTasks()
      const loginTask = tasks.find(t => t.id === 'daily_login')!
      
      const updated = updateTaskProgress(loginTask, 1)
      
      expect(updated.status).toBe('completed')
    })

    it('多次更新应该累加进度', () => {
      const tasks = initializeDailyTasks()
      let battleTask = tasks.find(t => t.id === 'daily_battle_5')!
      
      battleTask = updateTaskProgress(battleTask, 2)
      battleTask = updateTaskProgress(battleTask, 2)
      battleTask = updateTaskProgress(battleTask, 2)
      
      expect(battleTask.objective.current).toBe(5)
      expect(battleTask.status).toBe('completed')
    })
  })

  describe('领取任务奖励', () => {
    it('应该可以领取已完成任务的奖励', () => {
      const tasks = initializeDailyTasks()
      let loginTask = tasks.find(t => t.id === 'daily_login')!
      loginTask = updateTaskProgress(loginTask, 1)
      
      const { task, rewards } = claimTaskReward(loginTask)
      
      expect(task.status).toBe('claimed')
      expect(rewards.length).toBeGreaterThan(0)
      expect(rewards[0].type).toBe('exp')
    })

    it('不应该领取未完成的任务', () => {
      const tasks = initializeDailyTasks()
      const battleTask = tasks.find(t => t.id === 'daily_battle_5')!
      
      expect(() => claimTaskReward(battleTask)).toThrow('not completed')
    })

    it('不应该领取已领取的任务', () => {
      const tasks = initializeDailyTasks()
      let loginTask = tasks.find(t => t.id === 'daily_login')!
      loginTask = updateTaskProgress(loginTask, 1)
      const claimed = claimTaskReward(loginTask)
      
      expect(() => claimTaskReward(claimed.task)).toThrow('not completed')
    })
  })

  describe('任务解锁检查', () => {
    it('没有前置条件的任务应该总是解锁', () => {
      const tasks = initializeMainTasks()
      const firstTask = tasks[0]
      
      expect(isTaskUnlocked(firstTask, [])).toBe(true)
    })

    it('前置任务完成时应该解锁', () => {
      const tasks = initializeMainTasks()
      const secondTask = tasks[1] // main_first_battle
      
      expect(isTaskUnlocked(secondTask, ['main_create_character'])).toBe(true)
    })

    it('前置任务未完成时应该锁定', () => {
      const tasks = initializeMainTasks()
      const secondTask = tasks[1]
      
      expect(isTaskUnlocked(secondTask, [])).toBe(false)
    })
  })

  describe('批量更新任务', () => {
    it('应该更新匹配目标类型的任务', () => {
      const tasks = initializeDailyTasks()
      
      const updated = updateTasksByType(tasks, 'battle', 3, [])
      
      const battle5 = updated.find(t => t.id === 'daily_battle_5')!
      const battle10 = updated.find(t => t.id === 'daily_battle_10')!
      const login = updated.find(t => t.id === 'daily_login')!
      
      expect(battle5.objective.current).toBe(3)
      expect(battle10.objective.current).toBe(3)
      expect(login.objective.current).toBe(0) // 不匹配类型
    })

    it('应该跳过已领取的任务', () => {
      const tasks = initializeDailyTasks()
      let loginTask = tasks.find(t => t.id === 'daily_login')!
      loginTask = updateTaskProgress(loginTask, 1)
      const claimed = claimTaskReward(loginTask)
      
      const otherTasks = tasks.filter(t => t.id !== 'daily_login')
      const allTasks = [claimed.task, ...otherTasks]
      
      const updated = updateTasksByType(allTasks, 'login', 1, [])
      
      const claimedAgain = updated.find(t => t.id === 'daily_login')!
      expect(claimedAgain.status).toBe('claimed')
      expect(claimedAgain.objective.current).toBe(1)
    })

    it('应该跳过锁定的任务', () => {
      const tasks = initializeMainTasks()
      
      const updated = updateTasksByType(tasks, 'battle', 10, [])
      
      expect(updated[0].objective.current).toBe(0) // 第一个任务目标是创建角色
      expect(updated[1].status).toBe('locked') // 第二个任务锁定
    })
  })

  describe('任务进度百分比', () => {
    it('应该正确计算百分比', () => {
      const tasks = initializeDailyTasks()
      let battleTask = tasks.find(t => t.id === 'daily_battle_5')!
      
      expect(getTaskProgressPercent(battleTask)).toBe(0)
      
      battleTask = updateTaskProgress(battleTask, 3)
      expect(getTaskProgressPercent(battleTask)).toBe(60)
      
      battleTask = updateTaskProgress(battleTask, 2)
      expect(getTaskProgressPercent(battleTask)).toBe(100)
    })

    it('超过 100% 应该返回 100', () => {
      const tasks = initializeDailyTasks()
      let battleTask = tasks.find(t => t.id === 'daily_battle_5')!
      battleTask = updateTaskProgress(battleTask, 10)
      
      expect(getTaskProgressPercent(battleTask)).toBe(100)
    })
  })

  describe('任务状态标签', () => {
    it('应该返回正确的状态标签', () => {
      expect(getTaskStatusLabel({ ...initializeDailyTasks()[0], status: 'locked' }))
        .toBe('🔒 未解锁')
      expect(getTaskStatusLabel({ ...initializeDailyTasks()[0], status: 'available' }))
        .toBe('✨ 可进行')
      expect(getTaskStatusLabel({ ...initializeDailyTasks()[0], status: 'in-progress' }))
        .toBe('📋 进行中')
      expect(getTaskStatusLabel({ ...initializeDailyTasks()[0], status: 'completed' }))
        .toBe('✅ 可领取')
      expect(getTaskStatusLabel({ ...initializeDailyTasks()[0], status: 'claimed' }))
        .toBe('🎁 已领取')
    })
  })

  describe('任务配置验证', () => {
    it('所有每日任务都应该有奖励', () => {
      DAILY_TASKS.forEach(task => {
        expect(task.rewards).toBeDefined()
        expect(task.rewards.length).toBeGreaterThan(0)
      })
    })

    it('所有主线任务都应该有奖励', () => {
      MAIN_TASKS.forEach(task => {
        expect(task.rewards).toBeDefined()
        expect(task.rewards.length).toBeGreaterThan(0)
      })
    })

    it('所有成就任务都应该有奖励', () => {
      ACHIEVEMENT_TASKS.forEach(task => {
        expect(task.rewards).toBeDefined()
        expect(task.rewards.length).toBeGreaterThan(0)
      })
    })

    it('主线任务应该有正确的前置依赖链', () => {
      expect(MAIN_TASKS[0].prerequisite).toBeUndefined() // 第一个无前置
      expect(MAIN_TASKS[1].prerequisite).toBe('main_create_character')
      expect(MAIN_TASKS[2].prerequisite).toBe('main_first_battle')
      expect(MAIN_TASKS[3].prerequisite).toBe('main_reach_level_5')
    })
  })
})
