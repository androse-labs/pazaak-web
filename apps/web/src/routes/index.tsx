import { createFileRoute } from '@tanstack/react-router'
import { RefreshCcw } from 'lucide-react'
import { Modal } from '../components/Modal'
import { api } from '../webClient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CardValue } from '../components/game-elements/types'
import { MatchList } from '../components/MatchList'

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

  return (
    <Modal id="join-match-modal">
      <h3 className="text-lg font-bold">Join Match</h3>

      <div className="flex w-full items-center justify-center gap-2">
        <div className="join w-full">
          <input
            type="text"
            placeholder="Enter a Match ID"
            className="input join-item input-bordered w-full"
          />
          <button className="btn btn-primary join-item">Join</button>
        </div>
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
          onJoin={() => {
            // tryJoinGame(id)
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
    mutationFn: async (data: { deck: CardValue[]; matchName: string }) => {
      const response = await api.post<CreateMatchResponse>(
        '/match/create',
        data,
      )
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
  const { mutate } = useCreateMatchMutation()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-24">
      <h1 className="font-mono text-6xl font-semibold uppercase">Pazaak-Web</h1>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            mutate({
              deck: [
                { type: 'double', value: 'D' },
                { type: 'flip', value: '2&4' },
                { type: 'invert', value: 2 },
                { type: 'subtract', value: 3 },
              ],
              matchName: 'Test Match',
            })
          }}
          className="btn btn-primary"
        >
          Create Match
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            const modal = document.getElementById('join-match-modal')
            if (modal instanceof HTMLDialogElement) {
              modal.showModal()
            }
          }}
        >
          Join Match
        </button>
        <JoinMatchModal />
      </div>
    </div>
  )
}
