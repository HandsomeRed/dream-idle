/**
 * v0.40 限时活动系统
 * 
 * 功能：
 * - 多种活动类型（登录/累计/挑战/兑换）
 * - 活动时间管理
 * - 活动任务系统
 * - 活动奖励领取
 * - 活动积分/货币
 * - 活动商店
 */

export interface ActivityType {
  id: string;
  name: string;
  description: string;
  icon: string;
  startTime: number;
  endTime: number;
  type: 'login' | 'cumulative' | 'challenge' | 'exchange' | 'ranking';
  tasks: ActivityTask[];
  currency?: {
    name: string;
    icon: string;
  };
  shop?: ActivityShopItem[];
}

export interface ActivityTask {
  id: string;
  name: string;
  description: string;
  type: 'login' | 'battle' | 'win' | 'spend' | 'level_up' | 'pet_evolution' | 'tower_floor';
  target: number;
  reward: ActivityReward;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface ActivityReward {
  type: 'gold' | 'diamond' | 'item' | 'currency';
  gold?: number;
  diamond?: number;
  item?: {
    id: string;
    name: string;
    quantity: number;
  };
  currency?: number; // 活动货币
}

export interface ActivityShopItem {
  id: string;
  name: string;
  description: string;
  price: number; // 活动货币价格
  currency: string; // 活动货币 ID
  item: {
    id: string;
    name: string;
    quantity: number;
  };
  limit?: number; // 限购数量
  purchased: number; // 已购买数量
}

export interface ActivityProgress {
  activityId: string;
  tasks: {
    taskId: string;
    progress: number;
    completed: boolean;
    claimed: boolean;
  }[];
  currency: Record<string, number>; // 活动货币
  shopPurchases: Record<string, number>; // 商店购买记录
}

export interface ActivitySystemState {
  activeActivities: string[]; // 当前激活的活动 ID
  progress: ActivityProgress[];
  totalEventsParticipated: number;
}

/**
 * 活动配置示例
 */
export const ACTIVITIES: ActivityType[] = [
  {
    id: 'new-year-2026',
    name: '新年庆典',
    description: '庆祝 2026 新年，参与活动赢取丰厚奖励！',
    icon: '🎉',
    startTime: new Date('2026-01-01').getTime(),
    endTime: new Date('2026-01-15').getTime(),
    type: 'cumulative',
    currency: { name: '庆典币', icon: '🪙' },
    tasks: [
      {
        id: 'login-7days',
        name: '连续登录 7 天',
        description: '活动期间累计登录 7 天',
        type: 'login',
        target: 7,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { type: 'diamond', diamond: 500 }
      },
      {
        id: 'battle-100',
        name: '战斗达人',
        description: '完成 100 次战斗',
        type: 'battle',
        target: 100,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { type: 'currency', currency: 100 }
      },
      {
        id: 'win-50',
        name: '常胜将军',
        description: '获得 50 场胜利',
        type: 'win',
        target: 50,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { type: 'currency', currency: 150 }
      },
      {
        id: 'tower-50',
        name: '爬塔高手',
        description: '爬塔达到 50 层',
        type: 'tower_floor',
        target: 50,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { type: 'item', item: { id: 'legendary-fragment', name: '传说碎片', quantity: 10 } }
      }
    ],
    shop: [
      {
        id: 'shop-1',
        name: '史诗碎片',
        description: '用于合成史诗宠物',
        price: 50,
        currency: '庆典币',
        item: { id: 'epic-fragment', name: '史诗碎片', quantity: 5 },
        limit: 10,
        purchased: 0
      },
      {
        id: 'shop-2',
        name: '传说碎片',
        description: '用于合成传说宠物',
        price: 100,
        currency: '庆典币',
        item: { id: 'legendary-fragment', name: '传说碎片', quantity: 5 },
        limit: 5,
        purchased: 0
      },
      {
        id: 'shop-3',
        name: '钻石',
        description: '珍贵货币',
        price: 20,
        currency: '庆典币',
        item: { id: 'diamond', name: '钻石', quantity: 50 },
        limit: 20,
        purchased: 0
      },
      {
        id: 'shop-4',
        name: '进化石',
        description: '宠物进化材料',
        price: 30,
        currency: '庆典币',
        item: { id: 'evolution-stone', name: '进化石', quantity: 5 },
        limit: 10,
        purchased: 0
      }
    ]
  },
  {
    id: 'spring-festival-2026',
    name: '春节活动',
    description: '欢度春节，红包送不停！',
    icon: '🧧',
    startTime: new Date('2026-02-10').getTime(),
    endTime: new Date('2026-02-25').getTime(),
    type: 'login',
    currency: { name: '红包', icon: '🧧' },
    tasks: [
      {
        id: 'sf-login-1',
        name: '初一登录',
        description: '春节期间登录游戏',
        type: 'login',
        target: 1,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { type: 'currency', currency: 100 }
      },
      {
        id: 'sf-battle-200',
        name: '春节战斗',
        description: '完成 200 次战斗',
        type: 'battle',
        target: 200,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { type: 'currency', currency: 200 }
      }
    ],
    shop: [
      {
        id: 'sf-shop-1',
        name: '限定皮肤',
        description: '春节限定角色皮肤',
        price: 500,
        currency: '红包',
        item: { id: 'spring-skin', name: '春节皮肤', quantity: 1 },
        limit: 1,
        purchased: 0
      }
    ]
  },
  {
    id: 'anniversary-2026',
    name: '周年庆典',
    description: '游戏一周年，感谢有你！',
    icon: '🎂',
    startTime: new Date('2026-03-15').getTime(),
    endTime: new Date('2026-03-30').getTime(),
    type: 'challenge',
    currency: { name: '庆典券', icon: '🎫' },
    tasks: [
      {
        id: 'ann-level-50',
        name: '等级突破',
        description: '角色达到 50 级',
        type: 'level_up',
        target: 50,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { type: 'diamond', diamond: 1000 }
      },
      {
        id: 'ann-evolution',
        name: '宠物进化',
        description: '完成 1 次宠物进化',
        type: 'pet_evolution',
        target: 1,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { type: 'currency', currency: 500 }
      }
    ],
    shop: [
      {
        id: 'ann-shop-1',
        name: '周年限定称号',
        description: '一周年纪念称号',
        price: 1000,
        currency: '庆典券',
        item: { id: 'anniversary-title', name: '一周年', quantity: 1 },
        limit: 1,
        purchased: 0
      }
    ]
  }
];

/**
 * 初始化活动系统状态
 */
export function initializeActivitySystemState(): ActivitySystemState {
  return {
    activeActivities: [],
    progress: [],
    totalEventsParticipated: 0
  };
}

/**
 * 检查活动是否在进行中
 */
export function isActivityActive(activity: ActivityType, currentTime: number = Date.now()): boolean {
  return currentTime >= activity.startTime && currentTime <= activity.endTime;
}

/**
 * 获取正在进行的活动
 */
export function getActiveActivities(currentTime: number = Date.now()): ActivityType[] {
  return ACTIVITIES.filter(activity => isActivityActive(activity, currentTime));
}

/**
 * 获取活动剩余时间（毫秒）
 */
export function getActivityRemainingTime(activity: ActivityType, currentTime: number = Date.now()): number {
  return activity.endTime - currentTime;
}

/**
 * 获取活动剩余时间文本
 */
export function getActivityRemainingText(activity: ActivityType, currentTime: number = Date.now()): string {
  const remaining = getActivityRemainingTime(activity, currentTime);
  if (remaining <= 0) return '已结束';

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `剩余${days}天${hours}小时`;
  }
  return `剩余${hours}小时`;
}

