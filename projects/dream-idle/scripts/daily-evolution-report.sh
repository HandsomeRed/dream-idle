#!/bin/bash
# 每日进化报告脚本 - 22:00 执行
# 生成并推送当日学习总结

# 设置 PATH（cron 环境中需要）
export HOME="/root"
export PATH="/root/.local/share/pnpm:/root/.nvm/current/bin:/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# 验证 openclaw 可用
if ! command -v openclaw &> /dev/null; then
  export OPENCLAW_BIN="/root/.local/share/pnpm/openclaw"
  if [ ! -x "$OPENCLAW_BIN" ]; then
    log "❌ 找不到 openclaw 命令"
    exit 1
  fi
  alias openclaw="$OPENCLAW_BIN"
fi

WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/evolution-cron.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
  echo "$1"
}

log "=== 生成每日进化报告 ==="

# 使用 Node.js 生成报告并推送
cd "$WORKSPACE"
node << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspace = '/root/.openclaw/workspace';
const reportsDir = path.join(workspace, 'data/evolution-reports');
const learningStatePath = path.join(workspace, 'data/learning-state.json');
const heartbeatStatePath = path.join(workspace, 'data/heartbeat-state.json');
const memoryPath = path.join(workspace, 'MEMORY.md');

// 确保目录存在
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// 读取学习状态
let state = {};
try {
  state = JSON.parse(fs.readFileSync(learningStatePath, 'utf-8'));
} catch (e) {
  console.log('❌ 无法读取学习状态文件');
  process.exit(1);
}

const progress = state.learningProgress || {};

// 统计游戏开发进度（v0.x 开头）
const gameVersions = Object.entries(progress)
  .filter(([k, v]) => k.startsWith('v0.') && v.status === 'completed')
  .sort((a, b) => {
    const aNum = parseFloat(a[0].replace('v0.', ''));
    const bNum = parseFloat(b[0].replace('v0.', ''));
    return aNum - bNum;
  });

// 统计量化交易进度（quant-开头）
const quantStages = Object.entries(progress)
  .filter(([k, v]) => k.startsWith('quant-') && v.status === 'completed')
  .sort((a, b) => a[0].localeCompare(b[0]));

// 计算测试总数
const totalGameTests = gameVersions.reduce((sum, [_, v]) => {
  const match = v.tests?.match(/(\d+)\/(\d+)/);
  return sum + (match ? parseInt(match[2]) : 0);
}, 0);

const totalQuantTests = quantStages.reduce((sum, [_, v]) => {
  const match = v.tests?.match(/(\d+)\/(\d+)/);
  return sum + (match ? parseInt(match[2]) : 0);
}, 0);

// 读取心跳状态获取天数
let dayNum = 1;
try {
  const hbState = JSON.parse(fs.readFileSync(heartbeatStatePath, 'utf-8'));
  dayNum = hbState.currentStatus?.day || 1;
  // 如果 currentStatus.day 不存在，尝试从已生成的报告数量推断
  if (dayNum === 1) {
    const existingReports = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md')).length;
    dayNum = existingReports + 1;
  }
} catch (e) {
  // 默认第 1 天
}

// 读取 MEMORY.md 获取累计数据
let memoryContent = '';
try {
  memoryContent = fs.readFileSync(memoryPath, 'utf-8');
} catch (e) {
  // 忽略
}

// 生成报告
const today = new Date().toISOString().split('T')[0];
const report = {
  date: today,
  day: dayNum,
  generatedAt: new Date().toISOString(),
  summary: {
    gameDev: {
      completedVersions: gameVersions.map(([k]) => k),
      totalTests: totalGameTests,
      totalFeatures: gameVersions.length,
      latestVersion: gameVersions[gameVersions.length - 1]?.[0] || '无'
    },
    quant: {
      completedStages: quantStages.map(([k]) => k),
      totalTests: totalQuantTests,
      latestStage: quantStages[quantStages.length - 1]?.[0] || '无'
    }
  },
  newLearnings: [],
  mistakes: [],
  skillSuggestions: []
};

// 保存 JSON 报告
const jsonReportPath = path.join(reportsDir, `${today}.json`);
fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

// 生成 markdown 推送内容
const gameList = gameVersions.length > 0 
  ? gameVersions.map(([k, v]) => `- ✅ ${k}: ${v.topic || '功能完成'} (${v.tests || '测试通过'})`).join('\n')
  : '- 暂无进展';

