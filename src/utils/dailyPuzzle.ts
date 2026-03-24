// 每日谜题系统 - v0.65
// Daily Puzzle / 答题挑战

/**
 * 题目类型
 */
export type QuestionType = 'choice' | 'truefalse' | 'number';

/**
 * 题目分类
 */
export type QuestionCategory = 'lore' | 'math' | 'strategy' | 'trivia' | 'riddle';

/**
 * 题目难度
 */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

/**
 * 题目配置
 */
export interface QuestionConfig {
  id: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  question: string;
  /** 选项（choice 类型） */
  options?: string[];
  /** 正确答案（choice: 选项索引, truefalse: 'true'/'false', number: 数字字符串） */
  answer: string;
  /** 解释 */
  explanation: string;
  /** 奖励倍率 */
  rewardMultiplier?: number;
}

/**
 * 答题记录
 */
export interface AnswerRecord {
  questionId: string;
  playerAnswer: string;
  correct: boolean;
  timestamp: number;
  timeSpentMs: number;
}

/**
 * 每日谜题状态
 */
export interface PuzzleState {
  playerId: string;
  /** 今日题目ID列表 */
  todayQuestions: string[];
  /** 今日答题记录 */
  todayAnswers: AnswerRecord[];
  /** 今日得分 */
  todayScore: number;
  /** 今日最佳连续正确 */
  todayStreak: number;
  /** 当前连续正确 */
  currentStreak: number;
  /** 累计总分 */
  totalScore: number;
  /** 累计答对 */
  totalCorrect: number;
  /** 累计答题 */
  totalAnswered: number;
  /** 最佳连续正确 */
  bestStreak: number;
  /** 最后重置日期 */
  lastResetDate: string;
  /** 已领取奖励的分数阈值 */
  claimedRewards: number[];
}

// ==================== 题库 ====================

