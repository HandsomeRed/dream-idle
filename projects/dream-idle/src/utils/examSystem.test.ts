/**
 * v0.86 科举考试系统测试
 */

import {
  createExamSession,
  startExam,
  answerQuestion,
  skipQuestion,
  nextQuestion,
  claimExamReward,
  getCurrentQuestion,
  getExamProgress,
  calculateAccuracy,
  getTitle,
  getExamStats,
  getExamDifficultyName,
  getQuestionCategoryName,
  getRandomExamDifficulty,
  getRandomQuestions,
  EXAM_CONFIG,
  ExamSession,
} from './examSystem';

describe('v0.86 科举考试系统', () => {
  describe('考试会话创建', () => {
    it('应该创建考试会话', () => {
      const session = createExamSession();
      
      expect(session.id).toBeDefined();
      expect(session.questions.length).toBe(EXAM_CONFIG.questionsPerExam);
      expect(session.status).toBe('not_started');
      expect(session.currentQuestionIndex).toBe(0);
      expect(session.correctAnswers).toBe(0);
    });

    it('应该生成合理的题目数量', () => {
      const session = createExamSession();
      
      expect(session.questions.length).toBe(10);
    });

    it('应该包含题目信息', () => {
      const session = createExamSession();
      
      session.questions.forEach(q => {
        expect(q.id).toBeDefined();
        expect(q.question).toBeDefined();
        expect(q.options.length).toBe(4);
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswer).toBeLessThan(4);
      });
    });
  });

  describe('题目抽取', () => {
    it('应该随机抽取题目', () => {
      const questions1 = getRandomQuestions(5);
      const questions2 = getRandomQuestions(5);
      
      expect(questions1.length).toBe(5);
      expect(questions2.length).toBe(5);
    });

    it('应该按类别抽取题目', () => {
      const questions = getRandomQuestions(5, 'literature');
      
      expect(questions.every(q => q.category === 'literature')).toBe(true);
    });

    it('应该避免重复题目', () => {
      const questions = getRandomQuestions(10);
      const ids = new Set(questions.map(q => q.id));
      
      expect(ids.size).toBe(questions.length);
    });
  });

  describe('难度系统', () => {
    it('应该随机生成难度', () => {
      const difficulties = new Set();
      
      for (let i = 0; i < 100; i++) {
        difficulties.add(getRandomExamDifficulty());
      }
      
      expect(difficulties.has('easy')).toBe(true);
      expect(difficulties.has('medium')).toBe(true);
    });

    it('应该按概率分布生成难度', () => {
      const counts: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
      
      for (let i = 0; i < 1000; i++) {
        const diff = getRandomExamDifficulty();
        counts[diff]++;
      }
      
      expect(counts.easy).toBeGreaterThan(counts.hard);
      expect(counts.medium).toBeGreaterThan(counts.hard);
    });

    it('应该返回正确的难度名称', () => {
      expect(getExamDifficultyName('easy')).toBe('乡试');
      expect(getExamDifficultyName('medium')).toBe('会试');
      expect(getExamDifficultyName('hard')).toBe('殿试');
    });
  });

  describe('开始考试', () => {
    it('应该开始考试', () => {
      const session = createExamSession();
      
      const result = startExam(session);
      
      expect(result.success).toBe(true);
      expect(session.status).toBe('in_progress');
    });

    it('应该拒绝非未开始状态', () => {
      const session = createExamSession();
      session.status = 'completed';
      
      const result = startExam(session);
      
      expect(result.success).toBe(false);
    });
  });

  describe('回答问题', () => {
    it('应该回答正确', () => {
      const session = createExamSession();
      startExam(session);
      
      const currentQ = getCurrentQuestion(session);
      expect(currentQ).toBeTruthy();
      
      const result = answerQuestion(session, currentQ!.correctAnswer);
      
      expect(result.success).toBe(true);
      expect(result.correct).toBe(true);
      expect(session.correctAnswers).toBe(1);
    });

    it('应该回答错误', () => {
      const session = createExamSession();
      startExam(session);
      
      const currentQ = getCurrentQuestion(session);
      const wrongAnswer = (currentQ!.correctAnswer + 1) % 4;
      
      const result = answerQuestion(session, wrongAnswer);
      
      expect(result.success).toBe(true);
      expect(result.correct).toBe(false);
      expect(session.wrongAnswers).toBe(1);
    });

    it('应该累加奖励', () => {
      const session = createExamSession();
      startExam(session);
      
      const currentQ = getCurrentQuestion(session);
      answerQuestion(session, currentQ!.correctAnswer);
      
      expect(session.totalReward.exp).toBeGreaterThan(0);
      expect(session.totalReward.gold).toBeGreaterThan(0);
      expect(session.totalReward.titlePoints).toBeGreaterThan(0);
    });

    it('应该拒绝未开始的考试', () => {
      const session = createExamSession();
      
      const result = answerQuestion(session, 0);
      
      expect(result.success).toBe(false);
    });
  });

  describe('跳过题目', () => {
    it('应该跳过题目', () => {
      const session = createExamSession();
      startExam(session);
      
      const result = skipQuestion(session);
      
      expect(result.success).toBe(true);
      expect(session.skippedAnswers).toBe(1);
      expect(session.currentQuestionIndex).toBe(1);
    });

    it('应该拒绝未开始的考试', () => {
      const session = createExamSession();
      
      const result = skipQuestion(session);
      
      expect(result.success).toBe(false);
    });
  });

  describe('下一题', () => {
    it('应该进入下一题', () => {
      const session = createExamSession();
      startExam(session);
      answerQuestion(session, 0);
      
      const result = nextQuestion(session);
      
      expect(result.success).toBe(true);
      expect(session.currentQuestionIndex).toBe(1);
    });

    it('应该标记考试完成', () => {
      const session = createExamSession();
      startExam(session);
      
      // 答完所有题目
      for (let i = 0; i < EXAM_CONFIG.questionsPerExam; i++) {
        answerQuestion(session, 0);
        if (i < EXAM_CONFIG.questionsPerExam - 1) {
          nextQuestion(session);
        }
      }
      
      const result = nextQuestion(session);
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(true);
      expect(session.status).toBe('completed');
    });

    it('应该拒绝未开始的考试', () => {
      const session = createExamSession();
      
      const result = nextQuestion(session);
      
      expect(result.success).toBe(false);
    });
  });

  describe('领取奖励', () => {
    it('应该领取考试奖励', () => {
      const session = createExamSession();
      startExam(session);
      
      // 完成考试
      for (let i = 0; i < EXAM_CONFIG.questionsPerExam; i++) {
        answerQuestion(session, 0);
        nextQuestion(session);
      }
      
      const result = claimExamReward(session);
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(session.status).toBe('claimed');
    });

    it('应该拒绝未完成的考试', () => {
      const session = createExamSession();
      startExam(session);
      
      const result = claimExamReward(session);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未完成');
    });

    it('应该拒绝已领取的考试', () => {
      const session = createExamSession();
      startExam(session);
      
      // 完成并领取
      for (let i = 0; i < EXAM_CONFIG.questionsPerExam; i++) {
        answerQuestion(session, 0);
        if (i < EXAM_CONFIG.questionsPerExam - 1) {
          nextQuestion(session);
        }
      }
      claimExamReward(session);
      
      const result = claimExamReward(session);
      
      expect(result.success).toBe(false);
    });
  });

  describe('当前题目', () => {
    it('应该获取当前题目', () => {
      const session = createExamSession();
      startExam(session);
      
      const question = getCurrentQuestion(session);
      
      expect(question).toBeTruthy();
      expect(question!.id).toBeDefined();
    });

    it('应该返回 null 当题目已答完', () => {
      const session = createExamSession();
      startExam(session);
      session.currentQuestionIndex = EXAM_CONFIG.questionsPerExam;
      
      const question = getCurrentQuestion(session);
      
      expect(question).toBeNull();
    });
  });

  describe('考试进度', () => {
    it('应该获取考试进度', () => {
      const session = createExamSession();
      startExam(session);
      
      const progress = getExamProgress(session);
      
      expect(progress.current).toBe(1);
      expect(progress.total).toBe(EXAM_CONFIG.questionsPerExam);
      expect(progress.percentage).toBe(0);
    });

    it('应该计算正确进度', () => {
      const session = createExamSession();
      startExam(session);
      
      // 答对 3 题，答错 2 题
      for (let i = 0; i < 5; i++) {
        answerQuestion(session, i < 3 ? getCurrentQuestion(session)!.correctAnswer : 999);
        if (i < 4) nextQuestion(session);
      }
      
      const progress = getExamProgress(session);
      
      expect(progress.correct).toBe(3);
      expect(progress.wrong).toBe(2);
      expect(progress.skipped).toBe(0);
    });
  });

  describe('准确率计算', () => {
    it('应该计算准确率', () => {
      const session = createExamSession();
      session.correctAnswers = 8;
      session.wrongAnswers = 2;
      
      const accuracy = calculateAccuracy(session);
      
      expect(accuracy).toBe(80);
    });

    it('应该返回 0 当没有答题', () => {
      const session = createExamSession();
      
      const accuracy = calculateAccuracy(session);
      
      expect(accuracy).toBe(0);
    });
  });

  describe('称号系统', () => {
    it('应该根据积分获取称号', () => {
      expect(getTitle(0)).toBe('童生');
      expect(getTitle(50)).toBe('童生');
      expect(getTitle(100)).toBe('秀才');
      expect(getTitle(300)).toBe('秀才');
      expect(getTitle(500)).toBe('举人');
      expect(getTitle(1500)).toBe('进士');
      expect(getTitle(5000)).toBe('状元');
      expect(getTitle(10000)).toBe('状元');
    });
  });

  describe('考试统计', () => {
    it('应该统计考试数据', () => {
      const sessions: ExamSession[] = [
        { ...createExamSession(), status: 'claimed', correctAnswers: 8, wrongAnswers: 2, totalReward: { exp: 2000, gold: 1000, titlePoints: 80 } },
        { ...createExamSession(), status: 'claimed', correctAnswers: 6, wrongAnswers: 4, totalReward: { exp: 1500, gold: 750, titlePoints: 60 } },
        { ...createExamSession(), status: 'in_progress', correctAnswers: 3, wrongAnswers: 1 },
      ];
      
      const stats = getExamStats(sessions);
      
      expect(stats.total).toBe(3);
      expect(stats.claimed).toBe(2);
      expect(stats.totalCorrect).toBe(17);
      expect(stats.totalWrong).toBe(7);
      expect(stats.totalRewards.exp).toBe(3500);
      expect(stats.totalRewards.gold).toBe(1750);
    });

    it('应该计算平均准确率', () => {
      const sessions: ExamSession[] = [
        { ...createExamSession(), status: 'claimed', correctAnswers: 8, wrongAnswers: 2, totalReward: { exp: 0, gold: 0, titlePoints: 0 } },
        { ...createExamSession(), status: 'claimed', correctAnswers: 6, wrongAnswers: 4, totalReward: { exp: 0, gold: 0, titlePoints: 0 } },
      ];
      
      const stats = getExamStats(sessions);
      
      expect(stats.averageAccuracy).toBe(70); // (80 + 60) / 2
    });
  });

  describe('类别名称', () => {
    it('应该返回正确的类别名称', () => {
      expect(getQuestionCategoryName('literature')).toBe('文学');
      expect(getQuestionCategoryName('history')).toBe('历史');
      expect(getQuestionCategoryName('math')).toBe('算学');
      expect(getQuestionCategoryName('science')).toBe('格物');
      expect(getQuestionCategoryName('philosophy')).toBe('经义');
      expect(getQuestionCategoryName('arts')).toBe('艺术');
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的每日考试次数', () => {
      expect(EXAM_CONFIG.dailyExams).toBe(3);
    });

    it('应该配置正确的题目数量', () => {
      expect(EXAM_CONFIG.questionsPerExam).toBe(10);
    });

    it('应该配置正确的难度概率', () => {
      const rates = EXAM_CONFIG.difficultyRates;
      const total = Object.values(rates).reduce((sum, rate) => sum + rate, 0);
      
      expect(total).toBe(1);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的考试流程', () => {
      const session = createExamSession();
      
      // 1. 开始考试
      expect(startExam(session).success).toBe(true);
      expect(session.status).toBe('in_progress');
      
      // 2. 答题
      let correctCount = 0;
      for (let i = 0; i < EXAM_CONFIG.questionsPerExam; i++) {
        const currentQ = getCurrentQuestion(session);
        const answer = currentQ!.correctAnswer;
        const result = answerQuestion(session, answer);
        if (result.correct) correctCount++;
        
        if (i < EXAM_CONFIG.questionsPerExam - 1) {
          nextQuestion(session);
        }
      }
      
      // 3. 完成考试
      nextQuestion(session);
      expect(session.status).toBe('completed');
      
      // 4. 领取奖励
      const claimResult = claimExamReward(session);
      expect(claimResult.success).toBe(true);
      expect(claimResult.reward).toBeDefined();
      expect(session.status).toBe('claimed');
      
      // 5. 验证奖励
      expect(claimResult.reward!.exp).toBeGreaterThan(0);
      expect(claimResult.reward!.gold).toBeGreaterThan(0);
      expect(claimResult.reward!.titlePoints).toBeGreaterThan(0);
      
      // 6. 验证准确率
      const accuracy = calculateAccuracy(session);
      expect(accuracy).toBe(100); // 全对
    });
  });
});
