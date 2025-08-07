import { describe, it, expect } from 'bun:test'
import { createApp } from '../../src'
import { testClient } from './helpers/axiosMimic'
import { randomUUIDv7 } from 'bun'
import { MatchManager } from '../../src/models/match-manager'

describe('Match Joining', () => {
  it('joins a match successfully', async () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatch('Test Match', false, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    const client = testClient(createApp(matchManager))

    const response = await client.post(`/match/${matchId}/join`, {
      deck: [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '2&4' },
        { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
        { id: randomUUIDv7(), type: 'subtract', value: 3 },
      ],
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    // spread to workaround Bun's issue with expect.any
    expect({ ...data }).toMatchObject({
      playerId: expect.any(String),
      token: expect.any(String),
    })

    expect(matchManager.getMatch(matchId)).toBeDefined()
    expect(matchManager.getMatch(matchId)!.players[1]!.id).toBe(data.playerId)
    expect(matchManager.getMatch(matchId)!.players[1]!.token).toBe(data.token)
  })

  it('rejects a match join with invalid deck', async () => {
    const matchManager = new MatchManager()
    const { matchId } = matchManager.createMatch('Test Match', false, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    const client = testClient(createApp(matchManager))

    const response = await client.post(`/match/${matchId}/join`, {
      deck: [
        { type: 'invert', value: 'X' }, // Invalid card type
      ],
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  it('rejects joining a non-existent match', async () => {
    const matchManager = new MatchManager()
    const client = testClient(createApp(matchManager))

    const response = await client.post('/match/nonexistent/join', {
      deck: [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '2&4' },
        { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
        { id: randomUUIDv7(), type: 'subtract', value: 3 },
      ],
    })

    expect(response.status).toBe(404)
    const data = await response.text()
    expect(data).toBe('Match not found')
  })

  it('rejects joining a match with 2 players already', async () => {
    const matchManager = new MatchManager()
    const { matchId } = matchManager.createMatch('Test Match', false, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    const client = testClient(createApp(matchManager))

    // Second player joins
    const firstResponse = await client.post(`/match/${matchId}/join`, {
      deck: [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '2&4' },
        { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
        { id: randomUUIDv7(), type: 'subtract', value: 3 },
      ],
    })

    expect(firstResponse.status).toBe(200)

    // Third player tries to join
    const response = await client.post(`/match/${matchId}/join`, {
      deck: [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '3&6' },
        { id: randomUUIDv7(), type: 'flip', value: 3, magnitude: 'add' },
        { id: randomUUIDv7(), type: 'subtract', value: 4 },
      ],
    })

    expect(response.status).toBe(409) // Conflict status for too many players
    const data = await response.text()
    expect(data).toBe('Match already has two players')
  })
})
