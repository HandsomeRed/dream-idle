import { useState } from 'react'
import './App.css'
import { UpdateLog } from './components/UpdateLog'

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
}

// 门派选项
const JOBS = [
  { name: '剑侠客', hp: 100, mp: 50, attack: 15, defense: 10, speed: 8 },
  { name: '骨精灵', hp: 80, mp: 80, attack: 12, defense: 8, speed: 12 },
  { name: '龙太子', hp: 90, mp: 70, attack: 14, defense: 9, speed: 10 },
  { name: '狐美人', hp: 85, mp: 75, attack: 13, defense: 8, speed: 11 },
]

function App() {
  const [step, setStep] = useState<'input' | 'select' | 'complete'>('input')
  const [character, setCharacter] = useState<Character | null>(null)
  const [name, setName] = useState('')

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
    }
    setCharacter(newCharacter)
    setStep('complete')
  }

  // 角色创建完成界面
  if (step === 'complete' && character) {
    return (
      <div className="app-container">
        <UpdateLog />
        <h1>✨ 角色创建成功！</h1>
        <div className="character-card">
          <div className="character-avatar">
            🎮
          </div>
          <h2>{character.name}</h2>
          <p className="character-job">{character.job}</p>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">等级</span>
              <span className="stat-value">Lv.{character.level}</span>
            </div>
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
          </div>
          <button 
            className="start-button"
            data-testid="start-game-btn"
            onClick={() => alert('游戏开始！(功能开发中...)')}
          >
            🚀 开始冒险
          </button>
        </div>
      </div>
    )
  }

  // 门派选择界面
  if (step === 'select') {
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
          onClick={() => setStep('input')}
        >
          ← 返回
        </button>
      </div>
    )
  }

  // 输入名字界面
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
          onClick={() => setStep('select')}
          disabled={!name.trim()}
        >
          下一步 →
        </button>
      </div>
    </div>
  )
}

export default App
