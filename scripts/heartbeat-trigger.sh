#!/bin/bash
# Heartbeat 触发脚本 - 每 15 分钟执行一次
# 用于触发 OpenClaw 的 heartbeat 检查和学习任务
# 关键：检查学习进度并更新，避免重复学习

LOG_FILE="/root/.openclaw/workspace/logs/heartbeat-trigger.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
WORKSPACE="/root/.openclaw/workspace"
LEARNING_STATE="$WORKSPACE/data/learning-state.json"

# 获取当前时段
get_current_time_slot() {
  HOUR=$(date +%H)
  if [ "$HOUR" -ge 0 ] && [ "$HOUR" -lt 10 ]; then
    echo "00:00-10:00 游戏开发"
  elif [ "$HOUR" -ge 10 ] && [ "$HOUR" -lt 20 ]; then
    echo "10:00-20:00 量化交易"
  else
    echo "20:00-24:00 总结提升"
  fi
}

# 记录执行
echo "[$TIMESTAMP] 触发 heartbeat 检查..." >> "$LOG_FILE"

# 检查 HEARTBEAT.md 并执行相应任务
cd "$WORKSPACE"

if [ -f "$WORKSPACE/HEARTBEAT.md" ]; then
  echo "[$TIMESTAMP] ✅ 读取 HEARTBEAT.md" >> "$LOG_FILE"
  
  # 检查学习状态
  if [ -f "$LEARNING_STATE" ]; then
    LAST_ACTIVITY=$(cat "$LEARNING_STATE" | grep -o '"lastActivity"[^,]*' | cut -d'"' -f4)
    CURRENT_STATUS=$(cat "$LEARNING_STATE" | grep -o '"status"[^,}]*' | head -1 | cut -d'"' -f4)
    CURRENT_TOPIC=$(cat "$LEARNING_STATE" | grep -o '"topic"[^,]*' | head -1 | cut -d'"' -f4)
    
    echo "[$TIMESTAMP] 最后学习活动：$LAST_ACTIVITY" >> "$LOG_FILE"
    echo "[$TIMESTAMP] 当前状态：$CURRENT_STATUS" >> "$LOG_FILE"
    echo "[$TIMESTAMP] 当前主题：$CURRENT_TOPIC" >> "$LOG_FILE"
    
    # 检查是否需要更新学习进度
    LAST_ACTIVITY_EPOCH=$(date -d "$LAST_ACTIVITY" +%s 2>/dev/null || echo 0)
    CURRENT_EPOCH=$(date +%s)
    TIME_DIFF=$(( (CURRENT_EPOCH - LAST_ACTIVITY_EPOCH) / 60 ))  # 分钟
    
    if [ "$TIME_DIFF" -ge 15 ] && [ "$CURRENT_STATUS" = "learning" ]; then
      # 学习时间超过 15 分钟但状态还是 learning，可能学习已完成但未更新
      echo "[$TIMESTAMP] ⚠️ 学习状态可能过期（${TIME_DIFF}分钟未更新）" >> "$LOG_FILE"
      echo "[$TIMESTAMP] 💡 提示：下次会话时请更新学习进度" >> "$LOG_FILE"
    elif [ "$CURRENT_STATUS" = "completed" ]; then
      # 学习已完成，准备新主题
      echo "[$TIMESTAMP] ✅ 当前学习已完成，准备新主题" >> "$LOG_FILE"
    fi
  else
    echo "[$TIMESTAMP] ❌ learning-state.json 不存在" >> "$LOG_FILE"
  fi
  
  # 如果是 22:00-22:30，生成每日进化报告
  HOUR=$(date +%H)
  MINUTE=$(date +%M)
  if [ "$HOUR" = "22" ] && [ "$MINUTE" -ge "00" ] && [ "$MINUTE" -lt "30" ]; then
    echo "[$TIMESTAMP] 📝 22:00 时段，准备生成每日进化报告" >> "$LOG_FILE"
  fi
  
  # 触发 OpenClaw 学习任务
  echo "[$TIMESTAMP] 🚀 触发 OpenClaw 学习任务..." >> "$LOG_FILE"
  
  # 创建学习触发标记文件（包含进度信息）
  cat > "$WORKSPACE/data/heartbeat-pending.json" << EOF
{
  "triggered": true,
  "timestamp": "$TIMESTAMP",
  "hour": $(date +%H),
  "minute": $(date +%M),
  "shouldLearn": true,
  "timeSinceLastActivity": ${TIME_DIFF:-0},
  "currentStatus": "$CURRENT_STATUS",
  "currentTopic": "$CURRENT_TOPIC",
  "message": "Heartbeat 触发 - 请检查 HEARTBEAT.md 并执行学习任务，完成后更新 learning-state.json"
}
EOF
  
  echo "[$TIMESTAMP] ✅ 学习触发标记已创建" >> "$LOG_FILE"
  
  # 创建学习指令文件（包含进度追踪）
  if command -v openclaw &> /dev/null; then
    cat > "$WORKSPACE/data/pending-learning-task.md" << TASK
# 待执行学习任务

**触发时间：** $TIMESTAMP
**当前时段：** $(get_current_time_slot)
**距离上次学习：** ${TIME_DIFF:-0} 分钟
**当前状态：** ${CURRENT_STATUS:-unknown}
**当前主题：** ${CURRENT_TOPIC:-unknown}

## 操作指令

1. **检查进度**
   - 读取 data/learning-state.json
   - 确认当前学习主题和状态
   
2. **执行学习**
   - 如果状态是 "completed" → 开始新主题
   - 如果状态是 "learning" → 继续当前主题
   - 如果状态是 "starting" → 初始化学习

3. **更新进度** ⚠️ 重要！
   - 学习完成后立即更新 learning-state.json
   - 更新 status 为 "completed" 或 "learning"
   - 更新 lastActivity 为当前时间
   - 记录学习成果（测试数量、功能实现等）

4. **避免重复**
   - 检查已完成的主题不要重复学习
   - 根据进度继续下一步

## 学习主题参考

### 游戏开发 (00:00-10:00)
- v0.1-v0.6: ✅ 已完成
- v0.7: 装备系统（进行中）
- v0.8+: 好友系统、排行榜

### 量化交易 (10:00-20:00)
- Stage 1-2: ✅ 已完成
- Stage 3: 数据可视化（进行中）
- Stage 4: 模拟交易

### 总结提升 (20:00-24:00)
- 每日进化报告
- 技能固化
- 代码重构
TASK
    
    echo "[$TIMESTAMP] 📝 学习任务指令已创建（含进度追踪）" >> "$LOG_FILE"
  fi
else
  echo "[$TIMESTAMP] ❌ HEARTBEAT.md 不存在" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
