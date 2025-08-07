import { describe, it, expect } from 'bun:test'
import { createApp } from '../../src'
import { testClient } from './helpers/axiosMimic'
import { randomUUIDv7 } from 'bun'
import { MatchManager } from '../../src/models/match-manager'

describe('Match List', () => {
  it('lists joinable matches', async () => {
    const matchManager = new MatchManager()

    const { matchId: matchId1 } = matchManager.createMatch(
      'Test Match',
      false,
      [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '2&4' },
        { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
        { id: randomUUIDv7(), type: 'subtract', value: 3 },
      ],
    )

    const { matchId: matchId2 } = matchManager.createMatch(
      'Other Test Match',
      false,
      [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '2&4' },
        { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
        { id: randomUUIDv7(), type: 'subtract', value: 3 },
      ],
    )

    const client = testClient(createApp(matchManager))

    const response = await client.get('/match/joinable')

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data).toEqual([
      {
        matchId: matchId1,
        matchName: 'Test Match',
      },
      {
        matchId: matchId2,
        matchName: 'Other Test Match',
      },
    ])
  })

  it('returns 204 when no matches are available', async () => {
    const matchManager = new MatchManager()

    const client = testClient(createApp(matchManager))

    const response = await client.get('/match/joinable')
    expect(response.status).toBe(204)
  })

  it('does not list matches that are full', async () => {
    const matchManager = new MatchManager()

    const { matchId } = matchManager.createMatch('Full Match', false, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    // Simulate joining the match to make it full
    matchManager.joinMatch(matchId, [
      { id: randomUUIDv7(), type: 'double', value: 'D' },
      { id: randomUUIDv7(), type: 'invert', value: '2&4' },
      { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
      { id: randomUUIDv7(), type: 'subtract', value: 3 },
    ])

    const { matchId: matchId2 } = matchManager.createMatch(
      'Another Match',
      false,
      [
        { id: randomUUIDv7(), type: 'double', value: 'D' },
        { id: randomUUIDv7(), type: 'invert', value: '2&4' },
        { id: randomUUIDv7(), type: 'flip', value: 2, magnitude: 'subtract' },
        { id: randomUUIDv7(), type: 'subtract', value: 3 },
      ],
    )

    const client = testClient(createApp(matchManager))

    const response = await client.get('/match/joinable')

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual([
      {
        matchId: matchId2,
        matchName: 'Another Match',
      },
    ])
  })
})
