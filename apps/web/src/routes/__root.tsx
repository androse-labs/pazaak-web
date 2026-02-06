import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { HowToPlayDrawer } from '../components/HowToPlayDrawer'
import { SettingsMenu } from '../components/SettingsMenu'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  ),
})

const NavBar = () => {
  const location = useLocation()
  const pathname = location.pathname
  const showHelpIcon = pathname.startsWith('/match')

  return (
    <div className="navbar bg-base-300 flex w-full items-center">
      <Link
        to="/"
        className="btn btn-ghost grow-0 text-base normal-case lg:text-xl"
      >
        Home
      </Link>
      <Link
        to="/decks"
        className="btn btn-ghost grow-0 text-base normal-case lg:text-xl"
      >
        Decks
      </Link>
      {showHelpIcon ? null : (
        <Link
          to="/how-to-play"
          className="btn btn-ghost grow-0 text-base normal-case lg:text-xl"
        >
          How to Play
        </Link>
      )}
      <div className="grow"></div>
      {showHelpIcon && (
        <div className="flex-none">
          <HowToPlayDrawer />
        </div>
      )}
      <div className="flex-none">
        <SettingsMenu />
      </div>
    </div>
  )
}
