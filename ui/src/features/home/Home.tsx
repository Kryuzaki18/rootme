import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useAppInstancesStore } from '../../store/appInstancesStore'
import AppInstanceRow from './components/AppInstanceRow'

export default function Home() {
  const [title, setTitle] = useState('')
  const { instances, isLoading, hasSearched, verify } = useAppInstancesStore()

  const handleVerify = () => {
    if (!title.trim() || isLoading) return
    verify(title.trim())
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex gap-3">
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
          className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Verify
        </button>
      </div>

      <section className="flex flex-col gap-3">
        {hasSearched && !isLoading && instances.length === 0 && (
          <p className="rounded-lg border border-dashed border-green-300 px-4 py-6 text-center text-sm text-green-600 dark:border-green-800 dark:text-green-400">
            No running instances match &ldquo;{title}&rdquo;.
          </p>
        )}

        {instances.map((instance) => (
          <AppInstanceRow key={instance.pid} instance={instance} />
        ))}
      </section>
    </main>
  )
}
