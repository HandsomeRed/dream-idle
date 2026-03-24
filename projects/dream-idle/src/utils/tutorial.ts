/**
 * v0.57 引导教程系统
 * 
 * 功能特性：
 * - 多章节教程（新手/进阶/高级）
 * - 步骤式引导（高亮/箭头/文字说明）
 * - 条件触发教程
 * - 教程奖励
 * - 跳过/重播功能
 * - 教程进度追踪
 */

export type TutorialCategory = '新手' | '进阶' | '高级'
export type TutorialTrigger = 'level' | 'first_login' | 'unlock_feature' | 'manual'
export type StepAction = 'click' | 'navigate' | 'info' | 'battle' | 'equip' | 'summon'

export interface TutorialStep {
  id: string
  title: string
  description: string
  action: StepAction
  targetElement?: string          // UI 元素标识
  highlightArea?: string          // 高亮区域
  canSkip: boolean
  reward?: TutorialReward
}

export interface TutorialReward {
  type: 'gold' | 'diamond' | 'exp' | 'item'
  amount: number
  itemId?: string
}

export interface Tutorial {
  id: string
  name: string
  category: TutorialCategory
  description: string
  steps: TutorialStep[]
  trigger: TutorialTrigger
  triggerValue?: number           // level 触发时的等级
  triggerFeature?: string         // unlock_feature 触发时的功能名
  completionReward: TutorialReward[]
  prerequisiteTutorials: string[] // 前置教程 ID
}

export interface TutorialProgress {
  tutorialId: string
  currentStep: number             // 当前步骤索引
  completed: boolean
  skipped: boolean
  startedAt: number
  completedAt: number
  stepsCompleted: number
}

export interface TutorialState {
  progress: Map<string, TutorialProgress>
  activeTutorial: string | null    // 当前激活的教程 ID
  totalCompleted: number
  totalSkipped: number
  rewardsCollected: number
  tutorialsDisabled: boolean       // 全局禁用教程
}

// ========== 教程配置 ==========

export const TUTORIALS: Tutorial[] = [
  {
    id: 'tut_welcome',
    name: '欢迎来到梦幻放置',
    category: '新手',
    description: '了解游戏基础操作',
    trigger: 'first_login',
    prerequisiteTutorials: [],
    completionReward: [{ type: 'gold', amount: 1000 }, { type: 'diamond', amount: 50 }],
    steps: [
      { id: 'welcome_1', title: '欢迎', description: '欢迎来到梦幻放置！让我们开始冒险吧。', action: 'info', canSkip: false },
      { id: 'welcome_2', title: '角色信息', description: '这是你的角色面板，查看等级和属性。', action: 'navigate', targetElement: 'character_panel', canSkip: true },
      { id: 'welcome_3', title: '完成', description: '恭喜！你已了解基础操作。', action: 'info', canSkip: false, reward: { type: 'gold', amount: 500 } },
    ],
  },
  {
    id: 'tut_battle',
    name: '战斗入门',
    category: '新手',
    description: '学习战斗系统',
    trigger: 'level',
    triggerValue: 2,
    prerequisiteTutorials: ['tut_welcome'],
    completionReward: [{ type: 'exp', amount: 200 }],
    steps: [
      { id: 'battle_1', title: '进入战斗', description: '点击推图按钮开始你的第一场战斗。', action: 'click', targetElement: 'battle_btn', canSkip: true },
      { id: 'battle_2', title: '自动战斗', description: '战斗会自动进行，观察你的英雄如何战斗。', action: 'battle', canSkip: true },
      { id: 'battle_3', title: '战利品', description: '战斗胜利后会获得金币和经验。', action: 'info', canSkip: true, reward: { type: 'gold', amount: 300 } },
    ],
  },
  {
    id: 'tut_equip',
    name: '装备系统',
    category: '新手',
    description: '学习装备穿戴和强化',
    trigger: 'level',
    triggerValue: 5,
    prerequisiteTutorials: ['tut_battle'],
    completionReward: [{ type: 'item', amount: 1, itemId: 'iron_sword' }],
    steps: [
      { id: 'equip_1', title: '装备栏', description: '打开装备栏查看你的装备。', action: 'navigate', targetElement: 'equip_panel', canSkip: true },
      { id: 'equip_2', title: '穿戴装备', description: '将装备拖拽到对应槽位穿戴。', action: 'equip', canSkip: true },
      { id: 'equip_3', title: '强化装备', description: '使用金币强化装备提升属性。', action: 'click', targetElement: 'enhance_btn', canSkip: true },
    ],
  },
  {
    id: 'tut_summon',
    name: '英雄召唤',
    category: '进阶',
    description: '学习英雄召唤系统',
    trigger: 'level',
    triggerValue: 10,
    prerequisiteTutorials: ['tut_equip'],
    completionReward: [{ type: 'diamond', amount: 100 }],
    steps: [
      { id: 'summon_1', title: '召唤界面', description: '打开英雄召唤界面。', action: 'navigate', targetElement: 'summon_panel', canSkip: true },
      { id: 'summon_2', title: '单抽', description: '使用钻石进行一次召唤。', action: 'summon', canSkip: true },
      { id: 'summon_3', title: '保底机制', description: '每 90 次必得传说英雄。', action: 'info', canSkip: true },
    ],
  },
  {
    id: 'tut_idle',
    name: '离线挂机',
    category: '进阶',
    description: '了解离线收益系统',
    trigger: 'level',
    triggerValue: 15,
    prerequisiteTutorials: ['tut_summon'],
    completionReward: [{ type: 'gold', amount: 5000 }],
    steps: [
      { id: 'idle_1', title: '离线收益', description: '即使不在线，你的英雄也会持续战斗获取收益。', action: 'info', canSkip: true },
      { id: 'idle_2', title: '选择地点', description: '选择不同的挂机地点获取不同收益。', action: 'navigate', targetElement: 'idle_panel', canSkip: true },
    ],
  },
  {
    id: 'tut_talent',
    name: '天赋树系统',
    category: '高级',
    description: '学习天赋分配',
    trigger: 'level',
    triggerValue: 30,
    prerequisiteTutorials: ['tut_idle'],
    completionReward: [{ type: 'diamond', amount: 200 }],
    steps: [
      { id: 'talent_1', title: '天赋树', description: '打开天赋树，分配天赋点提升角色。', action: 'navigate', targetElement: 'talent_panel', canSkip: true },
      { id: 'talent_2', title: '三大分支', description: '战斗/防御/辅助三大分支，选择你的路线。', action: 'info', canSkip: true },
      { id: 'talent_3', title: '天赋预设', description: '保存不同的天赋方案快速切换。', action: 'info', canSkip: true },
    ],
  },
  {
    id: 'tut_rebirth',
    name: '转生系统',
    category: '高级',
    description: '学习转生机制',
    trigger: 'level',
    triggerValue: 50,
    prerequisiteTutorials: ['tut_talent'],
    completionReward: [{ type: 'diamond', amount: 500 }],
    steps: [
      { id: 'rebirth_1', title: '转生', description: '达到满级后可以转生，获得永久加成。', action: 'info', canSkip: true },
      { id: 'rebirth_2', title: '转生商店', description: '使用转生点购买永久加成。', action: 'navigate', targetElement: 'rebirth_shop', canSkip: true },
    ],
  },
]

