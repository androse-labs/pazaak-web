import { describe, it, expect } from 'bun:test'
import { createApp } from '../../src'
import { testClient } from './helpers/axiosMimic'
import { randomUUIDv7 } from 'bun'
import { MatchManager } from '../../src/models/match-manager'

describe('Match Creation', () => {
  const client = testClient(createApp(new MatchManager()))

  it('creates a match successfully', async () => {
    const matchManager = new MatchManager()

    const client = testClient(createApp(matchManager))

    const response = await client.post('/match/create', {
      deck: [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '2&4' },
        { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
        { id: randomUUIDv7(), type: 'subtract', value: 3 },
      ],
      unlisted: false,
      matchName: 'Test Match',
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    // spread to workaround Bun's issue with expect.any
    expect({ ...data }).toMatchObject({
      matchId: expect.any(String),
      playerId: expect.any(String),
      token: expect.any(String),
    })

    expect(matchManager.getMatch(data.matchId)).toBeDefined()
    expect(matchManager.getMatch(data.matchId)!.matchName).toBe('Test Match')
  })

  it('rejects match creation with invalid deck', async () => {
    const response = await client.post('/match/create', {
      deck: [
        { id: randomUUIDv7(), type: 'invert', value: 'X' }, // Invalid card type
      ],
      matchName: 'Invalid Match',
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})
