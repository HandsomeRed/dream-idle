#!/bin/bash
# Heartbeat 触发脚本 - 每 15 分钟执行一次
# 用于触发 OpenClaw 的 heartbeat 检查

LOG_FILE="/root/.openclaw/workspace/logs/heartbeat-trigger.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
WORKSPACE="/root/.openclaw/workspace"

# 记录执行
echo "[$TIMESTAMP] 触发 heartbeat 检查..." >> "$LOG_FILE"

# 检查 HEARTBEAT.md 并执行相应任务
cd "$WORKSPACE"

# 读取 HEARTBEAT.md 状态并更新
if [ -f "$WORKSPACE/HEARTBEAT.md" ]; then
  echo "[$TIMESTAMP] ✅ 读取 HEARTBEAT.md" >> "$LOG_FILE"
  
  # 检查学习状态
  if [ -f "$WORKSPACE/data/learning-state.json" ]; then
    LAST_ACTIVITY=$(cat "$WORKSPACE/data/learning-state.json" | grep -o '"lastActivity"[^,]*' | cut -d'"' -f4)
    echo "[$TIMESTAMP] 最后学习活动：$LAST_ACTIVITY" >> "$LOG_FILE"
  fi
  
  # 如果是 22:00-22:30，生成每日进化报告
  HOUR=$(date +%H)
  MINUTE=$(date +%M)
  if [ "$HOUR" = "22" ] && [ "$MINUTE" -ge "00" ] && [ "$MINUTE" -lt "30" ]; then
    echo "[$TIMESTAMP] 📝 22:00 时段，准备生成每日进化报告" >> "$LOG_FILE"
  fi
else
  echo "[$TIMESTAMP] ❌ HEARTBEAT.md 不存在" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
