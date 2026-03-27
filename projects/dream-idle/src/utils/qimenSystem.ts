/**
 * v0.87 奇门遁甲系统 (Qimen Dunjia System)
 * 奇门遁甲排盘、占卜、风水布局、吉凶预测
 */

export interface QimenChart {
  id: string;
  createTime: number;
  question: string; // 求测问题
  chartType: ChartType;
  palaces: Palace[]; // 九宫
  deities: Deity[]; // 八神
  stars: Star[]; // 九星
  doors: Door[]; // 八门
  stems: Stem[]; // 天干
  auspicious: boolean; // 是否吉利
  score: number; // 吉凶评分 0-100
}

export type ChartType = 'yang' | 'yin'; // 阳遁/阴遁

export interface Palace {
  id: number; // 1-9 宫位
  name: string; // 宫位名称
  direction: string; // 方位
  deity?: Deity;
  star?: Star;
  door?: Door;
  stem?: Stem;
  element: Element; // 五行
  auspiciousLevel: number; // 吉凶等级 1-5
}

export interface Deity {
  id: string;
  name: string;
  nature: 'auspicious' | 'neutral' | 'inauspicious';
  description: string;
}

export interface Star {
  id: string;
  name: string;
  nature: 'auspicious' | 'neutral' | 'inauspicious';
  element: Element;
  description: string;
}

export interface Door {
  id: string;
  name: string;
  nature: 'auspicious' | 'neutral' | 'inauspicious';
  description: string;
}

export interface Stem {
  id: string;
  name: string; // 甲乙丙丁戊己庚辛壬癸
  element: Element;
  yinYang: 'yin' | 'yang';
}

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface QimenConfig {
  dailyCharts: number; // 每日排盘次数
  baseCost: number; // 基础消耗
  interpretationCost: number; // 解盘消耗
}

export const QIMEN_CONFIG: QimenConfig = {
  dailyCharts: 3,
  baseCost: 100,
  interpretationCost: 50,
};

// 八神
export const DEITIES: Deity[] = [
  { id: 'd1', name: '值符', nature: 'auspicious', description: '最吉之神，百事皆宜' },
  { id: 'd2', name: '腾蛇', nature: 'inauspicious', description: '虚惊怪异，口舌是非' },
  { id: 'd3', name: '太阴', nature: 'auspicious', description: '阴私和合，谋事可成' },
  { id: 'd4', name: '六合', nature: 'auspicious', description: '和合之象，婚姻交易吉' },
  { id: 'd5', name: '白虎', nature: 'inauspicious', description: '凶灾血光，宜静不宜动' },
  { id: 'd6', name: '玄武', nature: 'inauspicious', description: '盗贼欺骗，防小人' },
  { id: 'd7', name: '九地', nature: 'neutral', description: '平稳保守，宜守不宜攻' },
  { id: 'd8', name: '九天', nature: 'auspicious', description: '高远之象，宜主动出击' },
];

// 九星
export const STARS: Star[] = [
  { id: 's1', name: '天蓬', nature: 'inauspicious', element: 'water', description: '大凶之星，破财损丁' },
  { id: 's2', name: '天任', nature: 'auspicious', element: 'earth', description: '吉星，贵人相助' },
  { id: 's3', name: '天冲', nature: 'neutral', element: 'wood', description: '中性，冲动行事' },
  { id: 's4', name: '天辅', nature: 'auspicious', element: 'wood', description: '文曲星，利考试文化' },
  { id: 's5', name: '天禽', nature: 'auspicious', element: 'earth', description: '大吉之星，百事皆宜' },
  { id: 's6', name: '天心', nature: 'auspicious', element: 'metal', description: '医星，利求医问药' },
  { id: 's7', name: '天柱', nature: 'inauspicious', element: 'metal', description: '破军星，口舌是非' },
  { id: 's8', name: '天芮', nature: 'inauspicious', element: 'earth', description: '病星，疾病灾祸' },
  { id: 's9', name: '天英', nature: 'neutral', element: 'fire', description: '火星，急躁冲动' },
];

