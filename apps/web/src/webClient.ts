import ky from 'ky'

export const api = ky.create({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3012',
  headers: {
    'Content-Type': 'application/json',
  },
})
