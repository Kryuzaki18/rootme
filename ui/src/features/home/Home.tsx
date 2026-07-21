import { useState } from 'react'
import { Search, Loader2, MoveLeft } from 'lucide-react'
import { useAppInstancesStore } from '../../store/appInstancesStore'
import AppInstanceRow from './components/AppInstanceRow'
import AppInstanceRowSkeleton from './components/AppInstanceRowSkeleton'
import Presets from './components/Presets'
import { SKELETON_ROW_COUNT } from '../../constants/ui.constant'

export default function Home() {
  const [title, setTitle] = useState('')
  const { instances, isLoading, hasSearched, verify, clearSearch } = useAppInstancesStore()

  const handleVerify = () => {
    if (!title.trim() || isLoading) return
    verify(title.trim())
  }

  const handleClear = () => {
    setTitle('')
    clearSearch()
  }

  return (
    <main className="flex h-150 gap-10 p-5 pb-15">
      <Presets />

      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex shrink-0 gap-1">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleVerify()}
            placeholder="Enter app name (e.g. notepad)"
            className="flex-1 rounded-lg border border-green-300 bg-white px-4 py-2.5 text-sm text-green-950 placeholder:text-green-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-800 dark:bg-green-900/40 dark:text-green-50 dark:placeholder:text-green-500 dark:focus:ring-green-700"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={!title.trim() || isLoading}
            className="cursor-pointer flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-800 dark:hover:bg-green-700"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Verify
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!title.trim() && !hasSearched}
            className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-green-500 dark:hover:bg-green-900/30"
          >
            Clear
          </button>
        </div>

        {hasSearched && !isLoading && (
          <div className="flex shrink-0 items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <MoveLeft className="h-3 w-3 shrink-0" />
              Drag an item to Presets to save it
            </span>

            <p className="text-xs text-green-600 dark:text-green-400">
              {instances.length} {instances.length === 1 ? 'result' : 'results'} found
            </p>
          </div>
        )}

        <section className="app-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto pr-1">
          {hasSearched && !isLoading && instances.length === 0 && (
            <p className="rounded-lg border border-dashed border-green-300 px-4 py-6 text-center text-sm text-green-600 dark:border-green-800 dark:text-green-400">
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
