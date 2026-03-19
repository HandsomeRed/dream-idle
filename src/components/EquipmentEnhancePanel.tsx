/**
 * Equipment Enhancement Panel - v0.28
 * 装备强化界面：强化、精炼、宝石镶嵌
 */

import React, { useState } from 'react';

// ==================== 类型导入 ====================

import {
  GemType,
  GemQuality,
  EnhancementState,
  RefinementState,
  GemSocket,
  Gem,
  getEnhanceSuccessRate,
  calculateEnhanceCost,
  getRepairCost,
  calculateRefinementCost,
  getRefinementBonus,
  generateRandomGem,
  initializeGemSockets,
  updateSocketUnlocks,
  getGemName,
  calculateGemBonus,
  getEnhanceDisplayText,
  getEnhanceColor,
  SOCKET_UNLOCK_LEVELS
} from '../utils/equipmentEnhance';

// ==================== 组件属性 ====================

interface EquipmentEnhancePanelProps {
  equipmentName: string;
  equipmentSlot: string;
  baseStats: Record<string, number>;
  enhanceState: EnhancementState;
  refinementState: RefinementState;
  gemSockets: GemSocket[];
  playerGold: number;
  refinementStones: number;
  onEnhance: () => void;
  onRefine: () => void;
  onRepair: () => void;
  onInstallGem: (socketIndex: number, gem: Gem) => void;
  onRemoveGem: (socketIndex: number) => void;
  onClose: () => void;
}

// ==================== 辅助组件 ====================

/**
 * 强化等级显示
 */
const EnhanceLevelDisplay: React.FC<{ level: number }> = ({ level }) => {
  const color = getEnhanceColor(level);
  const text = getEnhanceDisplayText(level);
  
  return (
    <span style={{ color, fontWeight: 'bold', fontSize: '1.2em' }}>
      {text}
    </span>
  );
};

/**
 * 精炼星级显示
 */
const RefinementStars: React.FC<{ level: number }> = ({ level }) => {
  return (
    <span style={{ color: '#f59f00', fontSize: '1.2em' }}>
      {'★'.repeat(level)}{'☆'.repeat(5 - level)}
    </span>
  );
};

/**
 * 进度条组件
 */
