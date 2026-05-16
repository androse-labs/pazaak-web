import { describe, it, expect } from 'bun:test'
import { randomUUIDv7 } from 'bun'
import { MatchManager } from '../../src/models/match-manager'
import { createTestMatch, createTestPlayer } from './match-helper'

const testDeck = [
  { id: randomUUIDv7(), type: 'double' as const, value: 'D' as const },
  { id: randomUUIDv7(), type: 'invert' as const, value: '2&4' as const },
  {
    id: randomUUIDv7(),
    type: 'flip' as const,
    value: 2 as const,
    magnitude: 'subtract' as const,
  },
  { id: randomUUIDv7(), type: 'subtract' as const, value: 3 as const },
]

const SIX_MINUTES_AGO = Date.now() - 6 * 60 * 1000

describe('Match Manager', () => {
  it('creates a match successfully', async () => {
    const matchManager = new MatchManager()

    const { matchId, playerId, token } = matchManager.createMatch(
      'Test Match',
      false,
      [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '2&4' },
        { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
        { id: randomUUIDv7(), type: 'subtract', value: 3 },
      ],
    )

    const match = matchManager.getMatch(matchId)

    expect(match).toBeDefined()
    expect(match!.matchName).toBe('Test Match')
    expect(match!.players[0]!.id).toBe(playerId)
    expect(match!.players[0]!.token).toBe(token)
    expect(match!.players[1]).toBeNull()
  })

  it('joins a match successfully', async () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatch('Test Match', false, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    const result = matchManager.joinMatch(matchId, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    if (!result) {
      throw new Error('Failed to join match')
    }

    const { playerId, token } = result

    const match = matchManager.getMatch(matchId)

    expect(match).toBeDefined()
    expect(match!.players[1]!.id).toBe(playerId)
    expect(match!.players[1]!.token).toBe(token)
  })

  it('lists all matches', () => {
    const matches = [
      createTestMatch({ players: [createTestPlayer(), null] }),
      createTestMatch({ players: [createTestPlayer(), createTestPlayer()] }),
    ]
    const matchManager = new MatchManager(matches)

    const result = matchManager.getAllMatches()

    expect(result.length).toBe(2)
    const [firstMatch, secondMatch] = result
    expect(firstMatch.players[0]).toBeDefined()
    expect(firstMatch.players[1]).toBeNull()
    expect(secondMatch.players[0]).toBeDefined()
    expect(secondMatch.players[1]).toBeDefined()
  })

  it('gets a match by ID', () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatch('Test Match', false, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    const match = matchManager.getMatch(matchId)

    expect(match).toBeDefined()
    expect(match!.matchName).toBe('Test Match')
  })

  it('returns null for non-existent match', () => {
    const matchManager = new MatchManager()

    const match = matchManager.getMatch(randomUUIDv7())

    expect(match).toBeNull()
  })

  it('deletes a match and returns true', () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatch('Test Match', false, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    const result = matchManager.deleteMatch(matchId)

    expect(result).toBe(true)
    expect(matchManager.getMatch(matchId)).toBeNull()
  })

  it('returns false when trying to delete a non-existent match', () => {
    const matchManager = new MatchManager()

    const result = matchManager.deleteMatch(randomUUIDv7())

    expect(result).toBe(false)
  })
})

describe('cleanUpMatches', () => {
  it('deletes inactive regular matches older than 5 minutes', () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatch('Test Match', false, testDeck)
    const match = matchManager.getMatch(matchId)!
    match.lastModifiedDateUtc = SIX_MINUTES_AGO

    matchManager.cleanUpMatches()

    expect(matchManager.getMatch(matchId)).toBeNull()
  })

  it('keeps active regular matches with connected players', () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatch('Test Match', false, testDeck)
    const match = matchManager.getMatch(matchId)!
    match.players[0]!.wsConnected = true

    matchManager.cleanUpMatches()

    expect(matchManager.getMatch(matchId)).toBeDefined()
  })

  it('deletes AI matches older than 5 minutes', () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatchVsAi(testDeck)
    const match = matchManager.getMatch(matchId)!
    match.lastModifiedDateUtc = SIX_MINUTES_AGO

    matchManager.cleanUpMatches()

    expect(matchManager.getMatch(matchId)).toBeNull()
  })

  it('deletes AI matches when the human player disconnects', () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatchVsAi(testDeck)
    const match = matchManager.getMatch(matchId)!
    // Simulate player connecting then disconnecting
    match.players[0]!.wsConnected = false

    matchManager.cleanUpMatches()

    expect(matchManager.getMatch(matchId)).toBeNull()
  })

  it('keeps active AI matches with a connected human player', () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatchVsAi(testDeck)
    const match = matchManager.getMatch(matchId)!
    const humanPlayer = match.players.find((p) => !p?.isAi)!
    humanPlayer.wsConnected = true

    matchManager.cleanUpMatches()

    expect(matchManager.getMatch(matchId)).toBeDefined()
  })
})
