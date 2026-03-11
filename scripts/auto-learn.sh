#!/bin/bash

# 自主学习脚本 - 由 heartbeat 触发
# 每 30 分钟检查一次，如果时间段内还有时间，继续学习

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 自主学习触发 @ $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# 运行学习检查
node "$SCRIPT_DIR/auto-learn-check.js"

# 根据检查结果，触发相应的学习流程
# TODO: 这里可以根据 auto-learn-check.js 的输出来决定下一步做什么

echo "✅ 自主学习流程完成"
