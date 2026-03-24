import { useState } from 'react'
import {
  getLevel,
  getChapterLevels,
  getCurrentLevel,
  isLevelCleared,
  LevelProgress,
  BattleResult,
} from '../utils/levels'

interface LevelSelectProps {
  progress: LevelProgress[]
  onSelectLevel: (levelId: number) => void
  onBack: () => void
}

export function LevelSelect({ progress, onSelectLevel, onBack }: LevelSelectProps) {
  const [selectedChapter, setSelectedChapter] = useState(1)
  const currentLevel = getCurrentLevel(progress)

  const chapters = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <div className="app-container">
      <div className="level-select-header">
        <button className="back-button" onClick={onBack}>
          ← 返回
        </button>
        <h1>📍 主线推图</h1>
        <div className="progress-info">
          当前进度：第{currentLevel}关 | 
          完美通关：{progress.filter(p => p.stars >= 3).length}关
        </div>
      </div>

      {/* 章节选择 */}
      <div className="chapter-tabs">
        {chapters.map(chapter => (
          <button
            key={chapter}
            className={`chapter-tab ${selectedChapter === chapter ? 'active' : ''}`}
            onClick={() => setSelectedChapter(chapter)}
          >
            第{chapter}章
          </button>
        ))}
      </div>

      {/* 关卡列表 */}
      <div className="level-grid">
        {getChapterLevels(selectedChapter).map(level => {
          const levelProgress = progress.find(p => p.levelId === level.id)
          const isLocked = level.id > currentLevel
          const stars = levelProgress?.stars || 0

          return (
            <button
              key={level.id}
              className={`level-card ${isLocked ? 'locked' : ''} ${levelProgress?.cleared ? 'cleared' : ''}`}
              onClick={() => !isLocked && onSelectLevel(level.id)}
              disabled={isLocked}
            >
              <div className="level-number">{level.stage}</div>
              <div className="level-name">{level.name.split(' - ')[1] || level.name}</div>
              {level.bossId && <div className="boss-tag">BOSS</div>}
              <div className="level-stars">
                {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
              </div>
              {levelProgress?.cleared && (
                <div className="cleared-tag">已通关</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
