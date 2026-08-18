import { Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import IconButton from '@/components/IconButton'

interface WindowBoundsFieldsProps {
  width: string
  height: string
  x: string
  y: string
  onWidthChange: (value: string) => void
  onHeightChange: (value: string) => void
  onXChange: (value: string) => void
  onYChange: (value: string) => void
  onEnter: () => void
  gridClassName: string
  inputClassName: string
}

export default function WindowBoundsFields({
  width,
  height,
  x,
  y,
  onWidthChange,
  onHeightChange,
  onXChange,
  onYChange,
  onEnter,
  gridClassName,
  inputClassName
}: WindowBoundsFieldsProps) {
  const { copiedKey, copy } = useCopyToClipboard()

  const fields = [
    { label: 'Width', value: width, onChange: onWidthChange },
    { label: 'Height', value: height, onChange: onHeightChange },
    { label: 'X', value: x, onChange: onXChange },
    { label: 'Y', value: y, onChange: onYChange }
  ]

  return (
    <div className={gridClassName}>
      {fields.map((field) => (
        <label key={field.label} className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center justify-between gap-1">
            {field.label}
            <IconButton
              icon={copiedKey === field.label ? Check : Copy}
              label={`Copy ${field.label}`}
              onClick={() => copy(field.label, field.value)}
              disabled={!field.value.trim()}
              className="rounded p-0.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              iconClassName="h-2.5 w-2.5"
            />
          </span>
          <input
            type="number"
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onEnter()}
            placeholder={field.label}
            className={inputClassName}
          />
        </label>
      ))}
    </div>
  )
}
