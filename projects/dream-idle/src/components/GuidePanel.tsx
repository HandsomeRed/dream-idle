/**
 * 新手引导面板组件
 */

import React, { useState, useEffect } from 'react';
import {
  getGuideProgress,
  shouldTriggerGuide,
  completeGuideStep,
  skipGuideStep,
  toggleGuide,
  resetGuideProgress,
  getGuideCompletionRate,
  getGuideStepsSummary,
  GUIDE_STEPS
} from '../utils/newbieGuide';

interface GuidePanelProps {
  onComplete?: (stepId: string, reward: any) => void;
  onClose?: () => void;
}

export const GuidePanel: React.FC<GuidePanelProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(() => shouldTriggerGuide());
  const [progress, setProgress] = useState(() => getGuideProgress());
  const [showFullList, setShowFullList] = useState(false);

  // 监听引导触发
  useEffect(() => {
    const checkGuide = () => {
      const step = shouldTriggerGuide();
      setCurrentStep(step);
      setProgress(getGuideProgress());
    };

    checkGuide();
    const interval = setInterval(checkGuide, 5000); // 每 5 秒检查一次
    return () => clearInterval(interval);
  }, []);

  const handleComplete = () => {
    if (!currentStep) return;

    const result = completeGuideStep(currentStep.id);
    if (result.success) {
      if (onComplete) {
        onComplete(currentStep.id, result.reward);
      }
      setCurrentStep(shouldTriggerGuide());
      setProgress(getGuideProgress());
    }
  };

  const handleSkip = () => {
    if (!currentStep) return;
    skipGuideStep(currentStep.id);
    setCurrentStep(shouldTriggerGuide());
    setProgress(getGuideProgress());
  };

  const handleToggleGuide = () => {
    toggleGuide(!progress.isGuideEnabled);
    setProgress(getGuideProgress());
  };

  const handleReset = () => {
    if (confirm('确定要重置新手引导进度吗？')) {
      resetGuideProgress();
      setCurrentStep(shouldTriggerGuide());
      setProgress(getGuideProgress());
    }
  };

  const completionRate = getGuideCompletionRate();

  if (!progress.isGuideEnabled && !showFullList) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowFullList(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          📖 新手引导
        </button>
      </div>
    );
  }

  if (showFullList) {
    const summary = getGuideStepsSummary();
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">新手引导进度</h2>
              <button
                onClick={() => setShowFullList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* 完成度进度条 */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">总进度</span>
                <span className="text-sm font-bold text-blue-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* 步骤列表 */}
            <div className="space-y-2">
              {summary.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border-2 ${
                    item.completed
                      ? 'border-green-500 bg-green-50'
                      : item.skipped
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">
                        {index + 1}. {item.title}
                      </div>
                      {item.reward && (
                        <div className="text-sm text-gray-600">
                          奖励：
                          {item.reward.gold && <span className="text-yellow-600"> 💰{item.reward.gold}</span>}
                          {item.reward.diamond && <span className="text-blue-600"> 💎{item.reward.diamond}</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      {item.completed ? (
                        <span className="text-green-600 font-bold">✅ 已完成</span>
                      ) : item.skipped ? (
                        <span className="text-gray-500">⏭️ 已跳过</span>
                      ) : (
                        <span className="text-blue-600">⏳ 进行中</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 控制按钮 */}
            <div className="mt-6 flex gap-2 flex-wrap">
              <button
                onClick={handleToggleGuide}
                className={`px-4 py-2 rounded-lg ${
                  progress.isGuideEnabled
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white transition-colors`}
              >
                {progress.isGuideEnabled ? '🔕 禁用引导' : '🔔 启用引导'}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                🔄 重置进度
              </button>
              <button
                onClick={() => setShowFullList(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowFullList(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          ✅ 引导已完成
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 animate-bounce-in">
        {/* 进度指示 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>步骤 {progress.completedCount + 1} / {progress.totalSteps}</span>
            <span>{completionRate}% 完成</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* 引导内容 */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2 text-blue-600">
            📖 {currentStep.title}
          </h3>
          <p className="text-gray-700">{currentStep.description}</p>
        </div>

        {/* 奖励预览 */}
        {currentStep.reward && (
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">完成奖励：</div>
            <div className="flex gap-3">
              {currentStep.reward.gold && (
                <span className="text-yellow-600 font-bold">💰 {currentStep.reward.gold} 金币</span>
              )}
              {currentStep.reward.diamond && (
                <span className="text-blue-600 font-bold">💎 {currentStep.reward.diamond} 钻石</span>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleComplete}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition-colors"
          >
            ✅ 完成
          </button>
          <button
            onClick={handleSkip}
            className="px-4 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
          >
            ⏭️ 跳过
          </button>
        </div>

        {/* 其他选项 */}
        <div className="mt-4 flex justify-between text-sm">
          <button
            onClick={() => setShowFullList(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            📋 查看全部
          </button>
          <button
            onClick={handleToggleGuide}
            className="text-gray-600 hover:text-gray-800"
          >
            🔕 禁用引导
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default GuidePanel;
