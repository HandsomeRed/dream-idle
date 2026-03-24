#!/usr/bin/env python3
"""
配置加载模块 - 从 config.json 加载监控列表
"""

import json
from pathlib import Path

CONFIG_FILE = Path(__file__).parent.parent / "config.json"

def load_config():
    """加载配置文件"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def get_watchlist():
    """获取监控列表"""
    config = load_config()
    if config:
        return config.get("watchlist", [])
    return []

def get_settings():
    """获取设置"""
    config = load_config()
    if config:
        return config.get("settings", {})
    return {
        "alert_cooldown_minutes": 30,
        "enable_feishu_notify": True,
        "log_level": "INFO"
    }
