# 🐳 Docker 部署指南

**创建时间：** 2026-03-13 00:33  
**更新时间：** 2026-03-13 00:33

---

## 📋 快速启动

### 1. 构建并启动容器

```bash
cd /root/.openclaw/workspace
docker-compose up -d --build
```

### 2. 查看运行状态

```bash
docker-compose ps
```

### 3. 查看日志

```bash
# 查看所有容器日志
docker-compose logs -f

# 查看单个容器日志
docker-compose logs dream-idle
docker-compose logs stock-quant
```

### 4. 停止服务

```bash
docker-compose down
```

---

## 🌐 访问地址

**通过云服务器外网 IP 访问：**

| 项目 | 地址 | 说明 |
|:---|:---|:---|
| DreamIdle | `http://<云服务器 IP>:3000` | 游戏开发学习记录 |
| StockQuant | `http://<云服务器 IP>:8501` | 量化交易学习记录 |

**示例：**
```
http://49.232.215.84:3000
http://49.232.215.84:8501
```

---

## 🔧 防火墙配置

### 腾讯云轻量服务器

1. 登录腾讯云控制台
2. 进入「防火墙」页面
3. 添加规则：
   - 端口：3000，协议：TCP，策略：允许
   - 端口：8501，协议：TCP，策略：允许

### 或使用命令

```bash
# 如果使用的是 ufw
sudo ufw allow 3000/tcp
sudo ufw allow 8501/tcp
sudo ufw reload
```

---

## 📊 容器管理

### 查看容器

```bash
docker ps
```

### 重启容器

```bash
docker-compose restart
```

### 进入容器

```bash
# 进入 DreamIdle 容器
docker exec -it dream-idle sh

# 进入 StockQuant 容器
docker exec -it stock-quant bash
```

### 更新代码

```bash
# 代码已挂载，修改后自动生效
# 如需重新构建：
docker-compose up -d --build
```

---

## 💾 数据持久化

**已配置卷挂载：**

| 容器 | 挂载路径 | 说明 |
|:---|:---|:---|
| dream-idle | `./projects/dream-idle:/app` | 代码实时同步 |
| stock-quant | `./projects/stock-quant:/app` | 代码实时同步 |

**修改代码后：**
- DreamIdle: Vite 热更新，自动刷新
- StockQuant: Streamlit 自动重新加载

---

## 🔍 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
docker-compose ps
netstat -tulpn | grep -E '3000|8501'
```

### 无法访问外网

1. **检查防火墙**
   ```bash
   sudo ufw status
   ```

2. **检查云服务商安全组**
   - 腾讯云控制台 → 防火墙 → 添加规则

3. **测试本地访问**
   ```bash
   curl http://localhost:3000
   curl http://localhost:8501
   ```

### 内存不足

```bash
# 查看资源使用
docker stats

# 停止不用的容器
docker-compose down
```

---

## 📝 日常使用

### 早上启动

```bash
cd /root/.openclaw/workspace
docker-compose up -d
```

### 晚上停止

```bash
docker-compose down
```

### 查看学习记录

```
访问：http://<云服务器 IP>:3000
→ 点击 "学习记录" 按钮

访问：http://<云服务器 IP>:8501
→ 查看主页面
```

---

## 🎯 自动更新机制

**学习记录自动同步：**

1. 我完成一个任务
   ↓
2. 更新 `learning-state.json`
   ↓
3. 知识沉淀到 `knowledge-base/`
   ↓
4. Web 页面自动显示最新状态

**你只需要：**
- 访问页面
- 点击按钮
- 查看更新

---

## 📊 资源占用

| 容器 | CPU | 内存 | 磁盘 |
|:---|:---|:---|:---|
| dream-idle | ~5% | ~200MB | ~500MB |
| stock-quant | ~2% | ~150MB | ~300MB |

**总计：** ~7% CPU, ~350MB 内存

---

## 🔗 相关文档

- [项目说明](./PROJECTS.md)
- [知识库](./knowledge-base/README.md)
- [学习状态](./data/learning-state.json)

---

**状态：** 🟢 Docker 部署配置完成  
**端口：** 3000 (DreamIdle), 8501 (StockQuant)
