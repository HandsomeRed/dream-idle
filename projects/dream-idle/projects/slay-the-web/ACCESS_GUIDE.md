# ✅ Slay the Web v0.1 - 访问说明

## 🎉 服务已启动！

**服务状态：**
- ✅ 后端运行中 (端口 4000)
- ✅ 前端运行中 (端口 4001)
- ✅ WebSocket 就绪

---

## 🌐 访问方式

### 方式 1：外网访问（推荐）

**地址：** http://49.232.215.84:4001

**适用场景：**
- 从任何地方访问
- 手机、平板、电脑都可以
- 可以分享给朋友

**前提条件：**
- ✅ 云服务器安全组已开放 4001 端口
- ⏳ 安全组规则可能需要 1-2 分钟生效

---

### 方式 2：本地访问

**地址：** http://localhost:4001

**适用场景：**
- 在服务器本机上测试
- SSH 隧道访问

---

### 方式 3：SSH 隧道

如果你的电脑无法直接访问外网 IP，可以用 SSH 隧道：

```bash
# 在你的电脑上执行
ssh -L 4001:localhost:4001 root@49.232.215.84

# 然后访问
http://localhost:4001
```

---

## 🔍 测试连接

### 测试步骤

1. **等待 1-2 分钟** - 安全组规则需要时间生效

2. **打开浏览器** - 推荐 Chrome/Edge/Firefox

3. **访问** - http://49.232.215.84:4001

4. **如果看到游戏界面** - 成功！🎉

5. **如果打不开** - 继续往下看

---

## 🐛 常见问题

### Q1: 页面加载不出来

**可能原因：**
- 安全组规则还未生效（等待 1-2 分钟）
- 浏览器缓存问题（尝试强制刷新 Ctrl+Shift+R）
- 网络问题

**解决方法：**
```bash
# 检查服务是否运行
curl http://localhost:4001

# 如果返回 HTML，说明服务正常
# 问题在外网访问，检查安全组
```

### Q2: WebSocket 连接失败

**可能原因：**
- 防火墙阻止 WebSocket

**解决方法：**
确保安全组同时开放了 TCP 和 WebSocket 连接

### Q3: 页面显示空白

**可能原因：**
- React 应用加载失败
- JavaScript 错误

**解决方法：**
1. 打开浏览器开发者工具（F12）
2. 查看 Console 中的错误信息
3. 截图发给我

---

## 🎮 游戏操作

1. **开始游戏** - 点击"开始战斗"
2. **出牌** - 点击手牌（需要足够能量⚡）
3. **结束回合** - 点击"结束回合"按钮
4. **击败敌人** - 将敌人 HP 降为 0
5. **再来一局** - 游戏结束后点击重新开始

---

## 📱 支持的设备

- ✅ 桌面浏览器（Chrome/Edge/Firefox/Safari）
- ✅ 手机浏览器（iOS/Android）
- ✅ 平板电脑

---

## 🛠️ 技术信息

**项目位置：**
```
/root/.openclaw/workspace/projects/slay-the-web/
```

**查看日志：**
```bash
# 前端日志
tail -f /tmp/slay-web-frontend.log

# 后端日志
tail -f /tmp/slay-web-backend.log
```

**重启服务：**
```bash
# 停止
pkill -f "vite"
pkill -f "python server.py"

# 启动
cd /root/.openclaw/workspace/projects/slay-the-web/backend
./venv/bin/python server.py &

cd /root/.openclaw/workspace/projects/slay-the-web/frontend
npm run dev -- --host 0.0.0.0 --port 4001 &
```

---

## 📞 需要帮助？

如果遇到问题，告诉我：
1. 浏览器中看到的错误信息
2. F12 Console 中的错误截图
3. 你是从哪里访问的（本地/远程/手机）

我会帮你解决！(´▽｀) ﾉ

---

**版本：** v0.1  
**更新时间：** 2026-03-20 01:11  
**开发者：** 虾虾红
