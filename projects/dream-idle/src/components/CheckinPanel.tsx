/**
 * v0.27 签到界面组件
 */

import React, { useState } from 'react';
import {
  PlayerCheckin,
  createPlayerCheckin,
  canCheckin,
  doCheckin,
  makeUpCheckin,
  claimCumulativeReward,
  getClaimableCumulativeRewards,
  getCheckinStats,
  getMonthlyCalendar,
  setVipDouble,
} from '../utils/checkin';

interface CheckinPanelProps {
  playerCheckin: PlayerCheckin;
  onCheckinUpdate: (checkin: PlayerCheckin) => void;
  onRewardClaimed: (rewards: { gold: number; diamond: number; exp: number; item?: string }) => void;
}

export const CheckinPanel: React.FC<CheckinPanelProps> = ({
  playerCheckin,
  onCheckinUpdate,
  onRewardClaimed,
}) => {
  const [showMakeUp, setShowMakeUp] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const stats = getCheckinStats(playerCheckin);
  const calendar = getMonthlyCalendar(playerCheckin);
  const claimableRewards = getClaimableCumulativeRewards(playerCheckin);

  // 执行签到
  const handleCheckin = () => {
    const can = canCheckin(playerCheckin);
    if (!can.can) {
      alert(can.reason);
      return;
    }

    const result = doCheckin(playerCheckin);
    onCheckinUpdate(result.checkin);
    onRewardClaimed(result.rewards);
  };

  // 补签
  const handleMakeUp = (day: number) => {
    const result = makeUpCheckin(playerCheckin, day, true);
    if (result.success && result.rewards) {
      onCheckinUpdate(result.checkin);
      onRewardClaimed(result.rewards);
      setShowMakeUp(false);
      setSelectedDay(null);
    } else {
      alert(result.error);
    }
  };

  // 领取累计奖励
  const handleClaimCumulative = (index: number) => {
    const reward = playerCheckin.cumulativeRewards[index];
    const result = claimCumulativeReward(playerCheckin, index);
    if (result.success && result.rewards) {
      onCheckinUpdate(result.checkin);
      onRewardClaimed(result.rewards);
    } else {
      alert(result.error);
    }
  };

  // 切换 VIP 双倍
  const toggleVipDouble = () => {
    const updated = setVipDouble(playerCheckin, !playerCheckin.vipDouble);
    onCheckinUpdate(updated);
  };

  return (
    <div className="checkin-panel p-4 bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg shadow-lg">
      {/* 标题 */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-purple-700">📅 每日签到</h2>
        <p className="text-sm text-gray-600">{calendar.month}</p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-white p-2 rounded-lg shadow">
          <div className="text-xs text-gray-500">今日</div>
          <div className={`font-bold ${stats.todayChecked ? 'text-green-500' : 'text-red-500'}`}>
            {stats.todayChecked ? '✅' : '❌'}
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow">
          <div className="text-xs text-gray-500">连续</div>
          <div className="font-bold text-orange-500">{stats.consecutiveDays}天</div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow">
          <div className="text-xs text-gray-500">总计</div>
          <div className="font-bold text-blue-500">{stats.totalDays}天</div>
        </div>
      </div>

      {/* 签到按钮 */}
      <div className="mb-4">
        <button
          onClick={handleCheckin}
          disabled={stats.todayChecked}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            stats.todayChecked
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 animate-pulse'
          }`}
        >
          {stats.todayChecked ? '今日已签到' : '立即签到'}
        </button>
      </div>

      {/* VIP 双倍 */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <span className="text-sm text-gray-600">VIP 双倍奖励:</span>
        <button
          onClick={toggleVipDouble}
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            playerCheckin.vipDouble
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {playerCheckin.vipDouble ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* 签到日历 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">本月签到</h3>
        <div className="grid grid-cols-7 gap-1">
          {calendar.days.map((day) => (
            <div
              key={day.day}
              className={`
                aspect-square flex items-center justify-center text-xs rounded
                ${day.checked
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-400'
                }
                ${!day.checked && day.day < new Date().getDate() ? 'cursor-pointer hover:bg-yellow-200' : ''}
              `}
              onClick={() => {
                if (!day.checked && day.day < new Date().getDate()) {
                  setSelectedDay(day.day);
                  setShowMakeUp(true);
                }
              }}
            >
              {day.day}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          点击灰色日期可补签 (10 钻石/天)
        </p>
      </div>

      {/* 累计奖励 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">累计签到奖励</h3>
        <div className="space-y-2">
          {playerCheckin.cumulativeRewards.map((reward, index) => (
            <div
              key={reward.days}
              className={`
                flex items-center justify-between p-2 rounded-lg
                ${reward.claimed ? 'bg-gray-100' : 'bg-white shadow'}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-600">{reward.days}天</span>
                <span className="text-xs text-gray-600">
                  💰{reward.rewards.gold} 💎{reward.rewards.diamond} ✨{reward.rewards.exp}
                  {reward.rewards.item && ` 🎁${reward.rewards.item}`}
                </span>
              </div>
              {reward.claimed ? (
                <span className="text-xs text-green-500 font-bold">已领取</span>
              ) : (
                <button
                  onClick={() => handleClaimCumulative(index)}
                  disabled={stats.totalDays < reward.days}
                  className={`px-2 py-1 text-xs rounded font-bold ${
                    stats.totalDays >= reward.days
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  领取
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 补签弹窗 */}
      {showMakeUp && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold mb-4">补签第 {selectedDay} 天</h3>
            <p className="text-sm text-gray-600 mb-4">
              消耗 10 钻石补签该日，获得对应奖励
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowMakeUp(false);
                  setSelectedDay(null);
                }}
                className="flex-1 py-2 bg-gray-200 rounded-lg font-bold"
              >
                取消
              </button>
              <button
                onClick={() => handleMakeUp(selectedDay)}
                className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600"
              >
                确认补签
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
