import { http, HttpResponse, ws } from 'msw'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const matchServer = ws.link(`${API_URL}/match/:matchId/subscribe`)

export const handlers = [
  http.get(`${API_URL}/match/joinable`, () => {
    return HttpResponse.json([])
  }),
]
