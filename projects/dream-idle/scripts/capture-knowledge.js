#!/usr/bin/env node

/**
 * 自动知识沉淀脚本
 * 
 * 功能：
 * 1. 检测新完成的任务
 * 2. 判断是否值得总结（过滤琐碎内容）
 * 3. 生成知识卡片
 * 4. 保存到 knowledge-base/
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE = process.env.HOME + '/.openclaw/workspace';

const LEARNING_STATE_PATH = join(WORKSPACE, 'data/learning-state.json');
const KNOWLEDGE_BASE_PATH = join(WORKSPACE, 'knowledge-base');

/**
 * 判断任务是否值得总结
 * 核心原则：只总结典型案例，不记录琐碎 bug
 */
function isWorthCapturing(task) {
  const name = (task.topic || task.subTopic || '').toLowerCase();
  const tests = task.tests || '';
  const deliverables = task.deliverables || [];
  
  // 🚫 绝对不值得总结的（琐碎 bug、临时修复）
  const absoluteSkipKeywords = [
    '拼写', 'typo', '括号', '逗号', '分号',  // 语法错误
    '变量名', '函数名', '文件名',  // 命名错误
    '路径错误', '配置错误', '端口',  // 配置问题
    '注释掉', '删除', '回滚',  // 临时修复
    '重启', '刷新', '重新安装'  // 操作类
  ];
  
  // ✅ 值得总结的（有通用价值）
  const valuableKeywords = [
    '实现', '开发', '系统', '模块', '架构',  // 功能开发
    '策略', '引擎', '框架', '模型',  // 核心组件
    '设计', '理论', '方法', '实践',  // 方法论
    '公式', '算法', '模式', '最佳实践',  // 可复用
    '指南', '教程', '机制', '流程'  // 指导类
  ];
  
  // 1. 先检查是否绝对要跳过
  for (const keyword of absoluteSkipKeywords) {
    if (name.includes(keyword)) {
      return false;  // 琐碎 bug，跳过
    }
  }
  
  // 2. 检查是否有通用价值
  for (const keyword of valuableKeywords) {
    if (name.includes(keyword)) {
      return true;  // 有通用价值，总结
    }
  }
  
  // 3. 检查是否有明确产出（新功能、新模块）
  if (deliverables && deliverables.length > 0) {
    // 排除琐碎的 deliverables
    const trivialDeliverables = ['配置文件', 'README', '.gitignore'];
    const hasTrivialDeliverable = deliverables.some(d => 
      trivialDeliverables.some(t => d.includes(t))
    );
    if (!hasTrivialDeliverable) {
      return true;  // 有实质性产出
    }
  }
  
  // 4. 检查测试数量（测试多说明是重要功能）
  if (tests) {
    const match = tests.match(/(\d+)\/(\d+)/);
    if (match) {
      const passed = parseInt(match[1]);
      if (passed >= 5) {
        return true;  // 测试覆盖较多，是重要功能
      }
    }
  }
  
  // 5. Bug 修复类：只总结有代表性的
  if (name.includes('bug') || name.includes('修复') || name.includes('解决')) {
    // 检查是否有通用解决方案
    const hasGeneralSolution = 
      name.includes('超时') ||  // 网络超时处理
      name.includes('内存') ||  // 内存泄漏
      name.includes('并发') ||  // 并发问题
      name.includes('异步') ||  // 异步竞态
      name.includes('类型转换') ||  // 类型问题
      name.includes('编码') ||  // 编码问题
      name.includes('性能');  // 性能优化
    
    return hasGeneralSolution;  // 只有通用解决方案的 bug 才总结
  }
  
  // 默认：不总结
  return false;
}

/**
 * 获取时间段对应的知识库分类
 */
function getKnowledgeCategory(timeSlot) {
  const mapping = {
    'game-dev': 'game-dev',
    'stock-quant': 'quant-trading',
    'self-evolution': 'self-evolution'
  };
  return mapping[timeSlot] || 'self-evolution';
}

/**
 * 生成知识卡片标题
 */
function generateTitle(task, timeSlot) {
  if (task.topic) {
    return task.topic;
  }
  
  // 根据时间段生成默认标题
  const titles = {
    'game-dev': '游戏开发实践',
    'stock-quant': '量化交易实践',
    'self-evolution': '学习方法总结'
  };
  
  return titles[timeSlot] || '知识总结';
}

/**
 * 生成知识卡片内容
 */