// 八门
export const DOORS: Door[] = [
  { id: 'm1', name: '休门', nature: 'auspicious', description: '休息养生，利求见贵人' },
  { id: 'm2', name: '死门', nature: 'inauspicious', description: '大凶之门，百事不宜' },
  { id: 'm3', name: '伤门', nature: 'inauspicious', description: '受伤破财，宜静不宜动' },
  { id: 'm4', name: '杜门', nature: 'neutral', description: '阻塞不通，宜守不宜攻' },
  { id: 'm5', name: '开门', nature: 'auspicious', description: '大吉之门，开业求财吉' },
  { id: 'm6', name: '惊门', nature: 'inauspicious', description: '惊恐口舌，防是非' },
  { id: 'm7', name: '生门', nature: 'auspicious', description: '生意兴隆，求财大吉' },
  { id: 'm8', name: '景门', nature: 'neutral', description: '文书考试，利文化事' },
];

// 天干
export const STEMS: Stem[] = [
  { id: 'stem1', name: '甲', element: 'wood', yinYang: 'yang' },
  { id: 'stem2', name: '乙', element: 'wood', yinYang: 'yin' },
  { id: 'stem3', name: '丙', element: 'fire', yinYang: 'yang' },
  { id: 'stem4', name: '丁', element: 'fire', yinYang: 'yin' },
  { id: 'stem5', name: '戊', element: 'earth', yinYang: 'yang' },
  { id: 'stem6', name: '己', element: 'earth', yinYang: 'yin' },
  { id: 'stem7', name: '庚', element: 'metal', yinYang: 'yang' },
  { id: 'stem8', name: '辛', element: 'metal', yinYang: 'yin' },
  { id: 'stem9', name: '壬', element: 'water', yinYang: 'yang' },
  { id: 'stem10', name: '癸', element: 'water', yinYang: 'yin' },
];

// 九宫
export const PALACES = [
  { id: 1, name: '坎一宫', direction: '北', element: 'water' as Element },
  { id: 2, name: '坤二宫', direction: '西南', element: 'earth' as Element },
  { id: 3, name: '震三宫', direction: '东', element: 'wood' as Element },
  { id: 4, name: '巽四宫', direction: '东南', element: 'wood' as Element },
  { id: 5, name: '中五宫', direction: '中', element: 'earth' as Element },
  { id: 6, name: '乾六宫', direction: '西北', element: 'metal' as Element },
  { id: 7, name: '兑七宫', direction: '西', element: 'metal' as Element },
  { id: 8, name: '艮八宫', direction: '东北', element: 'earth' as Element },
  { id: 9, name: '离九宫', direction: '南', element: 'fire' as Element },
];

