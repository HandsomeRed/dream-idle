// 任务系统配置和类型定义

/**
 * 任务类型
 */
export type TaskType = 'daily' | 'weekly' | 'main' | 'achievement'

/**
 * 任务状态
 */
export type TaskStatus = 'locked' | 'available' | 'in-progress' | 'completed' | 'claimed'

/**
 * 任务目标类型
 */
export type TaskTargetType = 'battle' | 'level' | 'skill' | 'login' | 'offline'

/**
 * 任务目标
 */
export interface TaskObjective {
  type: TaskTargetType;
  description: string;
  current: number;
  required: number;
}

/**
 * 任务奖励
 */
export interface TaskReward {
  type: 'exp' | 'gold' | 'item' | 'currency';
  amount: number;
  itemId?: string;
  itemName?: string;
}

/**
 * 任务配置
 */
export interface TaskConfig {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  objective: TaskObjective;
  rewards: TaskReward[];
  prerequisite?: string; // 前置任务 ID
  expiresAt?: number; // 过期时间戳 (每日/每周任务)
  order: number;
}

/**
 * 每日任务配置
 */
export const DAILY_TASKS: Omit<TaskConfig, 'status' | 'objective' | 'order'>[] = [
  {
    id: 'daily_battle_5',
    title: '初出茅庐',
    description: '完成 5 次战斗',
    type: 'daily',
    rewards: [{ type: 'exp', amount: 100 }, { type: 'gold', amount: 500 }]
  },
  {
    id: 'daily_battle_10',
    title: '身经百战',
    description: '完成 10 次战斗',
    type: 'daily',
    rewards: [{ type: 'exp', amount: 200 }, { type: 'gold', amount: 1000 }]
  },
  {
    id: 'daily_skill_use',
    title: '技能大师',
    description: '使用技能 10 次',
    type: 'daily',
    rewards: [{ type: 'exp', amount: 150 }, { type: 'gold', amount: 750 }]
  },
  {
    id: 'daily_login',
    title: '每日签到',
    description: '登录游戏',
    type: 'daily',
    rewards: [{ type: 'exp', amount: 50 }, { type: 'gold', amount: 200 }]
  }
]

/**
 * 主线任务配置
 */
export const MAIN_TASKS: Omit<TaskConfig, 'status' | 'objective' | 'order'>[] = [
  {
    id: 'main_create_character',
    title: '初入江湖',
    description: '创建你的角色',
    type: 'main',
    rewards: [{ type: 'exp', amount: 200 }, { type: 'gold', amount: 1000 }]
  },
  {
    id: 'main_first_battle',
    title: '首战告捷',
    description: '赢得第一场战斗',
    type: 'main',
    prerequisite: 'main_create_character',
    rewards: [{ type: 'exp', amount: 300 }, { type: 'gold', amount: 1500 }]
  },
  {
    id: 'main_reach_level_5',
    title: '小有所成',
    description: '角色达到 5 级',
    type: 'main',
    prerequisite: 'main_first_battle',
    rewards: [{ type: 'exp', amount: 500 }, { type: 'gold', amount: 2500 }]
  },
  {
    id: 'main_reach_level_10',
    title: '声名鹊起',
    description: '角色达到 10 级',
    type: 'main',
    prerequisite: 'main_reach_level_5',
    rewards: [{ type: 'exp', amount: 1000 }, { type: 'gold', amount: 5000 }]
  },
  {
    id: 'main_use_skill',
    title: '技能初探',
    description: '使用一次门派技能',
    type: 'main',
    prerequisite: 'main_first_battle',
    rewards: [{ type: 'exp', amount: 400 }, { type: 'gold', amount: 2000 }]
  }
]

/**
 * 成就任务配置
 */
export const ACHIEVEMENT_TASKS: Omit<TaskConfig, 'status' | 'objective' | 'order'>[] = [
  {
    id: 'achieve_battle_100',
    title: '百战英雄',
    description: '累计完成 100 次战斗',
    type: 'achievement',
    rewards: [{ type: 'exp', amount: 2000 }, { type: 'gold', amount: 10000 }]
  },
  {
    id: 'achieve_reach_level_50',
    title: '一代宗师',
    description: '角色达到 50 级',
    type: 'achievement',
    rewards: [{ type: 'exp', amount: 5000 }, { type: 'gold', amount: 25000 }]
  },
  {
    id: 'achieve_crit_50',
    title: '会心一击',
    description: '累计造成 50 次暴击',
    type: 'achievement',
    rewards: [{ type: 'exp', amount: 1500 }, { type: 'gold', amount: 7500 }]
  }
]

/**
 * 初始化每日任务
 */
