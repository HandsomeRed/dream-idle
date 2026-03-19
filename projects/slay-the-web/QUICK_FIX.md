# 🚀 立即可用的解决方案

## 问题根源

你的云服务器：
- **内网 IP：** 10.2.0.11
- **公网 IP：** 49.232.215.84（NAT 映射）

**问题：** 即使安全组配置正确，外网流量可能还被腾讯云的**网络 ACL**或其他安全策略阻止。

---

## ✅ 方案 A：使用已开放的端口（推荐，5 分钟搞定）

既然你的**梦幻放置 (:3000)** 能访问，说明 3000 端口是通的。

**快速修改：**

```bash
# 1. 停止当前服务
pkill -f "vite"
pkill -f "python server.py"

# 2. 修改前端端口为 3000
cd /root/.openclaw/workspace/projects/slay-the-web/frontend
sed -i 's/port: 4001/port: 3000/' vite.config.ts

# 3. 修改后端端口为 3001（避免冲突）
cd /root/.openclaw/workspace/projects/slay-the-web/backend
sed -i 's/port=4000/port=3001/' server.py

# 4. 启动服务
cd /root/.openclaw/workspace/projects/slay-the-web/backend
./venv/bin/python server.py &

cd /root/.openclaw/workspace/projects/slay-the-web/frontend
npm run dev -- --host 0.0.0.0 --port 3000 &

# 5. 等待启动
sleep 5
echo "服务启动完成！"
```

**访问地址：** http://49.232.215.84:3000

---

## ✅ 方案 B：用 Nginx 反向代理（如果你有 Nginx）

**检查是否有 Nginx：**
```bash
which nginx
nginx -v
```

**如果有，配置反向代理：**

```bash
# 创建 Nginx 配置
cat > /etc/nginx/conf.d/slay-the-web.conf << 'EOF'
server {
    listen 8888;
    server_name 49.232.215.84;
    
    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# 重启 Nginx
systemctl restart nginx

# 开放 8888 端口（在腾讯云安全组）
```

**访问地址：** http://49.232.215.84:8888

---

## ✅ 方案 C：继续排查 4001 端口

### 检查网络 ACL

腾讯云除了安全组，还有**网络 ACL**（子网级别）：

1. 登录腾讯云控制台
2. 进入 **私有网络 VPC**
3. 找到你的子网
4. 查看是否绑定了网络 ACL
5. 如果有，检查入站规则是否有 4001

### 检查默认安全组

你可能还有一个**默认安全组**：

1. 腾讯云控制台 → 云服务器 → 实例详情
2. 安全组标签 → 查看绑定了几个安全组
3. 如果有多个，**每个**都要添加 4001 规则

### 用 telnet 测试

在你的电脑（不是服务器）：
```bash
telnet 49.232.215.84 4001
```

如果显示"无法打开连接"，说明端口确实不通。

---

## 🎯 我的建议

**立即执行方案 A**，改用 3000 端口：

1. 梦幻放置能访问 → 3000 端口肯定通
2. 5 分钟就能改好
3. 马上就能玩

**长期方案：**
- 继续排查 4001 端口（网络 ACL/多个安全组）
- 或者就用 3000 端口

---

## 📞 要我帮你改吗？

告诉我你的选择：

**A.** 帮我改到 3000 端口，现在就要玩！
**B.** 继续排查 4001，我不急

我随时待命！(´▽｀) ﾉ
