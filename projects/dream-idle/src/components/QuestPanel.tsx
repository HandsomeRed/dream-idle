/**
 * v0.27 每日任务界面组件
 */

import React from 'react';
import {
  DailyQuests,
  getQuest,
  claimQuestReward,
  claimActivityReward,
  getClaimableQuests,
  getClaimableActivityRewards,
  getQuestStats,
  QUEST_CONFIG,
} from '../utils/quests';

interface QuestPanelProps {
  dailyQuests: DailyQuests;
  onQuestsUpdate: (quests: DailyQuests) => void;
  onRewardClaimed: (rewards: { gold: number; diamond: number; exp: number }) => void;
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  dailyQuests,
  onQuestsUpdate,
  onRewardClaimed,
}) => {
  const stats = getQuestStats(dailyQuests);
  const claimableQuests = getClaimableQuests(dailyQuests);
  const claimableActivity = getClaimableActivityRewards(dailyQuests);

  // 领取任务奖励
  const handleClaimQuest = (questId: string, isWeekly: boolean) => {
    const result = claimQuestReward(dailyQuests, questId, isWeekly);
    if (result.success && result.rewards) {
      onQuestsUpdate(result.quests);
      onRewardClaimed({ gold: result.rewards.gold, diamond: result.rewards.diamond || 0, exp: result.rewards.exp });
    } else {
      alert(result.error);
    }
  };

  // 领取活跃度奖励
  const handleClaimActivity = (index: number) => {
    const result = claimActivityReward(dailyQuests, index);
    if (result.success && result.rewards) {
      onQuestsUpdate(result.quests);
      onRewardClaimed({ gold: result.rewards.gold, diamond: result.rewards.diamond || 0, exp: result.rewards.exp });
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="quest-panel p-4 bg-gradient-to-b from-orange-50 to-yellow-50 rounded-lg shadow-lg">
      {/* 标题 */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-orange-700">📋 每日任务</h2>
        <p className="text-sm text-gray-600">
          每日 {QUEST_CONFIG.dailyQuestCount} 个任务 | 每周 {QUEST_CONFIG.weeklyQuestCount} 个任务
        </p>
      </div>

      {/* 活跃度进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-bold text-orange-600">活跃度</span>
          <span className="text-gray-600">
            {stats.activityPoints} / 150
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-400 to-yellow-400 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(100, (stats.activityPoints / 150) * 100)}%` }}
          />
        </div>
        {stats.nextActivityReward && (
          <p className="text-xs text-gray-500 mt-1 text-center">
            再获得 {stats.nextActivityReward - stats.activityPoints} 活跃度领取下一个奖励
          </p>
        )}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-center">
        <div className="bg-white p-2 rounded-lg shadow">
          <div className="text-xs text-gray-500">每日任务</div>
          <div className="font-bold text-blue-500">
            {stats.dailyCompleted}/{stats.dailyTotal}
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow">
          <div className="text-xs text-gray-500">每周任务</div>
          <div className="font-bold text-purple-500">
            {stats.weeklyCompleted}/{stats.weeklyTotal}
          </div>
        </div>
      </div>

      {/* 活跃度奖励 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">活跃度奖励</h3>
        <div className="grid grid-cols-7 gap-1">
          {QUEST_CONFIG.activityRewards.map((reward, index) => {
            const claimed = dailyQuests.activityRewardsClaimed.includes(index);
            const canClaim = dailyQuests.activityPoints >= reward.points && !claimed;
            return (
              <button
                key={reward.points}
                onClick={() => handleClaimActivity(index)}
                disabled={!canClaim}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded text-xs
                  ${claimed
                    ? 'bg-green-500 text-white'
                    : canClaim
                    ? 'bg-yellow-400 text-yellow-900 animate-pulse hover:bg-yellow-500'
                    : 'bg-gray-200 text-gray-400'
                  }
                `}
              >
                <span className="font-bold">{reward.points}</span>
                {claimed && <span>✅</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 每日任务列表 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">每日任务</h3>
        <div className="space-y-2">
          {dailyQuests.dailyQuests.map((progress) => {
            const quest = getQuest(progress.questId);
            if (!quest) return null;
            return (
              <div
                key={quest.id}
                className={`p-3 rounded-lg ${progress.completed ? 'bg-green-50' : 'bg-white'} shadow`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-gray-800">{quest.name}</div>
                    <div className="text-xs text-gray-600">{quest.description}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (progress.current / quest.requirement.target) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {progress.current}/{quest.requirement.target}
                      </span>
                    </div>
                  </div>
                  {progress.completed ? (
                    progress.rewardClaimed ? (
                      <span className="text-xs text-green-500 font-bold ml-2">已领取</span>
                    ) : (
                      <button
                        onClick={() => handleClaimQuest(quest.id, false)}
                        className="ml-2 px-3 py-1 bg-orange-500 text-white text-xs rounded font-bold hover:bg-orange-600"
                      >
                        领取
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-gray-400 ml-2">进行中</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  💰{quest.rewards.gold} ✨{quest.rewards.exp}
                  {quest.rewards.diamond && ` 💎${quest.rewards.diamond}`}
                  🎯{quest.rewards.activityPoints}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 每周任务列表 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">每周任务</h3>
        <div className="space-y-2">
          {dailyQuests.weeklyQuests.map((progress) => {
            const quest = getQuest(progress.questId);
            if (!quest) return null;
            return (
              <div
                key={quest.id}
                className={`p-3 rounded-lg ${progress.completed ? 'bg-green-50' : 'bg-white'} shadow`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-gray-800">{quest.name}</div>
                    <div className="text-xs text-gray-600">{quest.description}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (progress.current / quest.requirement.target) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {progress.current}/{quest.requirement.target}
                      </span>
                    </div>
                  </div>
                  {progress.completed ? (
                    progress.rewardClaimed ? (
                      <span className="text-xs text-green-500 font-bold ml-2">已领取</span>
                    ) : (
                      <button
                        onClick={() => handleClaimQuest(quest.id, true)}
                        className="ml-2 px-3 py-1 bg-purple-500 text-white text-xs rounded font-bold hover:bg-purple-600"
                      >
                        领取
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-gray-400 ml-2">进行中</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  💰{quest.rewards.gold} ✨{quest.rewards.exp}
                  {quest.rewards.diamond && ` 💎${quest.rewards.diamond}`}
                  🎯{quest.rewards.activityPoints}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