function generateKnowledgeCard(task, timeSlot) {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');
  const category = getKnowledgeCategory(timeSlot);
  const title = generateTitle(task, timeSlot);
  
  // 生成标签
  const tags = generateTags(task, category);
  
  // 生成内容
  const content = `# ${title}

**创建时间：** ${timestamp}  
**更新时间：** ${timestamp}  
**分类：** ${category === 'game-dev' ? '游戏开发' : category === 'quant-trading' ? '量化交易' : '自我进化'}  
**标签：** ${tags}  
**来源：** 实践  
**状态：** 已固化 ⭐⭐⭐⭐⭐

---

## 📖 核心概念

{这里填写核心概念和理论基础}

---

## 🔧 实现方法

{这里填写具体实现步骤}

---

## 📝 代码示例

\`\`\`python
# 这里放代码示例
\`\`\`

---

## 📊 实践结果

{这里填写实践数据和结果}

---

## ⚠️ 注意事项

1. {注意事项 1}
2. {注意事项 2}
3. {注意事项 3}

---

## 🔗 相关资源

- [相关项目](项目路径)
- [参考资料](链接)

---

## 📝 更新记录

| 日期 | 更新内容 | 作者 |
|:---|:---|:---|
| ${now.toISOString().slice(0, 10)} | 初始创建 | 虾虾红 |
`;

  return content;
}

/**
 * 生成标签
 */
function generateTags(task, category) {
  const defaultTags = {
    'game-dev': '#游戏开发 #实践',
    'quant-trading': '#量化交易 #实践',
    'self-evolution': '#学习方法 #实践'
  };
  
  return task.tags || defaultTags[category];
}

/**
 * 保存知识卡片
 */
function saveKnowledgeCard(content, category, title) {
  const categoryPath = join(KNOWLEDGE_BASE_PATH, category);
  
  // 确保目录存在
  if (!existsSync(categoryPath)) {
    mkdirSync(categoryPath, { recursive: true });
  }
  
  // 生成文件名（移除特殊字符）
  const filename = title.replace(/[^\w\u4e00-\u9fa5]/g, '-') + '.md';
  const filepath = join(categoryPath, filename);
  
  // 如果文件已存在，添加时间戳
  let finalPath = filepath;
  let counter = 1;
  while (existsSync(finalPath)) {
    const name = title.replace(/[^\w\u4e00-\u9fa5]/g, '-');
    finalPath = join(categoryPath, `${name}-${counter}.md`);
    counter++;
  }
  
  writeFileSync(finalPath, content, 'utf-8');
  return finalPath;
}

/**
 * 主函数
 */
function main() {
  console.log('📝 知识沉淀检查...\n');
  
  // 读取学习状态
  let state;
  try {
    const content = readFileSync(LEARNING_STATE_PATH, 'utf-8');
    state = JSON.parse(content);
  } catch (e) {
    console.log('⚠️  学习状态文件不存在');
    return;
  }
  
  // 获取当前时间段
  const now = new Date();
  const hour = now.getHours();
  const timeSlot = hour >= 0 && hour < 10 ? 'game-dev' :
                   hour >= 10 && hour < 20 ? 'stock-quant' :
                   hour >= 20 && hour < 24 ? 'self-evolution' : 'rest';
  
  console.log(`📅 当前时间段：${timeSlot}`);
  
  // 检查是否有新完成的任务
  const progress = state.learningProgress?.[timeSlot];
  if (!progress) {
    console.log('ℹ️  当前时段无学习任务');
    return;
  }
  
  const nowTime = Date.now();
  const tenMinutesAgo = nowTime - 10 * 60 * 1000;
  let captured = false;
  
  for (const [key, task] of Object.entries(progress)) {
    // 检查是否是新完成且未总结的任务
    if (task.status === 'completed' && task.completedAt) {
      const completedTime = new Date(task.completedAt).getTime();
      
      if (completedTime > tenMinutesAgo && !task.knowledgeCaptured) {
        console.log(`\n✅ 检测到新完成的任务：${task.topic || key}`);
        
        // 判断是否值得总结
        if (!isWorthCapturing(task)) {
          console.log('   ⚠️  判断为琐碎内容，跳过总结');
          task.knowledgeCaptured = true;
          continue;
        }
        
        console.log('   ✅ 判断为有价值知识，开始总结...');
        
        // 生成知识卡片
        const content = generateKnowledgeCard(task, timeSlot);
        
        // 保存
        const category = getKnowledgeCategory(timeSlot);
        const filepath = saveKnowledgeCard(content, category, task.topic || key);
        
        console.log(`   📁 已保存到：${filepath}`);
        console.log(`   🏷️  分类：${category}`);
        
        // 标记为已总结
        task.knowledgeCaptured = true;
        captured = true;
      }
    }
  }
  
  // 保存状态更新
  if (captured) {
    writeFileSync(LEARNING_STATE_PATH, JSON.stringify(state, null, 2));
    console.log('\n💾 学习状态已更新');
  }
  
  // 更新 heartbeat 状态
  const heartbeatPath = join(WORKSPACE, 'data/heartbeat-state.json');
  try {
    const heartbeatState = JSON.parse(readFileSync(heartbeatPath, 'utf-8'));
    heartbeatState.lastChecks.knowledgeCapture = now.toISOString();
    if (captured) {
      heartbeatState.stats.knowledgeCaptured = (heartbeatState.stats.knowledgeCaptured || 0) + 1;
    }
    writeFileSync(heartbeatPath, JSON.stringify(heartbeatState, null, 2));
  } catch (e) {
    // 忽略错误
  }
  
  console.log('\n✅ 知识沉淀检查完成\n');
}

main();
