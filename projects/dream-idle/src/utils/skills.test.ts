import {
  getJobSkills,
  initializeSkills,
  canUseSkill,
  useSkill,
  reduceSkillCooldown,
  calculateSkillDamage,
  calculateSkillHeal,
  JOB_SKILLS
} from './skills'

describe('技能系统', () => {
  describe('getJobSkills', () => {
    it('应该返回剑侠客的技能列表', () => {
      const skills = getJobSkills('剑侠客')
      expect(skills.length).toBe(3)
      expect(skills.map(s => s.name)).toEqual(['横扫天下', '破血狂攻', '战神护体'])
    })

    it('应该返回骨精灵的技能列表', () => {
      const skills = getJobSkills('骨精灵')
      expect(skills.length).toBe(3)
      expect(skills.map(s => s.name)).toEqual(['摄魂夺魄', '鬼火术', '灵能护体'])
    })

    it('应该返回龙太子的技能列表', () => {
      const skills = getJobSkills('龙太子')
      expect(skills.length).toBe(3)
      expect(skills.map(s => s.name)).toEqual(['龙息术', '水遁术', '雷霆万钧'])
    })

    it('应该返回狐美人的技能列表', () => {
      const skills = getJobSkills('狐美人')
      expect(skills.length).toBe(3)
      expect(skills.map(s => s.name)).toEqual(['魅惑术', '狐火', '倾国倾城'])
    })

    it('未知门派应该返回空数组', () => {
      const skills = getJobSkills('未知门派')
      expect(skills).toEqual([])
    })
  })

  describe('initializeSkills', () => {
    it('应该初始化技能实例', () => {
      const skills = initializeSkills('剑侠客')
      expect(skills.length).toBe(3)
      expect(skills[0].currentCooldown).toBe(0)
      expect(skills[0].available).toBe(true)
    })

    it('所有技能初始状态应该可用', () => {
      const skills = initializeSkills('骨精灵')
      skills.forEach(skill => {
        expect(skill.available).toBe(true)
        expect(skill.currentCooldown).toBe(0)
      })
    })
  })

  describe('canUseSkill', () => {
    const mockSkill = {
      id: 'test_skill',
      name: '测试技能',
      description: '测试',
      type: 'physical' as const,
      target: 'enemy' as const,
      mpCost: 30,
      cooldown: 3,
      icon: '⚔️',
      currentCooldown: 0,
      available: true
    }

    it('魔法充足且无冷却时应该可以使用', () => {
      expect(canUseSkill(mockSkill, 50)).toBe(true)
    })

    it('魔法不足时应该不能使用', () => {
      expect(canUseSkill(mockSkill, 20)).toBe(false)
    })

    it('冷却中时应该不能使用', () => {
      const coolingSkill = { ...mockSkill, currentCooldown: 2, available: false }
      expect(canUseSkill(coolingSkill, 50)).toBe(false)
    })

    it('魔法刚好够时应该可以使用', () => {
      expect(canUseSkill(mockSkill, 30)).toBe(true)
    })
  })

  describe('useSkill', () => {
    it('使用技能后应该进入冷却', () => {
      const skill = initializeSkills('剑侠客')[0]
      const usedSkill = useSkill(skill)
      
      expect(usedSkill.currentCooldown).toBe(skill.cooldown)
      expect(usedSkill.available).toBe(false)
    })

    it('使用技能后其他属性应该保持不变', () => {
      const skill = initializeSkills('剑侠客')[0]
      const usedSkill = useSkill(skill)
      
      expect(usedSkill.id).toBe(skill.id)
      expect(usedSkill.name).toBe(skill.name)
      expect(usedSkill.mpCost).toBe(skill.mpCost)
    })
  })

  describe('reduceSkillCooldown', () => {
    it('应该减少冷却时间', () => {
      const skill: any = {
        ...initializeSkills('剑侠客')[0],
        currentCooldown: 3,
        available: false
      }
      
      const reduced = reduceSkillCooldown(skill)
      expect(reduced.currentCooldown).toBe(2)
      expect(reduced.available).toBe(false)
    })

    it('冷却归零时应该变为可用', () => {
      const skill: any = {
        ...initializeSkills('剑侠客')[0],
        currentCooldown: 1,
        available: false
      }
      
      const reduced = reduceSkillCooldown(skill)
      expect(reduced.currentCooldown).toBe(0)
      expect(reduced.available).toBe(true)
    })

    it('已经可用的技能应该保持不变', () => {
      const skill = initializeSkills('剑侠客')[0]
      const reduced = reduceSkillCooldown(skill)
      
      expect(reduced.currentCooldown).toBe(0)
      expect(reduced.available).toBe(true)
    })
  })

  describe('calculateSkillDamage', () => {
    const physicalSkill = {
      id: 'phys',
      name: '物理技能',
      description: '测试',
      type: 'physical' as const,
      target: 'enemy' as const,
      mpCost: 30,
      cooldown: 3,
      damageMultiplier: 1.5,
      icon: '⚔️'
    }

    const magicalSkill = {
      id: 'mag',
      name: '法术技能',
      description: '测试',
      type: 'magical' as const,
      target: 'enemy' as const,
      mpCost: 40,
      cooldown: 4,
      damageMultiplier: 1.3,
      icon: '🔮'
    }

    it('应该计算物理技能伤害', () => {
      const damage = calculateSkillDamage(physicalSkill, 100, 10, 10)
      expect(damage).toBeGreaterThan(0)
    })

    it('应该计算法术技能伤害', () => {
      const damage = calculateSkillDamage(magicalSkill, 100, 10, 10)
      expect(damage).toBeGreaterThan(0)
    })

    it('伤害倍率应该影响最终伤害', () => {
      const lowMultiplier = { ...physicalSkill, damageMultiplier: 0.5 }
      const highMultiplier = { ...physicalSkill, damageMultiplier: 2.0 }
      
      const lowDmg = calculateSkillDamage(lowMultiplier, 100, 10, 10)
      const highDmg = calculateSkillDamage(highMultiplier, 100, 10, 10)
      
      expect(highDmg).toBeGreaterThan(lowDmg)
    })

    it('最低伤害应该为 1', () => {
      const damage = calculateSkillDamage(physicalSkill, 1, 100, 1)
      expect(damage).toBeGreaterThanOrEqual(1)
    })
  })

  describe('calculateSkillHeal', () => {
    const healSkill = {
      id: 'heal',
      name: '治疗技能',
      description: '测试',
      type: 'heal' as const,
      target: 'self' as const,
      mpCost: 25,
      cooldown: 4,
      healMultiplier: 1.0,
      icon: '💚'
    }

    it('应该计算治疗量', () => {
      const heal = calculateSkillHeal(healSkill, 100, 10)
      expect(heal).toBeGreaterThan(0)
    })

    it('治疗量应该随法术伤害和等级提升', () => {
      const heal1 = calculateSkillHeal(healSkill, 50, 5)
      const heal2 = calculateSkillHeal(healSkill, 100, 10)
      
      expect(heal2).toBeGreaterThan(heal1)
    })

    it('最低治疗量应该为 1', () => {
      const heal = calculateSkillHeal(healSkill, 1, 1)
      expect(heal).toBeGreaterThanOrEqual(1)
    })
  })

  describe('JOB_SKILLS 配置', () => {
    const jobNames = Object.keys(JOB_SKILLS)

    it('所有门派都应该有 3 个技能', () => {
      jobNames.forEach(jobName => {
        const skills = JOB_SKILLS[jobName]
        expect(skills.length).toBe(3)
      })
    })

    it('所有技能都应该有必要的字段', () => {
      jobNames.forEach(jobName => {
        const skills = JOB_SKILLS[jobName]
        skills.forEach(skill => {
          expect(skill.id).toBeDefined()
          expect(skill.name).toBeDefined()
          expect(skill.description).toBeDefined()
          expect(skill.type).toBeDefined()
          expect(skill.mpCost).toBeDefined()
          expect(skill.cooldown).toBeDefined()
          expect(skill.icon).toBeDefined()
        })
      })
    })

    it('物理/法术技能应该有伤害倍率', () => {
      jobNames.forEach(jobName => {
        const skills = JOB_SKILLS[jobName]
        skills.forEach(skill => {
          if (skill.type === 'physical' || skill.type === 'magical') {
            expect(skill.damageMultiplier).toBeDefined()
          }
        })
      })
    })

    it('增益技能应该有 buff 效果', () => {
      jobNames.forEach(jobName => {
        const skills = JOB_SKILLS[jobName]
        skills.forEach(skill => {
          if (skill.type === 'buff') {
            expect(skill.buffEffects).toBeDefined()
            expect(skill.buffEffects!.length).toBeGreaterThan(0)
          }
        })
      })
    })
  })
})
