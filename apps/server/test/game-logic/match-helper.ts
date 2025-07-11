import { randomUUIDv7 } from 'bun'
import { Match } from '../../src/models/match'
import { generateHexToken } from '../../src/utils'
import { JoinedPlayer, Player } from '../../src/models/players'
import { Deck } from '../../src/models/deck'
import { Game } from '../../src/models/game'

const playerDeck = new Deck().fillWithCustomCards([
  { id: randomUUIDv7(), type: 'double', value: 'D' },
  { id: randomUUIDv7(), type: 'invert', value: '2&4' },
  { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
  { id: randomUUIDv7(), type: 'subtract', value: 3 },
])

const createTestPlayer = (): JoinedPlayer => ({
  id: randomUUIDv7(),
  connection: null,
  token: generateHexToken(16),
  status: 'playing',
  deck: playerDeck,
  hand: [],
})

const createTestMatch = (
  options: {
    matchName?: string
    players?: [Player, Player]
    status?: 'in-progress' | 'waiting' | 'finished'
    games?: Game[]
    playerTurn?: 1 | 2
    round?: number
    score?: [number, number]
  } = {},
): Match => {
  const match = new Match(randomUUIDv7(), 'Test Match', createTestPlayer())

  match.matchName = options.matchName || 'Test Match'
  match.players = options.players || [
    {
      id: randomUUIDv7(),
      connection: null,
      token: generateHexToken(16),
      status: 'playing',
      deck: playerDeck,
      hand: [],
    },
    {
      id: randomUUIDv7(),
      connection: null,
      token: generateHexToken(16),
      status: 'playing',
      deck: playerDeck,
      hand: [],
    },
  ]
  match.status = options.status || 'in-progress'
  match.games = options.games || []
  match.score = options.score || [0, 0]
  match.round = options.round || 0
  match.playersTurn = options.playerTurn || 1

  return match
}

export { createTestMatch, createTestPlayer, playerDeck }
