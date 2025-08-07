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
