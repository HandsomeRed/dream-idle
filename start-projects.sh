#!/bin/bash

# 项目启动脚本
# 同时启动 DreamIdle 和 StockQuant 两个学习项目

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$SCRIPT_DIR"

echo "========================================"
echo "🚀 启动学习项目展示"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装 Python3"
    exit 1
fi

# 启动 DreamIdle (React)
echo "🎮 启动 DreamIdle (游戏开发项目)..."
cd "$WORKSPACE_DIR/projects/dream-idle"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "   📦 安装依赖..."
    npm install
fi

# 后台启动 Vite Dev Server
export PORT=3000
npm run dev -- --port 3000 --host 0.0.0.0 &
DREAM_IDLE_PID=$!
echo "   ✅ DreamIdle 已启动 (PID: $DREAM_IDLE_PID)"
echo "   🌐 访问地址：http://localhost:3000"
echo ""

# 启动 StockQuant (Streamlit)
echo "📈 启动 StockQuant (量化交易项目)..."
cd "$WORKSPACE_DIR/projects/stock-quant"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "   📦 创建虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -q streamlit pandas numpy
else
    source venv/bin/activate
fi

# 检查 Streamlit
if ! python3 -c "import streamlit" 2>/dev/null; then
    echo "   📦 安装 Streamlit..."
    pip install -q streamlit
fi

# 后台启动 Streamlit
streamlit run app.py --server.port 8501 --server.address 0.0.0.0 &
STOCK_QUANT_PID=$!
echo "   ✅ StockQuant 已启动 (PID: $STOCK_QUANT_PID)"
echo "   🌐 访问地址：http://localhost:8501"
echo ""

echo "========================================"
echo "✅ 所有项目已启动！"
echo "========================================"
echo ""
echo "📊 访问地址："
echo "   🎮 DreamIdle:   http://localhost:3000"
echo "   📈 StockQuant:  http://localhost:8501"
echo ""
echo "💡 提示："
echo "   - 点击右上角 '学习记录' 按钮查看详细记录"
echo "   - 按 Ctrl+C 停止所有服务"
echo ""

# 等待进程
wait