// ========== 核心函数 ==========

/**
 * 创建教程状态
 */
export function createTutorialState(): TutorialState {
  return {
    progress: new Map(),
    activeTutorial: null,
    totalCompleted: 0,
    totalSkipped: 0,
    rewardsCollected: 0,
    tutorialsDisabled: false,
  }
}

/**
 * 检查教程是否可以触发
 */
export function canTriggerTutorial(
  state: TutorialState,
  tutorialId: string,
  playerLevel: number,
  unlockedFeatures: string[] = []
): boolean {
  if (state.tutorialsDisabled) return false

  const tutorial = TUTORIALS.find(t => t.id === tutorialId)
  if (!tutorial) return false

  // 已完成或已跳过
  const progress = state.progress.get(tutorialId)
  if (progress && (progress.completed || progress.skipped)) return false

  // 检查前置教程
  for (const prereqId of tutorial.prerequisiteTutorials) {
    const prereqProgress = state.progress.get(prereqId)
    if (!prereqProgress || !prereqProgress.completed) return false
  }

  // 检查触发条件
  switch (tutorial.trigger) {
    case 'level':
      return playerLevel >= (tutorial.triggerValue || 1)
    case 'first_login':
      return true
    case 'unlock_feature':
      return tutorial.triggerFeature ? unlockedFeatures.includes(tutorial.triggerFeature) : false
    case 'manual':
      return true
  }
}

/**
 * 获取可触发的教程列表
 */
export function getTriggeredTutorials(
  state: TutorialState,
  playerLevel: number,
  unlockedFeatures: string[] = []
): Tutorial[] {
  return TUTORIALS.filter(t => canTriggerTutorial(state, t.id, playerLevel, unlockedFeatures))
}

/**
 * 开始教程
 */
export function startTutorial(
  state: TutorialState,
  tutorialId: string
): { success: boolean; reason?: string } {
  const tutorial = TUTORIALS.find(t => t.id === tutorialId)
  if (!tutorial) return { success: false, reason: '教程不存在' }

  if (state.activeTutorial) {
    return { success: false, reason: '已有教程进行中' }
  }

  const existing = state.progress.get(tutorialId)
  if (existing?.completed) return { success: false, reason: '教程已完成' }

  state.activeTutorial = tutorialId
  state.progress.set(tutorialId, {
    tutorialId,
    currentStep: 0,
    completed: false,
    skipped: false,
    startedAt: Date.now(),
    completedAt: 0,
    stepsCompleted: 0,
  })

  return { success: true }
}

