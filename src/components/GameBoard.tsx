import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GameMode, Difficulty, WeatherEffect } from '../App'
import { Card as CardType, GameState, Player, CardColor } from '../logic/types'
import { createDeck, canPlayCard, getNextPlayerIndex, calculateMove } from '../logic/game'
import { Card } from './Card'
import { SpecialCardEffect } from './SpecialCardEffect'
import { CherryBlossom } from './CherryBlossom'
import { FallingLeaves } from './FallingLeaves'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface GameBoardProps {
  mode: GameMode
  difficulty: Difficulty
  partyCode: string | null
  userAvatar: string
  userName: string
  onBack: () => void
  weather: WeatherEffect
}

export const GameBoard: React.FC<GameBoardProps> = ({ mode, difficulty, partyCode, userAvatar, userName, onBack, weather }) => {
  console.log('GameBoard rendering:', { mode, partyCode, userAvatar, userName });
  
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [wildColorMenu, setWildColorMenu] = useState<boolean>(false)
  const [pendingWildCard, setPendingWildCard] = useState<CardType | null>(null)
  const [hasSaidUno, setHasSaidUno] = useState<boolean>(false)
  const [specialEffect, setSpecialEffect] = useState<string | null>(null)
  const [showDramaticAction, setShowDramaticAction] = useState<{card: CardType, player: Player, chosenColor?: CardColor} | null>(null)

  const sayUno = () => {
    setHasSaidUno(true)
    triggerEffect('UNO!')
    
    if (mode === 'MULTIPLAYER') {
      socketRef.current?.emit('game_action', { 
        roomCode: partyCode, 
        action: 'SAY_UNO', 
        data: { playerId: socketRef.current?.id } 
      })
    }
  }
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([])
  const socketRef = useRef<Socket | null>(null)

  const [hostId, setHostId] = useState<string | null>(null)
  const [socketError, setSocketError] = useState<string | null>(null)
  const [myId, setMyId] = useState<string | null>(null)

  // Determine if I am the host
  const isHost = Boolean(
    (socketRef.current?.id && hostId && socketRef.current.id === hostId) ||
    (myId && hostId && myId === hostId) || 
    (connectedPlayers && connectedPlayers.length > 0 && connectedPlayers[0]?.id === (myId || socketRef.current?.id)) ||
    (connectedPlayers.find(p => p.id === (myId || socketRef.current?.id))?.isHost)
  );

  useEffect(() => {
    if (mode === 'MULTIPLAYER') {
      console.log('Host Status Debug:', {
        myId,
        socketId: socketRef.current?.id,
        hostId,
        isHost,
        connectedPlayersCount: connectedPlayers.length
      });
    }
  }, [myId, hostId, isHost, connectedPlayers, mode]);

  const triggerEffect = useCallback((effect: string) => {
    setSpecialEffect(effect)
    setTimeout(() => setSpecialEffect(null), 2000)
  }, [])

  const initGame = useCallback((multiplayerPlayers?: any[], initialState?: any) => {
    console.log('initGame called:', { mode, hasInitialState: !!initialState, playersCount: multiplayerPlayers?.length });
    setHasSaidUno(false)

    // Case 1: Received state from host (for non-host players)
    if (mode === 'MULTIPLAYER' && initialState) {
      const currentSocketId = socketRef.current?.id
      const players = [...initialState.players]
      const myIndex = players.findIndex(p => p.id === currentSocketId)
      
      let rotatedPlayers = players;
      let rotatedCurrentIndex = initialState.currentPlayerIndex;
      
      if (myIndex !== -1) {
        rotatedPlayers = [
          ...players.slice(myIndex),
          ...players.slice(0, myIndex)
        ]
        rotatedCurrentIndex = (initialState.currentPlayerIndex - myIndex + players.length) % players.length
      }

      // Map names to "YOU" for local view
      rotatedPlayers = rotatedPlayers.map(p => ({
        ...p,
        name: p.id === currentSocketId ? 'YOU' : p.name
      }))

      setGameState({
        ...initialState,
        players: rotatedPlayers,
        currentPlayerIndex: rotatedCurrentIndex
      })
      return
    }
    
    // Case 2: Generating state (for Host or AI mode)
    const deck = createDeck()
    let players: Player[] = []
    
    if (mode === 'MULTIPLAYER' && multiplayerPlayers && multiplayerPlayers.length > 0) {
      // Create neutral player list (no "YOU" names yet, just IDs and info)
      players = multiplayerPlayers.map(p => ({
        id: p.id,
        name: p.name || 'Player',
        hand: [],
        isAI: false,
        avatar: p.avatar || '👤'
      }))
    } else {
      players = [
        { id: 'player', name: 'YOU', hand: [], isAI: false, avatar: userAvatar },
        { id: 'ai1', name: `AI ${difficulty || 'EASY'} 1`, hand: [], isAI: true, avatar: '🤖' },
        { id: 'ai2', name: `AI ${difficulty || 'EASY'} 2`, hand: [], isAI: true, avatar: '👾' },
      ]
    }

    // Deal cards
    players.forEach(p => {
      p.hand = deck.splice(0, 7)
    })

    const firstCard = deck.splice(0, 1)[0]
    
    const neutralState = {
      deck,
      discardPile: [firstCard],
      players,
      currentPlayerIndex: 0,
      direction: 1 as (1 | -1),
      status: 'PLAYING' as const,
      winner: null,
      currentColor: (firstCard.color === 'WILD' ? 'RED' : firstCard.color) as CardColor,
      currentValue: firstCard.value,
    }

    // If multiplayer, host needs to rotate for themselves and use "YOU"
    if (mode === 'MULTIPLAYER') {
      const currentSocketId = socketRef.current?.id
      const myIndex = players.findIndex(p => p.id === currentSocketId)
      
      let rotatedPlayers = [...players];
      if (myIndex !== -1) {
        rotatedPlayers = [
          ...players.slice(myIndex),
          ...players.slice(0, myIndex)
        ]
      }
      
      // Map names to "YOU" for local view
      rotatedPlayers = rotatedPlayers.map(p => ({
        ...p,
        name: p.id === currentSocketId ? 'YOU' : p.name
      }))

      setGameState({
        ...neutralState,
        players: rotatedPlayers,
        currentPlayerIndex: (neutralState.currentPlayerIndex - myIndex + players.length) % players.length
      })
    } else {
      setGameState(neutralState)
    }

    return neutralState
  }, [mode, difficulty, userAvatar])

  const handleRemoteAction = useCallback((action: string, data: any) => {
    if (action === 'GAME_STATE_UPDATE') {
      if (data && typeof data === 'object' && 'players' in data) {
        setGameState(data)
      }
      return
    }
    setGameState(prev => {
      if (!prev) return null
      const updatedPlayers = [...prev.players]
      
      if (action === 'PLAY_CARD') {
        const { playerId, card, newColor } = data
        const playerIndex = updatedPlayers.findIndex(p => p.id === playerId)
        if (playerIndex === -1) return prev
        const player = updatedPlayers[playerIndex]
        
        if (['SKIP', 'REVERSE', 'DRAW2', 'WILD_DRAW4', 'WILD'].includes(card.value)) {
          setShowDramaticAction({ card, player, chosenColor: newColor })
          setTimeout(() => setShowDramaticAction(null), 2500)
        }

        const move = calculateMove(card, playerIndex, prev, newColor)
        const isGameOver = move.nextPlayers[playerIndex].hand.length === 0

        if (['SKIP', 'REVERSE', 'DRAW2', 'WILD_DRAW4'].includes(card.value)) {
          triggerEffect(`${card.value}!`)
        }

        return {
          ...prev,
          players: move.nextPlayers,
          deck: move.nextDeck,
          discardPile: [...prev.discardPile, card],
          currentPlayerIndex: move.nextIndex,
          direction: move.nextDirection,
          currentColor: move.nextColor,
          currentValue: move.nextValue,
          status: isGameOver ? 'GAME_OVER' : 'PLAYING',
          winner: isGameOver ? player.name : null
        }
      }

      if (action === 'DRAW_CARD') {
        const { playerId, card: receivedCard } = data
        const playerIndex = updatedPlayers.findIndex(p => p.id === playerId)
        if (playerIndex === -1) return prev
        const player = updatedPlayers[playerIndex]
        const newDeck = [...prev.deck]
        
        // If the card was provided, we use it. Otherwise we take from our local deck.
        const drawnCard = receivedCard || newDeck.splice(0, 1)[0]
        
        // If we took from local deck, we've already spliced. 
        // If we were given a card, we should remove it from our local deck if it's there.
        if (receivedCard && newDeck.length > 0) {
          const indexInDeck = newDeck.findIndex(c => c.color === receivedCard.color && c.value === receivedCard.value);
          if (indexInDeck !== -1) {
            newDeck.splice(indexInDeck, 1);
          }
        }

        if (drawnCard) {
          updatedPlayers[playerIndex] = { ...player, hand: [...player.hand, drawnCard] }
        }
        
        const nextIndex = getNextPlayerIndex(prev.currentPlayerIndex, prev.direction, prev.players.length)
        
        return {
          ...prev,
          players: updatedPlayers,
          deck: newDeck,
          currentPlayerIndex: nextIndex
        }
      }

      if (action === 'RESHUFFLE') {
        const { deck: newDeck } = data
        return {
          ...prev,
          deck: newDeck
        }
      }

      if (action === 'SAY_UNO') {
        const { playerId } = data
        const player = updatedPlayers.find(p => p.id === playerId)
        if (player) {
          triggerEffect(`${player.name}: UNO!`)
        }
        return prev
      }

      return prev
    })
  }, [triggerEffect])

  // Initialize multiplayer socket
  useEffect(() => {
    if (mode === 'MULTIPLAYER' && partyCode) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
      console.log(`Connecting to socket server at ${socketUrl}...`);
      const socket = io(socketUrl, {
        reconnectionAttempts: 5,
        timeout: 10000,
      })
      socketRef.current = socket
      
      socket.on('connect', () => {
        console.log('CONNECTED to server with ID:', socket.id);
        setMyId(socket.id || null);
        setSocketError(null);
        
        // Use the user's selected name and avatar
        console.log('Emitting join_room:', { roomCode: partyCode, name: userName, avatar: userAvatar });
        socket.emit('join_room', { roomCode: partyCode, name: userName, avatar: userAvatar })
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setSocketError('Could not connect to multiplayer server. Make sure it is running on port 3001.');
      })

      socket.on('room_update', (data) => {
        console.log('ROOM UPDATE RECEIVED:', data);
        if (data && typeof data === 'object' && 'players' in data) {
          setConnectedPlayers(data.players || [])
          setHostId(data.hostId || null)
          
          // Immediate check for host status using the socket's own ID
          if (socket.id && data.hostId) {
            const currentIsHost = socket.id === data.hostId;
            console.log('AM I HOST?', currentIsHost);
          }
        }
      })

      socket.on('game_started', (data: any) => {
        console.log('GAME STARTED RECEIVED:', data);
        if (data.initialState) {
          console.log('Using initial state from host');
          initGame(undefined, data.initialState)
        } else {
          console.log('No initial state, using players list');
          initGame(data.players)
        }
      })

      socket.on('game_action', ({ action, data }) => {
        handleRemoteAction(action, data)
      })

      return () => {
        console.log('DISCONNECTING SOCKET');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('room_update');
        socket.off('game_started');
        socket.off('game_action');
        socket.off('disconnect');
        socket.disconnect();
        socketRef.current = null;
      }
    } else if (mode === 'AI') {
      initGame()
    }
  }, [mode, partyCode, userAvatar, initGame, handleRemoteAction])

  const playCard = (playerIndex: number, card: CardType, newColor?: CardColor) => {
    if (!gameState) return

    const player = gameState.players[playerIndex]
    const topCard = gameState.discardPile[gameState.discardPile.length - 1]

    if (playerIndex === gameState.currentPlayerIndex && canPlayCard(card, topCard, gameState.currentColor)) {
      if (card.color === 'WILD' && !newColor) {
        setPendingWildCard(card)
        setWildColorMenu(true)
        return
      }

      const move = calculateMove(card, playerIndex, gameState, newColor)
      const isGameOver = move.nextPlayers[playerIndex].hand.length === 0

      // Special Card Effects - Only trigger if it's the current move we're processing
      if (['SKIP', 'REVERSE', 'DRAW2', 'WILD_DRAW4', 'WILD'].includes(card.value)) {
        setShowDramaticAction({ card, player, chosenColor: move.nextColor })
        setTimeout(() => setShowDramaticAction(null), 2500)
      }

      setGameState(prev => {
        if (!prev) return null
        // Verify we are not using stale data by checking if the card is still in player's hand
        const currentPlayer = prev.players[playerIndex]
        if (!currentPlayer.hand.some(c => c.id === card.id)) return prev

        return {
          ...prev,
          players: move.nextPlayers,
          deck: move.nextDeck,
          discardPile: [...prev.discardPile, card],
          currentPlayerIndex: move.nextIndex,
          direction: move.nextDirection,
          currentColor: move.nextColor,
          currentValue: move.nextValue,
          status: isGameOver ? 'GAME_OVER' : 'PLAYING',
          winner: isGameOver ? player.name : null
        }
      })

      if (mode === 'MULTIPLAYER') {
        socketRef.current?.emit('game_action', { 
          roomCode: partyCode, 
          action: 'PLAY_CARD', 
          data: { playerId: socketRef.current?.id, card, newColor: move.nextColor } 
        })
      }

      setWildColorMenu(false)
      setPendingWildCard(null)
    }
  }

  const drawCard = (playerIndex: number) => {
    if (!gameState || playerIndex !== gameState.currentPlayerIndex) return

    setGameState(prev => {
      if (!prev) return null
      
      const newDeck = [...prev.deck]
      const updatedPlayers = [...prev.players]
      const player = updatedPlayers[playerIndex]
      
      let drawnCard = newDeck.splice(0, 1)[0]
      let reloadedDeck: CardType[] | null = null;
      
      if (!drawnCard) {
        // If the deck is empty, reshuffle from discard pile (except top card)
        if (mode === 'MULTIPLAYER') {
          if (isHost) {
            reloadedDeck = createDeck();
            drawnCard = reloadedDeck.splice(0, 1)[0];
            socketRef.current?.emit('game_action', { 
              roomCode: partyCode, 
              action: 'RESHUFFLE', 
              data: { deck: reloadedDeck } 
            });
          } else {
            // Non-host waits for reshuffle, but let's draw a temp card to not block
            const tempDeck = createDeck();
            drawnCard = tempDeck.splice(0, 1)[0];
          }
        } else {
          reloadedDeck = createDeck();
          drawnCard = reloadedDeck.splice(0, 1)[0];
        }
      }

      if (drawnCard) {
        updatedPlayers[playerIndex] = { ...player, hand: [...player.hand, drawnCard] }
        
        // Broadcast the draw in multiplayer
        if (mode === 'MULTIPLAYER' && playerIndex === 0) { // Only if it's the local player
          socketRef.current?.emit('game_action', { 
            roomCode: partyCode, 
            action: 'DRAW_CARD', 
            data: { playerId: socketRef.current?.id, card: drawnCard } 
          })
        }
      }
      
      const nextIndex = getNextPlayerIndex(prev.currentPlayerIndex, prev.direction, prev.players.length)
      
      return {
        ...prev,
        players: updatedPlayers,
        deck: reloadedDeck || newDeck,
        currentPlayerIndex: nextIndex
      }
    })
  }

  // AI Logic
  useEffect(() => {
    if (gameState && gameState.status === 'PLAYING' && gameState.players[gameState.currentPlayerIndex].isAI) {
      const timer = setTimeout(() => {
        const aiPlayer = gameState.players[gameState.currentPlayerIndex]
        const topCard = gameState.discardPile[gameState.discardPile.length - 1]
        
        const playableCards = aiPlayer.hand.filter(c => canPlayCard(c, topCard, gameState.currentColor))
        
        if (playableCards.length > 0) {
          let cardToPlay = playableCards[0]
          
          if (difficulty === 'EASY') {
            // Pick a random playable card
            cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)]
          } else if (difficulty === 'MEDIUM') {
            // Prefer matching color or action cards
            const matchColor = playableCards.filter(c => c.color === gameState.currentColor)
            const actions = playableCards.filter(c => ['SKIP', 'REVERSE', 'DRAW2'].includes(c.value))
            if (actions.length > 0) cardToPlay = actions[0]
            else if (matchColor.length > 0) cardToPlay = matchColor[0]
          } else if (difficulty === 'HARD') {
            // Strategic play: save WILD_DRAW4, use actions if next player has few cards
            const nextPlayer = gameState.players[getNextPlayerIndex(gameState.currentPlayerIndex, gameState.direction, gameState.players.length)]
            const isNextPlayerDangerous = nextPlayer.hand.length <= 2
            
            const normalCards = playableCards.filter(c => c.color !== 'WILD')
            const drawCards = playableCards.filter(c => c.value === 'DRAW2' || c.value === 'WILD_DRAW4')
            
            if (isNextPlayerDangerous && drawCards.length > 0) {
              cardToPlay = drawCards[0]
            } else if (normalCards.length > 0) {
              cardToPlay = normalCards[0]
            }
          }

          if (cardToPlay.color === 'WILD') {
            const colors: CardColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]
            playCard(gameState.currentPlayerIndex, cardToPlay, randomColor)
          } else {
            playCard(gameState.currentPlayerIndex, cardToPlay)
          }
        } else {
          drawCard(gameState.currentPlayerIndex)
        }
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState, difficulty])

  if (mode === 'MULTIPLAYER' && !gameState) {
    if (!partyCode) {
      return (
        <div className="fixed inset-0 bg-[#1a0505] flex items-center justify-center font-mono">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-yellow-400 font-bold animate-pulse uppercase tracking-widest text-xs">Initializing Party...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 z-[500] bg-[#1a0505] flex items-center justify-center p-2 sm:p-4 font-mono select-none overflow-y-auto">
        {/* Background Stylized elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-8 bg-zinc-900 pixel-border max-w-sm sm:max-w-md w-full shadow-2xl my-auto">
          <h2 className="text-xl sm:text-2xl text-yellow-400 font-black italic tracking-widest uppercase">UNO ONLINE</h2>
          
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", myId ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            <span className="text-[6px] sm:text-[8px] text-zinc-500 font-bold uppercase">{myId ? "Connected" : "Connecting..."}</span>
          </div>
          
          {socketError ? (
            <div className="bg-red-900/40 p-4 sm:p-6 pixel-border border-red-500 text-red-200 text-xs text-center flex flex-col gap-4 sm:gap-6 w-full">
              <div className="text-red-500 font-bold uppercase">Connection Error</div>
              <p className="leading-relaxed text-[10px] sm:text-xs">{socketError}</p>
              <button 
                onClick={onBack} 
                className="pixel-button bg-red-600 hover:bg-red-500 transition-colors py-2 sm:py-3"
              >
                RETURN TO MENU
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 sm:gap-3 bg-black/40 p-4 sm:p-6 pixel-border w-full">
                <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Invite Code</span>
                <div className="text-2xl sm:text-4xl font-black tracking-[0.2em] text-yellow-400 drop-shadow-[0_2px_0_#000]">
                  {partyCode}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:gap-3 w-full">
                <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest self-start">Players</span>
                {(connectedPlayers || []).map(p => (
                  <div 
                    key={p?.id || Math.random()} 
                    className="flex items-center justify-between bg-black/60 p-2 sm:p-4 pixel-border relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                      <span className="text-xl sm:text-3xl">{p?.avatar || '👤'}</span>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-black italic text-white uppercase tracking-tight">
                          {p?.id === myId ? 'YOU' : (p?.name || 'Player')}
                        </span>
                        {p?.id === hostId && (
                          <span className="text-[6px] sm:text-[8px] text-cyan-400 font-black uppercase tracking-widest">
                            ★ LEADER ★
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative z-10">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>
                  </div>
                ))}
                
                {Array.from({ length: Math.max(0, 4 - (connectedPlayers?.length || 0)) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex items-center gap-3 sm:gap-4 bg-black/20 p-2 sm:p-4 pixel-border opacity-30 border-dashed">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-lg sm:text-xl text-zinc-600 font-black">?</div>
                    <span className="text-[10px] sm:text-xs text-zinc-600 font-bold uppercase italic tracking-widest">Waiting...</span>
                  </div>
                ))}
              </div>

              <div className="w-full h-px bg-zinc-800 my-1 sm:my-2" />

              {isHost ? (
                <div className="flex flex-col items-center gap-2 sm:gap-4 w-full">
                  <p className="text-[8px] sm:text-[9px] text-zinc-500 text-center uppercase font-bold italic tracking-wider">
                    Need 2-4 players
                  </p>
                  <button 
                    onClick={() => {
                      console.log('Host clicking start game. Players:', connectedPlayers.length);
                      const initialState = initGame(connectedPlayers)
                      console.log('Initial state generated, emitting start_game');
                      socketRef.current?.emit('start_game', { roomCode: partyCode, initialState })
                    }}
                    disabled={connectedPlayers.length < 2}
                    className="pixel-button bg-green-600 hover:bg-green-500 w-full disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-xs sm:text-sm py-3 sm:py-4 font-black italic"
                  >
                    START MATCH ({connectedPlayers.length}/4)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 sm:gap-4 py-1 sm:py-2">
                  <div className="flex items-center gap-2 sm:gap-3 text-yellow-400">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-ping" />
                    <span className="text-[8px] sm:text-[10px] font-black uppercase italic tracking-widest">
                      Waiting for Leader...
                    </span>
                  </div>
                </div>
              )}
              
              <button 
                onClick={onBack} 
                className="text-[8px] sm:text-[10px] hover:text-red-400 text-zinc-600 font-bold uppercase italic tracking-widest transition-colors mt-1 sm:mt-2"
              >
                Leave Lobby
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!gameState) return null

  const currentPlayer = gameState.players[0]

  if (!currentPlayer) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p>Loading Game Data...</p>
      </div>
    </div>
  )

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#1e1111] overflow-hidden font-pixel select-none">
      {/* Weather Effects */}
      {weather === 'CHERRY_BLOSSOM' && <CherryBlossom />}
      {weather === 'FALL_LEAVES' && <FallingLeaves />}

      {/* Background/Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Header UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
        <button 
          onClick={onBack}
          className="pixel-button bg-zinc-800 hover:bg-zinc-700 flex items-center gap-2 text-[10px] sm:text-xs pixel-border-32"
        >
          <ArrowLeft size={14} /> LEAVE
        </button>
        
        <div className="flex flex-col items-end gap-2">
          {mode === 'MULTIPLAYER' && (
            <div className="bg-black/60 px-3 py-1 pixel-border-32 text-[8px] sm:text-[10px]">
              <span className="text-zinc-400">ROOM:</span> <span className="text-yellow-400 font-bold tracking-widest">{partyCode}</span>
            </div>
          )}
          {gameState && (
            <div className="text-white font-black text-[8px] sm:text-[10px] pixel-text uppercase bg-black/40 px-2 py-1 pixel-border-32">
              NEXT PLAYER: <span className="text-yellow-400">
                {gameState.players[getNextPlayerIndex(gameState.currentPlayerIndex, gameState.direction, gameState.players.length)].name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Current Player Badge (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-50">
        <div className="flex flex-col items-start bg-black/40 p-2 pixel-border-32">
          <span className="text-white font-black text-[10px] sm:text-xs pixel-text uppercase">{userName}</span>
          <div className="flex gap-1 mt-1">
            <motion.div 
              animate={gameState.currentPlayerIndex === 0 ? { 
                scale: [1, 1.2, 1],
                backgroundColor: ['#dc2626', '#ef4444', '#dc2626'],
                boxShadow: ['0 0 0px rgba(220,38,38,0)', '0 0 10px rgba(220,38,38,0.8)', '0 0 0px rgba(220,38,38,0)']
              } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2.5 h-2.5 bg-red-600 pixel-border-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]" 
            />
            <div className="w-2.5 h-2.5 bg-zinc-700 pixel-border-sm" />
            <div className="w-2.5 h-2.5 bg-zinc-700 pixel-border-sm" />
          </div>
        </div>
      </div>

      {/* The Table */}
      <div className="relative w-[95%] max-w-4xl aspect-[16/9] perspective-table flex items-center justify-center pixel-shadow">
        {/* Game Area on Table */}
        <div className="relative w-full h-full flex items-center justify-center gap-12 sm:gap-20">
          {/* Draw Pile */}
          <div className="relative flex flex-col items-center gap-2">
            <div className="relative group">
              {/* Stack effect */}
              <div className="absolute top-1.5 left-1.5 w-12 h-18 sm:w-16 sm:h-24 bg-zinc-800 pixel-border-sm" />
              <div className="absolute top-1 left-1 w-12 h-18 sm:w-16 sm:h-24 bg-zinc-700 pixel-border-sm" />
              <div className="absolute top-0.5 left-0.5 w-12 h-18 sm:w-16 sm:h-24 bg-zinc-600 pixel-border-sm" />
              <Card 
                isBack 
                onClick={() => gameState?.status === 'PLAYING' && drawCard(0)} 
                disabled={gameState?.currentPlayerIndex !== 0}
              />
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative flex flex-col items-center gap-2">
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  {gameState?.discardPile.map((card, idx) => (
                    idx === gameState.discardPile.length - 1 && (
                      <motion.div
                        key={`${card.color}-${card.value}-${idx}`}
                        initial={{ scale: 1.5, opacity: 0, y: -50, rotate: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                      >
                        <Card card={card} disabled />
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>
              
              {/* DISCARD label next to pile as in image */}
              <div className="flex flex-col items-start gap-1">
                {gameState.currentColor && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "px-3 py-1 pixel-border-sm text-[8px] sm:text-[10px] font-black italic uppercase shadow-[0_0_15px_rgba(255,255,255,0.2)]",
                      gameState.currentColor === 'RED' ? "bg-red-600 text-white" :
                      gameState.currentColor === 'BLUE' ? "bg-blue-600 text-white" :
                      gameState.currentColor === 'GREEN' ? "bg-green-600 text-white" :
                      "bg-yellow-400 text-black"
                    )}
                  >
                    {gameState.currentColor}
                  </motion.div>
                )}
                <div className="text-white font-black italic text-xs sm:text-xl pixel-text tracking-tighter whitespace-nowrap">
                  DISCARD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opponent Hands Around Table */}
        {gameState?.players.slice(1).map((player, idx) => (
          <div 
            key={player.id}
            className={cn(
              "absolute z-20",
              idx === 0 ? "top-[-80px] left-1/2 -translate-x-1/2" : // Top player
              idx === 1 ? "right-[-60px] top-1/2 -translate-y-1/2" : // Right player
              "left-[-60px] top-1/2 -translate-y-1/2" // Left player
            )}
          >
            <div className={cn(
              "flex flex-col items-center gap-2",
              idx === 1 ? "flex-col" : idx === 2 ? "flex-col" : "flex-col"
            )}>
              <div className="relative flex -space-x-6 sm:-space-x-8">
                {Array.from({ length: Math.min(player.hand.length, 5) }).map((_, i) => (
                  <div key={i} className={cn(
                    "transform",
                    idx === 0 ? "rotate-180" : idx === 1 ? "-rotate-90" : "rotate-90"
                  )}>
                    <Card isBack className="w-8 h-12 sm:w-10 sm:h-16 pixel-shadow" />
                  </div>
                ))}
                {player.hand.length > 5 && (
                  <div className="absolute -right-4 -top-4 bg-yellow-400 text-black text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 pixel-border-sm z-30">
                    +{player.hand.length - 5}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-white font-black text-[8px] sm:text-[10px] pixel-text uppercase">
                  {player.name}
                </div>
                <div className="flex gap-1">
                  <motion.div 
                    animate={gameState.currentPlayerIndex === idx + 1 ? { 
                      scale: [1, 1.2, 1],
                      backgroundColor: ['#dc2626', '#ef4444', '#dc2626'],
                      boxShadow: ['0 0 0px rgba(220,38,38,0)', '0 0 10px rgba(220,38,38,0.8)', '0 0 0px rgba(220,38,38,0)']
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 bg-red-600 pixel-border-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]" 
                  />
                  <div className="w-2 h-2 bg-zinc-700 pixel-border-sm" />
                  <div className="w-2 h-2 bg-zinc-700 pixel-border-sm" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Player's Hand Area */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 flex flex-col items-center justify-end pb-4 sm:pb-8 z-40 pointer-events-none">
        {/* Turn Indicator */}
        {gameState?.currentPlayerIndex === 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4 bg-yellow-400 text-black px-4 py-1 font-black italic pixel-border text-xs sm:text-base animate-bounce"
          >
            YOUR TURN!
          </motion.div>
        )}

        <div className="flex flex-wrap justify-center items-end gap-[-20px] sm:gap-[-30px] px-4 pointer-events-auto max-w-5xl">
          {gameState?.players[0].hand.map((card, idx) => (
            <div 
              key={`${card.color}-${card.value}-${idx}`}
              className="transform hover:-translate-y-8 transition-transform duration-200 -ml-6 sm:-ml-10 first:ml-0"
              style={{ 
                zIndex: idx + 10,
                rotate: `${(idx - (gameState.players[0].hand.length - 1) / 2) * 2}deg`
              }}
            >
              <Card 
                card={card} 
                onClick={() => playCard(0, card)}
                disabled={gameState?.currentPlayerIndex !== 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Special Effects Overlay */}
      <AnimatePresence>
        {specialEffect && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1.2, opacity: 1, y: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute z-[100] text-4xl sm:text-7xl font-black italic text-white pixel-text pointer-events-none"
          >
            {specialEffect}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dramatic Action (SKIP/REVERSE etc) */}
      {showDramaticAction && (
         <SpecialCardEffect 
           show={!!showDramaticAction} 
           card={showDramaticAction.card} 
           player={showDramaticAction.player} 
           chosenColor={showDramaticAction.chosenColor}
         />
       )}

      {/* Wild Color Selection */}
      <AnimatePresence>
        {wildColorMenu && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-8">
              <h2 className="text-2xl sm:text-4xl font-black italic text-white pixel-text">CHOOSE COLOR</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['RED', 'BLUE', 'GREEN', 'YELLOW'] as CardColor[]).map(color => (
                  <button
                    key={color}
                    onClick={() => pendingWildCard && playCard(0, pendingWildCard, color)}
                    className={cn(
                      "w-20 h-20 sm:w-32 sm:h-32 pixel-border hover:scale-110 transition-transform flex items-center justify-center",
                      color === 'RED' ? 'bg-[#ff4d4d]' : 
                      color === 'BLUE' ? 'bg-[#4d79ff]' : 
                      color === 'GREEN' ? 'bg-[#2eb82e]' : 
                      'bg-[#ffcc00]'
                    )}
                  >
                    <span className="text-white font-black italic pixel-text text-xs sm:text-xl">{color}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      {gameState?.status === 'GAME_OVER' && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6 p-8 pixel-border bg-zinc-900 max-w-md w-full"
          >
            <Trophy size={80} className="text-yellow-400 animate-bounce" />
            <h1 className="text-3xl sm:text-5xl font-black italic text-white pixel-text text-center">
              {gameState.winner === 'YOU' ? 'VICTORY!' : `${gameState.winner} WINS!`}
            </h1>
            <div className="flex gap-4 w-full">
              <button 
                onClick={onBack}
                className="pixel-button bg-zinc-700 flex-1 font-bold italic"
              >
                MENU
              </button>
              {mode === 'AI' ? (
                <button 
                  onClick={() => initGame()}
                  className="pixel-button bg-blue-600 flex-1 font-bold italic flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> REPLAY
                </button>
              ) : (
                isHost && (
                  <button 
                    onClick={() => {
                      const initialState = initGame(connectedPlayers);
                      socketRef.current?.emit('start_game', { roomCode: partyCode, initialState });
                    }}
                    className="pixel-button bg-green-600 flex-1 font-bold italic flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} /> RESTART
                  </button>
                )
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* UNO Button */}
      {gameState?.players[0].hand.length === 2 && gameState.currentPlayerIndex === 0 && (
        <motion.button
          initial={{ scale: 0, x: 100 }}
          animate={{ scale: 1, x: 0 }}
          onClick={sayUno}
          disabled={hasSaidUno}
          className={cn(
            "absolute bottom-40 right-4 sm:right-10 z-[60] w-20 h-20 sm:w-28 sm:h-28 rounded-full pixel-border flex items-center justify-center font-black italic text-xl sm:text-3xl transition-transform hover:scale-110 active:scale-95",
            hasSaidUno ? "bg-zinc-600 text-zinc-400 grayscale" : "bg-red-600 text-white animate-pulse"
          )}
        >
          UNO!
        </motion.button>
      )}

      {/* Connection Status / Error */}
      {socketError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-4 py-2 pixel-border-sm text-[8px] sm:text-xs text-center max-w-[80%]">
          {socketError}
        </div>
      )}
    </div>
  )
}
