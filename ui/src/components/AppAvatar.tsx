import { initials } from '@/util'

interface AppAvatarProps {
  iconDataUrl?: string
  label: string
  size?: 'sm' | 'md'
}

const SIZE_CLASSES: Record<'sm' | 'md', { box: string; text: string }> = {
  sm: { box: 'h-6 w-6', text: 'text-[10px]' },
  md: { box: 'h-7 w-7', text: 'text-xs' }
}

export default function AppAvatar({ iconDataUrl, label, size = 'md' }: AppAvatarProps) {
  const { box, text } = SIZE_CLASSES[size]

  if (iconDataUrl) {
    return <img src={iconDataUrl} alt="" className={`shrink-0 rounded object-cover ${box}`} />
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded bg-green-100 font-semibold text-green-700 dark:bg-green-800 dark:text-green-200 ${box} ${text}`}
    >
      {initials(label)}
    </span>
  )
}
