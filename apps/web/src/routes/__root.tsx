import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="navbar bg-base-300">
          <Link to="/" className="btn btn-ghost text-xl normal-case">
            Home
          </Link>
          <Link
            to="/deck-builder"
            className="btn btn-ghost text-xl normal-case"
          >
            Deck Builder
          </Link>
        </div>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  ),
})
