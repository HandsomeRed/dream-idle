/**
 * v0.86 科举考试系统 (Imperial Examination System)
 * 每日科举考试，答题获得经验、金币、状元称号奖励
 */

export interface ExamQuestion {
  id: string;
  category: QuestionCategory;
  difficulty: ExamDifficulty;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3 index
  expReward: number;
  goldReward: number;
}

export interface ExamSession {
  id: string;
  startTime: number;
  questions: ExamQuestion[];
  currentQuestionIndex: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  status: ExamStatus;
  endTime?: number;
  totalReward: { exp: number; gold: number; titlePoints: number };
}

export type QuestionCategory = 'literature' | 'history' | 'math' | 'science' | 'philosophy' | 'arts';

export type ExamDifficulty = 'easy' | 'medium' | 'hard';

export type ExamStatus = 'not_started' | 'in_progress' | 'completed' | 'claimed';

export interface ExamConfig {
  dailyExams: number; // 每日考试次数
  questionsPerExam: number; // 每题考试题目数
  timeLimitPerQuestion: number; // 每题限时 (秒)
  difficultyRates: Record<ExamDifficulty, number>;
  baseRewards: Record<ExamDifficulty, { exp: number; gold: number }>;
  titleThresholds: Record<string, number>; // 称号所需积分
}

export const EXAM_CONFIG: ExamConfig = {
  dailyExams: 3,
  questionsPerExam: 10,
  timeLimitPerQuestion: 60,
  difficultyRates: {
    easy: 0.40,
    medium: 0.40,
    hard: 0.20,
  },
  baseRewards: {
    easy: { exp: 100, gold: 50 },
    medium: { exp: 250, gold: 120 },
    hard: { exp: 600, gold: 300 },
  },
  titleThresholds: {
    '童生': 0,
    '秀才': 100,
    '举人': 500,
    '进士': 1500,
    '状元': 5000,
  },
};

// 题库
const QUESTION_BANK: ExamQuestion[] = [
  // 文学类
  { id: 'q_lit_1', category: 'literature', difficulty: 'easy', question: '"床前明月光"的下一句是？', options: ['疑是地上霜', '举头望明月', '低头思故乡', '对影成三人'], correctAnswer: 0, expReward: 100, goldReward: 50 },
  { id: 'q_lit_2', category: 'literature', difficulty: 'medium', question: '"庐山真面目"出自哪首诗？', options: ['《题西林壁》', '《望庐山瀑布》', '《登鹳雀楼》', '《春望》'], correctAnswer: 0, expReward: 250, goldReward: 120 },
  { id: 'q_lit_3', category: 'literature', difficulty: 'hard', question: '"落霞与孤鹜齐飞"的作者是谁？', options: ['王勃', '李白', '杜甫', '白居易'], correctAnswer: 0, expReward: 600, goldReward: 300 },
  
  // 历史类
  { id: 'q_hist_1', category: 'history', difficulty: 'easy', question: '唐朝的开国皇帝是？', options: ['李渊', '李世民', '李治', '李隆基'], correctAnswer: 0, expReward: 100, goldReward: 50 },
  { id: 'q_hist_2', category: 'history', difficulty: 'medium', question: '"贞观之治"是哪位皇帝的年号？', options: ['唐太宗', '唐高宗', '唐玄宗', '唐高祖'], correctAnswer: 0, expReward: 250, goldReward: 120 },
  { id: 'q_hist_3', category: 'history', difficulty: 'hard', question: '科举制度创立于哪个朝代？', options: ['隋朝', '唐朝', '宋朝', '汉朝'], correctAnswer: 0, expReward: 600, goldReward: 300 },
  
  // 数学类
  { id: 'q_math_1', category: 'math', difficulty: 'easy', question: '1+2+3+...+100 等于？', options: ['5050', '5000', '5100', '4950'], correctAnswer: 0, expReward: 100, goldReward: 50 },
  { id: 'q_math_2', category: 'math', difficulty: 'medium', question: '勾股定理中，直角三角形三边关系是？', options: ['a²+b²=c²', 'a+b=c', 'a²-b²=c²', 'ab=c²'], correctAnswer: 0, expReward: 250, goldReward: 120 },
  { id: 'q_math_3', category: 'math', difficulty: 'hard', question: '《九章算术》成书于哪个朝代？', options: ['汉朝', '秦朝', '唐朝', '宋朝'], correctAnswer: 0, expReward: 600, goldReward: 300 },
  
  // 科学类
  { id: 'q_sci_1', category: 'science', difficulty: 'easy', question: '四大发明中，最早出现的是？', options: ['造纸术', '指南针', '火药', '印刷术'], correctAnswer: 0, expReward: 100, goldReward: 50 },
  { id: 'q_sci_2', category: 'science', difficulty: 'medium', question: '"天工开物"的作者是谁？', options: ['宋应星', '李时珍', '徐光启', '沈括'], correctAnswer: 0, expReward: 250, goldReward: 120 },
  { id: 'q_sci_3', category: 'science', difficulty: 'hard', question: '《梦溪笔谈》记载了哪个领域的成就？', options: ['科学技术', '医学', '农业', '军事'], correctAnswer: 0, expReward: 600, goldReward: 300 },
  
  // 哲学类
  { id: 'q_phi_1', category: 'philosophy', difficulty: 'easy', question: '孔子是哪个学派的创始人？', options: ['儒家', '道家', '法家', '墨家'], correctAnswer: 0, expReward: 100, goldReward: 50 },
  { id: 'q_phi_2', category: 'philosophy', difficulty: 'medium', question: '"道可道，非常道"出自？', options: ['《道德经》', '《庄子》', '《论语》', '《孟子》'], correctAnswer: 0, expReward: 250, goldReward: 120 },
  { id: 'q_phi_3', category: 'philosophy', difficulty: 'hard', question: '"性善论"是谁提出的？', options: ['孟子', '荀子', '孔子', '老子'], correctAnswer: 0, expReward: 600, goldReward: 300 },
  
  // 艺术类
  { id: 'q_art_1', category: 'arts', difficulty: 'easy', question: '"书圣"指的是谁？', options: ['王羲之', '颜真卿', '柳公权', '欧阳询'], correctAnswer: 0, expReward: 100, goldReward: 50 },
  { id: 'q_art_2', category: 'arts', difficulty: 'medium', question: '"清明上河图"描绘的是哪个城市？', options: ['汴京', '长安', '洛阳', '杭州'], correctAnswer: 0, expReward: 250, goldReward: 120 },
  { id: 'q_art_3', category: 'arts', difficulty: 'hard', question: '"吴带当风"形容的是哪位画家的风格？', options: ['吴道子', '吴镇', '吴历', '吴昌硕'], correctAnswer: 0, expReward: 600, goldReward: 300 },
];

