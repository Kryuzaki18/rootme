export default function AppInstanceRowSkeleton() {
  return (
    <div className="flex shrink-0 animate-pulse items-center gap-10 rounded-lg border border-green-200 bg-white px-4 py-3 dark:border-green-800 dark:bg-green-900/30">
      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-14 rounded bg-green-200 dark:bg-green-800" />
        <div className="h-2 w-16 rounded bg-green-200 dark:bg-green-800" />
      </div>

      <div className="flex flex-1 items-center gap-2">
        <div className="h-7 w-7 shrink-0 rounded bg-green-200 dark:bg-green-800" />
        <div className="h-3 w-40 rounded bg-green-200 dark:bg-green-800" />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="h-7 w-7 rounded-full bg-green-200 dark:bg-green-800" />
        <div className="h-7 w-7 rounded-full bg-green-200 dark:bg-green-800" />
        <div className="h-7 w-7 rounded-full bg-green-200 dark:bg-green-800" />
      </div>
    </div>
  )
}
