import { Link, MessageCircleQuestion } from 'lucide-react'
import HowToPlay from '../content/how-to-play.mdx'
import { CardPresentation } from './game-elements/card/CardPresentation'
import { CopyButton } from './CopyButton'

export const HowToPlayDrawer = () => {
  return (
    <div className="drawer drawer-end">
      <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        <label
          className="btn btn-ghost text-base normal-case lg:text-xl"
          htmlFor="my-drawer-4"
        >
          <MessageCircleQuestion />
        </label>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer-4"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>

        <div className="prose bg-base-200 prose-sm dark:prose-invert md:w-124 md:prose-lg w-80 overflow-y-auto p-6 text-left">
          <HowToPlay components={{ CardPresentation, CopyButton, Link }} />
        </div>
      </div>
    </div>
  )
}
