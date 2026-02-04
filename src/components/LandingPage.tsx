import { useRef, useState } from 'react'
import type { RecentSession } from '@/model/types.ts'
import { handleDragOver, handleDrop, readFileAsText } from '@/utils/fileLoader.ts'

type LandingPageProps = {
  recentSessions: RecentSession[]
  onFileLoaded: (text: string, fileName: string, fileSize: number) => void
  onClearHistory: () => void
}

export function LandingPage({ recentSessions, onFileLoaded, onClearHistory }: LandingPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteContent, setPasteContent] = useState('')

  async function handleFile(file: File) {
    const text = await readFileAsText(file)
    onFileLoaded(text, file.name, file.size)
  }

  function handlePasteSubmit() {
    if (pasteContent.trim()) {
      onFileLoaded(pasteContent, 'pasted-content.jsonl', new Blob([pasteContent]).size)
      setShowPasteModal(false)
      setPasteContent('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Claude Code Conversation Visualizer
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Load a Claude Code JSONL output file to visualize the conversation
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            handleDragOver(e)
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            setIsDragging(false)
            handleDrop(e, handleFile)
          }}
        >
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">Drop a .jsonl file here or click to browse</p>
            <p className="mt-1 text-sm">Supports Claude Code conversation output files</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jsonl"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Paste JSONL
          </button>
        </div>

        {recentSessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recent Sessions
              </h2>
              <button
                onClick={onClearHistory}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                Clear history
              </button>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentSessions.map((session) => (
                <li
                  key={session.sessionId + session.loadedAt}
                  className="px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {session.fileName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                      {session.recordCount} records
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(session.loadedAt).toLocaleString()} &middot;{' '}
                    {formatFileSize(session.fileSize)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showPasteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Paste JSONL Content
              </h2>
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste JSONL content here..."
                className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPasteModal(false)
                    setPasteContent('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteContent.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Load
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