export function initializeDailyTasks(): TaskConfig[] {
  const now = Date.now()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  return DAILY_TASKS.map((task, index) => ({
    ...task,
    status: 'available',
    objective: getObjectiveForTask(task.id),
    expiresAt: tomorrow.getTime(),
    order: index
  }))
}

/**
 * 初始化主线任务
 */
export function initializeMainTasks(): TaskConfig[] {
  return MAIN_TASKS.map((task, index) => ({
    ...task,
    status: index === 0 ? 'available' : 'locked',
    objective: getObjectiveForTask(task.id),
    order: index
  }))
}

/**
 * 初始化成就任务
 */
export function initializeAchievementTasks(): TaskConfig[] {
  return ACHIEVEMENT_TASKS.map((task, index) => ({
    ...task,
    status: 'locked',
    objective: getObjectiveForTask(task.id),
    order: index
  }))
}

/**
 * 获取任务目标
 */
function getObjectiveForTask(taskId: string): TaskObjective {
  const objectives: Record<string, TaskObjective> = {
    'daily_battle_5': { type: 'battle', description: '完成战斗', current: 0, required: 5 },
    'daily_battle_10': { type: 'battle', description: '完成战斗', current: 0, required: 10 },
    'daily_skill_use': { type: 'skill', description: '使用技能', current: 0, required: 10 },
    'daily_login': { type: 'login', description: '登录游戏', current: 0, required: 1 },
    'main_create_character': { type: 'level', description: '创建角色', current: 0, required: 1 },
    'main_first_battle': { type: 'battle', description: '赢得战斗', current: 0, required: 1 },
    'main_reach_level_5': { type: 'level', description: '角色等级', current: 0, required: 5 },
    'main_reach_level_10': { type: 'level', description: '角色等级', current: 0, required: 10 },
    'main_use_skill': { type: 'skill', description: '使用技能', current: 0, required: 1 },
    'achieve_battle_100': { type: 'battle', description: '累计战斗', current: 0, required: 100 },
    'achieve_reach_level_50': { type: 'level', description: '角色等级', current: 0, required: 50 },
    'achieve_crit_50': { type: 'skill', description: '暴击次数', current: 0, required: 50 }
  }
  
  return objectives[taskId] || { type: 'battle', description: '完成任务', current: 0, required: 1 }
}

/**
 * 更新任务进度
 */
export function updateTaskProgress(task: TaskConfig, progress: number): TaskConfig {
  const newCurrent = Math.min(task.objective.required, task.objective.current + progress)
  const newStatus: TaskStatus = newCurrent >= task.objective.required 
    ? (task.status === 'claimed' ? 'claimed' : 'completed')
    : (newCurrent > 0 ? 'in-progress' : task.status)
  
  return {
    ...task,
    status: newStatus,
    objective: {
      ...task.objective,
      current: newCurrent
    }
  }
}

/**
 * 领取任务奖励
 */
export function claimTaskReward(task: TaskConfig): { task: TaskConfig; rewards: TaskReward[] } {
  if (task.status !== 'completed') {
    throw new Error(`Task ${task.id} is not completed yet`)
  }
  
  return {
    task: {
      ...task,
      status: 'claimed'
    },
    rewards: task.rewards
  }
}

/**
 * 检查任务是否解锁
 */
export function isTaskUnlocked(task: TaskConfig, completedTaskIds: string[]): boolean {
  if (!task.prerequisite) return true
  return completedTaskIds.indexOf(task.prerequisite) >= 0
}

/**
 * 更新所有相关任务
 */
export function updateTasksByType(
  tasks: TaskConfig[],
  targetType: TaskTargetType,
  progress: number,
  completedTaskIds: string[]
): TaskConfig[] {
  return tasks.map(task => {
    // 检查是否已领取
    if (task.status === 'claimed') return task
    
    // 检查是否锁定
    if (!isTaskUnlocked(task, completedTaskIds)) return task
    
    // 检查目标类型是否匹配
    if (task.objective.type !== targetType) return task
    
    // 更新进度
    return updateTaskProgress(task, progress)
  })
}

/**
 * 计算任务完成度百分比
 */
export function getTaskProgressPercent(task: TaskConfig): number {
  if (task.objective.required === 0) return 0
  return Math.floor((task.objective.current / task.objective.required) * 100)
}

/**
 * 获取任务状态标签
 */
export function getTaskStatusLabel(task: TaskConfig): string {
  const labels: Record<TaskStatus, string> = {
    'locked': '🔒 未解锁',
    'available': '✨ 可进行',
    'in-progress': '📋 进行中',
    'completed': '✅ 可领取',
    'claimed': '🎁 已领取'
  }
  return labels[task.status]
}
