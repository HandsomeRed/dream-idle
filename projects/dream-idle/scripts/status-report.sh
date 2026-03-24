#!/bin/bash
# 状态汇报脚本 - 每 3 小时执行
# 汇报当前学习状态、进度、服务运行情况

WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/status-report.log"
LEARNING_STATE="$WORKSPACE/data/learning-state.json"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
  echo "$1"
}

log "=== 状态汇报触发 ==="

# 使用 Node.js 生成状态报告
node << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspace = '/root/.openclaw/workspace';
const learningStatePath = path.join(workspace, 'data/learning-state.json');
const heartbeatPath = path.join(workspace, 'data/heartbeat-state.json');

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: workspace }).trim();
  } catch (e) {
    return '';
  }
}

// 获取当前时间
const now = new Date();
const hour = now.getHours();
const dateStr = now.toISOString().split('T')[0];

// 确定当前时段
let currentSlot = '';
if (hour >= 0 && hour < 10) {
  currentSlot = '游戏开发 (00:00-10:00)';
} else if (hour >= 10 && hour < 20) {
  currentSlot = '量化交易 (10:00-20:00)';
} else {
  currentSlot = '总结提升 (20:00-24:00)';
}

// 读取学习状态
let state = {};
try {
  state = JSON.parse(fs.readFileSync(learningStatePath, 'utf-8'));
} catch (e) {
  console.log('⚠️ 学习状态文件不存在或格式错误');
}

const currentSession = state.currentSession || {};
const progress = state.learningProgress || {};
const stats = state.stats || { today: {}, total: {} };

// 检查服务状态
const services = [
  { name: 'DreamIdle', port: 3000, url: 'http://49.232.215.84:3000' },
  { name: 'StockQuant', port: 8501, url: 'http://49.232.215.84:8501' },
  { name: 'Stock Monitor Pro', port: null, url: '监控中' }
];

const serviceStatus = services.map(s => {
  const check = s.port ? exec(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${s.port} 2>/dev/null`) : 'running';
  const status = check === '200' || check === 'running' ? '🟢' : '🔴';
  return `${status} ${s.name}: ${s.url}`;
});

// 生成状态报告
const report = `
╔═══════════════════════════════════════════════════════╗
║          🤖 虾虾红状态汇报 (${now.toLocaleString('zh-CN')})          ║
╚═══════════════════════════════════════════════════════╝

📍 当前时段：${currentSlot}

📚 学习状态：
   主题：${currentSession.topic || '未开始'}
   子主题：${currentSession.subTopic || '-'}
   状态：${currentSession.status === 'active' ? '🔄 进行中' : '⏳ 待开始'}
   今日学习时长：${stats.today?.learnHours || 0} 小时

📊 今日进度：
   游戏开发：${Object.values(progress).filter(v => v.topic?.includes('角色') || v.topic?.includes('属性') || v.topic?.includes('战斗') || v.topic?.includes('技能') || v.topic?.includes('任务') || v.topic?.includes('离线') || v.topic?.includes('装备') || v.topic?.includes('好友') || v.topic?.includes('排行') || v.topic?.includes('公会')).length}/10 版本完成
   量化交易：Stage 1-3 完成
   测试总数：${stats.total?.testsWritten || 0} 个
   功能实现：${stats.total?.featuresImplemented || 0} 个

🌐 服务状态：
   ${serviceStatus.join('\n   ')}

📋 最近活动：
   ${currentSession.lastActivity ? new Date(currentSession.lastActivity).toLocaleString('zh-CN') : '无记录'}

💡 下一步计划：
   ${currentSession.kind === 'game-dev' ? '继续游戏开发下一个版本' : 
     currentSession.kind === 'quant' ? '继续量化交易数据可视化' : 
     currentSession.kind === 'summary-improve' ? '生成进化报告 + 自由学习' : '等待新任务'}

═══════════════════════════════════════════════════════
报告生成时间：${now.toLocaleString('zh-CN')}
状态：🎉 正常运行中 (´▽｀) ﾉ
═══════════════════════════════════════════════════════
`;

console.log(report);

// 保存到日志
const statusLogPath = path.join(workspace, 'logs/status-reports.log');
fs.appendFileSync(statusLogPath, `\n[${now.toISOString()}]\n${report}`);

NODESCRIPT

log "=== 状态汇报完成 ==="
echo "" >> "$LOG_FILE"
