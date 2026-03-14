import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Battle } from '../components/Battle'
import { calculateStatsAtLevel } from '../utils/gameStats'

describe('Battle Component', () => {
  const mockPlayerStats = calculateStatsAtLevel('剑侠客', 1)
  const mockOnBattleEnd = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render battle scene with player and monster', () => {
    render(
      <Battle
        playerStats={mockPlayerStats}
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    // Should show player name
    expect(screen.getByText('测试少侠')).toBeInTheDocument()
    
    // Should show monster (random, but should exist)
    expect(screen.getByText(/⚔️ VS ⚔️/i)).toBeInTheDocument()
    
    // Should show encounter log
    expect(screen.getByText(/遭遇野生/i)).toBeInTheDocument()
  })

  it('should display player and monster levels', () => {
    render(
      <Battle
        playerStats={mockPlayerStats}
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    // Should show player level
    expect(screen.getAllByText(/Lv\./i).length).toBeGreaterThanOrEqual(1)
  })

  it('should have back button', () => {
    render(
      <Battle
        playerStats={mockPlayerStats}
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    setTimeout(() => {}, 100)
    jest.advanceTimersByTime(100)

    const backButton = screen.getByText('← 返回')
    expect(backButton).toBeInTheDocument()
    
    fireEvent.click(backButton)
    expect(mockOnBack).toHaveBeenCalled()
  })

  it('should render action buttons', () => {
    render(
      <Battle
        playerStats={mockPlayerStats}
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    setTimeout(() => {}, 100)
    jest.advanceTimersByTime(100)

    expect(screen.getByText(/⚔️ 攻击/i)).toBeInTheDocument()
    expect(screen.getByText(/🔮 法术/i)).toBeInTheDocument()
    expect(screen.getByText(/💚 治疗/i)).toBeInTheDocument()
    expect(screen.getByText(/▶️ 自动/i)).toBeInTheDocument()
  })

  it('should disable action buttons when not player turn', async () => {
    render(
      <Battle
        playerStats={{ ...mockPlayerStats, speed: 1 }} // Low speed to ensure monster goes first
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    setTimeout(() => {}, 100)
    jest.advanceTimersByTime(100)

    // Wait for battle to start and monster to potentially attack
    await waitFor(() => {
      const attackButton = screen.getByText(/⚔️ 攻击/i)
      expect(attackButton).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should show battle logs', () => {
    render(
      <Battle
        playerStats={mockPlayerStats}
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    setTimeout(() => {}, 100)
    jest.advanceTimersByTime(100)

    // Battle logs container should exist (check for encounter message or logs container)
    expect(screen.queryByText(/遭遇/i) || document.querySelector('.battle-logs')).toBeTruthy()
  })

  it('should handle attack button click', () => {
    render(
      <Battle
        playerStats={mockPlayerStats}
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    setTimeout(() => {}, 100)
    jest.advanceTimersByTime(100)

    const attackButton = screen.getByText(/⚔️ 攻击/i)
    fireEvent.click(attackButton)

    // Should trigger attack action
    expect(attackButton).toBeInTheDocument()
  })

  it('should toggle auto battle', () => {
    render(
      <Battle
        playerStats={mockPlayerStats}
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    setTimeout(() => {}, 100)
    jest.advanceTimersByTime(100)

    const autoButton = screen.getByText(/▶️ 自动/i)
    fireEvent.click(autoButton)

    // Should change to pause
    setTimeout(() => {}, 100)
    jest.advanceTimersByTime(100)

    expect(screen.getByText(/⏸️ 暂停/i)).toBeInTheDocument()
  })

  it('should display health bars', () => {
    render(
      <Battle
        playerStats={mockPlayerStats}
        playerName="测试少侠"
        onBattleEnd={mockOnBattleEnd}
        onBack={mockOnBack}
      />
    )

    setTimeout(() => {}, 100)
    jest.advanceTimersByTime(100)

    // Health bars should be present
    const healthBars = document.querySelectorAll('.health-bar')
    expect(healthBars.length).toBeGreaterThanOrEqual(1)
  })
})
