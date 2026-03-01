import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { render, type RenderOptions } from '@testing-library/react'
import React from 'react'
import { routeTree } from './routeTree.gen'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

/** Renders the full app router at the given URL. Use for route-level tests. */
export function renderAtRoute(initialUrl: string) {
  const queryClient = createTestQueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { queryClient, router }
}

/** Wraps a component with QueryClientProvider. Use for isolated component tests. */
export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  const queryClient = createTestQueryClient()

  return {
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options),
    queryClient,
  }
}
