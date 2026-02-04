import { useAppState } from '@/hooks/useAppState.ts'
import { useStreamingParse } from '@/hooks/useStreamingParse.ts'
import { useRecentSessions } from '@/hooks/useRecentSessions.ts'
import { ConversationProvider } from '@/hooks/ConversationContext.tsx'
import { LandingPage } from '@/components/LandingPage.tsx'
import { SessionHeader } from '@/components/SessionHeader.tsx'
import { ConversationTimeline } from '@/components/ConversationTimeline.tsx'

function App() {
  const [state, dispatch] = useAppState()
  const { parseText, stop, resume, reset } = useStreamingParse(dispatch)
  const { sessions, addSession, clearHistory } = useRecentSessions()

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

    const meta = { fileName, fileSize, sessionId }

    parseText(text, meta).then(() => {
      addSession({
        fileName,
        fileSize,
        loadedAt: new Date().toISOString(),
        sessionId,
        recordCount: state.records.length,
      })
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
    <ConversationProvider state={state} dispatch={dispatch}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

        {state.error && (
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
              {state.error}
            </div>
          </div>
        )}

        <ConversationTimeline
          turns={state.turns}
          isStreaming={state.status === 'loading'}
        />
      </div>
    </ConversationProvider>
  )
}

export default App
