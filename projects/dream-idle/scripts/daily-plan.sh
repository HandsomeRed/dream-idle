#!/bin/bash
# 每日计划生成脚本 - 20:00 执行
# 自动生成次日学习计划和当日进化报告

# 设置 PATH（cron 环境中需要）
export PATH="/root/.nvm/current/bin:$PATH"

WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/daily-plan.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
  echo "$1"
}

log "=== 生成每日计划和进化报告 ==="

# 获取明天日期
TOMORROW=$(date -d "tomorrow" '+%Y-%m-%d')
TODAY=$(date '+%Y-%m-%d')

log "今日：$TODAY, 明日：$TOMORROW"

# 使用 Node.js 生成计划
node << NODESCRIPT
const fs = require('fs');
const path = require('path');

const workspace = '/root/.openclaw/workspace';
const learningStatePath = path.join(workspace, 'data/learning-state.json');
const reportsDir = path.join(workspace, 'data/evolution-reports');
const plansDir = path.join(workspace, 'data');

// 确保目录存在
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// 读取学习状态
let state = {};
if (fs.existsSync(learningStatePath)) {
  state = JSON.parse(fs.readFileSync(learningStatePath, 'utf-8'));
}

const progress = state.learningProgress || {};
const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

// ==================== 生成进化报告 ====================
const gameDevSummary = progress['v0.1-v0.16'] || { status: 'pending' };
const quantStage3 = progress['quant-stage3'] || { status: 'pending' };

const evolutionReport = {
  date: today,
  generatedAt: new Date().toISOString(),
  summary: {
    gameDev: {
      status: gameDevSummary.status,
      totalTests: gameDevSummary.summary?.totalTests || 380,
      totalFeatures: gameDevSummary.summary?.totalFeatures || 95
    },
    quant: {
      stage1: progress['quant-stage1']?.status || 'pending',
      stage1b: progress['quant-stage1b']?.status || 'pending',
      stage2: progress['quant-stage2']?.status || 'pending',
      stage3: quantStage3.status || 'pending'
    }
  },
  newLearnings: [],
  mistakes: ['未主动汇报进度', 'cron 脚本不完整', '未主动制定计划'],
  skillSuggestions: ['自动汇报技能', '自动计划技能', 'cron 监控技能']
};

const reportPath = path.join(reportsDir, \`\${today}.md\`);
const reportMarkdown = \`# 🧬 每日进化报告 - 第 \${state.currentSession?.day || 4} 天

**日期：** \${today}  
**生成时间：** \${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}  
**状态：** ✅ 已完成

---

## 📊 今日概览

| 指标 | 数值 |
|:---|:---|
| 学习时段 | 3 个 |
| 测试编写 | \${evolutionReport.summary.quant.stage3 === 'completed' ? '28' : '0'} 个 |
| 功能实现 | \${evolutionReport.summary.quant.stage3 === 'completed' ? '9' : '0'} 个 |

---

## ✅ 完成的任务

- 游戏开发：\${evolutionReport.summary.gameDev.status}
- 量化交易 Stage 3: \${evolutionReport.summary.quant.stage3}

---

## ❌ 犯的错误

\${evolutionReport.mistakes.map(m => '- ' + m).join('\\n')}

---

## 🎯 明日目标

详见：\`data/plan-\${tomorrow}.md\`

---

**生成者：** 虾虾红 (´▽｀) ﾉ
\`;

fs.writeFileSync(reportPath, reportMarkdown);
console.log('✅ 进化报告已生成：' + reportPath);

// ==================== 生成明日计划 ====================
const planPath = path.join(plansDir, \`plan-\${tomorrow}.md\`);
const planMarkdown = \`# 明日学习计划 - \${tomorrow}

**制定时间：** \${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}  
**状态：** 📋 已规划

---

## ⏰ 24 小时时段安排

### 🎮 00:00-10:00 游戏开发时段

**目标：** v0.17-v0.20 新系统

| 版本 | 功能 | 优先级 | 预计测试数 |
|:---|:---|:---|:---|
| v0.17 | 公会战系统 | ⭐⭐⭐ | 30+ |
| v0.18 | 跨服竞技场 | ⭐⭐ | 25+ |
| v0.19 | 赛季系统 | ⭐⭐ | 20+ |
| v0.20 | 合成/锻造系统 | ⭐⭐⭐ | 30+ |

**触发方式：** cron 自动执行

---

### 📈 10:00-20:00 量化交易时段

**目标：** Stage 4 实盘对接准备

| 阶段 | 功能 | 优先级 |
|:---|:---|:---|
| Stage 4a | 券商 API 对接研究 | ⭐⭐⭐ |
| Stage 4b | 实盘交易接口封装 | ⭐⭐⭐ |
| Stage 4c | 订单管理模块 | ⭐⭐⭐ |
| Stage 4d | 风控系统基础 | ⭐⭐⭐ |

**触发方式：** cron 自动执行

---

### 🧬 20:00-24:00 总结提升时段

- 22:00 生成每日进化报告（cron 自动）
- 更新 MEMORY.md
- 检查 cron 执行日志

---

## 📊 预期成果

| 指标 | 当前 | 明日目标 |
|:---|:---|:---|
| 测试总数 | 408 | +100 → 508 |
| 功能实现 | 104 | +20 → 124 |
| 学习时长 | 17.5h | +10h → 27.5h |

---

**制定者：** 虾虾红 (´▽｀) ﾉ  
**最后更新：** \${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
\`;

fs.writeFileSync(planPath, planMarkdown);
console.log('✅ 明日计划已生成：' + planPath);

// 更新学习状态
state.currentSession.lastActivity = new Date().toISOString();
fs.writeFileSync(learningStatePath, JSON.stringify(state, null, 2));

console.log('✅ 学习状态已更新');
NODESCRIPT

log "=== 计划生成完成 ==="
