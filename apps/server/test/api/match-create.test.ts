import { describe, it, expect } from 'bun:test'
import { testClient } from './helpers/axiosMimic'
import { randomUUIDv7 } from 'bun'
import { MatchManager } from '../../src/models/match-manager'
import { createApp } from '../../src/app'

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
      matchType: 'standard',
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
    expect(matchManager.getMatch(data.matchId)!.matchType).toBe('standard')
  })

  it('creates an exotic match successfully', async () => {
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
      matchName: 'Exotic Match',
      matchType: 'exotic',
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    expect({ ...data }).toMatchObject({
      matchId: expect.any(String),
      playerId: expect.any(String),
      token: expect.any(String),
    })

    const match = matchManager.getMatch(data.matchId)
    expect(match).toBeDefined()
    expect(match!.matchName).toBe('Exotic Match')
    expect(match!.matchType).toBe('exotic')
  })

  it('defaults to standard match type when not specified', async () => {
    const matchManager = new MatchManager()

    const client = testClient(createApp(matchManager))

    const response = await client.post('/match/create', {
      deck: [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
      ],
      unlisted: false,
      matchName: 'Default Match',
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    const match = matchManager.getMatch(data.matchId)
    expect(match).toBeDefined()
    expect(match!.matchType).toBe('standard')
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
