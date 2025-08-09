import { createFileRoute } from '@tanstack/react-router'
import HowToPlay from '../../content/how-to-play.mdx'
import { Card } from '../../components/game-elements/Card'

export const Route = createFileRoute('/how-to-play/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="prose prose-lg dark:prose-invert mx-auto p-6 text-left">
      <HowToPlay components={{ Card }} />
    </div>
  )
}
