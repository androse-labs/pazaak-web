import { useParams, useNavigate, createFileRoute } from '@tanstack/react-router'
import { usePlayerStore } from '../../../stores/playerStore'
import { useDeckStore } from '../../../stores/deckStore'
import { joinMatch } from '../../../api'

export const Route = createFileRoute('/match/$matchId/join')({
  component: MatchJoinPage,
  loader: async ({ params: { matchId } }) => {
    const userDeck = useDeckStore.getState().selectedDeck().cards
    const response = await joinMatch(matchId, userDeck)
    if (response.status !== 200) throw new Error('Failed to join match')
    const { playerId, token } = await response.json()
    usePlayerStore.getState().setMatchConnection({ matchId, playerId, token })
  },
})

export function MatchJoinPage() {
  const { matchId } = useParams({ from: '/match/$matchId/join' })
  const navigate = useNavigate()
  navigate({ to: `/match/${matchId}` })
  return null
}
