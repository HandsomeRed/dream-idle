/**
 * v0.34 新手引导系统
 * 
 * 功能：
 * - 分步骤引导新手玩家熟悉游戏
 * - 引导内容：推图、宠物、阵容、爬塔、竞技场等核心玩法
 * - 引导进度保存
 * - 可跳过/重新触发引导
 */

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  triggerCondition: () => boolean;
  completeCondition: () => boolean;
  reward?: {
    gold?: number;
    diamond?: number;
    item?: string;
  };
}

export interface GuideProgress {
  currentStepId: string | null;
  completedSteps: string[];
  skippedSteps: string[];
  totalSteps: number;
  completedCount: number;
  isGuideEnabled: boolean;
}

/**
 * 新手引导步骤配置
 */
export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'step-1-create-character',
    title: '创建角色',
    description: '欢迎来到梦幻放置！首先，让我们创建你的角色。',
    triggerCondition: () => true, // 游戏开始即触发
    completeCondition: () => {
      // 检查角色是否已创建
      const player = localStorage.getItem('dream-idle-player');
      return !!player;
    },
    reward: { gold: 1000, diamond: 100 }
  },
  {
    id: 'step-2-first-battle',
    title: '首次战斗',
    description: '现在让我们体验一下战斗系统。战斗是自动进行的，你只需要观看即可！',
    triggerCondition: () => {
      const player = localStorage.getItem('dream-idle-player');
      return !!player;
    },
    completeCondition: () => {
      // 检查是否完成过至少一次战斗
      const stats = localStorage.getItem('dream-idle-stats');
      if (!stats) return false;
      const parsed = JSON.parse(stats);
      return (parsed.battlesWon || 0) > 0;
    },
    reward: { gold: 500 }
  },
  {
    id: 'step-3-level-1-clear',
    title: '通关第 1 关',
    description: '太棒了！现在尝试通关第 1 关，解锁更多功能。',
    triggerCondition: () => {
      const stats = localStorage.getItem('dream-idle-stats');
      if (!stats) return false;
      const parsed = JSON.parse(stats);
      return (parsed.battlesWon || 0) > 0;
    },
    completeCondition: () => {
      // 检查是否通过第 1 关
      const levels = localStorage.getItem('dream-idle-levels');
      if (!levels) return false;
      const parsed = JSON.parse(levels);
      return (parsed.maxLevel || 0) >= 1;
    },
    reward: { diamond: 50 }
  },
  {
    id: 'step-4-pet-gacha',
    title: '宠物召唤',
    description: '解锁宠物系统！使用免费召唤抽取你的第一只宠物。',
    triggerCondition: () => {
      const levels = localStorage.getItem('dream-idle-levels');
      if (!levels) return false;
      const parsed = JSON.parse(levels);
      return (parsed.maxLevel || 0) >= 1;
    },
    completeCondition: () => {
      // 检查是否拥有宠物
      const pets = localStorage.getItem('dream-idle-pets');
      if (!pets) return false;
      const parsed = JSON.parse(pets);
      return (parsed.collection || []).length > 0;
    },
    reward: { gold: 2000 }
  },
  {
    id: 'step-5-pet-level-up',
    title: '宠物升级',
    description: '为你的宠物提升等级，让它变得更强大！',
    triggerCondition: () => {
      const pets = localStorage.getItem('dream-idle-pets');
      if (!pets) return false;
      const parsed = JSON.parse(pets);
      return (parsed.collection || []).length > 0;
    },
    completeCondition: () => {
      // 检查是否有宠物等级>1
      const pets = localStorage.getItem('dream-idle-pets');
      if (!pets) return false;
      const parsed = JSON.parse(pets);
      const collection = parsed.collection || [];
      return collection.some((p: any) => p.level > 1);
    },
    reward: { diamond: 30 }
  },
  {
    id: 'step-6-formation',
    title: '阵容配置',
    description: '解锁阵容系统！配置你的角色和宠物，激活羁绊加成。',
    triggerCondition: () => {
      const pets = localStorage.getItem('dream-idle-pets');
      if (!pets) return false;
      const parsed = JSON.parse(pets);
      const collection = parsed.collection || [];
      return collection.some((p: any) => p.level > 1);
    },
    completeCondition: () => {
      // 检查是否配置了阵容
      const formations = localStorage.getItem('dream-idle-formations');
      if (!formations) return false;
      const parsed = JSON.parse(formations);
      return (parsed.formations || []).length > 0;
    },
    reward: { gold: 3000 }
  },
  {
    id: 'step-7-tower',
    title: '爬塔挑战',
    description: '解锁爬塔玩法！挑战更高楼层，获取丰厚奖励。',
    triggerCondition: () => {
      const formations = localStorage.getItem('dream-idle-formations');
      if (!formations) return false;
      const parsed = JSON.parse(formations);
      return (parsed.formations || []).length > 0;
    },
    completeCondition: () => {
      // 检查是否通过爬塔第 10 层
      const tower = localStorage.getItem('dream-idle-tower');
      if (!tower) return false;
      const parsed = JSON.parse(tower);
      return (parsed.maxFloor || 0) >= 10;
    },
    reward: { diamond: 100 }
  },
  {
    id: 'step-8-arena',
    title: '竞技场',
    description: '解锁竞技场！与其他玩家进行异步 PVP 对战。',
    triggerCondition: () => {
      const tower = localStorage.getItem('dream-idle-tower');
      if (!tower) return false;
      const parsed = JSON.parse(tower);
      return (parsed.maxFloor || 0) >= 10;
    },
    completeCondition: () => {
      // 检查是否进行过至少一次竞技场战斗
      const arena = localStorage.getItem('dream-idle-arena');
      if (!arena) return false;
      const parsed = JSON.parse(arena);
      return (parsed.battles || 0) > 0;
    },
    reward: { gold: 5000 }
  },
  {
    id: 'step-9-daily-quest',
    title: '每日任务',
    description: '解锁每日任务系统！完成任务获取活跃度奖励。',
    triggerCondition: () => {
      const arena = localStorage.getItem('dream-idle-arena');
      if (!arena) return false;
      const parsed = JSON.parse(arena);
      return (parsed.battles || 0) > 0;
    },
    completeCondition: () => {
      // 检查是否完成过至少一个任务
      const quests = localStorage.getItem('dream-idle-quests');
      if (!quests) return false;
      const parsed = JSON.parse(quests);
      return (parsed.completedCount || 0) > 0;
    },
    reward: { diamond: 50 }
  },
  {
    id: 'step-10-checkin',
    title: '每日签到',
    description: '别忘了每日签到！累计签到可获得丰厚奖励。',
    triggerCondition: () => {
      const quests = localStorage.getItem('dream-idle-quests');
      if (!quests) return false;
      const parsed = JSON.parse(quests);
      return (parsed.completedCount || 0) > 0;
    },
    completeCondition: () => {
      // 检查是否签到过
      const checkin = localStorage.getItem('dream-idle-checkin');
      if (!checkin) return false;
      const parsed = JSON.parse(checkin);
      return (parsed.totalDays || 0) > 0;
    },
    reward: { gold: 2000, diamond: 50 }
  }
];

