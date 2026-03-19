# 🔧 WebSocket 端口修复

## 问题原因

前端代码中 WebSocket URL 写死了端口 `4000`：
```typescript
const wsUrl = `ws://${window.location.hostname}:4000/ws/${gameId}`
```

但后端实际运行在 `3001` 端口。

## ✅ 已修复

修改为：
```typescript
const wsUrl = `ws://${window.location.hostname}:3001/ws/${gameId}`
```

## 🎯 测试步骤

1. **刷新浏览器**（Ctrl + Shift + R 强制刷新）
2. **清除浏览器缓存**
3. **重新访问** http://49.232.215.84:3000
4. 点击"开始战斗"

## 📊 服务状态

| 服务 | 端口 | 状态 |
|:---|:---:|:---|
| 前端 | 3000 | ✅ 运行中 |
| 后端 | 3001 | ✅ 运行中 |
| WebSocket | 3001 | ✅ 就绪 |

## 🔍 如果还是显示加载中

打开浏览器开发者工具（F12）：

1. **Console 标签** - 查看是否有错误
2. **Network 标签** - 查看 WebSocket 连接状态
3. 截图发给我

可能的错误：
- `WebSocket connection failed` - 端口问题
- `Connection refused` - 后端服务未启动
- `404 Not Found` - WebSocket 路径错误

---

**现在请刷新页面重试！** (´▽｀) ﾉ
