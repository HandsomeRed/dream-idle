import { useState, useEffect, useCallback } from 'react'
import { CharacterStats, calcPhysicalDamage, calcMagicalDamage, isCritHit, getTurnOrder } from '../utils/gameStats'
import { initializeSkills, reduceSkillCooldown, canUseSkill, useSkill, calculateSkillDamage, calculateSkillHeal, SkillInstance } from '../utils/skills'
import { SkillBar } from './SkillBar'

// 战斗单位
interface CombatUnit {
  id: string;
  name: string;
  stats: CharacterStats;
  isPlayer: boolean;
  maxHp: number;
}

// 战斗动作
interface BattleAction {
  attacker: string;
  defender: string;
  skill: string;
  damage: number;
  isCrit: boolean;
  isPlayer: boolean;
}

// 战斗日志
interface BattleLog {
  id: number;
  message: string;
  type: 'info' | 'attack' | 'skill' | 'heal' | 'victory' | 'defeat';
}

interface BattleProps {
  playerStats: CharacterStats;
  playerName: string;
  onBattleEnd: (victory: boolean, expGained: number) => void;
  onBack: () => void;
}

// 怪物配置
const MONSTER_CONFIGS = [
  { name: '草精', hp: 80, attack: 10, defense: 5, speed: 6, exp: 10 },
  { name: '花妖', hp: 100, attack: 12, defense: 6, speed: 8, exp: 15 },
  { name: '树怪', hp: 120, attack: 14, defense: 8, speed: 5, exp: 20 },
  { name: '狐狸精', hp: 90, attack: 15, defense: 7, speed: 12, exp: 25 },
  { name: '骷髅怪', hp: 150, attack: 18, defense: 10, speed: 7, exp: 30 },
]

