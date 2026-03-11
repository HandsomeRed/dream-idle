#!/usr/bin/env node

/**
 * 自主学习检查脚本
 * 
 * 功能：
 * 1. 检查当前时间段
 * 2. 检查学习状态
 * 3. 如果时间段内还有时间且学习未完成，继续学习
 * 4. 更新学习状态
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const WORKSPACE = process.env.HOME + '/.openclaw/workspace';
const LEARNING_STATE_PATH = join(WORKSPACE, 'data/learning-state.json');
const HEARTBEAT_STATE_PATH = join(WORKSPACE, 'data/heartbeat-state.json');

/**
 * 获取当前时间段
 */
function getCurrentTimeSlot() {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 0 && hour < 10) return 'game-dev';
  if (hour >= 10 && hour < 20) return 'stock-quant';
  if (hour >= 20 && hour < 24) return 'self-evolution';
  return 'rest';
}

/**
 * 检查是否应该继续学习
 */
function shouldContinueLearning(state, timeSlot) {
  const config = state.autoLearnConfig;
  if (!config || !config.enabled) return false;
  
  const currentTopic = state.currentSession;
  if (!currentTopic || currentTopic.status !== 'in-progress') return true;
  
  // 检查是否超过最大连续学习时间
  const startTime = new Date(currentTopic.startTime).getTime();
  const now = Date.now();
  const hoursLearned = (now - startTime) / (1000 * 60 * 60);
  
  if (hoursLearned >= config.maxContinuousLearnHours) {
    console.log(`⚠️  已连续学习${hoursLearned.toFixed(1)}小时，建议休息`);
    return false;
  }
  
  return true;
}

/**
 * 获取下一个学习主题
 */
function getNextTopic(state, timeSlot) {
  const progress = state.learningProgress[timeSlot];
  if (!progress) return 'unknown';
  
  // 找到第一个未完成的主题
  for (const [key, value] of Object.entries(progress)) {
    if (value.status !== 'completed') {
      return value.topic;
    }
  }
  
  return 'review';
}

/**
 * 主函数
 */
function main() {
  console.log('🧠 自主学习检查...\n');
  
  // 读取学习状态
  let state = {};
  try {
    const content = readFileSync(LEARNING_STATE_PATH, 'utf-8');
    state = JSON.parse(content);
  } catch (e) {
    console.log('⚠️  学习状态文件不存在，创建默认状态');
    state = {
      autoLearnConfig: { enabled: true, maxContinuousLearnHours: 2 },
      currentSession: null
    };
  }
  
  // 获取当前时间段
  const timeSlot = getCurrentTimeSlot();
  console.log(`📅 当前时间段：${timeSlot}`);
  
  // 检查是否应该学习
  if (!shouldContinueLearning(state, timeSlot)) {
    console.log('⏸️  暂停学习（达到连续学习时长限制）');
    return;
  }
  
  // 获取当前学习主题
  const currentTopic = state.currentSession;
  if (currentTopic && currentTopic.kind === timeSlot && currentTopic.status === 'in-progress') {
    console.log(`✅ 继续当前学习主题：${currentTopic.topic}`);
    console.log(`   子主题：${currentTopic.subTopic}`);
    console.log(`   开始时间：${new Date(currentTopic.startTime).toLocaleString('zh-CN')}`);
    
    // 更新最后活动时间
    currentTopic.lastActivity = new Date().toISOString();
    writeFileSync(LEARNING_STATE_PATH, JSON.stringify(state, null, 2));
    
    console.log('\n📚 学习状态已更新，继续执行...');
  } else {
    console.log(`🆕 开始新的学习时段：${timeSlot}`);
    const nextTopic = getNextTopic(state, timeSlot);
    console.log(`   下一个主题：${nextTopic}`);
    
    // 更新当前会话
    const endTime = timeSlot === 'game-dev' ? '2026-03-12T10:00:00+08:00' : 
                    timeSlot === 'stock-quant' ? '2026-03-12T20:00:00+08:00' : 
                    '2026-03-12T24:00:00+08:00';
    
    state.currentSession = {
      kind: timeSlot,
      startTime: new Date().toISOString(),
      endTime: endTime,
      topic: nextTopic,
      subTopic: '待确定',
      status: 'in-progress',
      lastActivity: new Date().toISOString()
    };
    
    writeFileSync(LEARNING_STATE_PATH, JSON.stringify(state, null, 2));
    console.log('\n📚 学习会话已初始化');
  }
  
  // 更新 heartbeat 状态
  const heartbeatState = {
    lastChecks: {
      heartbeat: new Date().toISOString(),
      memoryOrganize: null,
      logCleanup: null,
      emergencyCheck: null,
      autoLearn: new Date().toISOString()
    },
    dailyTasks: {
      memoryReview: false,
      decisionExtract: false,
      tempCleanup: false
    },
    weeklyTasks: {
      memoryReview: false,
      projectUpdate: false,
      oldMemoryCleanup: false
    },
    stats: {
      totalHeartbeats: (state.stats?.total?.learnSessions || 0) + 1,
      memoriesOrganized: 0,
      logsCleaned: 0,
      autoLearnChecks: (state.stats?.total?.learnSessions || 0) + 1
    }
  };
  
  writeFileSync(HEARTBEAT_STATE_PATH, JSON.stringify(heartbeatState, null, 2));
  console.log('💓 Heartbeat 状态已更新');
  
  console.log('\n✅ 自主学习检查完成\n');
}

main();
