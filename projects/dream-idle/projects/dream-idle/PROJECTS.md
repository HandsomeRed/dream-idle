# 🚀 学习项目部署说明

**创建时间：** 2026-03-13 00:30  
**更新时间：** 2026-03-13 00:30

---

## 📋 项目列表

### 1. 🎮 DreamIdle（游戏开发）

**技术栈：** React + TypeScript + Vite + TailwindCSS  
**访问地址：** http://localhost:3000  
**学习记录按钮：** 页面右上角

**功能：**
- ✅ 角色创建系统 (v0.1)
- ✅ 属性系统 (v0.2)
- 📝 学习记录展示（点击按钮查看）

**启动方式：**
```bash
cd /root/.openclaw/workspace/projects/dream-idle
npm run dev
```

---

### 2. 📈 StockQuant（量化交易）

**技术栈：** Python + Streamlit + AKShare + Pandas  
**访问地址：** http://localhost:8501  
**学习记录：** 侧边栏 + 主页面

**功能：**
- ✅ Stage 1 数据获取
- ✅ Stage 1b 技术指标
- ✅ Stage 2 策略回测
- 📝 学习记录展示

**启动方式：**
```bash
cd /root/.openclaw/workspace/projects/stock-quant
source venv/bin/activate
streamlit run app.py
```

---

## 🚀 一键启动

**启动脚本：**
```bash
/root/.openclaw/workspace/start-projects.sh
```

**功能：**
- 同时启动两个项目
- 自动检查依赖
- 显示访问地址

**访问：**
- DreamIdle: http://localhost:3000
- StockQuant: http://localhost:8501

---

## 📊 学习记录功能

### DreamIdle - 更新记录按钮

**位置：** 页面右上角  
**点击显示：**
- 今日完成功能
- 测试通过率
- 知识库更新
- 明日计划

### StockQuant - 学习记录页面

**位置：** 主页面 + 侧边栏  
**显示内容：**
- 阶段完成情况
- 测试统计
- 知识沉淀
- 回测结果
- 明日计划

---

## 📁 项目路径

```
/root/.openclaw/workspace/
├── projects/
│   ├── dream-idle/        # 游戏开发项目
│   │   ├── src/
│   │   ├── tests/
│   │   └── ...
│   └── stock-quant/       # 量化交易项目
│       ├── src/
│       ├── tests/
│       ├── app.py         # Streamlit 应用
│       └── ...
├── knowledge-base/        # 知识库
│   ├── game-dev/
│   ├── quant-trading/
│   └── self-evolution/
└── start-projects.sh      # 启动脚本
```

---

## 🔍 检查学习记录

### 1. 访问项目页面

**DreamIdle:**
```
http://localhost:3000
→ 点击右上角 "学习记录" 按钮
```

**StockQuant:**
```
http://localhost:8501
→ 查看主页面学习记录
→ 侧边栏查看知识库
```

### 2. 查看知识库

```bash
# 游戏开发知识
ls /root/.openclaw/workspace/knowledge-base/game-dev/

# 量化交易知识
ls /root/.openclaw/workspace/knowledge-base/quant-trading/

# 自我进化知识
ls /root/.openclaw/workspace/knowledge-base/self-evolution/
```

### 3. 查看学习状态

```bash
cat /root/.openclaw/workspace/data/learning-state.json
```

---

## 💡 使用建议

### 每日检查流程

1. **早上 (00:00-10:00)**
   - 访问 http://localhost:3000
   - 查看游戏开发进度
   - 点击"学习记录"查看完成情况

2. **下午 (10:00-20:00)**
   - 访问 http://localhost:8501
   - 查看量化交易进度
   - 检查回测结果

3. **晚上 (20:00-24:00)**
   - 查看两个项目的学习记录
   - 检查知识库更新
   - 给出使用建议

### 给出建议的方式

**直接在项目中查看：**
- 学习记录会显示完成的功能、测试、知识
- 可以了解虾虾红今天学了什么

**查看知识库：**
- 知识卡片有详细的实现说明
- 可以了解技术细节

**检查测试：**
```bash
# 游戏开发测试
cd projects/dream-idle && npm test

# 量化交易测试
cd projects/stock-quant && source venv/bin/activate && pytest
```

---

## 🎯 自动更新机制

**学习记录自动更新：**
- 每完成一个任务，自动更新 `learning-state.json`
- 知识沉淀自动保存到 `knowledge-base/`
- Web 页面会显示最新状态

**手动刷新：**
- DreamIdle: 浏览器刷新即可
- StockQuant: Streamlit 会自动刷新

---

## 📝 更新日志

### 2026-03-13 - 项目部署完成
- ✅ DreamIdle 学习记录按钮
- ✅ StockQuant Streamlit 界面
- ✅ 一键启动脚本
- ✅ 知识库集成

---

**状态：** 🟢 项目已就绪，随时可以访问！
