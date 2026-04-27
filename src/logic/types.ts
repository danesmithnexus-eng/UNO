export type CardColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'WILD'
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'SKIP' | 'REVERSE' | 'DRAW2' | 'WILD' | 'WILD_DRAW4'

export interface Card {
  id: string
  color: CardColor
  value: CardValue
}

export interface Player {
  id: string
  name: string
  hand: Card[]
  isAI: boolean
  avatar: string
  isHost?: boolean
}

export interface GameState {
  deck: Card[]
  discardPile: Card[]
  players: Player[]
  currentPlayerIndex: number
  direction: 1 | -1
  status: 'WAITING' | 'PLAYING' | 'GAME_OVER'
  winner: string | null
  currentColor: CardColor | null
  currentValue: CardValue | null
}
