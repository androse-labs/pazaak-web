import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="navbar bg-base-300 flex w-full justify-between sm:justify-start">
          <Link
            to="/"
            className="btn btn-ghost text-base normal-case lg:text-xl"
          >
            Home
          </Link>
          <Link
            to="/deck-builder"
            className="btn btn-ghost text-base normal-case lg:text-xl"
          >
            Deck Builder
          </Link>
          <Link
            to="/how-to-play"
            className="btn btn-ghost text-base normal-case lg:text-xl"
          >
            How to Play
          </Link>
        </div>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  ),
})