/**
 * 获取新手引导进度
 */
export function getGuideProgress(): GuideProgress {
  const saved = localStorage.getItem('dream-idle-guide');
  if (saved) {
    return JSON.parse(saved);
  }
  
  return {
    currentStepId: GUIDE_STEPS[0]?.id || null,
    completedSteps: [],
    skippedSteps: [],
    totalSteps: GUIDE_STEPS.length,
    completedCount: 0,
    isGuideEnabled: true
  };
}

/**
 * 保存新手引导进度
 */
export function saveGuideProgress(progress: GuideProgress): void {
  localStorage.setItem('dream-idle-guide', JSON.stringify(progress));
}

/**
 * 检查是否应该触发引导
 */
export function shouldTriggerGuide(): GuideStep | null {
  const progress = getGuideProgress();
  
  if (!progress.isGuideEnabled) {
    return null;
  }
  
  // 找到下一个未完成的引导步骤
  for (const step of GUIDE_STEPS) {
    if (progress.completedSteps.includes(step.id)) {
      continue;
    }
    if (progress.skippedSteps.includes(step.id)) {
      continue;
    }
    
    // 检查触发条件
    if (step.triggerCondition()) {
      // 检查是否是当前步骤（按顺序）
      if (progress.currentStepId === step.id) {
        return step;
      }
    }
  }
  
  return null;
}

/**
 * 完成引导步骤
 */
export function completeGuideStep(stepId: string): { success: boolean; reward?: any } {
  const progress = getGuideProgress();
  const step = GUIDE_STEPS.find(s => s.id === stepId);
  
  if (!step) {
    return { success: false };
  }
  
  if (!step.completeCondition()) {
    return { success: false };
  }
  
  if (!progress.completedSteps.includes(stepId)) {
    progress.completedSteps.push(stepId);
    progress.completedCount = progress.completedSteps.length;
    
    // 设置下一个步骤
    const currentIndex = GUIDE_STEPS.findIndex(s => s.id === stepId);
    if (currentIndex < GUIDE_STEPS.length - 1) {
      progress.currentStepId = GUIDE_STEPS[currentIndex + 1].id;
    } else {
      progress.currentStepId = null; // 所有步骤完成
    }
    
    saveGuideProgress(progress);
    
    return { 
      success: true,
      reward: step.reward
    };
  }
  
  return { success: false };
}

/**
 * 跳过引导步骤
 */
export function skipGuideStep(stepId: string): void {
  const progress = getGuideProgress();
  
  if (!progress.skippedSteps.includes(stepId)) {
    progress.skippedSteps.push(stepId);
    
    // 设置下一个步骤
    const currentIndex = GUIDE_STEPS.findIndex(s => s.id === stepId);
    if (currentIndex < GUIDE_STEPS.length - 1) {
      progress.currentStepId = GUIDE_STEPS[currentIndex + 1].id;
    } else {
      progress.currentStepId = null;
    }
    
    saveGuideProgress(progress);
  }
}

/**
 * 禁用/启用引导
 */
export function toggleGuide(enabled: boolean): void {
  const progress = getGuideProgress();
  progress.isGuideEnabled = enabled;
  saveGuideProgress(progress);
}

/**
 * 重置引导进度（用于测试或重新体验）
 */
export function resetGuideProgress(): void {
  const progress: GuideProgress = {
    currentStepId: GUIDE_STEPS[0]?.id || null,
    completedSteps: [],
    skippedSteps: [],
    totalSteps: GUIDE_STEPS.length,
    completedCount: 0,
    isGuideEnabled: true
  };
  saveGuideProgress(progress);
}

/**
 * 获取引导完成百分比
 */
export function getGuideCompletionRate(): number {
  const progress = getGuideProgress();
  if (progress.totalSteps === 0) return 0;
  return Math.round((progress.completedCount / progress.totalSteps) * 100);
}

/**
 * 获取所有引导步骤的概要信息
 */
export function getGuideStepsSummary(): Array<{
  id: string;
  title: string;
  completed: boolean;
  skipped: boolean;
  reward?: GuideStep['reward'];
}> {
  const progress = getGuideProgress();
  
  return GUIDE_STEPS.map(step => ({
    id: step.id,
    title: step.title,
    completed: progress.completedSteps.includes(step.id),
    skipped: progress.skippedSteps.includes(step.id),
    reward: step.reward
  }));
}
