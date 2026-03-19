# 自主学习机制说明

**创建时间：** 2026-03-12 02:25  
**状态：** ✅ 已激活

---

## 🎯 目标

实现 AI 助手的**自主学习能力**，无需用户每次触发，自动在 24 小时学习时段内持续学习。

---

## 🔄 工作流程

### 1. 定时触发（每 15 分钟）

```
heartbeat-check 定时任务
    ↓
执行 scripts/auto-learn.sh
    ↓
运行 scripts/auto-learn-check.js
    ↓
检查并更新学习状态
```

### 2. 时间段识别

| 时段 | 时间段 | 学习主题 |
|:---|:---|:---|
| **游戏开发** | 00:00-10:00 | 放置挂机游戏 |
| **量化交易** | 10:00-20:00 | A 股量化服务 |
| **总结提升** | 20:00-24:00 | 进化报告 + 自由学习 |

### 3. 学习决策逻辑

```javascript
if (当前时间段内 && 未超时) {
  ✅ 继续当前学习主题
} else if (新时间段) {
  🆕 初始化新学习主题
} else if (连续学习≥2 小时) {
  ⚠️ 建议休息
}
```

---

## 📁 核心文件

### 1. `scripts/auto-learn-check.js`
**功能：** 学习状态检查和更新

**主要函数：**
- `getCurrentTimeSlot()` - 获取当前时间段
- `shouldContinueLearning()` - 判断是否继续学习
- `getNextTopic()` - 获取下一个学习主题
- `main()` - 主流程

### 2. `data/learning-state.json`
**功能：** 学习状态跟踪

**数据结构：**
```json
{
  "currentSession": {
    "kind": "game-dev",
    "startTime": "2026-03-12T01:51:00+08:00",
    "topic": "放置挂机游戏开发",
    "subTopic": "游戏数值设计与战斗系统",
    "status": "in-progress"
  },
  "learningProgress": {
    "game-dev": {
      "v0.1": { "status": "completed" },
      "v0.2": { "status": "in-progress" }
    }
  },
  "autoLearnConfig": {
    "enabled": true,
    "maxContinuousLearnHours": 2
  }
}
```

### 3. `data/heartbeat-state.json`
**功能：** Heartbeat 执行记录

**记录内容：**
- 最后检查时间
- 自主学习检查时间
- 统计信息

---

## ⚙️ 配置说明

### 最大连续学习时间

**默认：** 2 小时  
**位置：** `learning-state.json.autoLearnConfig.maxContinuousLearnHours`

**作用：** 防止过度学习，强制休息

### 检查间隔

**默认：** 15 分钟  
**配置：** `openclaw cron` 中的 `heartbeat-check` 任务（*/15 * * * *）

### 学习时段配置

**位置：** `learning-state.json.autoLearnConfig.topics`

```json
{
  "game-dev": {
    "timeSlot": "00:00-10:00",
    "priority": "high",
    "resources": ["放置游戏设计理论", ...]
  }
}
```

---

## 📊 状态跟踪

### 学习进度

每个项目按版本/阶段跟踪：

**游戏开发：**
- v0.1 角色创建系统 ✅
- v0.2 属性系统 + 数值 🔄
- v0.3 战斗系统 ⏳
- v0.4 任务系统 ⏳

**量化交易：**
- Stage 1 数据获取 ⏳
- Stage 2 策略回测 ⏳
- Stage 3 模拟交易 ⏳

### 统计指标

| 指标 | 说明 |
|:---|:---|
| `learnSessions` | 学习会话次数 |
| `learnHours` | 累计学习时长 |
| `topicsCovered` | 覆盖主题数 |
| `testsWritten` | 编写测试数 |
| `featuresImplemented` | 实现功能数 |

---

## 🚀 使用方式

### 自动触发（推荐）

无需手动操作，heartbeat 每 30 分钟自动检查并继续学习。

### 手动触发

```bash
# 运行学习检查
node ~/.openclaw/workspace/scripts/auto-learn-check.js

# 或通过 shell 脚本
~/.openclaw/workspace/scripts/auto-learn.sh
```

### 查看状态

```bash
# 查看学习状态
cat ~/.openclaw/workspace/data/learning-state.json

# 查看 heartbeat 状态
cat ~/.openclaw/workspace/data/heartbeat-state.json
```

---

## 🔧 自定义配置

### 修改学习时段

编辑 `learning-state.json`：

```json
{
  "autoLearnConfig": {
    "topics": {
      "game-dev": {
        "timeSlot": "01:00-11:00"  // 自定义时段
      }
    }
  }
}
```

### 修改最大连续学习时间

```json
{
  "autoLearnConfig": {
    "maxContinuousLearnHours": 3  // 改为 3 小时
  }
}
```

### 添加新学习主题

```json
{
  "learningProgress": {
    "new-topic": {
      "phase1": {
        "topic": "新主题",
        "status": "pending"
      }
    }
  }
}
```

---

## 📝 日志记录

每次 heartbeat 检查会记录：

- 检查时间
- 当前时间段
- 学习主题
- 决策结果（继续/休息/新主题）

日志位置：`heartbeat-state.json.lastChecks.autoLearn`

---

## ✅ 激活状态

**当前状态：** ✅ 已激活

**下次检查：** 约 30 分钟后（由 cron 调度）

**当前学习：** 游戏开发 → v0.2 属性系统（进行中）

---

## 🎯 效果

通过自主学习机制：

1. ✅ **无需用户触发** - 自动每 30 分钟检查
2. ✅ **持续学习** - 时间段内自动继续
3. ✅ **状态跟踪** - 完整的学习进度记录
4. ✅ **智能休息** - 连续学习 2 小时后建议休息
5. ✅ **时段切换** - 自动识别并切换学习主题

---

**小红主人，自主学习机制已激活！** 🎉

现在每 30 分钟 heartbeat 会自动检查：
- 如果还在游戏开发时段（00:00-10:00）→ 继续学习游戏开发
- 如果到了量化交易时段（10:00-20:00）→ 自动切换到量化学习
- 如果连续学习≥2 小时 → 建议休息

你不需要再每次触发我学习了！(´▽｀) ﾉ
