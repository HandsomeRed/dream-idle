# 🎮 Slay the Web

将《杀戮尖塔》核心战斗系统移植到网页端

## 📋 项目状态

- [x] 项目初始化
- [ ] 后端 API 服务
- [ ] 前端 React 界面
- [ ] WebSocket 实时通信
- [ ] 部署到外网

## 🏗️ 技术架构

```
┌─────────────┐         WebSocket         ┌─────────────┐
│   浏览器    │ ←───────────────────────→ │   Python    │
│  (React)    │                           │   后端      │
│             │                           │             │
│ - 卡牌展示  │                           │ - 战斗逻辑  │
│ - 玩家操作  │                           │ - 敌人 AI   │
│ - 战斗动画  │                           │ - 游戏状态  │
└─────────────┘                           └─────────────┘
```

## 📁 项目结构

```
slay-the-web/
├── backend/           # Python 后端
│   ├── server.py      # WebSocket 服务器
│   ├── combat.py      # 战斗逻辑（复用原项目）
│   └── requirements.txt
├── frontend/          # React 前端
│   ├── src/
│   │   ├── App.tsx    # 主界面
│   │   ├── components/
│   │   └── utils/
│   └── package.json
└── README.md
```

## 🚀 快速开始

### 后端
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

## 🌐 访问地址

- 本地：http://localhost:4000
- 外网：http://49.232.215.84:4000

## 🎯 v0.1 目标

- ✅ 单场战斗可玩
- ✅ 基础卡牌系统
- ✅ 敌人 AI
- ✅ 简单的战斗动画

---

**Made with ❤️ by 虾虾红**
