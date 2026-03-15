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