// 生成随机难度
export function getRandomExamDifficulty(): ExamDifficulty {
  const rand = Math.random();
  let cumulative = 0;
  
  const difficulties: ExamDifficulty[] = ['easy', 'medium', 'hard'];
  
  for (const diff of difficulties) {
    cumulative += EXAM_CONFIG.difficultyRates[diff];
    if (rand <= cumulative) {
      return diff;
    }
  }
  
  return 'easy';
}

// 随机抽取题目
export function getRandomQuestions(count: number, category?: QuestionCategory): ExamQuestion[] {
  let pool = [...QUESTION_BANK];
  
  if (category) {
    pool = pool.filter(q => q.category === category);
  }
  
  const questions: ExamQuestion[] = [];
  const usedIds = new Set<string>();
  
  while (questions.length < count && pool.length > 0) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    const question = pool[randomIndex];
    
    if (!usedIds.has(question.id)) {
      questions.push({ ...question });
      usedIds.add(question.id);
    }
    
    pool.splice(randomIndex, 1);
  }
  
  return questions;
}

// 创建考试会话
export function createExamSession(): ExamSession {
  const questions = getRandomQuestions(EXAM_CONFIG.questionsPerExam);
  
  return {
    id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    questions,
    currentQuestionIndex: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    skippedAnswers: 0,
    status: 'not_started',
    totalReward: { exp: 0, gold: 0, titlePoints: 0 },
  };
}

// 开始考试
export function startExam(session: ExamSession): { success: boolean; message: string } {
  if (session.status !== 'not_started') {
    return { success: false, message: '考试状态不正确' };
  }
  
  session.status = 'in_progress';
  return { success: true, message: '考试开始！请认真答题！' };
}

// 回答问题
export function answerQuestion(session: ExamSession, answerIndex: number): { 
  success: boolean; 
  message: string; 
  correct?: boolean;
  questionResult?: { exp: number; gold: number };
} {
  if (session.status !== 'in_progress') {
    return { success: false, message: '考试未进行中' };
  }
  
  if (session.currentQuestionIndex >= session.questions.length) {
    return { success: false, message: '所有题目已答完' };
  }
  
  const currentQuestion = session.questions[session.currentQuestionIndex];
  const isCorrect = answerIndex === currentQuestion.correctAnswer;
  
  if (isCorrect) {
    session.correctAnswers++;
    session.totalReward.exp += currentQuestion.expReward;
    session.totalReward.gold += currentQuestion.goldReward;
    session.totalReward.titlePoints += 10;
    
    return { 
      success: true, 
      message: '回答正确！',
      correct: true,
      questionResult: { exp: currentQuestion.expReward, gold: currentQuestion.goldReward },
    };
  } else {
    session.wrongAnswers++;
    return { success: true, message: '回答错误！', correct: false };
  }
}

