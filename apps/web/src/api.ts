import type { Card } from '@pazaak-web/shared'
import { api } from './webClient'

export const joinMatch = (matchId: string, deck: Card[]) => {
  return api.post<{ playerId: string; token: string }>(
    `/match/${matchId}/join`,
    {
      deck: deck,
    },
  )
}

export const rematch = async (
  matchId: string,
  token: string,
  action: 'accept' | 'request',
) => {
  return api.patch(
    `/match/${matchId}/rematch`,
    {},
    {
      params: {
        token,
        action,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}
