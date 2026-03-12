#!/bin/bash

echo "========================================"
echo "🔍 防火墙检查工具"
echo "========================================"
echo ""

# 检查服务是否运行
echo "📊 服务状态："
if netstat -tulpn 2>/dev/null | grep -q 3000; then
    echo "   ✅ DreamIdle (3000) 运行中"
else
    echo "   ❌ DreamIdle (3000) 未运行"
fi

if netstat -tulpn 2>/dev/null | grep -q 8501; then
    echo "   ✅ StockQuant (8501) 运行中"
else
    echo "   ❌ StockQuant (8501) 未运行"
fi

echo ""

# 检查防火墙
echo "🔒 防火墙状态："

# 检查 ufw
if command -v ufw &> /dev/null; then
    echo "   UFW: 已安装"
    ufw status 2>/dev/null | grep -E "3000|8501" || echo "   ⚠️  端口 3000/8501 未开放"
fi

# 检查 firewalld
if command -v firewall-cmd &> /dev/null; then
    echo "   Firewalld: 已安装"
    firewall-cmd --list-ports 2>/dev/null | grep -E "3000|8501" || echo "   ⚠️  端口 3000/8501 未开放"
fi

# 检查 iptables
if command -v iptables &> /dev/null; then
    echo "   iptables: 已安装"
    iptables -L -n 2>/dev/null | grep -E "3000|8501" || echo "   ℹ️  检查 iptables 规则"
fi

echo ""

# 外网访问测试
echo "🌐 外网访问测试："
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "未知")
echo "   服务器 IP: $SERVER_IP"

echo "   测试 DreamIdle (3000)..."
if curl -s --connect-timeout 3 http://$SERVER_IP:3000 > /dev/null 2>&1; then
    echo "   ✅ 可以访问"
else
    echo "   ❌ 无法访问 - 需要开放防火墙"
fi

echo "   测试 StockQuant (8501)..."
if curl -s --connect-timeout 3 http://$SERVER_IP:8501 > /dev/null 2>&1; then
    echo "   ✅ 可以访问"
else
    echo "   ❌ 无法访问 - 需要开放防火墙"
fi

echo ""
echo "========================================"
echo "💡 解决方案："
echo "========================================"
echo ""
echo "1. 登录腾讯云控制台"
echo "   https://console.cloud.tencent.com/lighthouse"
echo ""
echo "2. 进入「防火墙」页面"
echo ""
echo "3. 添加规则："
echo "   - 端口 3000, TCP, 允许"
echo "   - 端口 8501, TCP, 允许"
echo ""
echo "4. 保存后再次访问："
echo "   http://$SERVER_IP:3000"
echo "   http://$SERVER_IP:8501"
echo ""