/**
 * 参与活动
 */
export function joinActivity(
  state: ActivitySystemState,
  activityId: string
): ActivitySystemState {
  if (state.activeActivities.includes(activityId)) {
    return state; // 已参与
  }

  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) {
    return state;
  }

  // 初始化活动进度
  const progress: ActivityProgress = {
    activityId,
    tasks: activity.tasks.map(task => ({
      taskId: task.id,
      progress: 0,
      completed: false,
      claimed: false
    })),
    currency: {},
    shopPurchases: {}
  };

  // 初始化活动货币
  if (activity.currency) {
    progress.currency[activity.currency.name] = 0;
  }

  return {
    ...state,
    activeActivities: [...state.activeActivities, activityId],
    progress: [...state.progress, progress],
    totalEventsParticipated: state.totalEventsParticipated + 1
  };
}

/**
 * 更新活动任务进度
 */
export function updateActivityTaskProgress(
  state: ActivitySystemState,
  activityId: string,
  taskType: ActivityTask['type'],
  amount: number
): ActivitySystemState {
  const progressIndex = state.progress.findIndex(p => p.activityId === activityId);
  if (progressIndex === -1) return state;

  const progress = state.progress[progressIndex];
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) return state;

  const updatedTasks = progress.tasks.map(taskProgress => {
    const task = activity.tasks.find(t => t.id === taskProgress.taskId);
    if (!task || task.type !== taskType) return taskProgress;
    if (taskProgress.completed) return taskProgress;

    const newProgress = Math.min(task.target, taskProgress.progress + amount);
    const completed = newProgress >= task.target;

    return {
      ...taskProgress,
      progress: newProgress,
      completed
    };
  });

  const updatedProgress = { ...progress, tasks: updatedTasks };
  const updatedProgressList = [...state.progress];
  updatedProgressList[progressIndex] = updatedProgress;

  return {
    ...state,
    progress: updatedProgressList
  };
}

/**
 * 领取活动任务奖励
 */
