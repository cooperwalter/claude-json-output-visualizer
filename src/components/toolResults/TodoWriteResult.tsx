import type { ToolUseResultMeta, Todo } from '@/model/types.ts'

type TodoWriteResultProps = {
  meta?: ToolUseResultMeta
}

export function TodoWriteResult({ meta }: TodoWriteResultProps) {
  const oldTodos = meta?.oldTodos ?? []
  const newTodos = meta?.newTodos ?? []

  if (oldTodos.length === 0 && newTodos.length === 0) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        No todo data available
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Before</div>
        <TodoList todos={oldTodos} />
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">After</div>
        <TodoList todos={newTodos} />
      </div>
    </div>
  )
}

function TodoList({ todos }: { todos: Todo[] }) {
  if (todos.length === 0) {
    return <div className="text-xs text-gray-400 dark:text-gray-500">Empty</div>
  }

  return (
    <div className="space-y-1">
      {todos.map((todo, i) => (
        <div
          key={i}
          className={`text-xs px-2 py-1 rounded ${statusStyles(todo.status)}`}
        >
          <span className="font-medium">[{todo.status}]</span>{' '}
          <span>{todo.content}</span>
        </div>
      ))}
    </div>
  )
}

function statusStyles(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    case 'in_progress':
      return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
    case 'pending':
      return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    default:
      return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }
}
