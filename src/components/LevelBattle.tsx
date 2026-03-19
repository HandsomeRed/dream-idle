import { useState, useEffect } from 'react'
import { getLevel, calculateStars, updateProgress, Level, LevelProgress, BattleResult } from '../utils/levels'
import { CharacterStats } from '../utils/gameStats'

interface LevelBattleProps {
  levelId: number
  playerStats: CharacterStats
  playerName: string
  progress: LevelProgress[]
  onBattleEnd: (victory: boolean, expGained: number, goldGained: number, stars: number) => void
  onBack: () => void
}

export function LevelBattle({
  levelId,
  playerStats,
  playerName,
  progress,
  onBattleEnd,
  onBack,
}: LevelBattleProps) {
  const level = getLevel(levelId)
  const [battleState, setBattleState] = useState<'preparing' | 'fighting' | 'result'>('preparing')
  const [round, setRound] = useState(0)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [playerHP, setPlayerHP] = useState(playerStats.hp)
  const [enemyHP, setEnemyHP] = useState(100)
  const [casualtyCount, setCasualtyCount] = useState(0)
  const [result, setResult] = useState<BattleResult | null>(null)

  const maxEnemyHP = 100 * (level?.enemyLevel || 1) * 0.5

  // 模拟战斗
  useEffect(() => {
    if (battleState !== 'fighting' || !level) return

    const maxRounds = 20
    const battleInterval = setInterval(() => {
      setRound(prev => {
        const newRound = prev + 1

        // 玩家攻击
        const playerDamage = Math.floor(playerStats.attack * (1 + Math.random() * 0.5))
        setEnemyHP(prevHP => {
          const newHP = prevHP - playerDamage
          setBattleLog(log => [...log.slice(-4), `⚔️ 第${newRound}回合：${playerName}造成${playerDamage}点伤害`])
          return Math.max(0, newHP)
        })

        // 检查敌人是否死亡
        setEnemyHP(currentEnemyHP => {
          if (currentEnemyHP <= 0) {
            clearInterval(battleInterval)
            const battleResult: BattleResult = {
              victory: true,
              round: newRound,
              playerAlive: true,
              casualtyCount,
            }
            setResult(battleResult)
            setBattleState('result')
            return 0
          }

          // 敌人攻击
          const enemyDamage = Math.floor(level.enemyLevel * 2 * (0.8 + Math.random() * 0.4))
          setPlayerHP(prevHP => {
            const newHP = prevHP - enemyDamage
            setBattleLog(log => [...log.slice(-4), `🗡️ 敌人反击造成${enemyDamage}点伤害`])
            
            if (newHP <= 0) {
              clearInterval(battleInterval)
              const battleResult: BattleResult = {
                victory: false,
                round: newRound,
                playerAlive: false,
                casualtyCount: casualtyCount + 1,
              }
              setResult(battleResult)
              setBattleState('result')
              return 0
            }
            return newHP
          })

          return currentEnemyHP
        })

        if (newRound >= maxRounds) {
          clearInterval(battleInterval)
          // 超时判负
          const battleResult: BattleResult = {
            victory: false,
            round: newRound,
            playerAlive: playerHP > 0,
            casualtyCount,
          }
          setResult(battleResult)
          setBattleState('result')
        }

        return newRound
      })
    }, 800)

    return () => clearInterval(battleInterval)
  }, [battleState, level, playerStats, playerName, casualtyCount, playerHP, maxEnemyHP])

  if (!level) {
    return <div>关卡不存在</div>
  }

  // 战斗结果界面
  if (battleState === 'result' && result) {
    const stars = calculateStars(result, level)
    const goldReward = result.victory ? level.rewards.gold : 0
    const expReward = result.victory ? level.rewards.exp : 0

    return (
      <div className="app-container">
        <div className={`battle-result ${result.victory ? 'victory' : 'defeat'}`}>
          <h1>{result.victory ? '🎉 胜利！' : '💀 失败'}</h1>
          <div className="result-stats">
            <p>战斗回合：{result.round}</p>
            <p>获得星级：{'★'.repeat(stars)}</p>
            {result.victory && (
              <>
                <p>💰 金币：+{goldReward}</p>
                <p>✨ 经验：+{expReward}</p>
              </>
            )}
          </div>
          <div className="button-group">
            {result.victory && (
              <button
                className="start-button"
                onClick={() => onBattleEnd(true, expReward, goldReward, stars)}
              >
                领取奖励
              </button>
            )}
            <button className="secondary-button" onClick={onBack}>
              {result.victory ? '返回' : '再试一次'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 战斗前准备界面
  if (battleState === 'preparing') {
    return (
      <div className="app-container">
        <div className="battle-prep">
          <h1>⚔️ {level.name}</h1>
          <div className="enemy-info">
            <div className="enemy-avatar">👹</div>
            <h2>敌方阵容</h2>
            <p>等级：{level.enemyLevel}</p>
            <p>数量：{level.enemyCount}</p>
            <p>预计战力：{Math.floor(maxEnemyHP * 2)}</p>
          </div>
          <div className="player-info">
            <h2>{playerName}</h2>
            <p>等级：{playerStats.level}</p>
            <p>气血：{playerStats.hp}</p>
            <p>攻击：{playerStats.attack}</p>
            <p>防御：{playerStats.defense}</p>
          </div>
          <div className="button-group">
            <button className="start-button" onClick={() => setBattleState('fighting')}>
              ⚔️ 开始战斗
            </button>
            <button className="secondary-button" onClick={onBack}>
              返回
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 战斗进行界面
  return (
    <div className="app-container">
      <div className="battle-fighting">
        <div className="battle-header">
          <span>第{level.chapter}章 - 第{level.stage}关</span>
          <span>回合：{round}</span>
        </div>

        <div className="battle-field">
          {/* 玩家 */}
          <div className="battle-unit player">
            <div className="unit-avatar">🧙</div>
            <div className="unit-name">{playerName}</div>
            <div className="hp-bar">
              <div className="hp-fill" style={{ width: `${(playerHP / playerStats.hp) * 100}%` }} />
            </div>
            <div className="hp-text">{playerHP}/{playerStats.hp}</div>
          </div>

          {/* VS */}
          <div className="vs-text">VS</div>

          {/* 敌人 */}
          <div className="battle-unit enemy">
            <div className="unit-avatar">👹</div>
            <div className="unit-name">关卡敌人</div>
            <div className="hp-bar">
              <div className="hp-fill" style={{ width: `${(enemyHP / maxEnemyHP) * 100}%` }} />
            </div>
            <div className="hp-text">{enemyHP}/{maxEnemyHP}</div>
          </div>
        </div>

        <div className="battle-log">
          {battleLog.map((log, i) => (
            <div key={i} className="log-entry">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
