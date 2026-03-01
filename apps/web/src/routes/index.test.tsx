import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '../mocks/server'
import { renderAtRoute } from '../test-utils'
import type { CreateMatchResponse, JoinableMatchesResponse } from '.'

// Matches the shape returned by GET /match/joinable
const mockMatches = [
  { matchId: 'match-1', matchName: 'Test Match' },
  { matchId: 'match-2', matchName: 'Another Match' },
]

describe('Home page', () => {
  it('shows the create match form', async () => {
    renderAtRoute('/')

    expect(
      await screen.findByRole('button', { name: /create/i }),
    ).toBeInTheDocument()
  })

  it('shows available matches when they exist', async () => {
    server.use(
      http.get('*/match/joinable', () =>
        HttpResponse.json<JoinableMatchesResponse>(mockMatches),
      ),
    )

    renderAtRoute('/')

    expect(await screen.findByText('Test Match')).toBeInTheDocument()
    expect(screen.getByText('Another Match')).toBeInTheDocument()
  })

  it('shows empty state when no matches are available', async () => {
    server.use(
      http.get('*/match/joinable', () =>
        HttpResponse.json<JoinableMatchesResponse>([]),
      ),
    )

    renderAtRoute('/')

    expect(await screen.findByText(/no matches available/i)).toBeInTheDocument()
  })

  it('shows error state when fetching matches fails', async () => {
    server.use(http.get('*/match/joinable', () => HttpResponse.error()))

    renderAtRoute('/')

    await waitFor(() => {
      expect(screen.getByText(/failed to load matches/i)).toBeInTheDocument()
    })
  })

  it('requires a minimum name length before creating a match', async () => {
    const user = userEvent.setup()
    renderAtRoute('/')

    const input = await screen.findByRole('textbox', {
      name: /match name/i,
    })
    const createBtn = screen.getByRole('button', { name: /create/i })

    await user.clear(input)
    await user.type(input, 'abc') // too short (< 5 chars)
    await user.click(createBtn)

    expect(
      screen.getByText(/match name must be at least 5 characters/i),
    ).toBeVisible()
  })

  it('calls POST /match/create and navigates on success', async () => {
    const postSpy = vi.fn()
    server.use(
      http.post('*/match/create', async () => {
        postSpy()
        return HttpResponse.json<CreateMatchResponse>({
          matchId: 'new-match-id',
          token: 'tok',
        })
      }),
      http.post('*/match/join', () =>
        HttpResponse.json({ playerId: 'p1', token: 'tok' }),
      ),
    )

    const user = userEvent.setup()
    const { router } = renderAtRoute('/')

    const input = await screen.findByRole('textbox', { name: /match name/i })
    await user.clear(input)
    await user.type(input, 'My Great Match')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalled()
      expect(router.state.location.pathname).toBe('/match/new-match-id')
    })
  })

  it('calls POST /match/join when joining a match and navigates on success', async () => {
    const postSpy = vi.fn()
    server.use(
      http.get('*/match/joinable', () =>
        HttpResponse.json<JoinableMatchesResponse>(mockMatches),
      ),
      http.post('*/match/match-1/join', () => {
        postSpy()
        return HttpResponse.json({ playerId: 'p1', token: 'tok' })
      }),
    )

    const user = userEvent.setup()
    const { router } = renderAtRoute('/')

    await user.click(
      await screen.findByRole('button', { name: /open join match modal/i }),
    )

    await user.clear(screen.getByRole('textbox', { name: /match id/i }))
    await user.type(
      screen.getByRole('textbox', { name: /match id/i }),
      'match-1',
    )
    await user.click(screen.getByRole('button', { name: /join match by id/i }))

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalled()
      expect(router.state.location.pathname).toBe('/match/match-1')
    })
  })
})
