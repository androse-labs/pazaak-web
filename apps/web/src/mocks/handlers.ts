import { http, HttpResponse } from 'msw'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const handlers = [
  http.get(`${API_URL}/match/joinable`, () => {
    return HttpResponse.json([])
  }),
]
