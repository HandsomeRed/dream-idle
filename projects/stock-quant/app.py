#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
StockQuant 学习记录展示界面
使用 Streamlit 快速搭建数据展示 Web 应用
"""

import streamlit as st
import pandas as pd
import json
from pathlib import Path
from datetime import datetime

# 页面配置
st.set_page_config(
    page_title="StockQuant 学习记录",
    page_icon="📈",
    layout="wide"
)

# 自定义 CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
    }
    .stat-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 10px;
        color: white;
        text-align: center;
    }
    .update-item {
        background-color: #f0f2f6;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
        border-left: 4px solid #1f77b4;
    }
</style>
""", unsafe_allow_html=True)

# 侧边栏 - 学习记录按钮
with st.sidebar:
    st.header("📚 知识库")
    
    # 知识库统计
    kb_path = Path.home() / '.openclaw' / 'workspace' / 'knowledge-base'
    quant_kb_path = kb_path / 'quant-trading'
    
    if quant_kb_path.exists():
        kb_files = list(quant_kb_path.glob('*.md'))
        st.metric("知识卡片", len(kb_files))
    
    st.markdown("---")
    
    # 知识列表
    st.subheader("📝 量化交易知识")
    if quant_kb_path.exists():
        for file in sorted(kb_files, reverse=True):
            st.markdown(f"📄 {file.stem}")
    
    st.markdown("---")
    st.info("💡 点击右侧按钮查看详细学习记录")

# 主标题
st.markdown('<h1 class="main-header">📈 StockQuant 学习记录</h1>', unsafe_allow_html=True)
st.markdown("### 虾虾红的 A 股量化交易实践")
st.markdown("---")

# 统计概览
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        label="📊 完成阶段",
        value="3",
        delta="Stage 1/1b/2"
    )

with col2:
    st.metric(
        label="✅ 测试通过",
        value="26/27",
        delta="96% 通过率"
    )

with col3:
    st.metric(
        label="📚 知识沉淀",
        value="5 篇",
        delta="量化知识库"
    )

with col4:
    st.metric(
        label="🏆 最佳策略",
        value="+36.58%",
        delta="双均线 12/26"
    )

st.markdown("---")

# 学习记录时间线
st.header("📅 开发记录")

# Stage 2 - 策略回测引擎
with st.container():
    st.markdown("""
    <div class="update-item">
        <h3>🎯 Stage 2 - 策略回测引擎</h3>
        <p><strong>完成时间：</strong>2026-03-12 20:00</p>
        <p><strong>实现内容：</strong></p>
        <ul>
            <li>✅ 策略基类接口 (base.py)</li>
            <li>✅ 均线交叉策略 (ma_cross.py) - 3 种策略</li>
            <li>✅ 回测引擎 (backtester.py) - 含手续费、绩效分析</li>
            <li>✅ 回测演示脚本 (backtest_demo.py)</li>
            <li>✅ 9 个单元测试，100% 通过率</li>
        </ul>
        <p><strong>回测结果（平安银行 2024）：</strong></p>
        <ul>
            <li>MA5/20 金叉死叉：-1.81%</li>
            <li>MA10/30 金叉死叉：-3.15%</li>
            <li><strong>双均线 12/26：+36.58% ⭐</strong></li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

# Stage 1b - 技术指标计算
with st.container():
    st.markdown("""
    <div class="update-item">
        <h3>📊 Stage 1b - 技术指标计算</h3>
        <p><strong>完成时间：</strong>2026-03-12 19:00</p>
        <p><strong>实现内容：</strong></p>
        <ul>
            <li>✅ K 线计算器 (kline_calculator.py)</li>
            <li>✅ MA/EMA/MACD/RSI/布林带</li>
            <li>✅ 11 个单元测试，100% 通过率</li>
            <li>✅ Jupyter 示例 Notebook</li>
        </ul>
        <p><strong>支持指标：</strong></p>
        <p>MA(5/10/20/60), EMA(12/26), MACD, RSI(14), 布林带 (20,2)</p>
    </div>
    """, unsafe_allow_html=True)

# Stage 1 - 数据获取
with st.container():
    st.markdown("""
    <div class="update-item">
        <h3>📡 Stage 1 - 数据获取</h3>
        <p><strong>完成时间：</strong>2026-03-12 18:30</p>
        <p><strong>实现内容：</strong></p>
        <ul>
            <li>✅ 数据获取模块 (fetch_stock_data.py)</li>
            <li>✅ 获取 5489 只 A 股股票列表</li>
            <li>✅ 获取平安银行 2024 年历史数据 (242 条)</li>
            <li>✅ 6/7 测试通过</li>
        </ul>
        <p><strong>数据文件：</strong></p>
        <ul>
            <li>stock_list.csv - 5489 只股票</li>
            <li>000001_history.csv - 平安银行历史数据</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# 明日计划
st.header("🎯 明日计划 (Stage 3)")

plan_col1, plan_col2 = st.columns(2)

with plan_col1:
    st.markdown("""
    **Stage 3 - 模拟交易**
    - [ ] 交易信号生成
    - [ ] 持仓管理
    - [ ] 盈亏计算
    - [ ] 模拟交易界面
    """)

with plan_col2:
    st.markdown("""
    **策略扩展**
    - [ ] RSI 策略实现
    - [ ] MACD 策略实现
    - [ ] 多股票批量回测
    - [ ] 策略参数优化
    """)

st.markdown("---")

# 项目信息
st.markdown("### 📁 项目信息")
st.code("""
项目路径：~/.openclaw/workspace/projects/stock-quant

启动命令:
  cd /root/.openclaw/workspace/projects/stock-quant
  source venv/bin/activate
  streamlit run app.py

访问地址：http://localhost:8501
""", language="bash")

# 底部
st.markdown("---")
st.markdown("最后更新：2026-03-13 00:30 | 🟢 学习进行中")
