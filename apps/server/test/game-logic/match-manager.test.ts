import { describe, it, expect } from 'bun:test'
import { randomUUIDv7 } from 'bun'
import { MatchManager } from '../../src/models/match-manager'
import { createTestMatch, createTestPlayer } from './match-helper'

describe('Match Manager', () => {
  it('creates a match successfully', async () => {
    const matchManager = new MatchManager()

    const { matchId, playerId, token } = matchManager.createMatch(
      'Test Match',
      'standard',
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

    const { matchId } = matchManager.createMatch('Test Match', 'standard', false, [
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

    const { matchId } = matchManager.createMatch('Test Match', 'standard', false, [
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

    const { matchId } = matchManager.createMatch('Test Match', 'standard', false, [
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