/**
 * 完成当前步骤并前进
 */
export function advanceStep(
  state: TutorialState
): { success: boolean; stepReward?: TutorialReward; tutorialComplete?: boolean; reason?: string } {
  if (!state.activeTutorial) return { success: false, reason: '没有进行中的教程' }

  const tutorial = TUTORIALS.find(t => t.id === state.activeTutorial)
  const progress = state.progress.get(state.activeTutorial!)

  if (!tutorial || !progress) return { success: false, reason: '教程数据异常' }

  const currentStep = tutorial.steps[progress.currentStep]
  const stepReward = currentStep?.reward

  progress.stepsCompleted++
  progress.currentStep++

  // 检查是否完成所有步骤
  if (progress.currentStep >= tutorial.steps.length) {
    progress.completed = true
    progress.completedAt = Date.now()
    state.totalCompleted++
    state.activeTutorial = null

    return { success: true, stepReward, tutorialComplete: true }
  }

  return { success: true, stepReward, tutorialComplete: false }
}

/**
 * 跳过当前教程
 */
export function skipTutorial(state: TutorialState): boolean {
  if (!state.activeTutorial) return false

  const progress = state.progress.get(state.activeTutorial)
  if (!progress) return false

  progress.skipped = true
  progress.completedAt = Date.now()
  state.totalSkipped++
  state.activeTutorial = null

  return true
}

/**
 * 重播教程
 */
export function replayTutorial(
  state: TutorialState,
  tutorialId: string
): { success: boolean; reason?: string } {
  const tutorial = TUTORIALS.find(t => t.id === tutorialId)
  if (!tutorial) return { success: false, reason: '教程不存在' }

  if (state.activeTutorial) return { success: false, reason: '已有教程进行中' }

  state.activeTutorial = tutorialId
  state.progress.set(tutorialId, {
    tutorialId,
    currentStep: 0,
    completed: false,
    skipped: false,
    startedAt: Date.now(),
    completedAt: 0,
    stepsCompleted: 0,
  })

  return { success: true }
}

/**
 * 获取当前步骤
 */
export function getCurrentStep(state: TutorialState): TutorialStep | null {
  if (!state.activeTutorial) return null

  const tutorial = TUTORIALS.find(t => t.id === state.activeTutorial)
  const progress = state.progress.get(state.activeTutorial!)

  if (!tutorial || !progress) return null
  if (progress.currentStep >= tutorial.steps.length) return null

  return tutorial.steps[progress.currentStep]
}

/**
 * 获取教程完成进度
 */
export function getTutorialCompletionRate(state: TutorialState): number {
  if (TUTORIALS.length === 0) return 100
  return Math.round((state.totalCompleted / TUTORIALS.length) * 100)
}

/**
 * 按分类获取教程
 */
export function getTutorialsByCategory(category: TutorialCategory): Tutorial[] {
  return TUTORIALS.filter(t => t.category === category)
}

/**
 * 获取教程统计
 */
export function getTutorialStats(state: TutorialState): {
  total: number
  completed: number
  skipped: number
  inProgress: number
  completionRate: number
  byCategory: Record<TutorialCategory, { total: number; completed: number }>
} {
  const byCategory: Record<TutorialCategory, { total: number; completed: number }> = {
    '新手': { total: 0, completed: 0 },
    '进阶': { total: 0, completed: 0 },
    '高级': { total: 0, completed: 0 },
  }

  for (const tut of TUTORIALS) {
    byCategory[tut.category].total++
    const progress = state.progress.get(tut.id)
    if (progress?.completed) byCategory[tut.category].completed++
  }

  return {
    total: TUTORIALS.length,
    completed: state.totalCompleted,
    skipped: state.totalSkipped,
    inProgress: state.activeTutorial ? 1 : 0,
    completionRate: getTutorialCompletionRate(state),
    byCategory,
  }
}

/**
 * 导出教程状态
 */
export function exportTutorialState(state: TutorialState): any {
  return {
    progress: Array.from(state.progress.entries()),
    activeTutorial: state.activeTutorial,
    totalCompleted: state.totalCompleted,
    totalSkipped: state.totalSkipped,
    rewardsCollected: state.rewardsCollected,
    tutorialsDisabled: state.tutorialsDisabled,
  }
}

/**
 * 导入教程状态
 */
export function importTutorialState(data: any): TutorialState {
  return {
    progress: new Map(data.progress),
    activeTutorial: data.activeTutorial,
    totalCompleted: data.totalCompleted,
    totalSkipped: data.totalSkipped,
    rewardsCollected: data.rewardsCollected,
    tutorialsDisabled: data.tutorialsDisabled,
  }
}
