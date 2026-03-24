import { useState, useEffect } from 'react'
import { SkillInstance, canUseSkill, useSkill, reduceSkillCooldown, calculateSkillDamage, calculateSkillHeal } from '../utils/skills'
import { CharacterStats } from '../utils/gameStats'

interface SkillBarProps {
  skills: SkillInstance[]
  playerMp: number
  playerMag: number
  playerLevel: number
  onSkillUse: (skill: SkillInstance, damage?: number, heal?: number) => void
  onEndTurn: () => void
}

export function SkillBar({ skills, playerMp, playerMag, playerLevel, onSkillUse, onEndTurn }: SkillBarProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillInstance | null>(null)
  const [skillDescription, setSkillDescription] = useState<string>('')

  // 每回合减少冷却
  useEffect(() => {
    // 这个效果在父组件中通过回合结束触发
  }, [])

  const handleSkillClick = (skill: SkillInstance) => {
    if (!canUseSkill(skill, playerMp)) {
      setSkillDescription('⚠️ 魔法不足或冷却中')
      return
    }

    setSelectedSkill(skill)
    setSkillDescription(`确定使用 ${skill.name}？`)
  }

  const confirmSkillUse = () => {
    if (!selectedSkill) return

    // 计算技能效果
    let damage: number | undefined
    let heal: number | undefined

    if (selectedSkill.type === 'physical' || selectedSkill.type === 'magical') {
      damage = calculateSkillDamage(selectedSkill, playerMag, 10, playerLevel)
    } else if (selectedSkill.type === 'heal') {
      heal = calculateSkillHeal(selectedSkill, playerMag, playerLevel)
    }

    onSkillUse(selectedSkill, damage, heal)
    setSelectedSkill(null)
    setSkillDescription('')
  }

  const cancelSkillUse = () => {
    setSelectedSkill(null)
    setSkillDescription('')
  }

  const getSkillStatus = (skill: SkillInstance) => {
    if (skill.currentCooldown > 0) {
      return {
        disabled: true,
        reason: `冷却中 (${skill.currentCooldown})`,
        class: 'cooldown'
      }
    }
    if (playerMp < skill.mpCost) {
      return {
        disabled: true,
        reason: `魔法不足 (需要${skill.mpCost})`,
        class: 'no-mp'
      }
    }
    return {
      disabled: false,
      reason: '',
      class: 'available'
    }
  }

  return (
    <div className="skill-bar-container">
      {/* 技能按钮 */}
      <div className="skill-buttons">
        {skills.map((skill) => {
          const status = getSkillStatus(skill)
          return (
            <button
              key={skill.id}
              className={`skill-button ${status.class}`}
              onClick={() => handleSkillClick(skill)}
              disabled={status.disabled}
              title={status.reason}
            >
              <span className="skill-icon">{skill.icon}</span>
              <span className="skill-name">{skill.name}</span>
              <span className="skill-mp">{skill.mpCost}MP</span>
              {skill.currentCooldown > 0 && (
                <span className="skill-cooldown">{skill.currentCooldown}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 技能描述/确认框 */}
      {(selectedSkill || skillDescription) && (
        <div className="skill-confirm-overlay">
          <div className="skill-confirm-box">
            {selectedSkill ? (
              <>
                <h3>{selectedSkill.icon} {selectedSkill.name}</h3>
                <p className="skill-desc">{selectedSkill.description}</p>
                <p className="skill-cost">消耗：{selectedSkill.mpCost} MP</p>
                <p className="skill-cooldown-text">冷却：{selectedSkill.cooldown} 回合</p>
                <div className="confirm-buttons">
                  <button className="confirm-btn" onClick={confirmSkillUse}>
                    使用
                  </button>
                  <button className="cancel-btn" onClick={cancelSkillUse}>
                    取消
                  </button>
                </div>
              </>
            ) : (
              <p>{skillDescription}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
