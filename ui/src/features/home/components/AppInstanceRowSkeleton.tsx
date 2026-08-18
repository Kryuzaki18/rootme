export default function AppInstanceRowSkeleton() {
  return (
    <div className="flex shrink-0 animate-pulse items-center gap-10 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-2 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="flex flex-1 items-center gap-2">
        <div className="h-7 w-7 shrink-0 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}
