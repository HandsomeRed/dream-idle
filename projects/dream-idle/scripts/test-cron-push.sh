#!/bin/bash
# 测试 cron 推送脚本 - 验证 22:00 任务能否正常执行

export HOME="/root"
export PATH="/root/.local/share/pnpm:/root/.nvm/current/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

LOG_FILE="/root/.openclaw/workspace/logs/test-cron.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] === 测试 cron 推送开始 ===" >> "$LOG_FILE"

# 测试 openclaw 命令是否可用
if [ ! -x "/root/.local/share/pnpm/openclaw" ]; then
  echo "[$TIMESTAMP] ❌ openclaw 命令不存在" >> "$LOG_FILE"
  exit 1
fi

echo "[$TIMESTAMP] ✅ openclaw 命令存在" >> "$LOG_FILE"

# 发送测试消息
"/root/.local/share/pnpm/openclaw" message send \
  --target "ou_da9e6da7040815fb26ecbab65b3cb75d" \
  --message "🧪 Cron 推送测试 - $(date '+%Y-%m-%d %H:%M')

✅ 脚本执行成功
✅ openclaw 命令可用
✅ 消息推送成功

如果收到这条消息，说明 22:00 的每日进化报告推送也能正常工作。" \
  >> "$LOG_FILE" 2>&1

RESULT=$?

if [ $RESULT -eq 0 ]; then
  echo "[$TIMESTAMP] ✅ 测试消息发送成功" >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] ❌ 测试消息发送失败，退出码：$RESULT" >> "$LOG_FILE"
fi

echo "[$TIMESTAMP] === 测试完成 ===" >> "$LOG_FILE"

exit $RESULT
