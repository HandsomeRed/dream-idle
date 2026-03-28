// v0.94 阵法 UI 组件测试
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormationSelect } from '../components/FormationSelect';
import { FormationBonus } from '../components/FormationBonus';
import { PlayerFormation } from '../types/formation';

describe('v0.94 阵法 UI 组件', () => {
  const mockPlayerFormations: PlayerFormation[] = [
    { formationId: 'tian_fu', level: 5, exp: 100, unlocked: true },
    { formationId: 'di_zai', level: 3, exp: 50, unlocked: true },
    { formationId: 'feng_yang', level: 1, exp: 0, unlocked: false },
  ];

  describe('FormationSelect', () => {
    test('应该渲染所有 9 个阵法', () => {
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          onClose={() => {}}
        />
      );

      expect(screen.getByText('天覆阵')).toBeInTheDocument();
      expect(screen.getByText('地载阵')).toBeInTheDocument();
      expect(screen.getByText('风扬阵')).toBeInTheDocument();
    });

    test('已解锁阵法应该可点击', () => {
      const onSelect = jest.fn();
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          onSelect={onSelect}
          onClose={() => {}}
        />
      );

      const tianFuCard = screen.getByText('天覆阵').closest('.cursor-pointer');
      expect(tianFuCard).not.toHaveClass('opacity-50');
      
      if (tianFuCard) {
        fireEvent.click(tianFuCard);
        expect(onSelect).toHaveBeenCalledWith('tian_fu');
      }
    });

    test('未解锁阵法应该显示锁定状态', () => {
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          onClose={() => {}}
        />
      );

      const fengYangElement = screen.getByText('风扬阵');
      const fengYangCard = fengYangElement.closest('div[class*="rounded-lg"]');
      expect(fengYangCard).toHaveClass('opacity-50');
    });

    test('选中阵法应该高亮显示', () => {
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          selectedFormation="tian_fu"
          onClose={() => {}}
        />
      );

      const tianFuElement = screen.getByText('天覆阵');
      const tianFuCard = tianFuElement.closest('div[class*="rounded-lg"]');
      expect(tianFuCard?.className).toContain('border-yellow-500');
    });

    test('应该显示阵法描述', () => {
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/天阵主速/)).toBeInTheDocument();
      expect(screen.getByText(/地阵主防/)).toBeInTheDocument();
    });

    test('应该显示阵法等级', () => {
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          onClose={() => {}}
        />
      );

      expect(screen.getByText('等级：5/20')).toBeInTheDocument();
    });

    test('点击关闭按钮应该调用 onClose', () => {
      const onClose = jest.fn();
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByText('✕'));
      expect(onClose).toHaveBeenCalled();
    });

    test('点击取消按钮应该调用 onClose', () => {
      const onClose = jest.fn();
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByText('取消'));
      expect(onClose).toHaveBeenCalled();
    });

    test('应该显示敌方阵法信息', () => {
      render(
        <FormationSelect
          playerFormations={mockPlayerFormations}
          enemyFormation="di_zai"
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/敌方阵法/)).toBeInTheDocument();
      expect(screen.getByText('di_zai')).toBeInTheDocument();
    });
  });

  describe('FormationBonus', () => {
    const mockBonuses = [
      { position: 1, stat: 'speed' as const, value: 15 },
      { position: 1, stat: 'damage' as const, value: -5 },
      { position: 2, stat: 'speed' as const, value: 12 },
      { position: 2, stat: 'damage' as const, value: -4 },
    ];

    test('应该渲染加成信息', () => {
      render(<FormationBonus bonuses={mockBonuses} />);

      expect(screen.getByText('队长位')).toBeInTheDocument();
      expect(screen.getByText('2 号位')).toBeInTheDocument();
    });

    test('应该显示阵法名称', () => {
      render(<FormationBonus bonuses={mockBonuses} formationName="天覆阵" />);

      expect(screen.getByText('天覆阵 加成')).toBeInTheDocument();
    });

    test('正加成应该用绿色显示', () => {
      render(<FormationBonus bonuses={mockBonuses} />);

      const speedBonus = screen.getByText(/速度.*\+15\.0%/);
      expect(speedBonus).toHaveClass('text-green-300');
    });

    test('负加成应该用红色显示', () => {
      render(<FormationBonus bonuses={mockBonuses} />);

      const damagePenalty = screen.getByText(/伤害.*-5\.0%/);
      expect(damagePenalty).toHaveClass('text-red-300');
    });

    test('紧凑模式应该只显示主要加成', () => {
      render(<FormationBonus bonuses={mockBonuses} compact />);

      // 紧凑模式不显示位置信息
      expect(screen.queryByText('队长位')).not.toBeInTheDocument();
    });

    test('空加成列表应该不渲染', () => {
      const { container } = render(<FormationBonus bonuses={[]} />);
      expect(container.firstChild).toBeNull();
    });

    test('紧凑模式应该显示阵法名称', () => {
      render(<FormationBonus bonuses={mockBonuses} formationName="天覆阵" compact />);

      expect(screen.getByText('天覆阵')).toBeInTheDocument();
    });
  });
});
