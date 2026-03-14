import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App 角色创建流程', () => {
  const goToNameInput = () => {
    const startButton = screen.getByTestId('start-game-btn')
    fireEvent.click(startButton)
  }

  test('渲染初始菜单界面', () => {
    render(<App />)
    expect(screen.getByText('🎮 梦幻放置')).toBeInTheDocument()
    expect(screen.getByText('梦幻西游题材放置挂机游戏')).toBeInTheDocument()
    expect(screen.getByTestId('start-game-btn')).toBeInTheDocument()
    expect(screen.getByText('创建角色')).toBeInTheDocument()
  })

  test('可以进入角色创建界面', () => {
    render(<App />)
    goToNameInput()
    expect(screen.getByText('创建你的角色')).toBeInTheDocument()
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
  })

  test('可以输入角色名字', () => {
    render(<App />)
    goToNameInput()
    const input = screen.getByTestId('name-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '少侠' } })
    expect(input.value).toBe('少侠')
  })

  test('名字为空时下一步按钮禁用', () => {
    render(<App />)
    goToNameInput()
    const nextButton = screen.getByTestId('next-button')
    expect(nextButton).toBeDisabled()
  })

  test('输入名字后可以点击下一步', () => {
    render(<App />)
    goToNameInput()
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '少侠' } })
    fireEvent.click(nextButton)
    
    expect(screen.getByText('🎭 选择门派')).toBeInTheDocument()
  })

  test('显示 4 个门派选项', () => {
    render(<App />)
    goToNameInput()
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '少侠' } })
    fireEvent.click(nextButton)
    
    expect(screen.getByTestId('job-剑侠客')).toBeInTheDocument()
    expect(screen.getByTestId('job-骨精灵')).toBeInTheDocument()
    expect(screen.getByTestId('job-龙太子')).toBeInTheDocument()
    expect(screen.getByTestId('job-狐美人')).toBeInTheDocument()
  })

  test('选择门派后创建角色', () => {
    render(<App />)
    goToNameInput()
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '测试玩家' } })
    fireEvent.click(nextButton)
    fireEvent.click(screen.getByTestId('job-剑侠客'))
    
    expect(screen.getByText('✨ 测试玩家')).toBeInTheDocument()
    expect(screen.getByText('剑侠客')).toBeInTheDocument()
    expect(screen.getByText('Lv.1')).toBeInTheDocument()
  })

  test('可以点击去战斗按钮', () => {
    render(<App />)
    goToNameInput()
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '少侠' } })
    fireEvent.click(nextButton)
    fireEvent.click(screen.getByTestId('job-剑侠客'))
    
    const battleButton = screen.getByTestId('battle-btn')
    expect(battleButton).toBeInTheDocument()
    expect(battleButton).toHaveTextContent('⚔️ 去战斗')
  })

  test('可以从门派选择返回名字输入', () => {
    render(<App />)
    goToNameInput()
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '少侠' } })
    fireEvent.click(nextButton)
    
    expect(screen.getByText('🎭 选择门派')).toBeInTheDocument()
    
    const backButton = screen.getByText('← 返回')
    fireEvent.click(backButton)
    
    expect(screen.getByText('请输入角色名字：')).toBeInTheDocument()
  })

  test('可以从名字输入界面返回菜单', () => {
    render(<App />)
    goToNameInput()
    
    const backButton = screen.getByText('← 返回标题')
    fireEvent.click(backButton)
    
    expect(screen.getByText('创建角色')).toBeInTheDocument()
  })
})