export const QUESTION_POOL: QuestionConfig[] = [
  // 游戏知识
  {
    id: 'lore_001', category: 'lore', difficulty: 'easy', type: 'choice',
    question: '梦幻放置中，哪个元素克制火元素？',
    options: ['水', '土', '风', '光'],
    answer: '0', explanation: '水克火，这是基本的元素克制关系。',
  },
  {
    id: 'lore_002', category: 'lore', difficulty: 'easy', type: 'truefalse',
    question: '传说品质的宠物比史诗品质的属性更高。',
    answer: 'true', explanation: '品质从低到高：普通→稀有→史诗→传说。',
  },
  {
    id: 'lore_003', category: 'lore', difficulty: 'medium', type: 'choice',
    question: '竞技场中，最高段位是什么？',
    options: ['钻石', '大师', '传说', '王者'],
    answer: '2', explanation: '传说是竞技场最高段位。',
  },
  {
    id: 'lore_004', category: 'lore', difficulty: 'medium', type: 'choice',
    question: '宠物系统中共有几种元素？',
    options: ['4种', '5种', '6种', '8种'],
    answer: '2', explanation: '6种元素：火、水、土、风、光、暗。',
  },
  {
    id: 'lore_005', category: 'lore', difficulty: 'hard', type: 'choice',
    question: '装备强化到多少级可以解锁第3个宝石槽？',
    options: ['+5', '+8', '+10', '+15'],
    answer: '2', explanation: '宝石槽在+0/+5/+10/+15解锁。',
  },
  // 数学题
  {
    id: 'math_001', category: 'math', difficulty: 'easy', type: 'number',
    question: '如果你有500金币，买了一件300金币的装备，还剩多少？',
    answer: '200', explanation: '500 - 300 = 200。',
  },
  {
    id: 'math_002', category: 'math', difficulty: 'easy', type: 'choice',
    question: '10连抽需要多少钻石？（单抽100钻石）',
    options: ['800', '900', '1000', '1100'],
    answer: '2', explanation: '10 × 100 = 1000钻石。',
  },
  {
    id: 'math_003', category: 'math', difficulty: 'medium', type: 'number',
    question: '攻击力100，暴击伤害150%，暴击时造成多少伤害？',
    answer: '150', explanation: '100 × 150% = 150。',
  },
  {
    id: 'math_004', category: 'math', difficulty: 'hard', type: 'number',
    question: '强化成功率80%，连续强化3次全部成功的概率是多少百分比？（取整）',
    answer: '51', explanation: '0.8 × 0.8 × 0.8 = 0.512 ≈ 51%。',
  },
  // 策略题
  {
    id: 'strat_001', category: 'strategy', difficulty: 'easy', type: 'choice',
    question: '面对火属性BOSS，应该优先使用哪个元素的队伍？',
    options: ['火', '水', '风', '光'],
    answer: '1', explanation: '水克火，使用水元素队伍效果最好。',
  },
  {
    id: 'strat_002', category: 'strategy', difficulty: 'medium', type: 'truefalse',
    question: '在爬塔中，优先升级防御比攻击更重要。',
    answer: 'false', explanation: '爬塔需要在限定层数内击败敌人，攻击通常更重要。',
  },
  {
    id: 'strat_003', category: 'strategy', difficulty: 'hard', type: 'choice',
    question: '资源有限时，以下哪种投资回报最高？',
    options: ['升级低等级角色', '强化已有装备', '抽取新英雄', '升级技能'],
    answer: '3', explanation: '技能升级通常提供最稳定的战力提升。',
  },
  // 趣味题
  {
    id: 'trivia_001', category: 'trivia', difficulty: 'easy', type: 'choice',
    question: '放置游戏的英文名称是？',
    options: ['Action Game', 'Idle Game', 'Puzzle Game', 'RPG'],
    answer: '1', explanation: 'Idle Game 就是放置游戏。',
  },
  {
    id: 'trivia_002', category: 'trivia', difficulty: 'medium', type: 'truefalse',
    question: '世界上第一款放置游戏是 Cookie Clicker。',
    answer: 'false', explanation: '虽然 Cookie Clicker 很知名，但放置游戏概念更早出现。',
  },
  // 谜语
  {
    id: 'riddle_001', category: 'riddle', difficulty: 'easy', type: 'choice',
    question: '什么东西越洗越脏？',
    options: ['衣服', '水', '碗', '手'],
    answer: '1', explanation: '水越洗越脏！经典谜语。',
  },
  {
    id: 'riddle_002', category: 'riddle', difficulty: 'medium', type: 'choice',
    question: '什么东西有头没有脚？',
    options: ['蛇', '蒜', '钉子', '以上都是'],
    answer: '3', explanation: '蛇、蒜、钉子都有头没有脚。',
  },
  {
    id: 'riddle_003', category: 'riddle', difficulty: 'hard', type: 'choice',
    question: '一个人走进了一个没有窗户的房间，里面很黑。他有一根火柴、一盏油灯、一根蜡烛和一堆柴火。他应该先点什么？',
    options: ['油灯', '蜡烛', '柴火', '火柴'],
    answer: '3', explanation: '当然是先点火柴！没有火柴什么都点不了。',
  },
];

// ==================== 奖励配置 ====================

export const DIFFICULTY_SCORES: Record<QuestionDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 40,
};

export const STREAK_BONUS: Record<number, number> = {
  3: 10,   // 3连对 +10
  5: 30,   // 5连对 +30
  8: 60,   // 8连对 +60
  10: 100, // 10连对 +100
};

export const SCORE_REWARDS: { threshold: number; rewards: { gold: number; diamond: number; exp: number } }[] = [
  { threshold: 30, rewards: { gold: 500, diamond: 5, exp: 200 } },
  { threshold: 60, rewards: { gold: 1000, diamond: 10, exp: 500 } },
  { threshold: 100, rewards: { gold: 2000, diamond: 20, exp: 1000 } },
  { threshold: 150, rewards: { gold: 5000, diamond: 50, exp: 2000 } },
  { threshold: 200, rewards: { gold: 10000, diamond: 100, exp: 5000 } },
];

