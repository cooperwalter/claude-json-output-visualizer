import type { ToolUseResultMeta, Todo } from '@/model/types.ts'
import { HighlightedText } from '@/components/TurnCard.tsx'

type TodoWriteResultProps = {
  meta?: ToolUseResultMeta
  searchQuery?: string
}

type DiffEntry = {
  todo: Todo
  change: 'added' | 'removed' | 'status_changed' | 'unchanged'
  oldStatus?: string
}

function diffTodos(oldTodos: Todo[], newTodos: Todo[]): DiffEntry[] {
  const oldMap = new Map<string, Todo>()
  for (const t of oldTodos) {
    oldMap.set(t.content, t)
  }

  const newMap = new Map<string, Todo>()
  for (const t of newTodos) {
    newMap.set(t.content, t)
  }

  const entries: DiffEntry[] = []

  for (const t of oldTodos) {
    if (!newMap.has(t.content)) {
      entries.push({ todo: t, change: 'removed' })
    }
  }

  for (const t of newTodos) {
    const old = oldMap.get(t.content)
    if (!old) {
      entries.push({ todo: t, change: 'added' })
    } else if (old.status !== t.status) {
      entries.push({ todo: t, change: 'status_changed', oldStatus: old.status })
    } else {
      entries.push({ todo: t, change: 'unchanged' })
    }
  }

  return entries
}

export function TodoWriteResult({ meta, searchQuery }: TodoWriteResultProps) {
  const oldTodos = meta?.oldTodos ?? []
  const newTodos = meta?.newTodos ?? []

  if (oldTodos.length === 0 && newTodos.length === 0) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        No todo data available
      </div>
    )
  }

  const diff = diffTodos(oldTodos, newTodos)

  return (
    <div className="space-y-1">
      {diff.map((entry, i) => (
        <div
          key={i}
          className={`text-xs px-2 py-1 rounded flex items-center gap-2 ${diffStyles(entry.change)}`}
        >
          <span className="shrink-0">{diffIcon(entry.change)}</span>
          <span className="font-medium shrink-0">[{entry.todo.status}]</span>
          <span className="truncate">
            {searchQuery
              ? <HighlightedText text={entry.todo.content} query={searchQuery} />
              : entry.todo.content}
          </span>
          {entry.change === 'status_changed' && entry.oldStatus && (
            <span className="shrink-0 text-amber-600 dark:text-amber-400">
              (was: {entry.oldStatus})
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function diffStyles(change: DiffEntry['change']): string {
  switch (change) {
    case 'added':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-l-2 border-green-500'
    case 'removed':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-l-2 border-red-500 line-through'
    case 'status_changed':
      return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-l-2 border-amber-500'
    case 'unchanged':
      return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }
}

function diffIcon(change: DiffEntry['change']): string {
  switch (change) {
    case 'added': return '+'
    case 'removed': return '-'
    case 'status_changed': return '~'
    case 'unchanged': return ' '
  }
}
