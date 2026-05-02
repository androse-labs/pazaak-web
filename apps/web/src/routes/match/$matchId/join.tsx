import { createFileRoute } from '@tanstack/react-router'
import { usePlayerStore } from '../../../stores/playerStore'
import { useDeckStore } from '../../../stores/deckStore'
import { joinMatch } from '../../../api'

export const Route = createFileRoute('/match/$matchId/join')({
  loader: async ({ params: { matchId } }) => {
    const userDeck = useDeckStore.getState().selectedDeck().cards
    const response = await joinMatch(matchId, userDeck)
    if (response.status !== 200) throw new Error('Failed to join match')
    const { playerId, token } = await response.json()
    usePlayerStore.getState().setMatchConnection({ matchId, playerId, token })

    throw Route.redirect({ to: `/match/${matchId}` })
  },
  component: JoinPage,
})

function JoinPage() {
  const { matchId } = Route.useParams()
  return (
    <div>
      <h1>Joining match {matchId}...</h1>
    </div>
  )
}