export const DAILY_QUESTION_COUNT = 10;
export const TIME_LIMIT_MS = 30000; // 30秒/题
export const SPEED_BONUS_THRESHOLD_MS = 10000; // 10秒内答对额外加分

export const CATEGORY_NAMES: Record<QuestionCategory, string> = {
  lore: '游戏知识',
  math: '数学计算',
  strategy: '策略思考',
  trivia: '趣味百科',
  riddle: '谜语脑筋',
};

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 创建每日谜题状态
 */
export function createPuzzleState(playerId: string, now?: number): PuzzleState {
  const questions = selectDailyQuestions(DAILY_QUESTION_COUNT, now);
  return {
    playerId,
    todayQuestions: questions,
    todayAnswers: [],
    todayScore: 0,
    todayStreak: 0,
    currentStreak: 0,
    totalScore: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    bestStreak: 0,
    lastResetDate: getTodayStr(now),
    claimedRewards: [],
  };
}

/**
 * 选择每日题目（伪随机，同一天同一套题）
 */
export function selectDailyQuestions(count: number, now?: number): string[] {
  const dateStr = getTodayStr(now);
  // 用日期做种子的简单哈希
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = ((seed << 5) - seed + dateStr.charCodeAt(i)) | 0;
  }

  // Fisher-Yates shuffle with seeded random
  const pool = [...QUESTION_POOL];
  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length)).map(q => q.id);
}

/**
 * 获取题目配置
 */
export function getQuestion(id: string): QuestionConfig | undefined {
  return QUESTION_POOL.find(q => q.id === id);
}

/**
 * 检查是否需要每日重置
 */
export function needsDailyReset(state: PuzzleState, now?: number): boolean {
  return getTodayStr(now) !== state.lastResetDate;
}

/**
 * 每日重置
 */
export function resetDaily(state: PuzzleState, now?: number): PuzzleState {
  const questions = selectDailyQuestions(DAILY_QUESTION_COUNT, now);
  return {
    ...state,
    todayQuestions: questions,
    todayAnswers: [],
    todayScore: 0,
    todayStreak: 0,
    currentStreak: 0,
    lastResetDate: getTodayStr(now),
    claimedRewards: [],
  };
}

/**
 * 获取当前题目
 */
export function getCurrentQuestion(state: PuzzleState): QuestionConfig | null {
  const answeredCount = state.todayAnswers.length;
  if (answeredCount >= state.todayQuestions.length) return null;
  const questionId = state.todayQuestions[answeredCount];
  return getQuestion(questionId) ?? null;
}

/**
 * 获取剩余题目数
 */
export function getRemainingCount(state: PuzzleState): number {
  return Math.max(0, state.todayQuestions.length - state.todayAnswers.length);
}

/**
 * 提交答案
 */
export function submitAnswer(
  state: PuzzleState,
  answer: string,
  timeSpentMs: number,
  now?: number
): { state: PuzzleState; correct: boolean; score: number; streakBonus: number; speedBonus: number; explanation: string } {
  const question = getCurrentQuestion(state);
  if (!question) {
    return { state, correct: false, score: 0, streakBonus: 0, speedBonus: 0, explanation: '没有更多题目了' };
  }

  const correct = answer.trim() === question.answer;
  let score = 0;
  let streakBonus = 0;
  let speedBonus = 0;

  const newState = { ...state };

  if (correct) {
    // 基础分
    score = DIFFICULTY_SCORES[question.difficulty];
    if (question.rewardMultiplier) {
      score = Math.round(score * question.rewardMultiplier);
    }

    // 速度奖励
    if (timeSpentMs <= SPEED_BONUS_THRESHOLD_MS && timeSpentMs > 0) {
      speedBonus = Math.round(score * 0.5);
      score += speedBonus;
    }

    // 连续正确
    newState.currentStreak = state.currentStreak + 1;
    if (newState.currentStreak > newState.todayStreak) {
      newState.todayStreak = newState.currentStreak;
    }
    if (newState.currentStreak > newState.bestStreak) {
      newState.bestStreak = newState.currentStreak;
    }

    // 连续奖励
    if (STREAK_BONUS[newState.currentStreak]) {
      streakBonus = STREAK_BONUS[newState.currentStreak];
      score += streakBonus;
    }

    newState.totalCorrect++;
  } else {
    newState.currentStreak = 0;
  }

  // 记录
  const record: AnswerRecord = {
    questionId: question.id,
    playerAnswer: answer.trim(),
    correct,
    timestamp: now ?? Date.now(),
    timeSpentMs,
  };

  newState.todayAnswers = [...state.todayAnswers, record];
  newState.todayScore = state.todayScore + score;
  newState.totalScore = state.totalScore + score;
  newState.totalAnswered = state.totalAnswered + 1;

  return {
    state: newState,
    correct,
    score,
    streakBonus,
    speedBonus,
    explanation: question.explanation,
  };
}

