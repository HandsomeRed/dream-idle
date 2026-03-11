import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App 角色创建流程', () => {
  test('渲染初始界面 - 输入名字', () => {
    render(<App />)
    expect(screen.getByText('🎮 梦幻放置')).toBeInTheDocument()
    expect(screen.getByText('创建你的角色')).toBeInTheDocument()
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.getByTestId('next-button')).toBeInTheDocument()
  })

  test('可以输入角色名字', () => {
    render(<App />)
    const input = screen.getByTestId('name-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '少侠' } })
    expect(input.value).toBe('少侠')
  })

  test('名字为空时下一步按钮禁用', () => {
    render(<App />)
    const nextButton = screen.getByTestId('next-button')
    expect(nextButton).toBeDisabled()
  })

  test('输入名字后可以点击下一步', () => {
    render(<App />)
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '少侠' } })
    fireEvent.click(nextButton)
    
    expect(screen.getByText('🎭 选择门派')).toBeInTheDocument()
  })

  test('显示 4 个门派选项', () => {
    render(<App />)
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
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '测试玩家' } })
    fireEvent.click(nextButton)
    fireEvent.click(screen.getByTestId('job-剑侠客'))
    
    expect(screen.getByText('✨ 角色创建成功！')).toBeInTheDocument()
    expect(screen.getByText('测试玩家')).toBeInTheDocument()
    expect(screen.getByText('剑侠客')).toBeInTheDocument()
    expect(screen.getByText('Lv.1')).toBeInTheDocument()
  })

  test('可以点击开始游戏按钮', () => {
    render(<App />)
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '少侠' } })
    fireEvent.click(nextButton)
    fireEvent.click(screen.getByTestId('job-剑侠客'))
    
    const startButton = screen.getByTestId('start-game-btn')
    expect(startButton).toBeInTheDocument()
    
    // 点击后应该弹出 alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {})
    fireEvent.click(startButton)
    expect(alertMock).toHaveBeenCalledWith('游戏开始！(功能开发中...)')
    alertMock.mockRestore()
  })

  test('可以点击返回按钮回到名字输入', () => {
    render(<App />)
    const input = screen.getByTestId('name-input')
    const nextButton = screen.getByTestId('next-button')
    
    fireEvent.change(input, { target: { value: '少侠' } })
    fireEvent.click(nextButton)
    
    const backButton = screen.getByText('← 返回')
    fireEvent.click(backButton)
    
    expect(screen.getByText('🎮 梦幻放置')).toBeInTheDocument()
  })
})
