import { useEffect, useState } from 'react'
import { useParams, useNavigate, createFileRoute } from '@tanstack/react-router'
import { usePlayerStore } from '../../../stores/playerStore'
import { useDeckStore } from '../../../stores/deckStore'
import { joinMatch } from '../../../api'

export const Route = createFileRoute('/match/$matchId/join')({
  component: MatchJoinPage,
})

export function MatchJoinPage() {
  const { matchId } = useParams({ from: '/match/$matchId/join' })
  const setMatchConnection = usePlayerStore((s) => s.setMatchConnection)
  const userDeck = useDeckStore((s) => s.deck)
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const doJoin = async () => {
    console.log('Joining match:', matchId, 'with deck:', userDeck)
    setLoading(true)
    setError(null)
    try {
      const response = await joinMatch(matchId, userDeck)
      if (response.status !== 200) {
        console.error('Failed to join match:', response.data)
        throw new Error('Failed to join match')
      }
      setMatchConnection({
        matchId,
        playerId: response.data.playerId,
        token: response.data.token,
      })
      navigate({ to: `/match/${matchId}` })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    doJoin()
    // Only run on mount or matchId/userDeck change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, userDeck])

  if (loading) return <div>Joining match...</div>
  if (error)
    return (
      <div>
        Error: {error}
        <button onClick={doJoin}>Retry</button>
      </div>
    )
  return null // Or redirect/spinner
}