// 随机抽取
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 创建奇门遁甲盘
export function createQimenChart(question: string = ''): QimenChart {
  const chartType: ChartType = Math.random() > 0.5 ? 'yang' : 'yin';
  
  // 随机分配八神、九星、八门、天干到九宫
  const shuffledDeities = [...DEITIES].sort(() => Math.random() - 0.5);
  const shuffledStars = [...STARS].sort(() => Math.random() - 0.5);
  const shuffledDoors = [...DOORS].sort(() => Math.random() - 0.5);
  const shuffledStems = [...STEMS].sort(() => Math.random() - 0.5);
  
  const palaces: Palace[] = PALACES.map((p, index) => ({
    id: p.id,
    name: p.name,
    direction: p.direction,
    element: p.element,
    deity: shuffledDeities[index % shuffledDeities.length],
    star: shuffledStars[index % shuffledStars.length],
    door: shuffledDoors[index % shuffledDoors.length],
    stem: shuffledStems[index % shuffledStems.length],
    auspiciousLevel: calculateAuspiciousLevel(p.element, shuffledDeities[index], shuffledStars[index], shuffledDoors[index]),
  }));
  
  const score = calculateChartScore(palaces);
  
  return {
    id: `qimen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createTime: Date.now(),
    question,
    chartType,
    palaces,
    deities: shuffledDeities.slice(0, 8),
    stars: shuffledStars.slice(0, 9),
    doors: shuffledDoors.slice(0, 8),
    stems: shuffledStems.slice(0, 10),
    auspicious: score >= 60,
    score,
  };
}

// 计算宫位吉凶等级
function calculateAuspiciousLevel(element: Element, deity?: Deity, star?: Star, door?: Door): number {
  let level = 3; // 基础等级
  
  if (deity?.nature === 'auspicious') level += 1;
  if (deity?.nature === 'inauspicious') level -= 1;
  
  if (star?.nature === 'auspicious') level += 1;
  if (star?.nature === 'inauspicious') level -= 1;
  
  if (door?.nature === 'auspicious') level += 1;
  if (door?.nature === 'inauspicious') level -= 1;
  
  return Math.max(1, Math.min(5, level));
}

// 计算全盘吉凶评分
function calculateChartScore(palaces: Palace[]): number {
  let totalScore = 0;
  
  palaces.forEach(palace => {
    totalScore += palace.auspiciousLevel * 20; // 每宫最高 100 分
  });
  
  return Math.floor(totalScore / palaces.length);
}

// 获取吉宫
export function getAuspiciousPalaces(chart: QimenChart): Palace[] {
  return chart.palaces.filter(p => p.auspiciousLevel >= 4);
}

// 获取凶宫
export function getInauspiciousPalaces(chart: QimenChart): Palace[] {
  return chart.palaces.filter(p => p.auspiciousLevel <= 2);
}

// 获取最佳方位
export function getBestDirection(chart: QimenChart): string | null {
  const auspiciousPalaces = getAuspiciousPalaces(chart);
  if (auspiciousPalaces.length === 0) return null;
  
  const bestPalace = auspiciousPalaces.reduce((best, current) => 
    current.auspiciousLevel > best.auspiciousLevel ? current : best
  );
  
  return bestPalace.direction;
}

// 获取解盘建议
export function getInterpretation(chart: QimenChart): {
  summary: string;
  advice: string[];
  bestTime: string;
  worstTime: string;
} {
  const auspiciousCount = getAuspiciousPalaces(chart).length;
  const inauspiciousCount = getInauspiciousPalaces(chart).length;
  
  let summary = '';
  if (chart.score >= 80) {
    summary = '大吉之象，百事皆宜，贵人相助';
  } else if (chart.score >= 60) {
    summary = '吉象，谋事可成，宜主动出击';
  } else if (chart.score >= 40) {
    summary = '平象，吉凶参半，宜谨慎行事';
  } else if (chart.score >= 20) {
    summary = '凶象，多有不顺，宜静不宜动';
  } else {
    summary = '大凶之象，百事不宜，宜守不宜攻';
  }
  
  const advice: string[] = [];
  
  if (auspiciousCount > 4) {
    advice.push('今日运势极佳，适合重要决策');
    advice.push('贵人运旺，可寻求他人帮助');
  }
  
  if (inauspiciousCount > 4) {
    advice.push('今日运势不佳，避免重大决策');
    advice.push('防小人口舌，谨言慎行');
  }
  
  const bestDirection = getBestDirection(chart);
  if (bestDirection) {
    advice.push(`最佳方位：${bestDirection}`);
  }
  
  return {
    summary,
    advice,
    bestTime: '辰时 (7:00-9:00) 或 午时 (11:00-13:00)',
    worstTime: '亥时 (21:00-23:00)',
  };
}

// 五行相生相克
export function getElementRelationship(element1: Element, element2: Element): 'generate' | 'overcome' | 'neutral' {
  const generate: Record<Element, Element> = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood',
  };
  
  const overcome: Record<Element, Element> = {
    wood: 'earth',
    earth: 'water',
    water: 'fire',
    fire: 'metal',
    metal: 'wood',
  };
  
  if (generate[element1] === element2) return 'generate';
  if (overcome[element1] === element2) return 'overcome';
  return 'neutral';
}

// 获取元素名称
export function getElementName(element: Element): string {
  const names: Record<Element, string> = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水',
  };
  return names[element];
}

// 获取遁甲类型名称
export function getChartTypeName(type: ChartType): string {
  return type === 'yang' ? '阳遁' : '阴遁';
}
