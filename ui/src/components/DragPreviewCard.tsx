import AppAvatar from '@/components/AppAvatar'

interface DragPreviewCardProps {
  iconDataUrl?: string
  title: string
}

export default function DragPreviewCard({ iconDataUrl, title }: DragPreviewCardProps) {
  return (
    <div className="flex max-w-60 items-center gap-1.5 rounded-lg border border-green-300 bg-white p-1.5 shadow-xl dark:border-green-600 dark:bg-green-900">
      <AppAvatar iconDataUrl={iconDataUrl} label={title} size="sm" />
      <span className="truncate text-xs font-medium text-green-950 dark:text-green-50">{title}</span>
    </div>
  )
}
