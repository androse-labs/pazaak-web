import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, ws } from 'msw'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { server } from '../../../mocks/server'
import { renderAtRoute } from '../../../test-utils'
import { usePlayerStore } from '../../../stores/playerStore'
import type { PazaakSocketEvent } from '@pazaak-web/shared/src/web-socket-types'

beforeEach(() => {
  usePlayerStore.setState({
    matchConnection: {
      matchId: 'match-123',
      playerId: 'player-1',
      token: 'test-token',
    },
  })
})

const matchServer = ws.link('*/match/:matchId/subscribe')

describe('Match page', () => {
  it('shows the waiting lobby before the game starts', async () => {
    server.use(
      matchServer.addEventListener('connection', ({ client }) => {
        client.send(
          JSON.stringify({
            type: 'gameStateUpdate',
            matchName: 'Test Match',
            games: [
              {
                boards: {
                  yourBoard: { cards: [], total: 0 },
                  opponentBoard: { cards: [], total: 0 },
                },
                turn: 0,
                winner: null,
              },
            ],
            opponentConnected: false,
            yourHand: [],
            yourState: 'playing',
            opponentState: 'playing',
            opponentHandSize: 0,
            yourTurn: false,
            round: 0,
            score: {
              yourScore: 0,
              opponentScore: 0,
            },
          } satisfies PazaakSocketEvent),
        )
      }),
    )

    renderAtRoute('/match/match-123')

    await waitFor(() => {
      expect(screen.queryByText(/waiting/i)).not.toBeNull()
    })
  })

  it('shows the game board when a game-state event is received', async () => {
    server.use(
      matchServer.addEventListener('connection', ({ client }) => {
        client.send(
          JSON.stringify({
            type: 'gameStateUpdate',
            matchName: 'Test Match',
            games: [
              {
                boards: {
                  yourBoard: {
                    cards: [{ id: 'none-1', value: 5, type: 'none' }],
                    total: 5,
                  },
                  opponentBoard: {
                    cards: [{ id: 'none-2', value: 3, type: 'none' }],
                    total: 3,
                  },
                },
                turn: 0,
                winner: null,
              },
            ],
            opponentConnected: true,
            yourHand: [
              { id: 'card-1', type: 'add', value: 2 },
              { id: 'card-2', type: 'subtract', value: 1 },
              { id: 'card-3', type: 'flip', value: 1, magnitude: 'add' },
              { id: 'card-4', type: 'double', value: 'D' },
            ],
            yourState: 'playing',
            opponentState: 'playing',
            opponentHandSize: 4,
            yourTurn: true,
            round: 1,
            score: {
              yourScore: 0,
              opponentScore: 0,
            },
          } satisfies PazaakSocketEvent),
        )
      }),
    )

    renderAtRoute('/match/match-123')

    await waitFor(() => {
      expect(screen.getByLabelText(/your-board/i)).not.toBeNull()
      expect(screen.getByLabelText(/opponent-board/i)).not.toBeNull()
    })
  })

  it('calls PATCH /match/:id/action when the player ends their turn', async () => {
    const patchSpy = vi.fn()
    server.use(
      matchServer.addEventListener('connection', ({ client }) => {
        client.send(
          JSON.stringify({
            type: 'gameStateUpdate',
            matchName: 'Test Match',
            games: [
              {
                boards: {
                  yourBoard: { cards: [], total: 0 },
                  opponentBoard: { cards: [], total: 0 },
                },
                turn: 0,
                winner: null,
              },
            ],
            opponentConnected: true,
            yourHand: [],
            yourState: 'playing',
            opponentState: 'playing',
            opponentHandSize: 0,
            yourTurn: true,
            round: 1,
            score: { yourScore: 0, opponentScore: 0 },
          } satisfies PazaakSocketEvent),
        )
      }),
    )
    server.use(
      http.patch('*/match/:matchId/action', async () => {
        patchSpy()
        return HttpResponse.json({})
      }),
    )

    renderAtRoute('/match/match-123')

    await screen.findByRole('button', { name: /end turn/i })
    const endTurnButton = screen.getByRole('button', { name: /end turn/i })
    expect(endTurnButton).not.toBeDisabled()
    await userEvent.click(endTurnButton)

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('shows a win notification when the player wins', async () => {
    server.use(
      matchServer.addEventListener('connection', ({ client }) => {
        client.send(
          JSON.stringify({
            type: 'gameStateUpdate',
            matchName: 'Test Match',
            games: [
              {
                boards: {
                  yourBoard: { cards: [], total: 0 },
                  opponentBoard: { cards: [], total: 0 },
                },
                turn: 0,
                winner: null,
              },
            ],
            opponentConnected: true,
            yourHand: [],
            yourState: 'playing',
            opponentState: 'playing',
            opponentHandSize: 0,
            yourTurn: false,
            round: 1,
            score: { yourScore: 2, opponentScore: 0 },
          } satisfies PazaakSocketEvent),
        )
        client.send(
          JSON.stringify({
            type: 'matchComplete',
            youWon: true,
          } satisfies PazaakSocketEvent),
        )
      }),
    )

    renderAtRoute('/match/match-123')

    await waitFor(() => {
      expect(screen.getByText(/won!/i)).toBeInTheDocument()
    })
  })

  it('shows a rematch prompt when the game ends', async () => {
    server.use(
      http.patch('*/match/:matchId/rematch', () => HttpResponse.json({})),
      matchServer.addEventListener('connection', ({ client }) => {
        client.send(
          JSON.stringify({
            type: 'gameStateUpdate',
            matchName: 'Test Match',
            games: [
              {
                boards: {
                  yourBoard: { cards: [], total: 0 },
                  opponentBoard: { cards: [], total: 0 },
                },
                turn: 0,
                winner: null,
              },
            ],
            opponentConnected: true,
            yourHand: [],
            yourState: 'playing',
            opponentState: 'playing',
            opponentHandSize: 0,
            yourTurn: false,
            round: 1,
            score: { yourScore: 0, opponentScore: 2 },
          } satisfies PazaakSocketEvent),
        )
        client.send(
          JSON.stringify({
            type: 'matchComplete',
            youWon: false,
          } satisfies PazaakSocketEvent),
        )
      }),
    )

    renderAtRoute('/match/match-123')

    const rematchButton = await screen.findByText(/request rematch/i)
    expect(rematchButton).toBeInTheDocument()
    fireEvent.click(rematchButton)

    await waitFor(() => {
      expect(screen.getByText(/waiting for opponent to accept rematch/i)).toBeInTheDocument()
    })
  })
})
