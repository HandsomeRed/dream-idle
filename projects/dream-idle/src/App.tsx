import { useState } from 'react'
import './App.css'
import { UpdateLog } from './components/UpdateLog'
import { Battle } from './components/Battle'
import { LevelSelect } from './components/LevelSelect'
import { LevelBattle } from './components/LevelBattle'
import { PetList } from './components/PetList'
import { PetGacha } from './components/PetGacha'
import { calculateStatsAtLevel, CharacterStats } from './utils/gameStats'
import { LevelProgress } from './utils/levels'
import { Pet, PetGachaResult, createPet, pullGacha } from './utils/pets'

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
  gold: number;
}

// 门派选项
const JOBS = [
  { name: '剑侠客', hp: 100, mp: 50, attack: 15, defense: 10, speed: 8 },
  { name: '骨精灵', hp: 80, mp: 80, attack: 12, defense: 8, speed: 12 },
  { name: '龙太子', hp: 90, mp: 70, attack: 14, defense: 9, speed: 10 },
  { name: '狐美人', hp: 85, mp: 75, attack: 13, defense: 8, speed: 11 },
]

function App() {
  const [gameState, setGameState] = useState<'menu' | 'input' | 'select' | 'complete' | 'battle' | 'levelSelect' | 'levelBattle' | 'pets' | 'petGacha'>('menu')
  const [character, setCharacter] = useState<Character | null>(null)
  const [name, setName] = useState('')
  const [battleCount, setBattleCount] = useState(0)
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1)
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)

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
      gold: 0,
    }
    setCharacter(newCharacter)
    setGameState('complete')
  }

  // 开始战斗（快速战斗）
  const handleStartBattle = () => {
    if (character) {
      setGameState('battle')
    }
  }

  // 进入推图界面
  const handleEnterLevelSelect = () => {
    setGameState('levelSelect')
  }

  // 进入宠物界面
  const handleEnterPets = () => {
    setGameState('pets')
  }

  // 进入宠物召唤
  const handleEnterPetGacha = () => {
    setGameState('petGacha')
  }

  // 获得宠物
  const handleObtainPet = (results: PetGachaResult[]) => {
    const newPets = results.map((result) => result.pet)
    setPets((prev) => [...prev, ...newPets])
  }

  // 选择宠物
  const handleSelectPet = (pet: Pet) => {
    setSelectedPet(pet)
  }

  // 选择关卡
  const handleSelectLevel = (levelId: number) => {
    setSelectedLevelId(levelId)
    setGameState('levelBattle')
  }

  // 战斗结束处理（快速战斗）
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

  // 关卡战斗结束处理
  const handleLevelBattleEnd = (victory: boolean, expGained: number, goldGained: number, stars: number) => {
    if (victory && character) {
      // 更新关卡进度
      setLevelProgress(prev => {
        const updated = [...prev]
        const existing = updated.find(p => p.levelId === selectedLevelId)
        if (existing) {
          existing.stars = Math.max(existing.stars, stars)
          existing.cleared = true
        } else {
          updated.push({
            levelId: selectedLevelId,
            stars,
            cleared: true,
            bestRound: 10,
            clearedAt: Date.now(),
          })
        }
        return updated
      })

      // 更新角色资源
      const newExp = character.exp + expGained
      const newGold = character.gold + goldGained
      setCharacter({
        ...character,
        exp: newExp,
        gold: newGold,
      })

      // 检查升级
      let newLevel = character.level
      let newMaxExp = character.maxExp
      let levelUp = false
      
      while (newExp >= newMaxExp) {
        newLevel++
        newMaxExp = Math.floor(newMaxExp * 1.5)
        levelUp = true
      }
      
      if (levelUp) {
        const newStats = calculateStatsAtLevel(character.job, newLevel)
        setCharacter(prev => prev ? {
          ...prev,
          level: newLevel,
          maxExp: newMaxExp,
          hp: newStats.maxHp,
          mp: newStats.maxMp,
          attack: newStats.attack,
          defense: newStats.defense,
          speed: newStats.speed,
        } : null)
        alert(`🎉 升级了！当前等级：Lv.${newLevel}`)
      }
    }
    setGameState('levelSelect')
  }

  // 关卡选择界面
  if (gameState === 'levelSelect' && character) {
    return (
      <LevelSelect
        progress={levelProgress}
        onSelectLevel={handleSelectLevel}
        onBack={() => setGameState('complete')}
      />
    )
  }

  // 关卡战斗界面
  if (gameState === 'levelBattle' && character) {
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
      <LevelBattle
        levelId={selectedLevelId}
        playerStats={playerStats}
        playerName={character.name}
        progress={levelProgress}
        onBattleEnd={handleLevelBattleEnd}
        onBack={() => setGameState('levelSelect')}
      />
    )
  }

  // 宠物列表界面
  if (gameState === 'pets') {
    return (
      <div className="app-container">
        <UpdateLog />
        <div className="flex justify-between items-center mb-4">
          <h1>🐾 宠物系统</h1>
          <button
            className="start-button py-2 px-4 text-sm"
            onClick={handleEnterPetGacha}
          >
            🔮 召唤宠物
          </button>
        </div>
        <PetList
          pets={pets}
          onSelectPet={handleSelectPet}
          selectedPetId={selectedPet?.id}
        />
        <button
          className="back-button mt-4"
          onClick={() => setGameState('complete')}
        >
          ← 返回
        </button>
      </div>
    )
  }

  // 宠物召唤界面
  if (gameState === 'petGacha') {
    return (
      <div className="app-container">
        <UpdateLog />
        <PetGacha
          onObtainPet={handleObtainPet}
          normalGachaCost={1000}
          premiumGachaCost={10000}
        />
        <button
          className="back-button mt-4"
          onClick={() => setGameState('pets')}
        >
          ← 返回宠物列表
        </button>
      </div>
    )
  }

  // 快速战斗界面（保留原有功能）
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
              ⚔️ 快速战斗
            </button>
            <button 
              className="start-button"
              onClick={handleEnterLevelSelect}
            >
              🗺️ 主线推图
            </button>
            <button 
              className="start-button"
              onClick={handleEnterPets}
            >
              🐾 宠物系统
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
