/**
 * Dungeon Panel - v0.29
 * 副本系统界面：副本列表、挑战、扫荡
 */

import React, { useState } from 'react';
import {
  Dungeon,
  DungeonDifficulty,
  DungeonType,
  DungeonState,
  DungeonReward,
  RewardType,
  generateDungeons,
  challengeDungeon,
  sweepDungeon,
  canSweep,
  recoverStamina,
  getDungeonProgress,
  countClearedDungeons,
  countThreeStarDungeons,
  STAMINA_RECOVER_RATE,
} from '../utils/dungeons';

// ==================== 组件属性 ====================

interface DungeonPanelProps {
  playerLevel: number;
  playerPower: number;
  dungeonState: DungeonState;
  onChallenge: (dungeon: Dungeon, result: any) => void;
  onSweep: (dungeon: Dungeon, result: any) => void;
  onClose: () => void;
}

// ==================== 辅助组件 ====================

/**
 * 难度徽章
 */
const DifficultyBadge: React.FC<{ difficulty: DungeonDifficulty }> = ({ difficulty }) => {
  const colors = {
    [DungeonDifficulty.Easy]: '#51cf66',
    [DungeonDifficulty.Normal]: '#f59f00',
    [DungeonDifficulty.Hard]: '#ff6b6b',
  };
  
  const names = {
    [DungeonDifficulty.Easy]: '普通',
    [DungeonDifficulty.Normal]: '困难',
    [DungeonDifficulty.Hard]: '地狱',
  };
  
  return (
    <span style={{
      padding: '4px 8px',
      backgroundColor: colors[difficulty],
      color: '#fff',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      {names[difficulty]}
    </span>
  );
};

/**
 * 星级显示
 */
const StarRating: React.FC<{ stars: number; maxStars?: number }> = ({ stars, maxStars = 3 }) => {
  return (
    <span style={{ color: '#ffd43b', fontSize: '14px' }}>
      {'★'.repeat(stars)}{'☆'.repeat(maxStars - stars)}
    </span>
  );
};

/**
 * 奖励显示
 */
const RewardDisplay: React.FC<{ reward: DungeonReward }> = ({ reward }) => {
  const icons: Record<RewardType, string> = {
    [RewardType.Gold]: '💰',
    [RewardType.Exp]: '📚',
    [RewardType.Equipment]: '⚔️',
    [RewardType.Material]: '🧪',
    [RewardType.PetFragment]: '🐾',
    [RewardType.Diamond]: '💎',
  };
  
  const names: Record<RewardType, string> = {
    [RewardType.Gold]: '金币',
    [RewardType.Exp]: '经验',
    [RewardType.Equipment]: '装备',
    [RewardType.Material]: '材料',
    [RewardType.PetFragment]: '宠物碎片',
    [RewardType.Diamond]: '钻石',
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
      <span>{icons[reward.type]}</span>
      <span>{names[reward.type]} ×{reward.amount}</span>
      {reward.quality && (
        <span style={{ color: '#f59f00' }}>{'★'.repeat(reward.quality)}</span>
      )}
    </div>
  );
};

/**
 * 体力条
 */
const StaminaBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const percentage = (current / max) * 100;
  
  return (
    <div style={{ width: '100%', margin: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span>⚡ 体力</span>
        <span>{current}/{max} (+{STAMINA_RECOVER_RATE}/分钟)</span>
      </div>
      <div style={{
        width: '100%',
        height: '10px',
        backgroundColor: '#343a40',
        borderRadius: '5px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: percentage > 50 ? '#51cf66' : percentage > 20 ? '#f59f00' : '#ff6b6b',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

// ==================== 主组件 ====================

export const DungeonPanel: React.FC<DungeonPanelProps> = ({
  playerLevel,
  playerPower,
  dungeonState,
  onChallenge,
  onSweep,
  onClose
}) => {
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [message, setMessage] = useState<string>('');
  const [lastResult, setLastResult] = useState<any>(null);
  const [sweepTimes, setSweepTimes] = useState(1);
  
  const dungeons = generateDungeons();
  
  // 自动恢复体力（每分钟）
  React.useEffect(() => {
    const interval = setInterval(() => {
      // 实际恢复逻辑在父组件处理
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // 显示消息
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  
  // 选择副本
  const handleSelectDungeon = (dungeon: Dungeon) => {
    setSelectedDungeon(dungeon);
    setLastResult(null);
    setSweepTimes(1);
  };
  
  // 挑战副本
  const handleChallenge = () => {
    if (!selectedDungeon) return;
    
    const result = challengeDungeon(dungeonState, selectedDungeon, playerPower, playerLevel);
    setLastResult(result);
    onChallenge(selectedDungeon, result);
    
    if (result.success) {
      showMessage(result.message);
    } else {
      showMessage(result.message);
    }
  };
  
  // 扫荡副本
  const handleSweep = () => {
    if (!selectedDungeon) return;
    
    const result = sweepDungeon(dungeonState, selectedDungeon, sweepTimes);
    setLastResult(result);
    onSweep(selectedDungeon, result);
    showMessage(result.message);
  };
  
  // 检查扫荡条件
  const sweepCheck = selectedDungeon ? canSweep(dungeonState, selectedDungeon, playerLevel) : null;
  
  // 统计
  const clearedCount = countClearedDungeons(dungeonState);
  const threeStarCount = countThreeStarDungeons(dungeonState);
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '800px',
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
        <h2 style={{ margin: 0, fontSize: '20px' }}>🏰 副本系统</h2>
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
      
      {/* 玩家状态 */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#868e96' }}>玩家等级</div>
            <div style={{ fontSize: '18px', color: '#51cf66' }}>Lv.{playerLevel}</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#868e96' }}>战力</div>
            <div style={{ fontSize: '18px', color: '#f59f00' }}>{playerPower}</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#868e96' }}>通关/3 星</div>
            <div style={{ fontSize: '18px' }}>{clearedCount} / {threeStarCount}</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <StaminaBar current={dungeonState.stamina} max={dungeonState.maxStamina} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px' }}>
          <span>🎫 每日挑战：{dungeonState.dailyAttempts}/{dungeonState.maxDailyAttempts}</span>
          <span>🎟️ 扫荡券：{dungeonState.sweepTickets}</span>
        </div>
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
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 副本列表 */}
        <div style={{ flex: 1, minWidth: '400px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📋 副本列表</h3>
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            {dungeons.map(dungeon => {
              const progress = getDungeonProgress(dungeonState, dungeon.id);
              const canEnter = playerLevel >= dungeon.requiredLevel;
              
              return (
                <div
                  key={dungeon.id}
                  onClick={() => canEnter && handleSelectDungeon(dungeon)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: selectedDungeon?.id === dungeon.id 
                      ? 'rgba(77, 171, 247, 0.3)' 
                      : 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    cursor: canEnter ? 'pointer' : 'not-allowed',
                    opacity: canEnter ? 1 : 0.5,
                    border: selectedDungeon?.id === dungeon.id ? '1px solid #4dabf7' : '1px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {dungeon.name}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <DifficultyBadge difficulty={dungeon.difficulty} />
                        <span style={{ fontSize: '12px', color: '#868e96' }}>
                          Lv.{dungeon.requiredLevel}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {progress && (
                        <StarRating stars={progress.stars} />
                      )}
                      <div style={{ fontSize: '12px', color: '#868e96', marginTop: '4px' }}>
                        ⚡{dungeon.staminaCost} | 💪{dungeon.recommendedPower}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 副本详情 */}
        <div style={{ width: '300px' }}>
          {selectedDungeon ? (
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📖 副本详情</h3>
              
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {selectedDungeon.name}
                </div>
                
                <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: '#868e96' }}>推荐战力：</span>
                  <span style={{ color: playerPower >= selectedDungeon.recommendedPower ? '#51cf66' : '#ff6b6b' }}>
                    {selectedDungeon.recommendedPower}
                  </span>
                </div>
                
                <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: '#868e96' }}>进入等级：</span>
                  <span style={{ color: playerLevel >= selectedDungeon.requiredLevel ? '#51cf66' : '#ff6b6b' }}>
                    Lv.{selectedDungeon.requiredLevel}
                  </span>
                </div>
                
                <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: '#868e96' }}>体力消耗：</span>
                  <span style={{ color: '#ffd43b' }}>⚡ {selectedDungeon.staminaCost}</span>
                </div>
                
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '13px', color: '#868e96', marginBottom: '5px' }}>基础奖励：</div>
                  {selectedDungeon.baseRewards.map((reward, idx) => (
                    <RewardDisplay key={idx} reward={reward} />
                  ))}
                </div>
                
                {selectedDungeon.firstClearReward && (
                  <div style={{ marginTop: '10px', padding: '8px', backgroundColor: 'rgba(245, 159, 0, 0.2)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '13px', color: '#f59f00', marginBottom: '5px' }}>🎁 首通奖励：</div>
                    <RewardDisplay reward={selectedDungeon.firstClearReward} />
                  </div>
                )}
              </div>
              
              {/* 挑战按钮 */}
              <button
                onClick={handleChallenge}
                disabled={!canEnter || dungeonState.stamina < selectedDungeon.staminaCost || dungeonState.dailyAttempts <= 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '10px',
                  backgroundColor: canEnter && dungeonState.stamina >= selectedDungeon.staminaCost && dungeonState.dailyAttempts > 0
                    ? '#51cf66'
                    : '#868e96',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: canEnter && dungeonState.stamina >= selectedDungeon.staminaCost && dungeonState.dailyAttempts > 0
                    ? 'pointer'
                    : 'not-allowed'
                }}
              >
                ⚔️ 挑战副本
              </button>
              
              {/* 扫荡按钮 */}
              {sweepCheck && (
                <div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={sweepTimes}
                      onChange={(e) => setSweepTimes(parseInt(e.target.value) || 1)}
                      style={{
                        width: '60px',
                        padding: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid #4dabf7',
                        borderRadius: '6px',
                        color: '#fff',
                        textAlign: 'center'
                      }}
                    />
                    <button
                      onClick={handleSweep}
                      disabled={!sweepCheck.can || dungeonState.sweepTickets < 1 || dungeonState.dailyAttempts < 1}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: sweepCheck.can && dungeonState.sweepTickets >= 1 && dungeonState.dailyAttempts >= 1
                          ? '#f59f00'
                          : '#868e96',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: sweepCheck.can && dungeonState.sweepTickets >= 1 && dungeonState.dailyAttempts >= 1
                          ? 'pointer'
                          : 'not-allowed'
                      }}
                    >
                      🎟️ 扫荡
                    </button>
                  </div>
                  {!sweepCheck.can && (
                    <div style={{ fontSize: '12px', color: '#ff6b6b', textAlign: 'center' }}>
                      {sweepCheck.reason}
                    </div>
                  )}
                </div>
              )}
              
              {/* 战斗结果 */}
              {lastResult && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: lastResult.success ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {lastResult.success ? '🎉 挑战成功' : '❌ 挑战失败'}
                  </div>
                  
                  {lastResult.stars > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <StarRating stars={lastResult.stars} />
                    </div>
                  )}
                  
                  {lastResult.rewards && lastResult.rewards.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#868e96', marginBottom: '5px' }}>获得奖励：</div>
                      {lastResult.rewards.map((reward: DungeonReward, idx: number) => (
                        <RewardDisplay key={idx} reward={reward} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#868e96'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏰</div>
              <div>请选择一个副本</div>
            </div>
          )}
        </div>
      </div>
      
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

// 辅助函数
function canEnter(dungeon: Dungeon, playerLevel: number): boolean {
  return playerLevel >= dungeon.requiredLevel;
}
