import type { SessionMeta } from '@/hooks/useAppState.ts'
import type { AppStatus } from '@/hooks/useAppState.ts'
import { DarkModeToggle } from '@/components/DarkModeToggle.tsx'

type SessionHeaderProps = {
  meta: SessionMeta
  recordCount: number
  skippedLines: number
  status: AppStatus
  onStop: () => void
  onResume: () => void
  onReset: () => void
}

export function SessionHeader({
  meta,
  recordCount,
  skippedLines,
  status,
  onStop,
  onResume,
  onReset,
}: SessionHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {meta.fileName}
        </h1>
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {recordCount} records
          {status === 'loading' && (
            <span className="ml-1 inline-block animate-pulse">...</span>
          )}
        </span>
        {skippedLines > 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
            {skippedLines} skipped
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {status === 'loading' && (
          <button
            onClick={onStop}
            className="px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-600 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            Stop
          </button>
        )}
        {status === 'paused' && (
          <button
            onClick={onResume}
            className="px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            Resume
          </button>
        )}
        <button
          onClick={onReset}
          className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Load new file
        </button>
        <DarkModeToggle />
      </div>
    </header>
  )
}
