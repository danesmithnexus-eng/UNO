import { useState } from 'react'
import { MainMenu } from './components/MainMenu'
import { GameBoard } from './components/GameBoard'


export type GameMode = 'AI' | 'MULTIPLAYER' | null
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | null
export type WeatherEffect = 'CHERRY_BLOSSOM' | 'FALL_LEAVES' | 'NONE'

function App() {
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>(null)
  const [partyCode, setPartyCode] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string>('👤')
  const [userName, setUserName] = useState<string>('PLAYER')
  const [weather, setWeather] = useState<WeatherEffect>('CHERRY_BLOSSOM')

  const startGameAI = (diff: Difficulty) => {
    setDifficulty(diff)
    setGameMode('AI')
  }

  const startMultiplayer = (code: string) => {
    console.log('Starting multiplayer with code:', code);
    setPartyCode(code);
    setGameMode('MULTIPLAYER');
  }

  const backToMenu = () => {
    setGameMode(null)
    setDifficulty(null)
    setPartyCode(null)
  }

  return (
    <div className="h-screen w-screen bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden text-white font-pixel">
      {!gameMode ? (
        <MainMenu 
          onStartAI={startGameAI} 
          onStartMultiplayer={startMultiplayer} 
          userAvatar={userAvatar}
          setUserAvatar={setUserAvatar}
          userName={userName}
          setUserName={setUserName}
          weather={weather}
          setWeather={setWeather}
        />
      ) : (
        <GameBoard 
          mode={gameMode} 
          difficulty={difficulty} 
          partyCode={partyCode} 
          userAvatar={userAvatar}
          userName={userName}
          onBack={backToMenu} 
          weather={weather}
        />
      )}
    </div>
  )
}

export default App
