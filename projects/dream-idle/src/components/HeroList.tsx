// 英雄列表组件 - v0.43

import React, { useState } from 'react';
import {
  HERO_CONFIGS,
  getRarityColor,
  getRarityName,
  getClassName,
  getElementName,
  calculateHeroStats,
  createHeroSystem,
  type OwnedHero,
  type HeroConfig
} from '../utils/heroes';

interface HeroListProps {
  ownedHeroes: OwnedHero[];
  heroShards: Map<string, number>;
  onLevelUp?: (heroId: string, exp: number) => void;
  onStarUp?: (heroId: string) => void;
  onToggleLock?: (heroId: string) => void;
  onToggleFavorite?: (heroId: string) => void;
}

export const HeroList: React.FC<HeroListProps> = ({
  ownedHeroes,
  heroShards,
  onLevelUp,
  onStarUp,
  onToggleLock,
  onToggleFavorite
}) => {
  const [selectedHero, setSelectedHero] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');

  // 过滤英雄列表
  const filteredHeroes = ownedHeroes.filter(hero => {
    const config = HERO_CONFIGS[hero.heroId];
    if (!config) return false;
    
    if (filterRarity !== 'all' && config.rarity !== filterRarity) return false;
    if (filterClass !== 'all' && config.classType !== filterClass) return false;
    
    return true;
  });

  // 按稀有度和星级排序
  const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
  const sortedHeroes = [...filteredHeroes].sort((a, b) => {
    const configA = HERO_CONFIGS[a.heroId];
    const configB = HERO_CONFIGS[b.heroId];
    if (!configA || !configB) return 0;
    
    // 先按稀有度排序
    const rarityDiff = rarityOrder[configB.rarity] - rarityOrder[configA.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    
    // 再按星级排序
    return b.star - a.star;
  });

  const selectedHeroData = selectedHero ? ownedHeroes.find(h => h.heroId === selectedHero) : null;
  const selectedHeroConfig = selectedHero ? HERO_CONFIGS[selectedHero] : null;

  return (
    <div className="hero-list-container">
      <div className="hero-list-header">
        <h2 className="text-2xl font-bold text-amber-600 mb-4">英雄殿堂</h2>
        
        {/* 过滤器 */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <div>
            <label className="block text-sm text-gray-400 mb-1">稀有度</label>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
            >
              <option value="all">全部</option>
              <option value="legendary">神话</option>
              <option value="epic">传说</option>
              <option value="rare">史诗</option>
              <option value="uncommon">稀有</option>
              <option value="common">普通</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">职业</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
            >
              <option value="all">全部</option>
              <option value="warrior">战士</option>
              <option value="mage">法师</option>
              <option value="tank">坦克</option>
              <option value="assassin">刺客</option>
              <option value="support">辅助</option>
            </select>
          </div>
          
          <div className="ml-auto">
            <label className="block text-sm text-gray-400 mb-1">拥有数量</label>
            <div className="text-lg font-bold text-amber-400">
              {ownedHeroes.length} / {Object.keys(HERO_CONFIGS).length}
            </div>
          </div>
        </div>
      </div>

      {/* 英雄网格 */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {sortedHeroes.map(hero => {
          const config = HERO_CONFIGS[hero.heroId];
          if (!config) return null;
          
          const isSelected = selectedHero === hero.heroId;
          const rarityColor = getRarityColor(config.rarity);
          
          return (
            <div
              key={hero.heroId}
              onClick={() => setSelectedHero(hero.heroId)}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                isSelected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-gray-600'
              }`}
              style={{ borderColor: rarityColor }}
            >
              {/* 英雄头像背景 */}
              <div
                className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${rarityColor}22 0%, #1f2937 100%)`
                }}
              >
                <div className="text-4xl">🦸</div>
              </div>
              
              {/* 英雄信息 */}
              <div className="p-2 bg-gray-800">
                <div className="text-xs font-bold truncate" style={{ color: rarityColor }}>
                  {config.name}
                </div>
                <div className="text-xs text-gray-400 flex justify-between items-center mt-1">
                  <span>Lv.{hero.level}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: hero.star }).map((_, i) => (
                      <span key={i} className="text-amber-400">★</span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 锁定标记 */}
              {hero.isLocked && (
                <div className="absolute top-1 right-1 bg-gray-900 bg-opacity-75 rounded p-1">
                  <span className="text-xs">🔒</span>
                </div>
              )}
              
              {/* 收藏标记 */}
              {hero.favorite && (
                <div className="absolute top-1 left-1 bg-gray-900 bg-opacity-75 rounded p-1">
                  <span className="text-xs text-red-400">❤️</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 英雄详情面板 */}
      {selectedHeroData && selectedHeroConfig && (
        <HeroDetailPanel
          hero={selectedHeroData}
          config={selectedHeroConfig}
          shards={heroShards.get(selectedHeroData.heroId) || 0}
          onLevelUp={onLevelUp}
          onStarUp={onStarUp}
          onToggleLock={onToggleLock}
          onToggleFavorite={onToggleFavorite}
          onClose={() => setSelectedHero(null)}
        />
      )}
    </div>
  );
};

interface HeroDetailPanelProps {
  hero: OwnedHero;
  config: HeroConfig;
  shards: number;
  onLevelUp?: (heroId: string, exp: number) => void;
  onStarUp?: (heroId: string) => void;
  onToggleLock?: (heroId: string) => void;
  onToggleFavorite?: (heroId: string) => void;
  onClose: () => void;
}

const HeroDetailPanel: React.FC<HeroDetailPanelProps> = ({
  hero,
  config,
  shards,
  onLevelUp,
  onStarUp,
  onToggleLock,
  onToggleFavorite,
  onClose
}) => {
  const [expAmount, setExpAmount] = useState(1000);
  
  const currentStats = calculateHeroStats(config, hero.level, hero.star);
  const rarityColor = getRarityColor(config.rarity);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="relative p-6 border-b border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            ✕
          </button>
          
          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-lg flex items-center justify-center text-5xl"
              style={{ background: `linear-gradient(135deg, ${rarityColor}33 0%, #1f2937 100%)` }}
            >
              🦸
            </div>
            
            <div>
              <h3 className="text-2xl font-bold" style={{ color: rarityColor }}>
                {config.name}
              </h3>
              <div className="flex gap-2 mt-1 text-sm">
                <span className="px-2 py-0.5 bg-gray-700 rounded">
                  {getRarityName(config.rarity)}
                </span>
                <span className="px-2 py-0.5 bg-gray-700 rounded">
                  {getClassName(config.classType)}
                </span>
                <span className="px-2 py-0.5 bg-gray-700 rounded">
                  {getElementName(config.element)}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Lv.{hero.level} | {Array(hero.star).fill('★').join('')} | 碎片：{shards}
              </div>
            </div>
          </div>
        </div>

        {/* 属性面板 */}
        <div className="p-6 border-b border-gray-700">
          <h4 className="text-lg font-bold text-amber-400 mb-3">英雄属性</h4>
          <div className="grid grid-cols-2 gap-3">
            <StatRow label="气血" value={currentStats.hp} icon="❤️" />
            <StatRow label="攻击" value={currentStats.attack} icon="⚔️" />
            <StatRow label="防御" value={currentStats.defense} icon="🛡️" />
            <StatRow label="速度" value={currentStats.speed} icon="💨" />
            <StatRow label="法伤" value={currentStats.mag} icon="✨" />
            <StatRow label="法防" value={currentStats.res} icon="🔮" />
          </div>
        </div>

        {/* 技能列表 */}
        <div className="p-6 border-b border-gray-700">
          <h4 className="text-lg font-bold text-amber-400 mb-3">英雄技能</h4>
          <div className="flex gap-2 flex-wrap">
            {config.skills.map((skillId, index) => (
              <div
                key={skillId}
                className="px-3 py-2 bg-gray-700 rounded-lg text-sm"
              >
                🔮 技能 {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* 养成操作 */}
        <div className="p-6 border-b border-gray-700">
          <h4 className="text-lg font-bold text-amber-400 mb-3">英雄养成</h4>
          
          {/* 升级 */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">升级训练</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={expAmount}
                onChange={(e) => setExpAmount(Number(e.target.value))}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
                placeholder="经验值"
              />
              <button
                onClick={() => onLevelUp?.(hero.heroId, expAmount)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                训练
              </button>
            </div>
          </div>
          
          {/* 升星 */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">升星进化</label>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                需要碎片：{hero.star < config.maxStar ? Math.floor(20 * Math.pow(2.5, hero.star - 1)) : '已满'}
              </div>
              <button
                onClick={() => onStarUp?.(hero.heroId)}
                disabled={hero.star >= config.maxStar}
                className={`px-4 py-2 rounded transition-colors ${
                  hero.star >= config.maxStar
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                升星 {hero.star < config.maxStar ? `(${hero.star}→${hero.star + 1})` : '已满'}
              </button>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="p-6 flex gap-3">
          <button
            onClick={() => onToggleLock?.(hero.heroId)}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              hero.isLocked
                ? 'bg-gray-600 hover:bg-gray-500'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {hero.isLocked ? '🔒 已锁定' : '🔓 锁定'}
          </button>
          
          <button
            onClick={() => onToggleFavorite?.(hero.heroId)}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              hero.favorite
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {hero.favorite ? '❤️ 已收藏' : '🤍 收藏'}
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: number; icon: string }> = ({ label, value, icon }) => (
  <div className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
    <div className="flex items-center gap-2">
      <span>{icon}</span>
      <span className="text-gray-400">{label}</span>
    </div>
    <div className="font-bold text-amber-400">{value}</div>
  </div>
);

export default HeroList;
