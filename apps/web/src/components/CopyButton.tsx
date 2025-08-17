import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import clsx from 'clsx'

type CopyButtonProps = {
  value: string
  tooltip?: string
  copiedTooltip?: string
  tooltipClassName?: string
  className?: string
  iconSize?: number
}

export const CopyButton = ({
  value,
  tooltip = 'Copy to clipboard',
  copiedTooltip = 'Copied!',
  className = '',
  tooltipClassName = '',
}: CopyButtonProps) => {
  const [showCopied, setShowCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 1500)
  }

  return (
    <div
      className={clsx('tooltip tooltip-bottom', tooltipClassName)}
      data-tip={showCopied ? copiedTooltip : tooltip}
    >
      <button
        className={clsx('btn btn-secondary btn-square', className)}
        onClick={handleCopy}
        type="button"
      >
        {showCopied ? <Check /> : <Copy />}
      </button>
    </div>
  )
}
