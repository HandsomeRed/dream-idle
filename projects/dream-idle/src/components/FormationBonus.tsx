// v0.94 阵法加成显示组件
import React from 'react';
import { FormationBonus as FormationBonusType } from '../types/formation';

interface FormationBonusProps {
  bonuses: FormationBonusType[];
  formationName?: string;
  compact?: boolean;
}

export const FormationBonus: React.FC<FormationBonusProps> = ({
  bonuses,
  formationName,
  compact = false,
}) => {
  if (bonuses.length === 0) {
    return null;
  }

  // 按位置分组
  const groupedByPosition = bonuses.reduce((acc, bonus) => {
    if (!acc[bonus.position]) {
      acc[bonus.position] = [];
    }
    acc[bonus.position].push(bonus);
    return acc;
  }, {} as Record<number, FormationBonusType[]>);

  const positionNames: Record<number, string> = {
    1: '队长位',
    2: '2 号位',
    3: '3 号位',
    4: '4 号位',
    5: '5 号位',
  };

  if (compact) {
    // 紧凑模式：只显示主要加成
    const mainBonuses = bonuses
      .filter(b => Math.abs(b.value) >= 10)
      .slice(0, 3);

    return (
      <div className="flex flex-wrap gap-2">
        {formationName && (
          <span className="text-yellow-400 font-bold">{formationName}</span>
        )}
        {mainBonuses.map((bonus, idx) => (
          <span
            key={idx}
            className={`text-sm ${
              bonus.value > 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {statName(bonus.stat)}{bonus.value > 0 ? '+' : ''}{bonus.value.toFixed(1)}%
          </span>
        ))}
      </div>
    );
  }

  // 详细模式：显示所有位置的加成
  return (
    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
      {formationName && (
        <h3 className="text-lg font-bold text-yellow-400 mb-3">
          {formationName} 加成
        </h3>
      )}

      <div className="space-y-3">
        {Object.entries(groupedByPosition).map(([position, positionBonuses]) => (
          <div key={position} className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold w-16">
              {positionNames[parseInt(position)]}
            </span>
            <div className="flex flex-wrap gap-2 flex-1">
              {positionBonuses.map((bonus, idx) => (
                <span
                  key={idx}
                  className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${bonus.value > 0 
                      ? 'bg-green-900/50 text-green-300' 
                      : 'bg-red-900/50 text-red-300'
                    }
                  `}
                >
                  {statName(bonus.stat)}{bonus.value > 0 ? '+' : ''}{bonus.value.toFixed(1)}%
                </span>
              ))}
            </div>
          </div>
        ))}
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

export default FormationBonus;
