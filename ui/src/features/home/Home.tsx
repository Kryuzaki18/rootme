import { useState } from 'react'
import { Search, Loader2, MoveLeft, X } from 'lucide-react'
import { useAppInstancesStore } from '@/store/appInstancesStore'
import { SKELETON_ROW_COUNT } from '@/constants/ui.constant'
import IconButton from '@/components/IconButton'
import AppInstanceRow from './components/AppInstanceRow'
import AppInstanceRowSkeleton from './components/AppInstanceRowSkeleton'
import Presets from './components/Presets'
import RecentSearchesDropdown from './components/RecentSearchesDropdown'

export default function Home() {
  const [title, setTitle] = useState('')
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const {
    instances,
    isLoading,
    hasSearched,
    recentSearches,
    verify,
    clearSearch,
    clearRecentSearches,
    removeRecentSearch
  } = useAppInstancesStore()

  const handleVerify = (term: string = title) => {
    if (!term.trim() || isLoading) return
    setShowRecentSearches(false)
    verify(term.trim())
  }

  const handleClear = () => {
    setTitle('')
    clearSearch()
  }

  const handleRecentSearchSelect = (term: string) => {
    setTitle(term)
    handleVerify(term)
  }

  return (
    <main className="flex h-150 gap-10 p-5 pb-15">
      <Presets />

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="relative flex shrink-0 gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleVerify()}
              onFocus={() => setShowRecentSearches(true)}
              onBlur={() => setTimeout(() => setShowRecentSearches(false), 150)}
              placeholder="Enter app name (e.g. notepad)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-red-900/50"
            />

            {(title.trim() || hasSearched) && (
              <IconButton
                icon={X}
                label="Clear"
                onClick={handleClear}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-1.5 text-zinc-400 transition-all duration-150 hover:bg-red-50 hover:text-red-600 active:scale-90 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                iconClassName="h-4 w-4"
              />
            )}

            {showRecentSearches && recentSearches.length > 0 && (
              <RecentSearchesDropdown
                entries={recentSearches}
                onSelect={handleRecentSearchSelect}
                onRemove={removeRecentSearch}
                onClearAll={clearRecentSearches}
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={!title.trim() || isLoading}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-red-600/20 transition-all duration-150 hover:bg-red-700 hover:shadow-red-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:bg-red-600 dark:hover:bg-red-500"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Verify
          </button>
        </div>

        {hasSearched && !isLoading && (
          <div className="flex shrink-0 items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
              <MoveLeft className="h-3 w-3 shrink-0" />
              Drag an item to Presets to save it
            </span>

            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {instances.length} {instances.length === 1 ? 'result' : 'results'} found
            </p>
          </div>
        )}

        <section className="app-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto pr-1">
          {hasSearched && !isLoading && instances.length === 0 && (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No running instances match &ldquo;{title}&rdquo;.
            </p>
          )}

          {isLoading
            ? Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => <AppInstanceRowSkeleton key={index} />)
            : instances.map((instance) => <AppInstanceRow key={instance.pid} instance={instance} />)}
        </section>
      </div>
    </main>
  )
}
