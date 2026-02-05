import { useMemo } from 'react'
import { useAppState } from '@/hooks/useAppState.ts'
import { useStreamingParse } from '@/hooks/useStreamingParse.ts'
import { useRecentSessions } from '@/hooks/useRecentSessions.ts'
import { useSearch } from '@/hooks/useSearch.ts'
import { useFilters } from '@/hooks/useFilters.ts'
import { ConversationProvider } from '@/hooks/ConversationContext.tsx'
import { LandingPage } from '@/components/LandingPage.tsx'
import { SessionHeader } from '@/components/SessionHeader.tsx'
import { TokenSummaryPanel } from '@/components/TokenSummaryPanel.tsx'
import { SearchBar } from '@/components/SearchBar.tsx'
import { FilterBar } from '@/components/FilterBar.tsx'
import { ConversationTimeline } from '@/components/ConversationTimeline.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx'

function App() {
  const [state, dispatch] = useAppState()
  const { parseText, stop, resume, reset } = useStreamingParse(dispatch)
  const { sessions, addSession, clearHistory } = useRecentSessions()

  const search = useSearch(state.turns, state.indexes)
  const filterHook = useFilters(state.turns, state.indexes)

  const visibleTurns = useMemo(() => {
    let turns = filterHook.filteredTurns
    if (search.isActive) {
      turns = turns.filter((t) => search.matchingTurnIds.has(t.messageId))
    }
    return turns
  }, [filterHook.filteredTurns, search.isActive, search.matchingTurnIds])

  function handleFileLoaded(text: string, fileName: string, fileSize: number) {
    const lines = text.split('\n')
    const firstValid = lines.find((l) => {
      try {
        const parsed = JSON.parse(l.trim()) as Record<string, unknown>
        return typeof parsed.session_id === 'string'
      } catch {
        return false
      }
    })

    let sessionId = 'unknown'
    if (firstValid) {
      try {
        sessionId = (JSON.parse(firstValid.trim()) as Record<string, unknown>).session_id as string
      } catch {
        /* keep default */
      }
    }

    const loadedAt = new Date().toISOString()
    const meta = { fileName, fileSize, sessionId, loadedAt }

    parseText(text, meta).then((recordCount) => {
      addSession({
        fileName,
        fileSize,
        loadedAt,
        sessionId,
        recordCount,
      })
    }).catch(() => {
      /* errors already dispatched as LOAD_ERROR */
    })
  }

  if (state.status === 'empty') {
    return (
      <LandingPage
        recentSessions={sessions}
        onFileLoaded={handleFileLoaded}
        onClearHistory={clearHistory}
      />
    )
  }

  return (
    <ErrorBoundary>
    <ConversationProvider state={state} dispatch={dispatch}>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {state.sessionMeta && (
          <SessionHeader
            meta={state.sessionMeta}
            recordCount={state.records.length}
            skippedLines={state.skippedLines}
            status={state.status}
            onStop={stop}
            onResume={resume}
            onReset={reset}
          />
        )}

        <div className="sticky top-[41px] z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <TokenSummaryPanel
            records={state.records}
            visibleTurns={visibleTurns}
            isFiltered={filterHook.isActive || search.isActive}
            indexes={state.indexes}
          />

        <div className="px-4 py-2 space-y-2">
          <SearchBar
            query={search.query}
            onQueryChange={search.setQuery}
            matchCount={search.matchCount}
            currentMatchIndex={search.currentMatchIndex}
            onNextMatch={search.nextMatch}
            onPrevMatch={search.prevMatch}
            onClear={search.clearSearch}
            isActive={search.isActive}
          />
          <FilterBar
            filters={filterHook.filters}
            availableToolNames={filterHook.availableToolNames}
            availableModels={filterHook.availableModels}
            onSetRole={filterHook.setRole}
            onToggleToolName={filterHook.toggleToolName}
            onSetStatus={filterHook.setStatus}
            onSetModel={filterHook.setModel}
            onClearFilters={filterHook.clearFilters}
            isActive={filterHook.isActive || search.isActive}
            totalTurns={state.turns.length}
            filteredTurns={visibleTurns.length}
          />
        </div>
        </div>

        {state.error && (
          <div className="max-w-4xl mx-auto px-4 py-4" role="alert">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
              {state.error}
            </div>
          </div>
        )}

        <ErrorBoundary>
          <ConversationTimeline
            turns={visibleTurns}
            isStreaming={state.status === 'loading'}
            searchMatchIds={search.isActive ? search.matchingTurnIds : undefined}
            currentMatchId={search.currentMatchTurnId}
            searchQuery={search.isActive ? search.debouncedQuery : undefined}
            hasActiveFilters={filterHook.isActive || search.isActive}
            onClearFilters={() => { filterHook.clearFilters(); search.clearSearch(); }}
          />
        </ErrorBoundary>
      </main>
    </ConversationProvider>
    </ErrorBoundary>
  )
}

export default App
