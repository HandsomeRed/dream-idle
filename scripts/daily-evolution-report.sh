#!/bin/bash
# 每日进化报告脚本 - 22:00 执行
# 生成并播报当日学习总结

# 设置 PATH（cron 环境中需要）
export PATH="/root/.nvm/current/bin:$PATH"

WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/evolution-report.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
  echo "$1"
}

log "=== 生成每日进化报告 ==="

# 读取学习状态
LEARNING_STATE="$WORKSPACE/data/learning-state.json"

if [ ! -f "$LEARNING_STATE" ]; then
  log "❌ 学习状态文件不存在"
  exit 1
fi

# 使用 Node.js 生成报告
node << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');

const workspace = '/root/.openclaw/workspace';
const learningStatePath = path.join(workspace, 'data/learning-state.json');
const reportsDir = path.join(workspace, 'data/evolution-reports');
const memoryDir = path.join(workspace, 'memory');

// 确保目录存在
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// 读取学习状态
const state = JSON.parse(fs.readFileSync(learningStatePath, 'utf-8'));
const progress = state.learningProgress || {};
const gameDev = progress['game-dev'] || {};
const quant = progress['quant'] || {};

// 生成报告
const today = new Date().toISOString().split('T')[0];
const report = {
  date: today,
  generatedAt: new Date().toISOString(),
  summary: {
    gameDev: {
      completedVersions: Object.keys(gameDev).filter(v => gameDev[v].status === 'completed'),
      totalTests: Object.values(gameDev).reduce((sum, v) => {
        const match = v.tests?.match(/(\d+)\/(\d+)/);
        return sum + (match ? parseInt(match[2]) : 0);
      }, 0),
      totalFeatures: Object.values(gameDev).filter(v => v.status === 'completed').length
    },
    quant: {
      completedStages: Object.keys(quant).filter(s => quant[s].status === 'completed'),
      totalTests: Object.values(quant).reduce((sum, s) => {
        const match = s.tests?.match(/(\d+)\/(\d+)/);
        return sum + (match ? parseInt(match[2]) : 0);
      }, 0)
    }
  },
  newLearnings: [],
  mistakes: [],
  skillSuggestions: []
};

// 保存报告
const reportPath = path.join(reportsDir, `${today}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('报告生成完成');
console.log(JSON.stringify(report, null, 2));
NODESCRIPT

log "=== 进化报告完成 ==="

# 生成 markdown 格式并推送
node << 'PUSHSCRIPT'
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspace = '/root/.openclaw/workspace';
const today = new Date().toISOString().split('T')[0];
const reportsDir = path.join(workspace, 'data/evolution-reports');

// 读取 JSON 报告
const jsonReportPath = path.join(reportsDir, `${today}.json`);
if (!fs.existsSync(jsonReportPath)) {
  console.log('❌ JSON 报告不存在，无法推送');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(jsonReportPath, 'utf-8'));

// 生成 markdown 推送内容
const mdReport = `# 🧬 每日进化报告 - ${report.date}

## 📊 今日概览
- **学习时长：** ${report.summary?.gameDev?.totalFeatures || 0} 个功能 + ${report.summary?.quant?.completedStages?.length || 0} 个阶段
- **测试通过：** ${report.summary?.gameDev?.totalTests || 0} + ${report.summary?.quant?.totalTests || 0}

## 🎮 游戏开发
${report.summary?.gameDev?.completedVersions?.slice(-3)?.join(' → ') || '无进展'}

## 📈 量化交易
${report.summary?.quant?.completedStages?.slice(-3)?.join(' → ') || '无进展'}

## 📝 新学会的东西
${report.newLearnings?.map(l => `- ${l}`).join('\n') || '- 无'}

## ⚠️ 犯的错误
${report.mistakes?.map(m => `- ${m}`).join('\n') || '- 无'}

---
*准时推送 ✅*`;

// 保存 markdown 版本
const mdReportPath = path.join(reportsDir, `${today}-day-${report.day || 'N'}.md`);
fs.writeFileSync(mdReportPath, mdReport);

// 调用 openclaw 推送消息
try {
  const cmd = `openclaw message send --target "ou_da9e6da7040815fb26ecbab65b3cb75d" --message "${mdReport.replace(/\n/g, '\\n')}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('✅ 报告已推送');
} catch (e) {
  console.log('❌ 推送失败:', e.message);
}
PUSHSCRIPT
