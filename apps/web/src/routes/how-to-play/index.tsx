import { createFileRoute, Link } from '@tanstack/react-router'
import HowToPlay from '../../content/how-to-play.mdx'
import { CardPresentation } from '../../components/game-elements/card/CardPresentation'
import { CopyButton } from '../../components/CopyButton'

export const Route = createFileRoute('/how-to-play/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="prose prose-lg dark:prose-invert mx-auto p-6 text-left">
      <HowToPlay components={{ CardPresentation, CopyButton, Link }} />
    </div>
  )
}
