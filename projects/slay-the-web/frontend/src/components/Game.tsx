import { useState, useEffect, useRef } from 'react'
import Card from './Card'

interface Player {
  max_hp: number
  hp: number
  energy: number
  max_energy: number
  block: number
  hand: any[]
  deck_count: number
  discard_count: number
}

interface Enemy {
  id: string
  name: string
  max_hp: number
  hp: number
  block: number
  intent: string
  intent_value: number
}

interface GameState {
  player: Player
  enemy: Enemy | null
  turn: number
  is_player_turn: boolean
  combat_log: string[]
  game_over: boolean
  victory: boolean
}

interface GameProps {
  gameId: string
  onBack: () => void
}

export default function Game({ gameId, onBack }: GameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // 连接 WebSocket
    const wsUrl = `ws://${window.location.hostname}:3000/ws/${gameId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('已连接到游戏服务器')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      const state = JSON.parse(event.data)
      setGameState(state)
    }

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log('连接已关闭')
      setIsConnected(false)
    }

    wsRef.current = ws

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [gameId])

  const playCard = (cardIndex: number) => {
    if (wsRef.current && gameState?.is_player_turn) {
      wsRef.current.send(JSON.stringify({
        action: 'play_card',
        card_index: cardIndex,
        target: 'enemy'
      }))
    }
  }

  const endTurn = () => {
    if (wsRef.current && gameState?.is_player_turn) {
      wsRef.current.send(JSON.stringify({
        action: 'end_turn'
      }))
    }
  }

  const restart = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        action: 'restart'
      }))
    }
  }

  if (!gameState) {
    return (
      <div className="game-container">
        <div className="loading">
          <div>加载中...</div>
          {!isConnected && (
            <div style={{ marginTop: '20px', color: '#e94560' }}>
              连接服务器失败，请刷新页面重试
            </div>
          )}
        </div>
      </div>
    )
  }

  const { player, enemy, turn, is_player_turn, combat_log, game_over, victory } = gameState

  return (
    <div className="game-container">
      {/* 战斗区域 */}
      <div className="battle-area">
        {/* 玩家 */}
        <div className="player-section">
          <h2>🧙 玩家</h2>
          
          <div className="player-stats">
            <div className="stat">
              <span className="stat-icon">❤️</span>
              <div className="hp-bar-container">
                <div 
                  className="hp-bar-fill" 
                  style={{ width: `${(player.hp / player.max_hp) * 100}%` }}
                >
                  {player.hp} / {player.max_hp}
                </div>
              </div>
            </div>

            <div className="stat">
              <span className="stat-icon">🛡️</span>
              <span>{player.block}</span>
            </div>

            <div className="stat">
              <span className="stat-icon">⚡</span>
              <div className="energy-display">
                {Array.from({ length: player.max_energy }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`energy-orb ${i >= player.energy ? 'empty' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="deck-info">
            牌库：{player.deck_count} | 弃牌：{player.discard_count}
          </div>
        </div>

        {/* VS */}
        <div className="vs-text" style={{ fontSize: '3rem', fontWeight: 'bold', color: '#e94560' }}>
          VS
        </div>

        {/* 敌人 */}
        <div className="enemy-section">
          <div className="enemy-avatar">👹</div>
          
          {enemy && (
            <>
              <h3>{enemy.name}</h3>
              
              <div className="enemy-stats">
                <div className="stat">
                  <span className="stat-icon">❤️</span>
                  <div className="hp-bar-container">
                    <div 
                      className="hp-bar-fill" 
                      style={{ width: `${(enemy.hp / enemy.max_hp) * 100}%` }}
                    >
                      {enemy.hp} / {enemy.max_hp}
                    </div>
                  </div>
                </div>

                <div className="stat">
                  <span className="stat-icon">🛡️</span>
                  <span>{enemy.block}</span>
                </div>

                <div className="intent-display">
                  {getIntentDisplay(enemy)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 手牌 */}
      <div className="hand-section">
        <div className="hand-title">
          手牌 ({player.hand.length} 张) - 第 {turn} 回合 {is_player_turn ? '(你的回合)' : '(敌人回合)'}
        </div>
        
        <div className="hand-cards">
          {player.hand.map((card, index) => (
            <Card
              key={`${card.id}-${index}`}
              card={card}
              index={index}
              canPlay={is_player_turn && player.energy >= card.cost}
              onPlay={playCard}
            />
          ))}
        </div>
      </div>

      {/* 战斗日志 */}
      <div className="combat-log-section">
        <div className="combat-log-title">⚔️ 战斗日志</div>
        <div className="combat-log">
          {combat_log.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="controls">
        <button 
          className="control-button back-button"
          onClick={onBack}
        >
          返回
        </button>
        
        <button 
          className="control-button"
          onClick={endTurn}
          disabled={!is_player_turn || game_over}
        >
          结束回合
        </button>

        {game_over && (
          <button 
            className="control-button"
            onClick={restart}
          >
            再来一局
          </button>
        )}
      </div>

      {/* 游戏结束覆盖层 */}
      {game_over && (
        <div className="game-over-overlay" onClick={restart}>
          <div className={`game-over-content ${victory ? 'victory' : 'defeat'}`} onClick={e => e.stopPropagation()}>
            <h2>{victory ? '🎉 胜利！' : '💀 失败'}</h2>
            <p>{victory ? '你击败了敌人！' : '你被打败了...'}</p>
            <button className="control-button" onClick={restart}>
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function getIntentDisplay(enemy: Enemy) {
  const { intent, intent_value } = enemy
  
  switch (intent) {
    case 'attack':
      return `⚔️ 攻击 ${intent_value}`
    case 'defend':
      return `🛡️ 防御 ${intent_value}`
    case 'buff':
      return `✨ 强化`
    default:
      return `❓ 未知`
  }
}
