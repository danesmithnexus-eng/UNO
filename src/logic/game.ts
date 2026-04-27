import { Card, CardColor, CardValue, Player, GameState } from './types'
import { nanoid } from 'nanoid'

const COLORS: CardColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW']
const VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'SKIP', 'REVERSE', 'DRAW2']

export const createDeck = (): Card[] => {
  const deck: Card[] = []

  COLORS.forEach(color => {
    // One 0 for each color
    deck.push({ id: nanoid(), color, value: '0' })
    // Two of each 1-9, SKIP, REVERSE, DRAW2
    for (let i = 0; i < 2; i++) {
      VALUES.slice(1).forEach(value => {
        deck.push({ id: nanoid(), color, value })
      })
    }
  })

  // 4 WILD and 4 WILD_DRAW4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: nanoid(), color: 'WILD', value: 'WILD' })
    deck.push({ id: nanoid(), color: 'WILD', value: 'WILD_DRAW4' })
  }

  return shuffle(deck)
}

const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck]
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
  }
  return newDeck
}

export const canPlayCard = (card: Card, topCard: Card, currentColor: CardColor | null): boolean => {
  if (card.color === 'WILD') return true
  if (currentColor && card.color === currentColor) return true
  if (card.color === topCard.color) return true
  if (card.value === topCard.value) return true
  return false
}

export const getNextPlayerIndex = (currentIndex: number, direction: 1 | -1, totalPlayers: number): number => {
  let next = currentIndex + direction
  if (next >= totalPlayers) next = 0
  if (next < 0) next = totalPlayers - 1
  return next
}

export interface MoveResult {
  nextPlayers: Player[]
  nextIndex: number
  nextDirection: 1 | -1
  nextColor: CardColor
  nextValue: CardValue
  nextDeck: Card[]
}

export const calculateMove = (
  card: Card,
  playerIndex: number,
  currentState: GameState,
  newColor?: CardColor
): MoveResult => {
  const updatedPlayers = [...currentState.players]
  const player = updatedPlayers[playerIndex]
  const newHand = player.hand.filter(c => c.id !== card.id)
  updatedPlayers[playerIndex] = { ...player, hand: newHand }

  const nextDeck = [...currentState.deck]
  let nextIndex = getNextPlayerIndex(currentState.currentPlayerIndex, currentState.direction, currentState.players.length)
  let nextDirection = currentState.direction
  let cardsToDraw = 0
  let skipNext = false

  if (card.value === 'SKIP') skipNext = true
  if (card.value === 'REVERSE') {
    if (currentState.players.length === 2) {
      skipNext = true
    } else {
      nextDirection = (currentState.direction * -1) as 1 | -1
      nextIndex = getNextPlayerIndex(currentState.currentPlayerIndex, nextDirection, currentState.players.length)
    }
  }
  if (card.value === 'DRAW2') cardsToDraw = 2
  if (card.value === 'WILD_DRAW4') cardsToDraw = 4

  if (cardsToDraw > 0) {
    const targetIndex = getNextPlayerIndex(currentState.currentPlayerIndex, nextDirection, currentState.players.length)
    const targetPlayer = updatedPlayers[targetIndex]
    const drawnCards = nextDeck.splice(0, cardsToDraw)
    updatedPlayers[targetIndex] = { ...targetPlayer, hand: [...targetPlayer.hand, ...drawnCards] }
    skipNext = true
  }

  if (skipNext) {
    nextIndex = getNextPlayerIndex(nextIndex, nextDirection, currentState.players.length)
  }

  return {
    nextPlayers: updatedPlayers,
    nextIndex: newHand.length === 0 ? currentState.currentPlayerIndex : nextIndex,
    nextDirection,
    nextColor: newColor || card.color as CardColor,
    nextValue: card.value,
    nextDeck
  }
}
