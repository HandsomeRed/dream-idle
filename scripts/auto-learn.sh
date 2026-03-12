#!/bin/bash

# 自主学习脚本 - 由 heartbeat 触发
# 每 5 分钟检查一次，自动继续学习 + 知识沉淀

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 自主学习触发 @ $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# 1. 运行学习检查（检测时间段、任务状态）
node "$SCRIPT_DIR/auto-learn-check.js"

# 2. 检查是否需要知识沉淀（任务完成后自动总结）
node "$SCRIPT_DIR/capture-knowledge.js"

echo "✅ 自主学习流程完成"
