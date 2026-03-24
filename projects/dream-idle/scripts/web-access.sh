#!/bin/bash

# 网页访问工具 - 无需 API Key 的 Browser 工具
# 使用 Snap Chromium 无头模式

CHROME=/snap/bin/chromium
OUTPUT_DIR=/root/snap/chromium/common

# 确保输出目录存在
mkdir -p $OUTPUT_DIR

show_help() {
    echo "🌐 网页访问工具 - 无需 API Key"
    echo ""
    echo "用法："
    echo "  $0 <command> [options]"
    echo ""
    echo "命令："
    echo "  screenshot <url> [output.png]  - 截图网页"
    echo "  extract <url>                  - 提取网页内容（使用 Tavily）"
    echo "  test                           - 测试浏览器"
    echo ""
    echo "示例："
    echo "  $0 screenshot https://www.example.com"
    echo "  $0 screenshot https://www.bilibili.com /tmp/bilibili.png"
    echo "  $0 test"
}

screenshot() {
    local url=$1
    local output=${2:-$OUTPUT_DIR/screenshot.png}
    
    echo "📸 正在截图：$url"
    echo "输出：$output"
    
    $CHROME \
        --headless \
        --disable-gpu \
        --no-sandbox \
        --disable-dev-shm-usage \
        --screenshot=$output \
        --window-size=1920,1080 \
        "$url" 2>&1 | grep -v "ERROR: ld.so" | grep -v "dbind-WARNING" | grep -v "ERROR:dbus"
    
    if [ -f "$output" ]; then
        echo "✅ 截图成功！"
        ls -lh "$output"
        echo ""
        echo "文件路径：$output"
    else
        echo "❌ 截图失败"
        exit 1
    fi
}

test_browser() {
    echo "🔍 测试 Chromium 浏览器..."
    echo ""
    
    # 版本检查
    echo "版本信息："
    $CHROME --version 2>&1 | grep -v "ERROR: ld.so"
    echo ""
    
    # 截图测试
    echo "截图测试："
    screenshot "https://www.example.com" "$OUTPUT_DIR/test.png"
    echo ""
    
    # 验证文件
    if [ -f "$OUTPUT_DIR/test.png" ]; then
        file "$OUTPUT_DIR/test.png"
        echo ""
        echo "✅ 浏览器工作正常！"
    else
        echo "❌ 浏览器测试失败"
        exit 1
    fi
}

# 主程序
case "$1" in
    screenshot)
        if [ -z "$2" ]; then
            echo "❌ 请提供 URL"
            show_help
            exit 1
        fi
        screenshot "$2" "$3"
        ;;
    extract)
        if [ -z "$2" ]; then
            echo "❌ 请提供 URL"
            show_help
            exit 1
        fi
        echo "📄 提取网页内容：$2"
        cd /root/.openclaw/workspace/skills/tavily-search
        export TAVILY_API_KEY="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"
        node scripts/extract.mjs "$2"
        ;;
    test)
        test_browser
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac
