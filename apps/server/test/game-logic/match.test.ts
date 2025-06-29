import { describe, it, expect } from 'bun:test'
import { createTestMatch, createTestPlayer } from './match-helper'
import { Game } from '../../src/models/game'

describe('Match', () => {
  it('adds a new game to the match', () => {
    const match = createTestMatch()
    const game = new Game(match.players[0]!.id, match.players[1]!.id)
    match.addGame(game)

    expect(match.games).toHaveLength(1)
    expect(match.games[0]).toEqual(game)
  })
})
