# 🔧 WebSocket 3001 端口修复方案

## ✅ 测试结果

**本地测试：** WebSocket 完全正常 ✅  
**外网访问：** 超时 ❌

## 🔍 问题原因

**腾讯云安全组没有开放 3001 端口！**

 WebSocket 使用 3001 端口，但安全组只开放了 3000（HTTP），没有开放 3001（WebSocket）。

---

## 🎯 解决方案

### 方案 A：开放 3001 端口（推荐）

**腾讯云控制台操作：**

1. 访问：https://console.cloud.tencent.com/cvm/securitygroup/
2. 找到你的安全组
3. 点击"修改规则" → "入站规则"
4. 添加规则：
   ```
   类型：自定义
   协议端口：TCP:3001
   来源：0.0.0.0/0
   策略：允许
   ```
5. 保存，等待 1 分钟

**测试：** 刷新页面，应该能连接了

---

### 方案 B：WebSocket 和 HTTP 用同一个端口

如果不想开放新端口，可以修改后端配置，让 WebSocket 也用 3000 端口。

**修改后端代码：**
```python
# server.py
# 不需要修改，FastAPI 默认支持同端口 WebSocket
```

**但是需要重启服务到 3000 端口：**

```bash
# 停止当前服务
pkill -f "python server.py"
pkill -f vite

# 修改后端端口为 3000
cd /root/.openclaw/workspace/projects/slay-the-web/backend
sed -i 's/port=3001/port=3000/' server.py

# 修改前端 WebSocket 端口为 3000
cd /root/.openclaw/workspace/projects/slay-the-web/frontend/src/components
sed -i 's/:3001/:3000/' Game.tsx

# 启动后端
./venv/bin/python server.py &

# 启动前端
cd ../frontend
npm run dev -- --host 0.0.0.0 --port 3000 &
```

**访问：** http://49.232.215.84:3000

---

## 📊 我的建议

**立即执行方案 B** - 同端口方案：
- ✅ 不需要配置安全组
- ✅ 3000 端口已经开放
- ✅ 马上就能玩

---

## 🚀 要我帮你改吗？

回复我：
- **B** - 帮我改成同端口，现在就要玩！

我马上动手！(´▽｀) ﾉ
