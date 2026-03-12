import { useState } from 'react'
import './App.css'
import { UpdateLog } from './components/UpdateLog'
import { Battle } from './components/Battle'
import { calculateStatsAtLevel, CharacterStats } from './utils/gameStats'

// 角色类型定义
interface Character {
  name: string;
  level: number;
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  job: string;
  exp: number;
  maxExp: number;
}

// 门派选项
const JOBS = [
  { name: '剑侠客', hp: 100, mp: 50, attack: 15, defense: 10, speed: 8 },
  { name: '骨精灵', hp: 80, mp: 80, attack: 12, defense: 8, speed: 12 },
  { name: '龙太子', hp: 90, mp: 70, attack: 14, defense: 9, speed: 10 },
  { name: '狐美人', hp: 85, mp: 75, attack: 13, defense: 8, speed: 11 },
]

function App() {
  const [gameState, setGameState] = useState<'menu' | 'input' | 'select' | 'complete' | 'battle'>('menu')
  const [character, setCharacter] = useState<Character | null>(null)
  const [name, setName] = useState('')
  const [battleCount, setBattleCount] = useState(0)

  // 创建角色
  const handleCreate = (job: typeof JOBS[0]) => {
    const newCharacter: Character = {
      name: name || '少侠',
      level: 1,
      hp: job.hp,
      mp: job.mp,
      attack: job.attack,
      defense: job.defense,
      speed: job.speed,
      job: job.name,
      exp: 0,
      maxExp: 100,
    }
    setCharacter(newCharacter)
    setGameState('complete')
  }

  // 开始战斗
  const handleStartBattle = () => {
    if (character) {
      setGameState('battle')
    }
  }

  // 战斗结束处理
  const handleBattleEnd = (victory: boolean, expGained: number) => {
    if (victory && character) {
      const newExp = character.exp + expGained
      let newLevel = character.level
      let newMaxExp = character.maxExp
      let levelUp = false
      
      // 检查升级
      while (newExp >= newMaxExp) {
        newLevel++
        newMaxExp = Math.floor(newMaxExp * 1.5)
        levelUp = true
      }
      
      // 计算升级后的属性
      const newStats = calculateStatsAtLevel(character.job, newLevel)
      
      setCharacter({
        ...character,
        level: newLevel,
        exp: newExp,
        maxExp: newMaxExp,
        hp: newStats.maxHp,
        mp: newStats.maxMp,
        attack: newStats.attack,
        defense: newStats.defense,
        speed: newStats.speed,
      })
      
      setBattleCount(prev => prev + 1)
      
      if (levelUp) {
        alert(`🎉 升级了！当前等级：Lv.${newLevel}`)
      }
    }
    setGameState('complete')
  }

  // 战斗界面
  if (gameState === 'battle' && character) {
    const playerStats: CharacterStats = {
      level: character.level,
      exp: character.exp,
      hp: character.hp,
      maxHp: character.hp,
      mp: character.mp,
      maxMp: character.mp,
      attack: character.attack,
      defense: character.defense,
      speed: character.speed,
      mag: character.attack * 0.8,
      res: character.defense * 0.8,
      job: character.job
    }
    
    return (
      <Battle
        playerStats={playerStats}
        playerName={character.name}
        onBattleEnd={handleBattleEnd}
        onBack={() => setGameState('complete')}
      />
    )
  }

  // 角色创建完成界面
  if (gameState === 'complete' && character) {
    const expPercent = Math.floor((character.exp / character.maxExp) * 100)
    
    return (
      <div className="app-container">
        <UpdateLog />
        <h1>✨ {character.name}</h1>
        <div className="character-card">
          <div className="character-avatar">
            🎮
          </div>
          <h2>{character.job}</h2>
          <p className="character-level">Lv.{character.level}</p>
          
          {/* 经验条 */}
          <div className="exp-bar-container">
            <div className="exp-bar">
              <div className="exp-fill" style={{ width: `${expPercent}%` }} />
            </div>
            <span className="exp-text">{character.exp}/{character.maxExp} EXP</span>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">气血</span>
              <span className="stat-value hp">{character.hp}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">魔法</span>
              <span className="stat-value mp">{character.mp}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">攻击</span>
              <span className="stat-value atk">{character.attack}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">防御</span>
              <span className="stat-value def">{character.defense}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">速度</span>
              <span className="stat-value spd">{character.speed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">战斗</span>
              <span className="stat-value">{battleCount}场</span>
            </div>
          </div>
          <div className="button-group">
            <button 
              className="start-button"
              data-testid="battle-btn"
              onClick={handleStartBattle}
            >
              ⚔️ 去战斗
            </button>
            <button 
              className="secondary-button"
              onClick={() => setGameState('menu')}
            >
              🏠 返回标题
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 门派选择界面
  if (gameState === 'select') {
    return (
      <div className="app-container">
        <UpdateLog />
        <h1>🎭 选择门派</h1>
        <p className="subtitle">少侠 {name}，请选择合适的门派</p>
        <div className="job-grid">
          {JOBS.map((job) => (
            <button
              key={job.name}
              className="job-card"
              data-testid={`job-${job.name}`}
              onClick={() => handleCreate(job)}
            >
              <h3>{job.name}</h3>
              <div className="job-stats">
                <span>❤️ {job.hp}</span>
                <span>💙 {job.mp}</span>
                <span>⚔️ {job.attack}</span>
                <span>🛡️ {job.defense}</span>
                <span>💨 {job.speed}</span>
              </div>
            </button>
          ))}
        </div>
        <button 
          className="back-button"
          onClick={() => setGameState('input')}
        >
          ← 返回
        </button>
      </div>
    )
  }

  // 输入名字界面
  if (gameState === 'input') {
    return (
      <div className="app-container">
        <UpdateLog />
        <h1>🎮 梦幻放置</h1>
        <p className="subtitle">创建你的角色</p>
        <div className="input-card">
          <label htmlFor="name-input">请输入角色名字：</label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="少侠"
            maxLength={10}
            data-testid="name-input"
          />
          <button
            className="next-button"
            data-testid="next-button"
            onClick={() => setGameState('select')}
            disabled={!name.trim()}
          >
            下一步 →
          </button>
        </div>
        <button 
          className="back-button"
          onClick={() => setGameState('menu')}
        >
          ← 返回标题
        </button>
      </div>
    )
  }

  // 主菜单
  return (
    <div className="app-container">
      <UpdateLog />
      <h1>🎮 梦幻放置</h1>
      <p className="subtitle">梦幻西游题材放置挂机游戏</p>
      <div className="menu-card">
        <p className="menu-description">
          体验经典回合制战斗的放置版本<br/>
          自动战斗、离线收益、轻松养成
        </p>
        <button
          className="start-button"
          data-testid="start-game-btn"
          onClick={() => setGameState('input')}
        >
          创建角色
        </button>
        {battleCount > 0 && (
          <p className="menu-stats">
            已战斗：{battleCount} 场 | 当前等级：Lv.{character?.level || 1}
          </p>
        )}
      </div>
    </div>
  )
}

export default App
