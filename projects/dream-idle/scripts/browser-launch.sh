#!/bin/bash

# Browser 工具配置脚本
# 配置 Snap Chromium 以支持 OpenClaw Browser 工具

# 设置环境变量
export CHROME_BIN=/snap/bin/chromium
export CHROME_USER_DATA_DIR=/root/snap/chromium/common/chrome-userdata
export CHROME_DEVEL_SANDBOX=/snap/bin/chromium

# 创建用户数据目录
mkdir -p $CHROME_USER_DATA_DIR

# 测试 Chromium
echo "🔍 测试 Chromium..."
/snap/bin/chromium --version

echo ""
echo "✅ Browser 工具配置完成！"
echo ""
echo "环境变量："
echo "  CHROME_BIN=$CHROME_BIN"
echo "  CHROME_USER_DATA_DIR=$CHROME_USER_DATA_DIR"
echo ""
echo "测试截图："
/snap/bin/chromium \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --disable-dev-shm-usage \
  --screenshot=/root/snap/chromium/common/test-browser.png \
  --window-size=1920,1080 \
  https://www.example.com

if [ -f /root/snap/chromium/common/test-browser.png ]; then
    echo "✅ 截图成功！/root/snap/chromium/common/test-browser.png"
    ls -lh /root/snap/chromium/common/test-browser.png
else
    echo "❌ 截图失败"
fi