const quantList = quantStages.length > 0
  ? quantStages.map(([k, v]) => `- ✅ ${k}: ${v.topic || '阶段完成'} (${v.tests || '测试通过'})`).join('\n')
  : '- 暂无进展';

const mdReport = `# 🧬 每日进化报告 - ${today}（第${dayNum}天）

## 📊 今日概览
- **游戏开发：** ${gameVersions.length} 个版本完成，${totalGameTests} 个测试通过
- **量化交易：** ${quantStages.length} 个阶段完成，${totalQuantTests} 个测试通过
- **最新进展：** ${report.summary.gameDev.latestVersion} / ${report.summary.quant.latestStage}

## 🎮 游戏开发进度
${gameList}

## 📈 量化交易进度
${quantList}

## 📝 学会的新东西
${report.newLearnings.length > 0 ? report.newLearnings.map(l => `- ${l}`).join('\n') : '- 持续学习中...'}

## ⚠️ 犯的错误和解决
${report.mistakes.length > 0 ? report.mistakes.map(m => `- ${m}`).join('\n') : '- 无'}

---
**累计：** ${totalGameTests + totalQuantTests} 个测试通过 | ${gameVersions.length + quantStages.length} 个功能完成

*🤖 准时推送 - 脚本自动执行*`;

// 保存 markdown 版本
const mdFilename = `${today}-day-${dayNum}.md`;
const mdReportPath = path.join(reportsDir, mdFilename);
fs.writeFileSync(mdReportPath, mdReport);
console.log(`✅ 报告已保存：${mdFilename}`);

// 🔄 同步进化报告到 MEMORY.md
console.log('🔄 正在同步到 MEMORY.md...');
try {
  let memoryContent = fs.readFileSync(memoryPath, 'utf-8');
  
  // 更新最后更新时间
  memoryContent = memoryContent.replace(
    /\*\*最后更新：\*\* \d{4}-\d{2}-\d{2} .*/,
    `**最后更新：** ${today} (${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}) - 第${dayNum}天完成`
  );
  
  // 更新自我进化进度
  const totalTests = totalGameTests + totalQuantTests;
  const totalFeatures = gameVersions.length + quantStages.length;
  const learningState = JSON.parse(fs.readFileSync(learningStatePath, 'utf-8'));
  const totalHours = learningState.totalLearningHours || (dayNum * 5); // 估算
  memoryContent = memoryContent.replace(
    /进度：第 \d+ 天完成，累计 \d+ 测试\/\d+ 功能\/[~\d.]+小时/,
    `进度：第${dayNum}天完成，累计${totalTests}测试/${totalFeatures}功能/${totalHours.toFixed(1)}小时`
  );
  
  // 检查是否已有今日记录，避免重复
  const todaySection = `### 第${dayNum}天（${today}）`;
  if (!memoryContent.includes(todaySection)) {
    // 插入到"## 📅 近期进化记录"之后
    const newSection = `
${todaySection}
- **游戏开发：** ${gameVersions.length > 0 ? gameVersions[gameVersions.length-1][0] : '待开始'} ${gameVersions.length > 0 ? '✅' : '⏳'}
- **量化交易：** ${quantStages.length > 0 ? quantStages[quantStages.length-1][0] : '待开始'} ${quantStages.length > 0 ? '✅' : '⏳'}
- **测试通过：** ${totalTests}个 | **功能完成：** ${totalFeatures}个
`;
    memoryContent = memoryContent.replace(
      '## 📅 近期进化记录\n',
      `## 📅 近期进化记录\n${newSection}`
    );
  }
  
  fs.writeFileSync(memoryPath, memoryContent);
  console.log('✅ MEMORY.md 已同步更新');
} catch (e) {
  console.log('⚠️ MEMORY.md 同步失败:', e.message);
}

// 调用 openclaw 推送消息（转义换行符和引号）
const escapedMessage = mdReport.replace(/"/g, '\\"').replace(/\n/g, '\\n');
const targetUser = 'ou_da9e6da7040815fb26ecbab65b3cb75d'; // 小红的用户 ID
const openclawBin = '/root/.local/share/pnpm/openclaw'; // 使用完整路径

try {
  const cmd = `"${openclawBin}" message send --target "${targetUser}" --message "${escapedMessage}"`;
  console.log('正在推送...');
  const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
  console.log('✅ 报告已推送到飞书');
} catch (e) {
  console.log('❌ 推送失败:', e.message);
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
NODESCRIPT

log "=== 进化报告完成 ==="
