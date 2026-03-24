/**
 * v0.19 宠物列表组件
 * 展示用户拥有的所有宠物
 */

import React, { useState } from 'react';
import { Pet, PetQuality, PetElement } from '../utils/pets';

interface PetListProps {
  pets: Pet[];
  onSelectPet?: (pet: Pet) => void;
  selectedPetId?: string;
}

const qualityColors: { [key in PetQuality]: string } = {
  common: 'bg-gray-400',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-amber-500',
};

const qualityBorders: { [key in PetQuality]: string } = {
  common: 'border-gray-400',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-amber-500',
};

const elementEmojis: { [key in PetElement]: string } = {
  fire: '🔥',
  water: '💧',
  earth: '🌍',
  wind: '💨',
  light: '✨',
  dark: '🌑',
};

export const PetList: React.FC<PetListProps> = ({ pets, onSelectPet, selectedPetId }) => {
  const [filterQuality, setFilterQuality] = useState<PetQuality | 'all'>('all');
  const [filterElement, setFilterElement] = useState<PetElement | 'all'>('all');
  const [sortBy, setSortBy] = useState<'level' | 'quality' | 'obtainedAt'>('level');

  // 筛选和排序
  const filteredPets = pets
    .filter((pet) => filterQuality === 'all' || pet.quality === filterQuality)
    .filter((pet) => filterElement === 'all' || pet.element === filterElement)
    .sort((a, b) => {
      if (sortBy === 'level') return b.level - a.level;
      if (sortBy === 'quality') {
        const qualityOrder: { [key in PetQuality]: number } = {
          common: 0,
          rare: 1,
          epic: 2,
          legendary: 3,
        };
        return qualityOrder[b.quality] - qualityOrder[a.quality];
      }
      if (sortBy === 'obtainedAt') return b.obtainedAt - a.obtainedAt;
      return 0;
    });

  return (
    <div className="p-4">
      {/* 筛选控制 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterQuality}
          onChange={(e) => setFilterQuality(e.target.value as PetQuality | 'all')}
          className="px-3 py-1 border border-gray-300 rounded-lg bg-white"
        >
          <option value="all">全部品质</option>
          <option value="common">普通</option>
          <option value="rare">稀有</option>
          <option value="epic">史诗</option>
          <option value="legendary">传说</option>
        </select>

        <select
          value={filterElement}
          onChange={(e) => setFilterElement(e.target.value as PetElement | 'all')}
          className="px-3 py-1 border border-gray-300 rounded-lg bg-white"
        >
          <option value="all">全部元素</option>
          <option value="fire">🔥 火</option>
          <option value="water">💧 水</option>
          <option value="earth">🌍 土</option>
          <option value="wind">💨 风</option>
          <option value="light">✨ 光</option>
          <option value="dark">🌑 暗</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'level' | 'quality' | 'obtainedAt')}
          className="px-3 py-1 border border-gray-300 rounded-lg bg-white"
        >
          <option value="level">按等级</option>
          <option value="quality">按品质</option>
          <option value="obtainedAt">按获得时间</option>
        </select>

        <span className="ml-auto text-sm text-gray-500">
          共 {filteredPets.length} 只宠物
        </span>
      </div>

      {/* 宠物列表 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPets.map((pet) => (
          <div
            key={pet.id}
            onClick={() => onSelectPet?.(pet)}
            className={`
              relative p-3 rounded-lg border-2 cursor-pointer transition-all
              hover:scale-105 hover:shadow-lg
              ${qualityBorders[pet.quality]}
              ${selectedPetId === pet.id ? 'ring-2 ring-blue-500' : ''}
              ${pet.isLocked ? 'opacity-50' : ''}
            `}
          >
            {/* 品质背景 */}
            <div className={`absolute inset-0 ${qualityColors[pet.quality]} opacity-10 rounded-lg`} />

            {/* 宠物信息 */}
            <div className="relative">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{elementEmojis[pet.element]}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-yellow-500">⭐</span>
                  <span className="text-xs font-bold">{pet.stars}</span>
                </div>
              </div>

              {/* 名字 */}
              <h3 className="font-bold text-sm mb-1 truncate">{pet.name}</h3>

              {/* 等级 */}
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Lv.{pet.level}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full text-white ${qualityColors[pet.quality]}`}>
                  {pet.quality === 'common' && '普通'}
                  {pet.quality === 'rare' && '稀有'}
                  {pet.quality === 'epic' && '史诗'}
                  {pet.quality === 'legendary' && '传说'}
                </span>
              </div>

              {/* 属性 */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>⚔️ 攻击</span>
                  <span className="font-bold">{pet.currentAttack}</span>
                </div>
                <div className="flex justify-between">
                  <span>🛡️ 防御</span>
                  <span className="font-bold">{pet.currentDefense}</span>
                </div>
                <div className="flex justify-between">
                  <span>❤️ 生命</span>
                  <span className="font-bold">{pet.currentHealth}</span>
                </div>
              </div>

              {/* 经验条 */}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>EXP</span>
                  <span>{pet.exp}/{pet.maxExp}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(pet.exp / pet.maxExp) * 100}%` }}
                  />
                </div>
              </div>

              {/* 协助率 */}
              <div className="mt-2 text-xs text-gray-600">
                协助率：{pet.assistRate}% | 伤害：{pet.assistDamage}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">🥚</p>
          <p>还没有宠物，快去召唤吧！</p>
        </div>
      )}
    </div>
  );
};
