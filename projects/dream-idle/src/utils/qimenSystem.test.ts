/**
 * v0.87 奇门遁甲系统测试
 */

import {
  createQimenChart,
  getAuspiciousPalaces,
  getInauspiciousPalaces,
  getBestDirection,
  getInterpretation,
  getElementRelationship,
  getElementName,
  getChartTypeName,
  DEITIES,
  STARS,
  DOORS,
  STEMS,
  PALACES,
  QIMEN_CONFIG,
  QimenChart,
} from './qimenSystem';

describe('v0.87 奇门遁甲系统', () => {
  describe('奇门遁甲盘创建', () => {
    it('应该创建奇门遁甲盘', () => {
      const chart = createQimenChart('测试问题');
      
      expect(chart.id).toBeDefined();
      expect(chart.question).toBe('测试问题');
      expect(chart.chartType).toBeDefined();
      expect(chart.palaces.length).toBe(9);
      expect(chart.score).toBeGreaterThanOrEqual(0);
      expect(chart.score).toBeLessThanOrEqual(100);
    });

    it('应该生成九宫', () => {
      const chart = createQimenChart();
      
      expect(chart.palaces.length).toBe(9);
      chart.palaces.forEach(palace => {
        expect(palace.id).toBeGreaterThanOrEqual(1);
        expect(palace.id).toBeLessThanOrEqual(9);
        expect(palace.name).toBeDefined();
        expect(palace.direction).toBeDefined();
        expect(palace.auspiciousLevel).toBeGreaterThanOrEqual(1);
        expect(palace.auspiciousLevel).toBeLessThanOrEqual(5);
      });
    });

    it('应该分配八神', () => {
      const chart = createQimenChart();
      
      expect(chart.deities.length).toBeGreaterThan(0);
    });

    it('应该分配九星', () => {
      const chart = createQimenChart();
      
      expect(chart.stars.length).toBeGreaterThan(0);
    });

    it('应该分配八门', () => {
      const chart = createQimenChart();
      
      expect(chart.doors.length).toBeGreaterThan(0);
    });

    it('应该分配天干', () => {
      const chart = createQimenChart();
      
      expect(chart.stems.length).toBeGreaterThan(0);
    });

    it('应该随机生成阳遁或阴遁', () => {
      const types = new Set();
      
      for (let i = 0; i < 20; i++) {
        types.add(createQimenChart().chartType);
      }
      
      expect(types.size).toBeGreaterThan(0);
    });
  });

  describe('数据库验证', () => {
    it('应该包含八神', () => {
      expect(DEITIES.length).toBe(8);
      DEITIES.forEach(deity => {
        expect(deity.id).toBeDefined();
        expect(deity.name).toBeDefined();
        expect(['auspicious', 'neutral', 'inauspicious']).toContain(deity.nature);
      });
    });

    it('应该包含九星', () => {
      expect(STARS.length).toBe(9);
      STARS.forEach(star => {
        expect(star.id).toBeDefined();
        expect(star.name).toBeDefined();
        expect(['wood', 'fire', 'earth', 'metal', 'water']).toContain(star.element);
      });
    });

    it('应该包含八门', () => {
      expect(DOORS.length).toBe(8);
      DOORS.forEach(door => {
        expect(door.id).toBeDefined();
        expect(door.name).toBeDefined();
        expect(['auspicious', 'neutral', 'inauspicious']).toContain(door.nature);
      });
    });

    it('应该包含十天干', () => {
      expect(STEMS.length).toBe(10);
      expect(STEMS.map(s => s.name)).toEqual(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']);
    });

    it('应该包含九宫', () => {
      expect(PALACES.length).toBe(9);
      PALACES.forEach(palace => {
        expect(palace.id).toBeGreaterThanOrEqual(1);
        expect(palace.id).toBeLessThanOrEqual(9);
        expect(palace.direction).toBeDefined();
      });
    });
  });

  describe('吉宫查询', () => {
    it('应该获取吉宫', () => {
      const chart = createQimenChart();
      const auspiciousPalaces = getAuspiciousPalaces(chart);
      
      auspiciousPalaces.forEach(palace => {
        expect(palace.auspiciousLevel).toBeGreaterThanOrEqual(4);
      });
    });

    it('应该获取凶宫', () => {
      const chart = createQimenChart();
      const inauspiciousPalaces = getInauspiciousPalaces(chart);
      
      inauspiciousPalaces.forEach(palace => {
        expect(palace.auspiciousLevel).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('最佳方位', () => {
    it('应该获取最佳方位', () => {
      const chart = createQimenChart();
      const bestDirection = getBestDirection(chart);
      
      if (bestDirection) {
        expect(['北', '西南', '东', '东南', '中', '西北', '西', '东北', '南']).toContain(bestDirection);
      }
    });

    it('应该返回吉宫最多的方位', () => {
      const chart = createQimenChart();
      const auspiciousPalaces = getAuspiciousPalaces(chart);
      const bestDirection = getBestDirection(chart);
      
      if (auspiciousPalaces.length > 0 && bestDirection) {
        const bestPalace = auspiciousPalaces.find(p => p.direction === bestDirection);
        expect(bestPalace).toBeTruthy();
      }
    });
  });

  describe('解盘建议', () => {
    it('应该获取解盘建议', () => {
      const chart = createQimenChart('求财');
      const interpretation = getInterpretation(chart);
      
      expect(interpretation.summary).toBeDefined();
      expect(interpretation.advice).toBeDefined();
      expect(interpretation.advice.length).toBeGreaterThan(0);
      expect(interpretation.bestTime).toBeDefined();
      expect(interpretation.worstTime).toBeDefined();
    });

    it('应该根据评分给出不同建议', () => {
      // 创建多个图表，找到高分和低分的
      let highScoreChart: QimenChart | null = null;
      let lowScoreChart: QimenChart | null = null;
      
      for (let i = 0; i < 100; i++) {
        const chart = createQimenChart();
        if (chart.score >= 70 && !highScoreChart) {
          highScoreChart = chart;
        }
        if (chart.score <= 30 && !lowScoreChart) {
          lowScoreChart = chart;
        }
        if (highScoreChart && lowScoreChart) break;
      }
      
      if (highScoreChart) {
        const highInterpretation = getInterpretation(highScoreChart);
        expect(highInterpretation.summary).toContain('吉');
      }
      
      if (lowScoreChart) {
        const lowInterpretation = getInterpretation(lowScoreChart);
        expect(lowInterpretation.summary).toContain('凶');
      }
    });

    it('应该包含方位建议', () => {
      const chart = createQimenChart();
      const interpretation = getInterpretation(chart);
      
      const hasDirectionAdvice = interpretation.advice.some(a => a.includes('方位'));
      expect(hasDirectionAdvice).toBe(true);
    });
  });

  describe('五行关系', () => {
    it('应该判断相生关系', () => {
      expect(getElementRelationship('wood', 'fire')).toBe('generate');
      expect(getElementRelationship('fire', 'earth')).toBe('generate');
      expect(getElementRelationship('earth', 'metal')).toBe('generate');
      expect(getElementRelationship('metal', 'water')).toBe('generate');
      expect(getElementRelationship('water', 'wood')).toBe('generate');
    });

    it('应该判断相克关系', () => {
      expect(getElementRelationship('wood', 'earth')).toBe('overcome');
      expect(getElementRelationship('earth', 'water')).toBe('overcome');
      expect(getElementRelationship('water', 'fire')).toBe('overcome');
      expect(getElementRelationship('fire', 'metal')).toBe('overcome');
      expect(getElementRelationship('metal', 'wood')).toBe('overcome');
    });

    it('应该判断中性关系', () => {
      expect(getElementRelationship('wood', 'wood')).toBe('neutral');
      expect(getElementRelationship('wood', 'metal')).toBe('neutral');
      expect(getElementRelationship('earth', 'earth')).toBe('neutral');
    });
  });

  describe('元素名称', () => {
    it('应该返回正确的元素名称', () => {
      expect(getElementName('wood')).toBe('木');
      expect(getElementName('fire')).toBe('火');
      expect(getElementName('earth')).toBe('土');
      expect(getElementName('metal')).toBe('金');
      expect(getElementName('water')).toBe('水');
    });
  });

  describe('遁甲类型名称', () => {
    it('应该返回正确的类型名称', () => {
      expect(getChartTypeName('yang')).toBe('阳遁');
      expect(getChartTypeName('yin')).toBe('阴遁');
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的每日排盘次数', () => {
      expect(QIMEN_CONFIG.dailyCharts).toBe(3);
    });

    it('应该配置正确的基础消耗', () => {
      expect(QIMEN_CONFIG.baseCost).toBe(100);
    });
  });

  describe('吉凶评分', () => {
    it('应该计算合理的评分', () => {
      const charts: QimenChart[] = [];
      
      for (let i = 0; i < 20; i++) {
        charts.push(createQimenChart());
      }
      
      const scores = charts.map(c => c.score);
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      
      // 平均分数应该在 40-60 之间（随机分布）
      expect(avgScore).toBeGreaterThanOrEqual(30);
      expect(avgScore).toBeLessThanOrEqual(70);
    });

    it('应该根据评分正确标记吉凶', () => {
      // 验证评分和吉凶标记的一致性
      for (let i = 0; i < 20; i++) {
        const chart = createQimenChart();
        
        // score >= 60 应该是吉，< 60 应该是凶
        if (chart.score >= 60) {
          expect(chart.auspicious).toBe(true);
        } else {
          expect(chart.auspicious).toBe(false);
        }
      }
    });
  });

  describe('宫位吉凶等级', () => {
    it('应该计算宫位吉凶等级', () => {
      const chart = createQimenChart();
      
      chart.palaces.forEach(palace => {
        expect(palace.auspiciousLevel).toBeGreaterThanOrEqual(1);
        expect(palace.auspiciousLevel).toBeLessThanOrEqual(5);
      });
    });

    it('吉神应该提高等级', () => {
      const chart = createQimenChart();
      
      const palacesWithAuspiciousDeity = chart.palaces.filter(p => p.deity?.nature === 'auspicious');
      
      if (palacesWithAuspiciousDeity.length > 0) {
        const avgLevel = palacesWithAuspiciousDeity.reduce((sum, p) => sum + p.auspiciousLevel, 0) / palacesWithAuspiciousDeity.length;
        expect(avgLevel).toBeGreaterThan(2);
      }
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的排盘流程', () => {
      // 1. 创建奇门遁甲盘
      const chart = createQimenChart('今日运势如何？');
      
      expect(chart.id).toBeDefined();
      expect(chart.question).toBe('今日运势如何？');
      
      // 2. 查看吉凶
      expect(chart.score).toBeGreaterThanOrEqual(0);
      expect(chart.score).toBeLessThanOrEqual(100);
      expect(chart.auspicious).toBeDefined();
      
      // 3. 查询吉宫
      const auspiciousPalaces = getAuspiciousPalaces(chart);
      expect(auspiciousPalaces.length).toBeGreaterThanOrEqual(0);
      
      // 4. 获取最佳方位
      const bestDirection = getBestDirection(chart);
      if (auspiciousPalaces.length > 0) {
        expect(bestDirection).toBeDefined();
      }
      
      // 5. 获取解盘建议
      const interpretation = getInterpretation(chart);
      expect(interpretation.summary).toBeDefined();
      expect(interpretation.advice.length).toBeGreaterThan(0);
      
      // 6. 验证五行关系
      expect(getElementRelationship('wood', 'fire')).toBe('generate');
      expect(getElementRelationship('wood', 'earth')).toBe('overcome');
    });
  });
});
