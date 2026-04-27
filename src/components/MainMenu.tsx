import React, { useState } from 'react'
import { Users, Cpu, Wind } from 'lucide-react'
import { CherryBlossom } from './CherryBlossom'
import { FallingLeaves } from './FallingLeaves'
import { WeatherEffect, Difficulty } from '../App'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface MainMenuProps {
  onStartAI: (difficulty: Difficulty) => void
  onStartMultiplayer: (code: string, serverUrl?: string) => void
  userAvatar: string
  setUserAvatar: (avatar: string) => void
  userName: string
  setUserName: (name: string) => void
  weather: WeatherEffect
  setWeather: (weather: WeatherEffect) => void
}

const AVATARS = ['😎', '🤖', '🦊', '🐱', '🐼', '🐲', '👻', '🎩', '🎮', '👾', '🤴', '🤠', '👽', '🦄', '🐯']

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartAI, 
  onStartMultiplayer, 
  userAvatar, 
  setUserAvatar,
  userName,
  setUserName,
  weather,
  setWeather
}) => {
  const [view, setView] = useState<'MAIN' | 'AI_SELECT' | 'MULTIPLAYER_SELECT' | 'CHARACTER_EDIT'>('MAIN')
  const [inputCode, setInputCode] = useState('')
  const [customServerUrl, setCustomServerUrl] = useState('')

  const generateCode = () => {
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      console.log('Generated code:', result);
      onStartMultiplayer(result, customServerUrl);
    } catch (error) {
      console.error('Error generating code:', error);
      // Fallback code just in case
      onStartMultiplayer('PIXEL1', customServerUrl);
    }
  }

  const joinGame = () => {
    if (inputCode.length === 6) {
      onStartMultiplayer(inputCode.toUpperCase(), customServerUrl)
    }
  }

  return (
    <>
      {weather === 'CHERRY_BLOSSOM' && <CherryBlossom />}
      {weather === 'FALL_LEAVES' && <FallingLeaves />}
      <div className="flex flex-col items-center gap-8 p-8 bg-[#1e1e1e] pixel-border-32 max-w-md w-full animate-in fade-in zoom-in duration-300 relative z-10">
        <div className="relative">
          <h1 className="text-5xl font-black text-yellow-400 pixel-text mb-4 drop-shadow-[0_4px_0_#b27c00] tracking-tighter transform -rotate-2">UNO!</h1>
          <div className="absolute -inset-2 bg-white/5 blur-xl -z-10 animate-pulse" />
        </div>

      {view === 'MAIN' && (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative group">
              <div className="w-24 h-24 bg-black/40 pixel-border-32 flex items-center justify-center text-5xl mb-2 transition-transform group-hover:scale-105">
                {userAvatar}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-black uppercase tracking-[0.2em] text-sm mb-1 pixel-text">{userName}</div>
              <button 
                onClick={() => setView('CHARACTER_EDIT')}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-widest bg-blue-400/10 px-2 py-1 pixel-border-sm"
              >
                EDIT CHARACTER
              </button>
            </div>
          </div>
          <button 
            onClick={() => setView('AI_SELECT')}
            className="pixel-button bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 text-sm font-black italic pixel-border-32 h-12"
          >
            <Cpu size={20} /> VS AI
          </button>
          <button 
            onClick={() => setView('MULTIPLAYER_SELECT')}
            className="pixel-button bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2 text-sm font-black italic pixel-border-32 h-12"
          >
            <Users size={20} /> MULTIPLAYER
          </button>

          {/* Weather Toggle */}
          <div className="flex flex-col gap-2 mt-4 p-3 bg-black/40 pixel-border-32">
            <div className="flex items-center gap-2 text-[8px] font-black text-zinc-400 uppercase tracking-widest">
              <Wind size={12} /> Ambient Atmosphere
            </div>
            <div className="flex items-center justify-center gap-2">
              <button 
                onClick={() => setWeather('CHERRY_BLOSSOM')}
                className={cn(
                  "flex-1 text-[8px] sm:text-[10px] px-2 py-2 pixel-border-sm font-bold uppercase tracking-widest transition-all",
                  weather === 'CHERRY_BLOSSOM' ? "bg-pink-500 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                )}
              >
                Sakura
              </button>
              <button 
                onClick={() => setWeather('FALL_LEAVES')}
                className={cn(
                  "flex-1 text-[8px] sm:text-[10px] px-2 py-2 pixel-border-sm font-bold uppercase tracking-widest transition-all",
                  weather === 'FALL_LEAVES' ? "bg-amber-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                )}
              >
                Autumn
              </button>
              <button 
                onClick={() => setWeather('NONE')}
                className={cn(
                  "flex-1 text-[8px] sm:text-[10px] px-2 py-2 pixel-border-sm font-bold uppercase tracking-widest transition-all",
                  weather === 'NONE' ? "bg-zinc-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                )}
              >
                Off
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'CHARACTER_EDIT' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Player Name</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value.toUpperCase().slice(0, 10))}
                className="bg-black/40 p-3 pixel-border text-yellow-400 text-lg font-black tracking-widest focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
                placeholder="ENTER NAME"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Choose Avatar</label>
              <div className="grid grid-cols-5 gap-3 max-h-[160px] overflow-y-auto p-1 custom-scrollbar">
                {AVATARS.map(avatar => (
                  <button
                    key={avatar}
                    onClick={() => setUserAvatar(avatar)}
                    className={`w-12 h-12 flex items-center justify-center text-2xl pixel-border hover:bg-white/10 transition-all ${userAvatar === avatar ? 'bg-yellow-400 border-yellow-400 scale-110 z-10' : 'bg-black/20'}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setView('MAIN')} 
            className="pixel-button bg-blue-600 hover:bg-blue-500 w-full font-bold italic"
          >
            SAVE CHANGES
          </button>
        </div>
      )}

      {view === 'AI_SELECT' && (
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-lg text-center mb-2">SELECT DIFFICULTY</h2>
          <button onClick={() => onStartAI('EASY')} className="pixel-button bg-green-600 hover:bg-green-500 text-sm">EASY</button>
          <button onClick={() => onStartAI('MEDIUM')} className="pixel-button bg-yellow-600 hover:bg-yellow-500 text-sm">MEDIUM</button>
          <button onClick={() => onStartAI('HARD')} className="pixel-button bg-red-600 hover:bg-red-500 text-sm">HARD</button>
          <button onClick={() => setView('MAIN')} className="text-xs mt-4 hover:underline">BACK</button>
        </div>
      )}

      {view === 'MULTIPLAYER_SELECT' && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-lg text-center mb-2">MULTIPLAYER</h2>
            
            <div className="flex flex-col gap-2 mb-4 p-3 bg-black/40 pixel-border-sm">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Server URL (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 192.168.1.5:3001" 
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                className="bg-black/40 p-2 pixel-border-sm text-blue-400 text-xs font-bold focus:outline-none"
              />
              <p className="text-[8px] text-zinc-500 italic">Leave empty for default server</p>
            </div>

            <button onClick={generateCode} className="pixel-button bg-blue-600 hover:bg-blue-500 text-sm">CREATE PARTY</button>
            <div className="flex flex-col gap-2 mt-4">
              <input 
                type="text" 
                placeholder="ENTER CODE" 
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="bg-black/40 p-3 pixel-border text-center text-yellow-400 text-lg font-black tracking-[0.2em] focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
              />
              <button 
                onClick={joinGame}
                disabled={inputCode.length !== 6}
                className="pixel-button bg-green-600 hover:bg-green-500 disabled:opacity-50 text-sm font-bold italic"
              >
                JOIN PARTY
              </button>
            </div>
            <button onClick={() => setView('MAIN')} className="text-xs mt-4 hover:underline">BACK</button>
          </div>
        )}
      </div>
    </>
  )
}
