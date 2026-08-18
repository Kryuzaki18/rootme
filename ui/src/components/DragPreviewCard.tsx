import AppAvatar from '@/components/AppAvatar'

interface DragPreviewCardProps {
  iconDataUrl?: string
  title: string
}

export default function DragPreviewCard({ iconDataUrl, title }: DragPreviewCardProps) {
  return (
    <div className="flex max-w-60 items-center gap-1.5 rounded-lg border border-red-300 bg-white p-1.5 shadow-xl shadow-zinc-950/20 dark:border-red-500/50 dark:bg-zinc-900">
      <AppAvatar iconDataUrl={iconDataUrl} label={title} size="sm" />
      <span className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-50">{title}</span>
    </div>
  )
}