// 跳过题目
export function skipQuestion(session: ExamSession): { success: boolean; message: string } {
  if (session.status !== 'in_progress') {
    return { success: false, message: '考试未进行中' };
  }
  
  session.skippedAnswers++;
  session.currentQuestionIndex++;
  
  return { success: true, message: '已跳过此题' };
}

// 下一题
export function nextQuestion(session: ExamSession): { success: boolean; message: string; completed?: boolean } {
  if (session.status !== 'in_progress') {
    return { success: false, message: '考试未进行中' };
  }
  
  session.currentQuestionIndex++;
  
  if (session.currentQuestionIndex >= session.questions.length) {
    session.status = 'completed';
    session.endTime = Date.now();
    return { success: true, message: '考试完成！', completed: true };
  }
  
  return { success: true, message: '进入下一题' };
}

// 领取考试奖励
export function claimExamReward(session: ExamSession): { success: boolean; message: string; reward?: typeof session.totalReward } {
  if (session.status !== 'completed') {
    return { success: false, message: '考试未完成，无法领取奖励' };
  }
  
  const reward = { ...session.totalReward };
  session.status = 'claimed';
  
  return { success: true, message: '领取考试奖励成功！', reward };
}

// 获取当前题目
export function getCurrentQuestion(session: ExamSession): ExamQuestion | null {
  if (session.currentQuestionIndex >= session.questions.length) {
    return null;
  }
  return session.questions[session.currentQuestionIndex];
}

// 获取考试进度
export function getExamProgress(session: ExamSession): {
  current: number;
  total: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
} {
  return {
    current: session.currentQuestionIndex + 1,
    total: session.questions.length,
    percentage: Math.floor(((session.currentQuestionIndex) / session.questions.length) * 100),
    correct: session.correctAnswers,
    wrong: session.wrongAnswers,
    skipped: session.skippedAnswers,
  };
}

// 计算准确率
export function calculateAccuracy(session: ExamSession): number {
  const total = session.correctAnswers + session.wrongAnswers;
  if (total === 0) return 0;
  return Math.floor((session.correctAnswers / total) * 100);
}

// 获取称号
export function getTitle(titlePoints: number): string {
  const titles = Object.entries(EXAM_CONFIG.titleThresholds)
    .sort((a, b) => b[1] - a[1]);
  
  for (const [title, threshold] of titles) {
    if (titlePoints >= threshold) {
      return title;
    }
  }
  
  return '童生';
}

// 获取考试统计
export function getExamStats(sessions: ExamSession[]): {
  total: number;
  completed: number;
  claimed: number;
  totalCorrect: number;
  totalWrong: number;
  averageAccuracy: number;
  totalRewards: { exp: number; gold: number; titlePoints: number };
} {
  const stats = {
    total: sessions.length,
    completed: 0,
    claimed: 0,
    totalCorrect: 0,
    totalWrong: 0,
    averageAccuracy: 0,
    totalRewards: { exp: 0, gold: 0, titlePoints: 0 },
  };
  
  let accuracySum = 0;
  let accuracyCount = 0;
  
  sessions.forEach(session => {
    if (session.status === 'completed') stats.completed++;
    if (session.status === 'claimed') {
      stats.claimed++;
      stats.totalRewards.exp += session.totalReward.exp;
      stats.totalRewards.gold += session.totalReward.gold;
      stats.totalRewards.titlePoints += session.totalReward.titlePoints;
    }
    
    stats.totalCorrect += session.correctAnswers;
    stats.totalWrong += session.wrongAnswers;
    
    const accuracy = calculateAccuracy(session);
    if (accuracy > 0) {
      accuracySum += accuracy;
      accuracyCount++;
    }
  });
  
  stats.averageAccuracy = accuracyCount > 0 ? Math.floor(accuracySum / accuracyCount) : 0;
  
  return stats;
}

// 获取难度名称
export function getExamDifficultyName(difficulty: ExamDifficulty): string {
  const names: Record<ExamDifficulty, string> = {
    easy: '乡试',
    medium: '会试',
    hard: '殿试',
  };
  return names[difficulty];
}

// 获取类别名称
export function getQuestionCategoryName(category: QuestionCategory): string {
  const names: Record<QuestionCategory, string> = {
    literature: '文学',
    history: '历史',
    math: '算学',
    science: '格物',
    philosophy: '经义',
    arts: '艺术',
  };
  return names[category];
}
