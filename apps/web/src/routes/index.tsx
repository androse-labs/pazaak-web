import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CirclePlus, Dices, DoorOpen, RefreshCcw } from 'lucide-react'
import { Modal } from '../components/Modal'
import { api } from '../webClient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Card } from '@pazaak-web/shared'
import { MatchList } from '../components/MatchList'
import { useState } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { useDeckStore } from '../stores/deckStore'
import { joinMatch } from '../api'
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator'

export const Route = createFileRoute('/')({
  component: Index,
})

type JoinableMatchesResponse = {
  matchId: string
  matchName: string
}[]

function useGetJoinableMatches() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['joinableMatches'],
    queryFn: async () => {
      const response = await api.get<JoinableMatchesResponse>('/match/joinable')
      if (response.status !== 200 && response.status !== 204) {
        throw new Error('Failed to fetch open matches')
      }

      return response.data
    },
  })

  return { data, isPending, error, refetch }
}

const JoinMatchModal = () => {
  const { data: matches, isPending, error, refetch } = useGetJoinableMatches()
  const setMatchConnection = usePlayerStore((s) => s.setMatchConnection)
  const navigate = useNavigate()
  const [matchId, setMatchId] = useState<string>('')
  const userDeck = useDeckStore((s) => s.selectedDeck().cards)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await joinMatch(matchId, userDeck)
    if (response.status !== 200) {
      throw new Error('Failed to join match')
    }

    setMatchConnection({
      matchId: matchId,
      playerId: response.data.playerId,
      token: response.data.token,
    })

    navigate({ to: `/match/${matchId}` })
  }

  return (
    <Modal id="join-match-modal">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <DoorOpen />
        Join Match
      </h3>

      <div className="flex w-full items-center justify-center gap-2">
        <form className="join w-full" onSubmit={handleSubmit}>
          <input
            type="text"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            placeholder="Enter a Match ID"
            className="input join-item input-bordered w-full"
          />
          <button className="btn btn-primary join-item" type="submit">
            Join
          </button>
        </form>
      </div>

      <div className="divider">or</div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Open Matches</h3>
          <button className="btn btn-square btn-sm" onClick={() => refetch()}>
            <RefreshCcw />
          </button>
        </div>

        <MatchList
          matches={matches ?? []}
          isLoading={isPending}
          error={error}
          onJoin={async () => {
            if (!matches || matches.length === 0) {
              return
            }
            const matchId = matches[0].matchId
            const response = await joinMatch(matchId, userDeck)

            if (response.status !== 200) {
              throw new Error('Failed to join match')
            }

            setMatchConnection({
              matchId,
              playerId: response.data.playerId,
              token: response.data.token,
            })

            navigate({ to: `/match/${matches?.[0]?.matchId}` })
          }}
        />
      </div>
    </Modal>
  )
}

type CreateMatchResponse = {
  matchId: string
  token: string
}

function useCreateMatchMutation() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    // deck does not need card id. exclude it from the type
    mutationFn: async (data: {
      deck: Card[]
      matchName: string
      unlisted: boolean
    }) => {
      // drop the id from each card in the deck
      const response = await api.post<CreateMatchResponse>('/match/create', {
        deck: data.deck,
        matchName: data.matchName,
        unlisted: data.unlisted,
      })
      if (response.status !== 200) {
        throw new Error('Failed to create match')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinableMatches'] })
    },
  })

  return { mutate, isPending, error }
}

function Index() {
  const { refetch } = useGetJoinableMatches()
  const { mutate } = useCreateMatchMutation()
  const userDeck = useDeckStore((s) => s.selectedDeck().cards)
  const [unlisted, setUnlisted] = useState<boolean>(true)
  const [matchName, setMatchName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const setMatchConnection = usePlayerStore((s) => s.setMatchConnection)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-24">
      <h1 className="font-mono text-5xl font-semibold uppercase md:text-6xl">
        Pazaak-Web
      </h1>
      <div className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (matchName.length < 5) {
              setError('Match name must be at least 5 characters long')
              return
            }
            mutate(
              {
                deck: userDeck,
                matchName: matchName,
                unlisted: unlisted,
              },
              {
                onSuccess: (data) => {
                  setMatchConnection({
                    matchId: data.matchId,
                    playerId: crypto.randomUUID(),
                    token: data.token,
                  })
                  navigate({ to: `/match/${data.matchId}` })
                },
              },
            )
          }}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Match Name"
              className="input input-bordered w-full"
              value={matchName}
              onChange={(e) => {
                setError(null)
                setMatchName(e.target.value)
              }}
            />
            <div className="tooltip" data-tip="Generate Random Name">
              <button
                type="button"
                className="btn btn-square btn-ghost"
                onClick={() => {
                  const randomName = uniqueNamesGenerator({
                    dictionaries: [adjectives, animals],
                    separator: ' ',
                    style: 'capital',
                    length: 2,
                  })
                  setMatchName(randomName)
                }}
              >
                <Dices />
              </button>
            </div>
            <label className="label">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={unlisted}
                onChange={(e) => {
                  setUnlisted(e.target.checked)
                }}
              />
              Unlisted
            </label>
          </div>
          {error && (
            <div className="text-error max-w-2xs shrink-0 break-words">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            <CirclePlus />
            Create Match
          </button>
        </form>
        <div className="divider">or</div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            const modal = document.getElementById('join-match-modal')
            if (modal instanceof HTMLDialogElement) {
              modal.showModal()
            }
            refetch()
          }}
        >
          <DoorOpen />
          Join Match
        </button>
        <JoinMatchModal />
      </div>
    </div>
  )
}