export function claimActivityReward(
  state: ActivitySystemState,
  activityId: string,
  taskId: string
): {
  success: boolean;
  reason?: string;
  newState: ActivitySystemState;
  reward?: ActivityReward;
} {
  const progressIndex = state.progress.findIndex(p => p.activityId === activityId);
  if (progressIndex === -1) {
    return { success: false, reason: '未参与活动', newState: state };
  }

  const progress = state.progress[progressIndex];
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) {
    return { success: false, reason: '活动不存在', newState: state };
  }

  const taskProgress = progress.tasks.find(t => t.taskId === taskId);
  if (!taskProgress) {
    return { success: false, reason: '任务不存在', newState: state };
  }

  if (!taskProgress.completed) {
    return { success: false, reason: '任务未完成', newState: state };
  }

  if (taskProgress.claimed) {
    return { success: false, reason: '奖励已领取', newState: state };
  }

  const task = activity.tasks.find(t => t.id === taskId);
  if (!task) {
    return { success: false, reason: '任务配置错误', newState: state };
  }

  // 标记为已领取
  const updatedTasks = progress.tasks.map(t =>
    t.taskId === taskId ? { ...t, claimed: true } : t
  );

  // 发放奖励
  const updatedProgress = { ...progress, tasks: updatedTasks };

  // 如果是货币奖励，添加到活动货币
  if (task.reward.type === 'currency' && activity.currency) {
    const currencyName = activity.currency.name;
    updatedProgress.currency[currencyName] = (updatedProgress.currency[currencyName] || 0) + (task.reward.currency || 0);
  }

  const updatedProgressList = [...state.progress];
  updatedProgressList[progressIndex] = updatedProgress;

  return {
    success: true,
    newState: {
      ...state,
      progress: updatedProgressList
    },
    reward: task.reward
  };
}

/**
 * 购买活动商店物品
 */
export function purchaseActivityItem(
  state: ActivitySystemState,
  activityId: string,
  shopItemId: string
): {
  success: boolean;
  reason?: string;
  newState: ActivitySystemState;
  item?: ActivityShopItem['item'];
} {
  const progressIndex = state.progress.findIndex(p => p.activityId === activityId);
  if (progressIndex === -1) {
    return { success: false, reason: '未参与活动', newState: state };
  }

  const progress = state.progress[progressIndex];
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity || !activity.shop) {
    return { success: false, reason: '活动商店不存在', newState: state };
  }

  const shopItem = activity.shop.find(item => item.id === shopItemId);
  if (!shopItem) {
    return { success: false, reason: '商品不存在', newState: state };
  }

  // 检查限购
  const purchased = progress.shopPurchases[shopItemId] || 0;
  if (shopItem.limit && purchased >= shopItem.limit) {
    return { success: false, reason: '已达购买上限', newState: state };
  }

  // 检查货币
  const currencyName = shopItem.currency;
  const ownedCurrency = progress.currency[currencyName] || 0;
  if (ownedCurrency < shopItem.price) {
    return { success: false, reason: `${currencyName}不足`, newState: state };
  }

  // 扣除货币
  const updatedCurrency = { ...progress.currency };
  updatedCurrency[currencyName] = ownedCurrency - shopItem.price;

  // 更新购买记录
  const updatedShopPurchases = { ...progress.shopPurchases };
  updatedShopPurchases[shopItemId] = purchased + 1;

  const updatedProgress = {
    ...progress,
    currency: updatedCurrency,
    shopPurchases: updatedShopPurchases
  };

  const updatedProgressList = [...state.progress];
  updatedProgressList[progressIndex] = updatedProgress;

  return {
    success: true,
    newState: {
      ...state,
      progress: updatedProgressList
    },
    item: shopItem.item
  };
}

/**
 * 获取活动任务进度
 */
export function getActivityTaskProgress(
  state: ActivitySystemState,
  activityId: string,
  taskId: string
): { progress: number; target: number; completed: boolean; claimed: boolean } | null {
  const progress = state.progress.find(p => p.activityId === activityId);
  if (!progress) return null;

  const taskProgress = progress.tasks.find(t => t.taskId === taskId);
  if (!taskProgress) return null;

  const activity = ACTIVITIES.find(a => a.id === activityId);
  const task = activity?.tasks.find(t => t.id === taskId);

  return {
    progress: taskProgress.progress,
    target: task?.target || 0,
    completed: taskProgress.completed,
    claimed: taskProgress.claimed
  };
}

/**
 * 获取活动货币数量
 */
export function getActivityCurrency(
  state: ActivitySystemState,
  activityId: string,
  currencyName: string
): number {
  const progress = state.progress.find(p => p.activityId === activityId);
  if (!progress) return 0;

  return progress.currency[currencyName] || 0;
}

/**
 * 保存活动系统状态到 localStorage
 */
export function saveActivitySystemState(state: ActivitySystemState): void {
  localStorage.setItem('dream-idle-activity-system', JSON.stringify(state));
}

/**
 * 从 localStorage 加载活动系统状态
 */
export function loadActivitySystemState(): ActivitySystemState {
  const saved = localStorage.getItem('dream-idle-activity-system');
  if (saved) {
    return JSON.parse(saved);
  }
  return initializeActivitySystemState();
}
