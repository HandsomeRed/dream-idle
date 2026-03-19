import { useState } from 'react'
import './App.css'
import Game from './components/Game'

function App() {
  const [gameId, setGameId] = useState('')

  const startGame = () => {
    const id = `game_${Date.now()}`
    setGameId(id)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Slay the Web</h1>
        <p className="subtitle">网页版杀戮尖塔 - v0.1</p>
      </header>

      {!gameId ? (
        <div className="start-screen">
          <h2>准备好了吗？</h2>
          <p>开始你的冒险之旅！</p>
          <button className="start-button" onClick={startGame}>
            ⚔️ 开始战斗
          </button>
        </div>
      ) : (
        <Game gameId={gameId} onBack={() => setGameId('')} />
      )}

      <footer className="app-footer">
        <p>Made with ❤️ by 虾虾红</p>
      </footer>
    </div>
  )
}

export default App