export function Battle({ playerStats, playerName, onBattleEnd, onBack }: BattleProps) {
  // 战斗状态
  const [player, setPlayer] = useState<CombatUnit>({
    id: 'player',
    name: playerName,
    stats: { ...playerStats },
    isPlayer: true,
    maxHp: playerStats.maxHp
  })
  
  const [monster, setMonster] = useState<CombatUnit | null>(null)
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([])
  const [isAutoBattle, setIsAutoBattle] = useState(false)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [battlePhase, setBattlePhase] = useState<'start' | 'fighting' | 'ended'>('start')
  const [selectedSkill, setSelectedSkill] = useState<'attack' | 'magic' | 'heal'>('attack')
  const [logId, setLogId] = useState(0)
  const [playerSkills, setPlayerSkills] = useState<SkillInstance[]>([])

  // 添加战斗日志
  const addLog = useCallback((message: string, type: BattleLog['type'] = 'info') => {
    setBattleLogs(prev => [...prev.slice(-9), { id: logId, message, type }])
    setLogId(prev => prev + 1)
  }, [logId])

  // 初始化战斗
  useEffect(() => {
    if (battlePhase === 'start') {
      // 初始化技能
      const skills = initializeSkills(player.stats.job)
      setPlayerSkills(skills)
      
      // 随机选择怪物
      const randomMonster = MONSTER_CONFIGS[Math.floor(Math.random() * MONSTER_CONFIGS.length)]
      const monsterLevel = Math.max(1, player.stats.level - 1 + Math.floor(Math.random() * 3))
      
      setMonster({
        id: 'monster',
        name: randomMonster.name,
        stats: {
          level: monsterLevel,
          exp: 0,
          hp: randomMonster.hp + monsterLevel * 10,
          maxHp: randomMonster.hp + monsterLevel * 10,
          mp: 50,
          maxMp: 50,
          attack: randomMonster.attack + monsterLevel * 2,
          defense: randomMonster.defense + monsterLevel,
          speed: randomMonster.speed,
          mag: 10,
          res: 10,
          job: 'monster'
        },
        isPlayer: false,
        maxHp: randomMonster.hp + monsterLevel * 10
      })
      
      setBattlePhase('fighting')
      addLog(`遭遇野生${randomMonster.name} (Lv.${monsterLevel})！`, 'info')
      
      // 决定先手
      const order = getTurnOrder([
        { speed: player.stats.speed },
        { speed: randomMonster.speed + monsterLevel }
      ])
      setIsPlayerTurn(order[0].speed === player.stats.speed)
    }
  }, [battlePhase, player.stats.level, player.stats.speed, addLog])

  // 玩家攻击
  const playerAttack = useCallback(() => {
    if (!monster || battlePhase !== 'fighting') return
    
    const isCrit = isCritHit(player.stats.level)
    const damage = calcPhysicalDamage(player.stats.attack, monster.stats.defense, isCrit)
    
    setMonster(prev => {
      if (!prev) return null
      const newHp = Math.max(0, prev.stats.hp - damage)
      return { ...prev, stats: { ...prev.stats, hp: newHp } }
    })
    
    addLog(`${playerName} 攻击 ${monster.name}，造成 ${damage} 点伤害${isCrit ? ' (暴击!)' : ''}`, 'attack')
    
    // 检查怪物是否死亡
    setTimeout(() => {
      if (monster.stats.hp - damage <= 0) {
        handleVictory(monster)
      } else {
        setIsPlayerTurn(false)
      }
    }, 500)
  }, [monster, player.stats.attack, player.stats.level, playerName, battlePhase, addLog])

  // 玩家法术
  const playerMagic = useCallback(() => {
    if (!monster || battlePhase !== 'fighting') return
    
    if (player.stats.mp < 10) {
      addLog('魔法不足！', 'info')
      return
    }
    
    // 消耗魔法
    setPlayer(prev => ({
      ...prev,
      stats: { ...prev.stats, mp: prev.stats.mp - 10 }
    }))
    
    const skillLevel = player.stats.level * 5
    const damage = calcMagicalDamage(skillLevel, player.stats.mag, monster.stats.res)
    const isCrit = isCritHit(player.stats.level)
    const finalDamage = isCrit ? damage * 2 : damage
    
    setMonster(prev => {
      if (!prev) return null
      const newHp = Math.max(0, prev.stats.hp - finalDamage)
      return { ...prev, stats: { ...prev.stats, hp: newHp } }
    })
    
    addLog(`${playerName} 使用法术，造成 ${finalDamage} 点伤害${isCrit ? ' (暴击!)' : ''}`, 'skill')
    
    setTimeout(() => {
      if (monster.stats.hp - finalDamage <= 0) {
        handleVictory(monster)
      } else {
        setIsPlayerTurn(false)
      }
    }, 500)
  }, [monster, player.stats, battlePhase, addLog])

  // 玩家治疗
  const playerHeal = useCallback(() => {
    if (battlePhase !== 'fighting') return
    
    if (player.stats.mp < 15) {
      addLog('魔法不足！', 'info')
      return
    }
    
    const healAmount = Math.floor(player.stats.maxHp * 0.3)
    
    setPlayer(prev => ({
      ...prev,
      stats: { 
        ...prev.stats, 
        mp: prev.stats.mp - 15,
        hp: Math.min(prev.maxHp, prev.stats.hp + healAmount)
      }
    }))
    
    addLog(`${playerName} 治疗自己，恢复 ${healAmount} 点气血`, 'heal')
    setIsPlayerTurn(false)
  }, [player.stats, battlePhase, addLog])

  // 怪物攻击
  const monsterAttack = useCallback(() => {
    if (!monster || battlePhase !== 'fighting') return
    
    const isCrit = isCritHit(monster.stats.level)
    const damage = calcPhysicalDamage(monster.stats.attack, player.stats.defense, isCrit)
    
    setPlayer(prev => {
      const newHp = Math.max(0, prev.stats.hp - damage)
      return { ...prev, stats: { ...prev.stats, hp: newHp } }
    })
    
    addLog(`${monster.name} 攻击 ${playerName}，造成 ${damage} 点伤害${isCrit ? ' (暴击!)' : ''}`, 'attack')
    
    setTimeout(() => {
      if (player.stats.hp - damage <= 0) {
        handleDefeat()
      } else {
        setIsPlayerTurn(true)
      }
    }, 500)
  }, [monster, player.stats.defense, player.stats.hp, playerName, battlePhase, addLog])

  // 处理胜利
  const handleVictory = (defeatedMonster: CombatUnit) => {
    setBattlePhase('ended')
    const expGained = defeatedMonster.stats.level * 10
    addLog(`战斗胜利！获得 ${expGained} 点经验`, 'victory')
    
    setTimeout(() => {
      onBattleEnd(true, expGained)
    }, 1500)
  }

  // 处理失败
  const handleDefeat = () => {
    setBattlePhase('ended')
    addLog('战斗失败...', 'defeat')
    
    setTimeout(() => {
      onBattleEnd(false, 0)
    }, 1500)
  }

  // 自动战斗
  useEffect(() => {
    if (!isAutoBattle || battlePhase !== 'fighting') return
    
    if (isPlayerTurn && monster) {
      const timer = setTimeout(() => {
        // 自动选择技能：血量低时治疗，否则攻击
        if (player.stats.hp < player.maxHp * 0.3 && player.stats.mp >= 15) {
          playerHeal()
        } else if (player.stats.mp >= 10) {
          playerMagic()
        } else {
          playerAttack()
        }
      }, 800)
      
      return () => clearTimeout(timer)
    } else if (!isPlayerTurn && monster) {
      const timer = setTimeout(() => {
        monsterAttack()
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [isAutoBattle, isPlayerTurn, battlePhase, monster, player.stats, player.maxHp, playerAttack, playerMagic, playerHeal, monsterAttack])

  // 手动攻击按钮
  const handleAttack = () => {
    setIsAutoBattle(false)
    if (isPlayerTurn) {
      playerAttack()
    }
  }

  // 手动法术按钮
  const handleMagic = () => {
    setIsAutoBattle(false)
    if (isPlayerTurn) {
      playerMagic()
    }
  }

  // 手动治疗按钮
  const handleHeal = () => {
    setIsAutoBattle(false)
    if (isPlayerTurn) {
      playerHeal()
    }
  }

  // 切换自动战斗
  const toggleAutoBattle = () => {
    setIsAutoBattle(!isAutoBattle)
  }

  // 使用技能
  const handleSkillUse = useCallback((skill: SkillInstance, damage?: number, heal?: number) => {
    if (!monster || !canUseSkill(skill, player.stats.mp)) return
    
    // 消耗魔法并设置冷却
    setPlayer(prev => ({
      ...prev,
      stats: { ...prev.stats, mp: prev.stats.mp - skill.mpCost }
    }))
    
    setPlayerSkills(prev => prev.map(s => 
      s.id === skill.id ? useSkill(s) : s
    ))
    
    // 处理技能效果
    if (damage !== undefined) {
      const isCrit = isCritHit(player.stats.level)
      const finalDamage = isCrit ? damage * 2 : damage
      
      setMonster(prev => {
        if (!prev) return null
        const newHp = Math.max(0, prev.stats.hp - finalDamage)
        return { ...prev, stats: { ...prev.stats, hp: newHp } }
      })
      
      addLog(`${playerName} 使用 ${skill.icon}${skill.name}，造成 ${finalDamage} 点伤害${isCrit ? ' (暴击!)' : ''}`, 'skill')
      
      setTimeout(() => {
        if (monster.stats.hp - finalDamage <= 0) {
          handleVictory(monster)
        } else {
          setIsPlayerTurn(false)
        }
      }, 500)
    } else if (heal !== undefined) {
      setPlayer(prev => ({
        ...prev,
        stats: { ...prev.stats, hp: Math.min(prev.maxHp, prev.stats.hp + heal) }
      }))
      
      addLog(`${playerName} 使用 ${skill.icon}${skill.name}，恢复 ${heal} 点气血`, 'heal')
      setIsPlayerTurn(false)
    } else if (skill.buffEffects) {
      // TODO: 处理增益效果
      addLog(`${playerName} 使用 ${skill.icon}${skill.name}！`, 'skill')
      setIsPlayerTurn(false)
    }
  }, [monster, player.stats, playerName, addLog, handleVictory])
  
  // 回合结束时减少技能冷却
  const endPlayerTurn = useCallback(() => {
    setPlayerSkills(prev => prev.map(skill => reduceSkillCooldown(skill)))
  }, [])

  // 渲染血条
  const renderHealthBar = (current: number, max: number, isPlayer: boolean) => {
    const percent = Math.floor((current / max) * 100)
    const color = percent > 50 ? 'bg-green-500' : percent > 25 ? 'bg-yellow-500' : 'bg-red-500'
    
    return (
      <div className="health-bar-container">
        <div className="health-bar">
          <div 
            className={`health-fill ${color}`} 
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="health-text">{current}/{max}</span>
      </div>
    )
  }

  if (battlePhase === 'start' || !monster) {
    return (
      <div className="battle-container">
        <div className="battle-loading">
          <p>⚔️ 进入战斗中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="battle-container">
      {/* 返回按钮 */}
      <button className="back-button" onClick={onBack}>
        ← 返回
      </button>

      {/* 战斗场景 */}
      <div className="battle-scene">
        {/* 玩家区域 */}
        <div className={`combatant player ${isPlayerTurn ? 'active' : ''}`}>
          <div className="combatant-avatar">🧙</div>
          <h3>{player.name}</h3>
          <p className="combatant-level">Lv.{player.stats.level}</p>
          {renderHealthBar(player.stats.hp, player.maxHp, true)}
          <p className="mp-text">💙 {player.stats.mp}/{player.stats.maxMp}</p>
        </div>

        {/* VS */}
        <div className="vs-text">⚔️ VS ⚔️</div>

        {/* 怪物区域 */}
        <div className={`combatant monster ${!isPlayerTurn ? 'active' : ''}`}>
          <div className="combatant-avatar">👾</div>
          <h3>{monster.name}</h3>
          <p className="combatant-level">Lv.{monster.stats.level}</p>
          {renderHealthBar(monster.stats.hp, monster.maxHp, false)}
        </div>
      </div>

      {/* 战斗日志 */}
      <div className="battle-logs">
        {battleLogs.map((log) => (
          <div key={log.id} className={`battle-log ${log.type}`}>
            {log.message}
          </div>
        ))}
      </div>

      {/* 战斗操作 */}
      {battlePhase === 'fighting' && (
        <div className="battle-ui">
          {/* 技能栏 */}
          {isPlayerTurn && playerSkills.length > 0 && (
            <SkillBar
              skills={playerSkills}
              playerMp={player.stats.mp}
              playerMag={player.stats.mag}
              playerLevel={player.stats.level}
              onSkillUse={handleSkillUse}
              onEndTurn={endPlayerTurn}
            />
          )}
          
          {/* 基础操作按钮 */}
          <div className="battle-actions">
            <button
              className={`action-button ${isPlayerTurn ? '' : 'disabled'}`}
              onClick={handleAttack}
              disabled={!isPlayerTurn}
            >
              ⚔️ 攻击
            </button>
            <button
              className={`action-button ${isPlayerTurn ? '' : 'disabled'}`}
              onClick={handleMagic}
              disabled={!isPlayerTurn || player.stats.mp < 10}
            >
              🔮 法术 (10MP)
            </button>
            <button
              className={`action-button ${isPlayerTurn ? '' : 'disabled'}`}
              onClick={handleHeal}
              disabled={!isPlayerTurn || player.stats.mp < 15}
            >
              💚 治疗 (15MP)
            </button>
            <button
              className={`action-button auto-battle ${isAutoBattle ? 'active' : ''}`}
              onClick={toggleAutoBattle}
            >
              {isAutoBattle ? '⏸️ 暂停' : '▶️ 自动'}
            </button>
          </div>
        </div>
      )}

      {battlePhase === 'ended' && (
        <div className="battle-result">
          <p>战斗结束</p>
        </div>
      )}
    </div>
  )
}
