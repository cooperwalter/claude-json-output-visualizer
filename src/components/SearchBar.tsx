import { useRef, useEffect, useCallback } from 'react'

type SearchBarProps = {
  query: string
  onQueryChange: (value: string) => void
  matchCount: number
  currentMatchIndex: number
  onNextMatch: () => void
  onPrevMatch: () => void
  onClear: () => void
  isActive: boolean
}

export function SearchBar({
  query,
  onQueryChange,
  matchCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  onClear,
  isActive,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'f')) && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && isActive) {
        onClear()
        inputRef.current?.blur()
      }
    },
    [isActive, onClear],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex items-center gap-2" role="search" aria-label="Conversation search">
      <div className="relative flex-1 max-w-md">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onNextMatch()
            }
            if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault()
              onPrevMatch()
            }
          }}
          placeholder="Search messages... (/ or Ctrl+F)"
          aria-label="Search conversation messages"
          aria-describedby={isActive ? 'search-match-count' : undefined}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isActive && (
          <span id="search-match-count" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
            {matchCount > 0 ? `${currentMatchIndex + 1} of ${matchCount}` : 'No matches'}
          </span>
        )}
      </div>
      {isActive && (
        <>
          <button
            onClick={onPrevMatch}
            className="p-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded"
            title="Previous match (Shift+Enter)"
            aria-label="Previous match"
          >
            &#x25B2;
          </button>
          <button
            onClick={onNextMatch}
            className="p-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded"
            title="Next match (Enter)"
            aria-label="Next match"
          >
            &#x25BC;
          </button>
          <button
            onClick={onClear}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            aria-label="Clear search"
          >
            Clear
          </button>
        </>
      )}
    </div>
  )
}
