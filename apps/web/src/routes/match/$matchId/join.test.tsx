import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../mocks/server'
import { renderAtRoute } from '../../../test-utils'

describe('Match join page', () => {
  it('redirects to the match page on successful join', async () => {
    server.use(
      http.post('*/match/:matchId/join', () =>
        HttpResponse.json({ playerId: 'p1', token: 'tok' }),
      ),
    )

    const { router } = renderAtRoute('/match/match-123/join')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/match/match-123')
    })
  })

  it('shows an error message when join fails', async () => {
    server.use(
      http.post('*/match/:matchId/join', () =>
        HttpResponse.json({ message: 'Match is full' }, { status: 400 }),
      ),
    )

    renderAtRoute('/match/match-123/join')

    expect(
      await screen.findByText(
        /could not join match. please try again or go back to home./i,
      ),
    ).toBeInTheDocument()
  })

  it('provides a link back to home on error', async () => {
    server.use(http.post('*/match/:matchId/join', () => HttpResponse.error()))

    renderAtRoute('/match/match-123/join')

    const homeLink = await screen.findByRole('link', { name: /home/i })
    expect(homeLink).toBeInTheDocument()
  })
})