const ProgressBar: React.FC<{
  current: number;
  max: number;
  color?: string;
  label?: string;
}> = ({ current, max, color = '#4dabf7', label }) => {
  const percentage = Math.min(100, (current / max) * 100);
  
  return (
    <div style={{ margin: '8px 0' }}>
      {label && (
        <div style={{ fontSize: '12px', marginBottom: '4px', color: '#868e96' }}>
          {label}: {current}/{max}
        </div>
      )}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

/**
 * 宝石槽位显示
 */
const GemSocketDisplay: React.FC<{
  socket: GemSocket;
  index: number;
  requiredLevel: number;
  onInstall: () => void;
  onRemove: () => void;
}> = ({ socket, index, requiredLevel, onInstall, onRemove }) => {
  const isUnlocked = socket.unlocked;
  const hasGem = socket.gem !== null;
  
  return (
    <div
      onClick={isUnlocked ? (hasGem ? onRemove : onInstall) : undefined}
      style={{
        width: '60px',
        height: '60px',
        border: `2px solid ${isUnlocked ? (hasGem ? '#f59f00' : '#4dabf7') : '#868e96'}`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isUnlocked ? 'pointer' : 'not-allowed',
        opacity: isUnlocked ? 1 : 0.5,
        backgroundColor: hasGem ? 'rgba(245, 159, 0, 0.1)' : 'rgba(77, 171, 247, 0.1)',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {hasGem ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>💎</div>
          <div style={{ fontSize: '10px', color: '#868e96' }}>
            {socket.gem && getGemName(socket.gem).substring(0, 4)}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#868e96' }}>
          <div style={{ fontSize: '20px' }}>◊</div>
          <div style={{ fontSize: '10px' }}>
            {isUnlocked ? '空' : `+${requiredLevel}`}
          </div>
        </div>
      )}
      
      {/* 解锁等级提示 */}
      {!isUnlocked && (
        <div style={{
          position: 'absolute',
          bottom: '-18px',
          fontSize: '10px',
          color: '#868e96'
        }}>
          需要 +{requiredLevel}
        </div>
      )}
    </div>
  );
};

/**
 * 宝石背包格子
 */
const GemBagSlot: React.FC<{
  gem: Gem;
  onClick: () => void;
}> = ({ gem, onClick }) => {
  const typeEmojis: Record<GemType, string> = {
    [GemType.Attack]: '🔴',
    [GemType.Defense]: '🔵',
    [GemType.HP]: '🟢',
    [GemType.Speed]: '🟡',
    [GemType.Critical]: '🟣'
  };
  
  const qualityColors: Record<GemQuality, string> = {
    [GemQuality.Common]: '#868e96',
    [GemQuality.Rare]: '#4dabf7',
    [GemQuality.Epic]: '#f59f00',
    [GemQuality.Legendary]: '#ff6b6b'
  };
  
  return (
    <div
      onClick={onClick}
      style={{
        width: '50px',
        height: '50px',
        border: `2px solid ${qualityColors[gem.quality]}`,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.2s ease',
        fontSize: '24px'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {typeEmojis[gem.type]}
    </div>
  );
};

// ==================== 主组件 ====================

export const EquipmentEnhancePanel: React.FC<EquipmentEnhancePanelProps> = ({
  equipmentName,
  equipmentSlot,
  baseStats,
  enhanceState,
  refinementState,
  gemSockets,
  playerGold,
  refinementStones,
  onEnhance,
  onRefine,
  onRepair,
  onInstallGem,
  onRemoveGem,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'enhance' | 'refine' | 'gems'>('enhance');
  const [selectedGem, setSelectedGem] = useState<Gem | null>(null);
  const [message, setMessage] = useState<string>('');
  
  // 计算当前属性
  const gemBonus = calculateGemBonus(gemSockets);
  const enhanceMultiplier = 1 + (enhanceState.level * 0.05);
  const refinementMultiplier = getRefinementBonus(refinementState.level);
  
  const finalStats: Record<string, number> = {};
  for (const [stat, value] of Object.entries(baseStats)) {
    finalStats[stat] = Math.floor(value * refinementMultiplier * enhanceMultiplier) + (gemBonus[stat] || 0);
  }
  
  // 强化相关
  const enhanceCost = calculateEnhanceCost(enhanceState.level);
  const enhanceRate = getEnhanceSuccessRate(enhanceState.level) * 100;
  const repairCost = getRepairCost(enhanceState.level);
  const isBroken = enhanceState.level <= -12;
  const isMaxEnhance = enhanceState.level >= 15;
  
  // 精炼相关
  const refineCost = calculateRefinementCost(refinementState.level);
  const canRefine = refinementStones >= refineCost && refinementState.level < 5;
  
  // 宝石槽解锁等级
  const socketUnlockLevels = SOCKET_UNLOCK_LEVELS;
  
  // 消息显示（3 秒后消失）
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  
  // 处理强化
  const handleEnhance = () => {
    if (playerGold < enhanceCost) {
      showMessage('❌ 金币不足！');
      return;
    }
    onEnhance();
  };
  
  // 处理精炼
  const handleRefine = () => {
    if (!canRefine) {
      showMessage('❌ 精炼石不足或已达满级！');
      return;
    }
    onRefine();
  };
  
  // 处理修复
  const handleRepair = () => {
    if (playerGold < repairCost) {
      showMessage('❌ 金币不足！');
      return;
    }
    onRepair();
    showMessage('✨ 装备已修复！');
  };
  
  // 处理宝石选择
  const handleGemSelect = (socketIndex: number) => {
    if (selectedGem) {
      onInstallGem(socketIndex, selectedGem);
      setSelectedGem(null);
      showMessage('✨ 宝石已镶嵌！');
    }
  };
  
  // 示例宝石背包
  const gemBag: Gem[] = [
    { id: '1', type: GemType.Attack, quality: GemQuality.Common, value: 10 },
    { id: '2', type: GemType.Defense, quality: GemQuality.Rare, value: 25 },
    { id: '3', type: GemType.HP, quality: GemQuality.Epic, value: 50 },
    { id: '4', type: GemType.Speed, quality: GemQuality.Legendary, value: 100 },
  ];
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      maxHeight: '80vh',
      backgroundColor: 'rgba(30, 30, 40, 0.98)',
      borderRadius: '12px',
      border: '2px solid #4dabf7',
      padding: '20px',
      color: '#fff',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      {/* 标题栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #4dabf7'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>
          {equipmentName} - 强化系统
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#868e96',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>
      
      {/* 装备信息 */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              {equipmentName} <span style={{ color: '#868e96' }}>({equipmentSlot})</span>
            </div>
            <div style={{ fontSize: '14px' }}>
              强化：<EnhanceLevelDisplay level={enhanceState.level} />
              {' | '}
              精炼：<RefinementStars level={refinementState.level} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#868e96' }}>最终属性</div>
            {Object.entries(finalStats).map(([stat, value]) => (
              <div key={stat} style={{ fontSize: '14px', color: '#51cf66' }}>
                {stat === 'attack' && '攻击'}
                {stat === 'defense' && '防御'}
                {stat === 'hp' && '生命'}
                {stat === 'speed' && '速度'}
                : +{value}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 选项卡 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('enhance')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'enhance' ? '#4dabf7' : 'rgba(0, 0, 0, 0.3)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          🔨 强化
        </button>
        <button
          onClick={() => setActiveTab('refine')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'refine' ? '#f59f00' : 'rgba(0, 0, 0, 0.3)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          ✨ 精炼
        </button>
        <button
          onClick={() => setActiveTab('gems')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'gems' ? '#51cf66' : 'rgba(0, 0, 0, 0.3)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          💎 宝石
        </button>
      </div>
      
      {/* 消息提示 */}
      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '6px',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
      
      {/* 强化面板 */}
      {activeTab === 'enhance' && (
        <div>
          {/* 强化等级 */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', color: getEnhanceColor(enhanceState.level) }}>
              {getEnhanceDisplayText(enhanceState.level)}
            </div>
            <div style={{ fontSize: '14px', color: '#868e96' }}>
              {isBroken ? '装备已损坏' : isMaxEnhance ? '已达最高等级' : `成功率：${enhanceRate.toFixed(1)}%`}
            </div>
          </div>
          
          {/* 强化按钮 */}
          {!isBroken && !isMaxEnhance && (
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <button
                onClick={handleEnhance}
                disabled={playerGold < enhanceCost}
                style={{
                  padding: '12px 40px',
                  fontSize: '16px',
                  backgroundColor: playerGold >= enhanceCost ? '#ff6b6b' : '#868e96',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: playerGold >= enhanceCost ? 'pointer' : 'not-allowed',
                  marginRight: '10px'
                }}
              >
                🔨 强化 (+1)
              </button>
              <button
                onClick={() => {}}  // TODO: 实现锁定功能
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  backgroundColor: enhanceState.isLocked ? '#f59f00' : 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                🔒 {enhanceState.isLocked ? '已锁定' : '锁定'}
              </button>
            </div>
          )}
          
          {/* 修复按钮 */}
          {isBroken && (
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <button
                onClick={handleRepair}
                disabled={playerGold < repairCost}
                style={{
                  padding: '12px 40px',
                  fontSize: '16px',
                  backgroundColor: playerGold >= repairCost ? '#51cf66' : '#868e96',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: playerGold >= repairCost ? 'pointer' : 'not-allowed'
                }}
              >
                🔧 修复装备
              </button>
            </div>
          )}
          
          {/* 消耗显示 */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>强化消耗：</span>
              <span style={{ color: '#ffd43b' }}>{enhanceCost} 金币</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>当前金币：</span>
              <span style={{ color: playerGold >= enhanceCost ? '#51cf66' : '#ff6b6b' }}>
                {playerGold}
              </span>
            </div>
          </div>
          
          {/* 强化等级说明 */}
          <div style={{ fontSize: '12px', color: '#868e96' }}>
            <div style={{ marginBottom: '5px' }}>📊 强化说明：</div>
            <div>• +0 ~ +10: 失败降级，+11 ~ +15: 失败大幅降级</div>
            <div>• +5, +10, +15: 解锁宝石槽</div>
            <div>• 锁定可防止降级（需消耗保护符）</div>
          </div>
        </div>
      )}
      
      {/* 精炼面板 */}
      {activeTab === 'refine' && (
        <div>
          {/* 精炼等级 */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', color: '#f59f00' }}>
              <RefinementStars level={refinementState.level} />
            </div>
            <div style={{ fontSize: '14px', color: '#868e96', marginTop: '10px' }}>
              属性加成：+{(refinementMultiplier - 1) * 100}%
            </div>
          </div>
          
          {/* 精炼按钮 */}
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <button
              onClick={handleRefine}
              disabled={!canRefine}
              style={{
                padding: '12px 40px',
                fontSize: '16px',
                backgroundColor: canRefine ? '#f59f00' : '#868e96',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: canRefine ? 'pointer' : 'not-allowed'
              }}
            >
              ✨ 精炼 ({refinementState.level}★→{refinementState.level + 1}★)
            </button>
          </div>
          
          {/* 消耗显示 */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>精炼消耗：</span>
              <span style={{ color: '#ffd43b' }}>{refineCost} 精炼石</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>当前精炼石：</span>
              <span style={{ color: refinementStones >= refineCost ? '#51cf66' : '#ff6b6b' }}>
                {refinementStones}
              </span>
            </div>
          </div>
          
          {/* 精炼成功率 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>
              成功率：{(REFINEMENT_SUCCESS_RATES[refinementState.level as 1 | 2 | 3 | 4 | 5] * 100).toFixed(0)}%
            </div>
            <ProgressBar
              current={REFINEMENT_SUCCESS_RATES[refinementState.level as 1 | 2 | 3 | 4 | 5] * 100}
              max={100}
              color="#f59f00"
            />
          </div>
          
          {/* 精炼说明 */}
          <div style={{ fontSize: '12px', color: '#868e96' }}>
            <div style={{ marginBottom: '5px' }}>📊 精炼说明：</div>
            <div>• 1★→2★: 100% | 2★→3★: 80% | 3★→4★: 60% | 4★→5★: 40%</div>
            <div>• 精炼失败不降级，仅消耗材料</div>
            <div>• 5★精炼提供 +100% 基础属性加成</div>
          </div>
        </div>
      )}
      
      {/* 宝石面板 */}
      {activeTab === 'gems' && (
        <div>
          {/* 宝石槽位 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', marginBottom: '10px' }}>宝石槽位</div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              {gemSockets.map((socket, index) => (
                <GemSocketDisplay
                  key={index}
                  socket={socket}
                  index={index}
                  requiredLevel={socketUnlockLevels[index]}
                  onInstall={() => handleGemSelect(index)}
                  onRemove={() => {
                    onRemoveGem(index);
                    showMessage('💎 宝石已取下');
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* 宝石背包 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', marginBottom: '10px' }}>
              宝石背包（点击选择）
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {gemBag.map((gem) => (
                <GemBagSlot
                  key={gem.id}
                  gem={gem}
                  onClick={() => {
                    setSelectedGem(gem);
                    showMessage(`已选择：${getGemName(gem)}`);
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* 当前选择的宝石 */}
          {selectedGem && (
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                当前选择：<span style={{ color: '#f59f00' }}>{getGemName(selectedGem)}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#868e96' }}>
                点击未使用的宝石槽进行镶嵌
              </div>
            </div>
          )}
          
          {/* 宝石说明 */}
          <div style={{ fontSize: '12px', color: '#868e96' }}>
            <div style={{ marginBottom: '5px' }}>📊 宝石说明：</div>
            <div>• 🔴 红宝石：攻击 | 🔵 蓝宝石：防御 | 🟢 绿宝石：生命</div>
            <div>• 🟡 黄宝石：速度 | 🟣 紫宝石：暴击</div>
            <div>• 宝石槽解锁：+0 (1 个) | +5 (2 个) | +10 (3 个) | +15 (4 个)</div>
          </div>
        </div>
      )}
      
      {/* 底部按钮 */}
      <div style={{
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'right'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
};

// 需要导入的常量（避免重复定义）
const REFINEMENT_SUCCESS_RATES: Record<number, number> = {
  1: 1.00,
  2: 0.80,
  3: 0.60,
  4: 0.40,
  5: 0.00
};
