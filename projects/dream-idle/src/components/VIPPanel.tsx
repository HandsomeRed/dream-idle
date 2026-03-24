/**
 * VIP 面板组件
 */

import React, { useState, useEffect } from 'react';
import {
  VIP_LEVELS,
  getVIPLevelName,
  getVIPLevelColor,
  loadVIPState,
  saveVIPState,
  addVIPExp,
  getVIPProgress,
  getExpToNextLevel,
  getOfflineBonusPercent,
  getGoldBonusPercent,
  getExpBonusPercent,
  getExtraDungeonEntries,
  getExtraArenaEntries,
  getUnlockedPerks,
  purchaseVIPExp,
  getDailyActivityExp
} from '../utils/vip';

interface VIPPanelProps {
  onClose?: () => void;
  onPurchase?: (amount: number) => void;
}

export const VIPPanel: React.FC<VIPPanelProps> = ({ onClose, onPurchase }) => {
  const [vipState, setVipState] = useState(() => loadVIPState());
  const [showAllPerks, setShowAllPerks] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(100);

  useEffect(() => {
    setVipState(loadVIPState());
  }, []);

  const handlePurchase = () => {
    const exp = purchaseVIPExp(purchaseAmount);
    const result = addVIPExp(vipState, exp);
    setVipState({ ...vipState });
    saveVIPState(vipState);
    
    if (onPurchase) {
      onPurchase(purchaseAmount);
    }
    
    if (result.leveledUp) {
      alert(`🎉 恭喜！VIP 等级提升至 ${getVIPLevelName(result.newLevel)}！`);
    }
  };

  const progress = getVIPProgress(vipState.exp);
  const expToNext = getExpToNextLevel(vipState.exp);
  const offlineBonus = getOfflineBonusPercent(vipState);
  const goldBonus = getGoldBonusPercent(vipState);
  const expBonus = getExpBonusPercent(vipState);
  const extraDungeon = getExtraDungeonEntries(vipState);
  const extraArena = getExtraArenaEntries(vipState);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 my-8 p-6">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">👑 VIP 特权</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* VIP 等级展示 */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-4xl font-bold ${getVIPLevelColor(vipState.level)}`}>
                {getVIPLevelName(vipState.level)}
              </div>
              <div className="text-gray-600 mt-1">
                VIP 经验：{vipState.exp.toLocaleString()} / {vipState.level >= 15 ? 'MAX' : VIP_LEVELS[vipState.level + 1]?.requiredExp.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-6xl">👑</div>
            </div>
          </div>

          {/* 进度条 */}
          {vipState.level < 15 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>升级进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {expToNext > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  还需 {expToNext.toLocaleString()} VIP 经验升级
                </div>
              )}
            </div>
          )}
          {vipState.level >= 15 && (
            <div className="text-center text-xl font-bold text-yellow-600">
              🎉 已达到最高 VIP 等级！
            </div>
          )}
        </div>

        {/* 当前特权 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl mb-1">⏰</div>
            <div className="font-bold text-blue-600">离线收益 +{offlineBonus}%</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl mb-1">💰</div>
            <div className="font-bold text-yellow-600">金币 +{goldBonus}%</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl mb-1">⭐</div>
            <div className="font-bold text-purple-600">经验 +{expBonus}%</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl mb-1">⚔️</div>
            <div className="font-bold text-green-600">副本 +{extraDungeon}次</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl mb-1">🏆</div>
            <div className="font-bold text-red-600">竞技场 +{extraArena}次</div>
          </div>
        </div>

        {/* 特权详情 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold">📋 特权详情</h3>
            <button
              onClick={() => setShowAllPerks(!showAllPerks)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showAllPerks ? '收起' : '展开全部'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {VIP_LEVELS.slice(1, showAllPerks ? VIP_LEVELS.length : vipState.level + 1).map(level => (
              <div
                key={level.level}
                className={`p-3 rounded-lg border-2 ${
                  level.level <= vipState.level
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-bold">
                    {getVIPLevelName(level.level)}
                    {level.level <= vipState.level && (
                      <span className="ml-2 text-green-600">✅ 已解锁</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    需要：{level.requiredExp.toLocaleString()} VIP 经验
                  </div>
                </div>
                {level.perks.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {level.perks.map((perk, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${
                          level.level <= vipState.level
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {perk.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* VIP 充值 */}
        {vipState.level < 15 && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <h3 className="text-xl font-bold mb-3">💎 VIP 充值</h3>
            <p className="text-gray-600 mb-3">
              充值钻石可获得 VIP 经验，1 钻石 = 1 VIP 经验
            </p>
            <div className="flex gap-2 flex-wrap">
              {[100, 500, 1000, 5000, 10000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setPurchaseAmount(amount)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    purchaseAmount === amount
                      ? 'border-yellow-500 bg-yellow-100'
                      : 'border-gray-300 hover:border-yellow-400'
                  }`}
                >
                  💎 {amount.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="border-2 border-gray-300 rounded-lg px-4 py-2 w-32"
                min="1"
              />
              <span className="text-gray-600">钻石 = {purchaseAmount} VIP 经验</span>
              <button
                onClick={handlePurchase}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                立即充值
              </button>
            </div>
          </div>
        )}

        {/* 日常活动获取 VIP 经验 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-3">📅 日常活动获取 VIP 经验</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: '每日签到', exp: getDailyActivityExp('daily_login') },
              { name: '完成每日任务', exp: getDailyActivityExp('complete_daily_quest') },
              { name: '完成成就', exp: getDailyActivityExp('complete_achievement') },
              { name: '爬塔 100 层', exp: getDailyActivityExp('tower_floor_100') },
              { name: '竞技场前 100', exp: getDailyActivityExp('arena_top_100') },
              { name: '首充', exp: getDailyActivityExp('first_purchase') }
            ].map((activity, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg">
                <div className="font-bold">{activity.name}</div>
                <div className="text-sm text-blue-600">+{activity.exp} VIP 经验</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIPPanel;