/**
 * 获取可领取的分数奖励
 */
export function getClaimableRewards(state: PuzzleState): typeof SCORE_REWARDS {
  return SCORE_REWARDS.filter(
    r => state.todayScore >= r.threshold && !state.claimedRewards.includes(r.threshold)
  );
}

/**
 * 领取分数奖励
 */
export function claimScoreReward(
  state: PuzzleState,
  threshold: number
): { state: PuzzleState; success: boolean; rewards?: { gold: number; diamond: number; exp: number }; error?: string } {
  const reward = SCORE_REWARDS.find(r => r.threshold === threshold);
  if (!reward) return { state, success: false, error: '奖励不存在' };
  if (state.todayScore < threshold) return { state, success: false, error: '分数不足' };
  if (state.claimedRewards.includes(threshold)) return { state, success: false, error: '已领取' };

  return {
    state: {
      ...state,
      claimedRewards: [...state.claimedRewards, threshold],
    },
    success: true,
    rewards: reward.rewards,
  };
}

/**
 * 获取答题统计
 */
export function getPuzzleStats(state: PuzzleState): {
  todayScore: number;
  todayCorrect: number;
  todayTotal: number;
  todayAccuracy: number;
  todayStreak: number;
  remaining: number;
  totalScore: number;
  totalCorrect: number;
  totalAnswered: number;
  totalAccuracy: number;
  bestStreak: number;
  categoryBreakdown: Record<QuestionCategory, { correct: number; total: number }>;
} {
  const todayCorrect = state.todayAnswers.filter(a => a.correct).length;
  const todayTotal = state.todayAnswers.length;

  // 分类统计
  const categoryBreakdown: Record<QuestionCategory, { correct: number; total: number }> = {
    lore: { correct: 0, total: 0 },
    math: { correct: 0, total: 0 },
    strategy: { correct: 0, total: 0 },
    trivia: { correct: 0, total: 0 },
    riddle: { correct: 0, total: 0 },
  };
  for (const ans of state.todayAnswers) {
    const q = getQuestion(ans.questionId);
    if (q) {
      categoryBreakdown[q.category].total++;
      if (ans.correct) categoryBreakdown[q.category].correct++;
    }
  }

  return {
    todayScore: state.todayScore,
    todayCorrect,
    todayTotal,
    todayAccuracy: todayTotal > 0 ? Math.round((todayCorrect / todayTotal) * 100) : 0,
    todayStreak: state.todayStreak,
    remaining: getRemainingCount(state),
    totalScore: state.totalScore,
    totalCorrect: state.totalCorrect,
    totalAnswered: state.totalAnswered,
    totalAccuracy: state.totalAnswered > 0 ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0,
    bestStreak: state.bestStreak,
    categoryBreakdown,
  };
}

/**
 * 获取分类名称
 */
export function getCategoryName(category: QuestionCategory): string {
  return CATEGORY_NAMES[category];
}

/**
 * 导出数据
 */
export function exportPuzzleData(state: PuzzleState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importPuzzleData(json: string): PuzzleState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || typeof data.totalScore !== 'number') return null;
    return data as PuzzleState;
  } catch {
    return null;
  }
}
