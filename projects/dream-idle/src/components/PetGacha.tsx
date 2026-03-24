/**
 * v0.19 宠物召唤组件
 * 抽卡/召唤系统
 */

import React, { useState } from 'react';
import { pullGacha, pullGacha10, Pet, PetGachaResult } from '../utils/pets';

interface PetGachaProps {
  onObtainPet: (results: PetGachaResult[]) => void;
  normalGachaCost?: number;
  premiumGachaCost?: number;
}

export const PetGacha: React.FC<PetGachaProps> = ({
  onObtainPet,
  normalGachaCost = 1000,
  premiumGachaCost = 10000,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [gachaResults, setGachaResults] = useState<PetGachaResult[]>([]);
  const [gachaType, setGachaType] = useState<'normal' | 'premium'>('normal');

  // 单抽
  const handleSinglePull = async () => {
    if (isPulling) return;
    setIsPulling(true);

    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result = pullGacha(gachaType);
    const results = [result];
    setGachaResults(results);
    onObtainPet(results);
    setShowResult(true);
    setIsPulling(false);
  };

  // 十连抽
  const handleTenPull = async () => {
    if (isPulling) return;
    setIsPulling(true);

    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const results = pullGacha10(gachaType);
    setGachaResults(results);
    onObtainPet(results);
    setShowResult(true);
    setIsPulling(false);
  };

  // 关闭结果
  const closeResult = () => {
    setShowResult(false);
    setGachaResults([]);
  };

  return (
    <div className="p-4">
      {/* 召唤界面 */}
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">🔮 宠物召唤</h2>
          <p className="text-gray-600">召唤属于你的宠物伙伴</p>
        </div>

        {/* 召唤类型选择 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setGachaType('normal')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              gachaType === 'normal'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl mb-2">✨</div>
            <div className="font-bold">普通召唤</div>
            <div className="text-sm text-gray-600 mt-1">
              传说概率 1%
            </div>
            <div className="text-lg font-bold text-blue-600 mt-2">
              ¥{normalGachaCost}
            </div>
          </button>

          <button
            onClick={() => setGachaType('premium')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              gachaType === 'premium'
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl mb-2">🌟</div>
            <div className="font-bold">高级召唤</div>
            <div className="text-sm text-gray-600 mt-1">
              传说概率 5%
            </div>
            <div className="text-lg font-bold text-amber-600 mt-2">
              ¥{premiumGachaCost}
            </div>
          </button>
        </div>

        {/* 召唤按钮 */}
        <div className="flex gap-4">
          <button
            onClick={handleSinglePull}
            disabled={isPulling}
            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg
                     hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg hover:shadow-xl"
          >
            {isPulling ? '召唤中...' : '召唤 1 次'}
          </button>

          <button
            onClick={handleTenPull}
            disabled={isPulling}
            className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg
                     hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg hover:shadow-xl"
          >
            {isPulling ? '召唤中...' : '召唤 10 次'}
          </button>
        </div>

        {/* 概率说明 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">📊 召唤概率</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-bold mb-1">普通召唤</div>
              <div className="space-y-1 text-gray-600">
                <div>传说：1%</div>
                <div>史诗：9%</div>
                <div>稀有：30%</div>
                <div>普通：60%</div>
              </div>
            </div>
            <div>
              <div className="font-bold mb-1">高级召唤</div>
              <div className="space-y-1 text-gray-600">
                <div>传说：5%</div>
                <div>史诗：20%</div>
                <div>稀有：45%</div>
                <div>普通：30%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 召唤结果弹窗 */}
      {showResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">✨ 召唤结果 ✨</h3>
                <button
                  onClick={closeResult}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* 结果展示 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {gachaResults.map((result, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-lg border-2 text-center
                      ${result.pet.quality === 'legendary' ? 'border-amber-500 bg-amber-50 animate-pulse' : ''}
                      ${result.pet.quality === 'epic' ? 'border-purple-500 bg-purple-50' : ''}
                      ${result.pet.quality === 'rare' ? 'border-blue-500 bg-blue-50' : ''}
                      ${result.pet.quality === 'common' ? 'border-gray-400 bg-gray-50' : ''}
                    `}
                  >
                    <div className="text-4xl mb-2">
                      {result.pet.element === 'fire' && '🔥'}
                      {result.pet.element === 'water' && '💧'}
                      {result.pet.element === 'earth' && '🌍'}
                      {result.pet.element === 'wind' && '💨'}
                      {result.pet.element === 'light' && '✨'}
                      {result.pet.element === 'dark' && '🌑'}
                    </div>
                    <div className="font-bold text-sm mb-1">{result.pet.name}</div>
                    <div className="text-xs">
                      {result.pet.quality === 'legendary' && '🌟传说'}
                      {result.pet.quality === 'epic' && '⭐史诗'}
                      {result.pet.quality === 'rare' && '🔹稀有'}
                      {result.pet.quality === 'common' && '⚪普通'}
                    </div>
                    {result.isNew && (
                      <div className="mt-2 text-xs text-red-500 font-bold">NEW!</div>
                    )}
                  </div>
                ))}
              </div>

              {/* 统计 */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-center gap-4 text-sm">
                  <div>
                    传说：{gachaResults.filter((r) => r.pet.quality === 'legendary').length}
                  </div>
                  <div>
                    史诗：{gachaResults.filter((r) => r.pet.quality === 'epic').length}
                  </div>
                  <div>
                    稀有：{gachaResults.filter((r) => r.pet.quality === 'rare').length}
                  </div>
                  <div>
                    普通：{gachaResults.filter((r) => r.pet.quality === 'common').length}
                  </div>
                </div>
              </div>

              {/* 确认按钮 */}
              <div className="mt-6 text-center">
                <button
                  onClick={closeResult}
                  className="px-8 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
