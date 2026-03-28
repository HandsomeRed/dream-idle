// v0.94 阵法选择 UI 组件
import React, { useState } from 'react';
import { Formation, PlayerFormation } from '../types/formation';
import { getAllFormations, getFormationStats, getFormationDamageMultiplier } from '../systems/formationSystem';

interface FormationSelectProps {
  playerFormations: PlayerFormation[];
  selectedFormation?: string;
  enemyFormation?: string;
  onSelect?: (formationId: string) => void;
  onClose?: () => void;
}

export const FormationSelect: React.FC<FormationSelectProps> = ({
  playerFormations,
  selectedFormation,
  enemyFormation,
  onSelect,
  onClose,
}) => {
  const [hoveredFormation, setHoveredFormation] = useState<string | null>(null);

  const formations = getAllFormations();

  const getFormationStatus = (formationId: string): 'locked' | 'unlocked' | 'selected' => {
    const playerFormation = playerFormations.find(pf => pf.formationId === formationId);
    if (!playerFormation?.unlocked) return 'locked';
    if (selectedFormation === formationId) return 'selected';
    return 'unlocked';
  };

  const getMatchupInfo = (formationId: string) => {
    if (!enemyFormation) return null;
    
    const multiplier = getFormationDamageMultiplier(formationId, enemyFormation);
    if (multiplier > 1) return { type: 'strong', text: '克制 +25%' };
    if (multiplier < 1) return { type: 'weak', text: '被克制 -25%' };
    return { type: 'neutral', text: '平局' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-blue-900 to-purple-900 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">选择阵法</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        {enemyFormation && (
          <div className="mb-4 p-3 bg-yellow-900/30 rounded-lg">
            <p className="text-yellow-200">
              敌方阵法：<span className="font-bold">{enemyFormation}</span>
              {hoveredFormation && (() => {
                const info = getMatchupInfo(hoveredFormation);
                return info && (
                  <span className={`ml-2 ${
                    info.type === 'strong' ? 'text-green-400' :
                    info.type === 'weak' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    → {info.text}
                  </span>
                );
              })()}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formations.map((formation) => {
            const status = getFormationStatus(formation.id);
            const stats = getFormationStats(formation);
            const matchup = hoveredFormation ? getMatchupInfo(hoveredFormation) : null;

            return (
              <div
                key={formation.id}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${status === 'locked' 
                    ? 'bg-gray-800/50 border-gray-700 opacity-50' 
                    : status === 'selected'
                    ? 'bg-yellow-900/50 border-yellow-500 shadow-lg shadow-yellow-500/30'
                    : 'bg-blue-900/30 border-blue-700 hover:border-blue-400 hover:bg-blue-800/50'
                  }
                `}
                onClick={() => status !== 'locked' && onSelect?.(formation.id)}
                onMouseEnter={() => setHoveredFormation(formation.id)}
                onMouseLeave={() => setHoveredFormation(null)}
              >
                {status === 'locked' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">🔒</span>
                  </div>
                )}

                <div className={status === 'locked' ? 'opacity-30' : ''}>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {formation.name}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    {formation.description}
                  </p>

                  <div className="space-y-1">
                    {Object.entries(stats)
                      .filter(([_, value]) => value !== 0)
                      .slice(0, 4)
                      .map(([stat, value]) => (
                        <div key={stat} className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            {statName(stat)}
                          </span>
                          <span className={value > 0 ? 'text-green-400' : 'text-red-400'}>
                            {value > 0 ? '+' : ''}{value}%
                          </span>
                        </div>
                      ))}
                  </div>

                  {status === 'unlocked' && (
                    <div className="mt-3 pt-3 border-t border-blue-700">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>等级：{playerFormations.find(pf => pf.formationId === formation.id)?.level || 1}/20</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

function statName(stat: string): string {
  const names: Record<string, string> = {
    damage: '伤害',
    defense: '防御',
    speed: '速度',
    magic: '灵力',
    sealHit: '封印命中',
    sealResist: '抗封',
    crit: '暴击',
    critResist: '抗暴',
  };
  return names[stat] || stat;
}

export default FormationSelect;
