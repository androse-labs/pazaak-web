import { OctagonMinus, OctagonX } from 'lucide-react'

export const StateDisplay = ({
  state,
}: {
  state: 'playing' | 'standing' | 'busted'
}) => {
  if (state === 'busted') {
    return (
      <span className="flex items-center gap-2 text-red-300">
        <OctagonX
          size={20}
          strokeWidth={3}
          className="inline-block align-middle leading-none"
        />
        <span className="align-middle text-2xl font-bold leading-none">
          Busted
        </span>
      </span>
    )
  }
  if (state === 'standing') {
    return (
      <span className="flex items-center gap-2 text-yellow-200">
        <OctagonMinus
          size={20}
          strokeWidth={3}
          className="inline-block align-middle leading-none"
        />
        <span className="align-middle text-2xl font-bold leading-none">
          Standing
        </span>
      </span>
    )
  }
  return null
}
