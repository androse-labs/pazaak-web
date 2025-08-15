import { type AppType } from '../../../src'

export function testClient(app: AppType) {
  const axiosLike = {
    get: (url: string, config?: RequestInit) =>
      app.request(url, {
        ...config,
        method: 'GET',
      }),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post: (url: string, data?: any, config?: RequestInit) =>
      app.request(url, {
        ...config,
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          ...(config?.headers || {}),
        },
      }),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    put: (url: string, data?: any, config?: RequestInit) =>
      app.request(url, {
        ...config,
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          ...(config?.headers || {}),
        },
      }),

    delete: (url: string, config?: RequestInit) =>
      app.request(url, {
        ...config,
        method: 'DELETE',
      }),
  }

  return axiosLike
}
