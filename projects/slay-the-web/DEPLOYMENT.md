# 🚀 Slay the Web 部署说明

## ✅ 部署完成！

**访问地址：** http://49.232.215.84:4001

## 📁 项目位置

```
/root/.openclaw/workspace/projects/slay-the-web/
├── backend/          # Python 后端 (端口 4000)
│   ├── server.py     # WebSocket 服务器
│   ├── venv/         # Python 虚拟环境
│   └── requirements.txt
└── frontend/         # React 前端 (端口 4001)
    ├── src/
    ├── package.json
    └── vite.config.ts
```

## 🛠️ 服务管理

### 启动服务
```bash
# 后端
cd /root/.openclaw/workspace/projects/slay-the-web/backend
./venv/bin/python server.py &

# 前端
cd /root/.openclaw/workspace/projects/slay-the-web/frontend
npm run dev -- --host 0.0.0.0 &
```

### 查看日志
```bash
# 后端日志
tail -f /tmp/slay-web-backend.log

# 前端日志
tail -f /tmp/slay-web-frontend.log
```

### 停止服务
```bash
pkill -f "python server.py"
pkill -f "vite"
```

## 🎮 游戏说明

### v0.1 功能
- ✅ 单场战斗
- ✅ 8 张基础卡牌
- ✅ 敌人 AI
- ✅ 回合制战斗
- ✅ 战斗日志

### 操作说明
1. 点击"开始战斗"
2. 点击手牌出牌（需要足够能量）
3. 点击"结束回合"
4. 击败敌人或失败后可以选择"再来一局"

### 卡牌列表
| 卡牌 | 类型 | 消耗 | 效果 |
|:---|:---|:---|:---|
| 打击 ⚔️ | 攻击 | 1 | 造成 6 点伤害 |
| 防御 🛡️ | 技能 | 1 | 获得 5 点格挡 |
| 重击 💥 | 攻击 | 2 | 造成 10 点伤害 |
| 铁波 🌊 | 攻击 | 1 | 造成 4 点伤害 + 5 格挡 |
| 顺劈 ✂️ | 攻击 | 1 | 造成 8 点伤害 |
| 锻甲 🔨 | 技能 | 1 | 获得 8 点格挡 |
| 激怒 🔥 | 能力 | 1 | 获得 2 点能量 |
| 抽牌 🎴 | 技能 | 0 | 抽取 2 张牌 |

## 📊 技术架构

```
浏览器 (React)  ←──WebSocket──→  Python 后端 (FastAPI)
     :4001                           :4000
```

## 🎯 后续开发计划

### v0.2 (下一步)
- [ ] 更多卡牌 (15-20 张)
- [ ] 多个敌人
- [ ] 精英怪/BOSS
- [ ] 遗物系统
- [ ] 药水系统

### v0.3
- [ ] 地图探索
- [ ] 房间选择
- [ ] 商店系统
- [ ] 休息点

### v0.4
- [ ] 存档功能
- [ ] 多角色
- [ ] 进阶系统

---

**Made with ❤️ by 虾虾红**  
**版本：** v0.1  
**更新时间：** 2026-03-20 01:01
