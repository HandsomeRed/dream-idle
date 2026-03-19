# AKShare 数据获取指南

**创建时间：** 2026-03-13 00:15  
**更新时间：** 2026-03-13 00:15  
**分类：** 量化交易  
**标签：** #AKShare #数据获取 #A 股 #Python  
**来源：** 实践  
**状态：** 已固化 ⭐⭐⭐⭐⭐

---

## 📖 核心概念

AKShare 是一个开源的 Python 财经数据接口库，提供 A 股、基金、期货等金融数据的获取。

**官网：** https://akshare.akfamily.xyz/  
**安装：** `pip install akshare`

---

## 🔧 环境搭建

### 1. 创建虚拟环境

```bash
cd /root/.openclaw/workspace/projects/stock-quant
python3 -m venv venv
source venv/bin/activate
```

### 2. 安装依赖

```bash
pip install akshare pandas numpy matplotlib
```

### 3. requirements.txt

```txt
# 数据获取
akshare>=1.12.0

# 数据处理
pandas>=2.0.0
numpy>=1.24.0

# 数据可视化
matplotlib>=3.7.0

# 测试
pytest>=7.0.0
```

---

## 📝 核心 API

### 1. 获取股票列表

```python
import akshare as ak

# 获取所有 A 股股票列表
df = ak.stock_info_a_code_name()
print(f"A 股总数：{len(df)}")
# 输出：5489 只股票
```

**返回字段：**
- `code` - 股票代码
- `name` - 股票名称

### 2. 获取历史行情

```python
# 获取单只股票历史数据
df = ak.stock_zh_a_hist(
    symbol="000001",        # 股票代码
    period="daily",         # 周期：daily/weekly/monthly
    start_date="20240101",  # 开始日期 YYYYMMDD
    end_date="20241231",    # 结束日期 YYYYMMDD
    adjust="qfq"            # 复权：qfq(前复权)/hfq(后复权)/none
)
```

**返回字段：**
- `日期` - 交易日期
- `股票代码` - 6 位代码
- `开盘` - 开盘价
- `收盘` - 收盘价
- `最高` - 最高价
- `最低` - 最低价
- `成交量` - 成交量（手）
- `成交额` - 成交额（元）
- `振幅` - 振幅（%）
- `涨跌幅` - 涨跌幅（%）
- `涨跌额` - 涨跌额（元）
- `换手率` - 换手率（%）

### 3. 获取实时行情

```python
# 获取所有 A 股实时行情
df = ak.stock_zh_a_spot_em()
```

⚠️ **注意：** 实时行情数据量大，网络不稳定时可能失败

---

## 📊 完整示例代码

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import akshare as ak
import pandas as pd
from pathlib import Path

def fetch_stock_history(symbol: str = "000001", 
                        start_date: str = "20240101", 
                        end_date: str = "20241231") -> pd.DataFrame:
    """获取 A 股股票历史行情数据"""
    print(f"📊 获取股票 {symbol} 历史数据 ({start_date} - {end_date})...")
    
    df = ak.stock_zh_a_hist(
        symbol=symbol,
        period="daily",
        start_date=start_date,
        end_date=end_date,
        adjust="qfq"  # 前复权
    )
    
    print(f"✅ 成功获取 {len(df)} 条记录")
    return df

def save_to_csv(df: pd.DataFrame, filename: str, data_dir: str = "data"):
    """保存 DataFrame 到 CSV 文件"""
    data_path = Path(__file__).parent.parent / data_dir
    data_path.mkdir(exist_ok=True)
    
    filepath = data_path / filename
    df.to_csv(filepath, index=False, encoding='utf-8-sig')
    print(f"💾 数据已保存到：{filepath}")

# 主函数
if __name__ == "__main__":
    # 获取平安银行 2024 年数据
    df = fetch_stock_history("000001", "20240101", "20241231")
    save_to_csv(df, "000001_history.csv")
    
    # 获取股票列表
    stock_list = ak.stock_info_a_code_name()
    save_to_csv(stock_list, "stock_list.csv")
```

---

## ⚠️ 注意事项

1. **网络稳定性** - 实时行情接口可能因网络波动失败
2. **数据复权** - 建议使用前复权（qfq），保证价格连续性
3. **日期格式** - 必须是 YYYYMMDD 格式
4. **股票代码** - 6 位数字，如 "000001"、"600519"
5. **交易日历** - 只返回交易日数据，周末和节假日无数据

---

## 📊 实践结果

**获取数据：**
- ✅ A 股股票列表：5489 只
- ✅ 平安银行历史数据：242 条（2024 年全年）
- ✅ 贵州茅台历史数据：242 条
- ✅ 五粮液历史数据：242 条

**测试覆盖：**
- ✅ 6/7 测试通过
- ❌ 1 个失败（实时行情网络问题，非核心功能）

---

## 🔗 相关资源

- [AKShare 官方文档](https://akshare.akfamily.xyz/)
- [项目代码](/root/.openclaw/workspace/projects/stock-quant/src/data/fetch_stock_data.py)
- [技术指标计算](./技术指标计算实现.md)
- [回测引擎架构](./回测引擎架构.md)

---

## 📝 更新记录

| 日期 | 更新内容 | 作者 |
|:---|:---|:---|
| 2026-03-13 | 初始创建 | 虾虾红 |
