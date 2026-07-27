import { Clock, X } from 'lucide-react'
import type { RecentSearchEntry } from '@/store/appInstancesStore'
import IconButton from '@/components/IconButton'

interface RecentSearchesDropdownProps {
  entries: RecentSearchEntry[]
  onSelect: (term: string) => void
  onRemove: (term: string) => void
  onClearAll: () => void
}

export default function RecentSearchesDropdown({
  entries,
  onSelect,
  onRemove,
  onClearAll
}: RecentSearchesDropdownProps) {
  return (
    <ul className="absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded-lg border border-green-200 bg-white shadow-lg dark:border-green-800 dark:bg-green-950">
      <li className="flex items-center justify-between gap-2 border-b border-green-100 px-4 py-1.5 dark:border-green-800">
        <span className="text-[10px] font-semibold tracking-wide text-green-500 uppercase dark:text-green-500">
          Recent Searches
        </span>
        <button
          type="button"
          onClick={onClearAll}
          className="cursor-pointer text-[10px] font-medium text-green-600 hover:underline dark:text-green-400"
        >
          Clear Recent Searches
        </button>
      </li>
      {entries.map((entry) => (
        <li
          key={entry.term}
          className="flex items-center gap-1 px-2 py-1 transition hover:bg-green-50 dark:hover:bg-green-900/40"
        >
          <button
            type="button"
            onClick={() => onSelect(entry.term)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1 text-left"
          >
            <Clock className="h-3.5 w-3.5 shrink-0 text-green-500 dark:text-green-500" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-green-800 dark:text-green-200">
                {entry.term}
              </span>
              <span className="block truncate text-[10px] text-green-500 dark:text-green-500">
                {entry.appNames.length > 0 ? entry.appNames.join(', ') : 'No matching app'} ·{' '}
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </span>
          </button>
          <IconButton
            icon={X}
            label={`Remove ${entry.term} from recent searches`}
            onClick={() => onRemove(entry.term)}
            className="shrink-0 cursor-pointer rounded-full p-1 text-green-400 transition hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-800 dark:hover:text-green-200"
            iconClassName="h-3.5 w-3.5"
          />
        </li>
      ))}
    </ul>
  )
}
