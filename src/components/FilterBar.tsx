import { useState } from 'react'
import type { RoleFilter, StatusFilter, FilterState } from '@/hooks/useFilters.ts'

type FilterBarProps = {
  filters: FilterState
  availableToolNames: string[]
  availableModels: string[]
  onSetRole: (role: RoleFilter) => void
  onToggleToolName: (name: string) => void
  onSetStatus: (status: StatusFilter) => void
  onSetModel: (model: string) => void
  onClearFilters: () => void
  isActive: boolean
  totalTurns: number
  filteredTurns: number
}

export function FilterBar({
  filters,
  availableToolNames,
  availableModels,
  onSetRole,
  onToggleToolName,
  onSetStatus,
  onSetModel,
  onClearFilters,
  isActive,
  totalTurns,
  filteredTurns,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          aria-expanded={expanded}
          aria-controls="filter-panel"
        >
          {expanded ? '▼' : '▶'} Filters
        </button>
        {isActive && (
          <>
            <span className="text-xs text-blue-600 dark:text-blue-400" aria-live="polite">
              Showing {filteredTurns} of {totalTurns} turns
            </span>
            <button
              onClick={onClearFilters}
              className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              aria-label="Clear all filters"
            >
              Clear filters
            </button>
          </>
        )}
      </div>

      {expanded && (
        <div id="filter-panel" className="flex flex-wrap items-start gap-4 text-xs" role="group" aria-label="Conversation filters">
          <fieldset>
            <legend className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Role</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Filter by role">
              {(['all', 'assistant', 'user'] as RoleFilter[]).map((role) => (
                <button
                  key={role}
                  onClick={() => onSetRole(role)}
                  aria-pressed={filters.role === role}
                  className={`px-2 py-1 rounded border ${
                    filters.role === role
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Status</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Filter by status">
              {([
                { value: 'all', label: 'All' },
                { value: 'errors', label: 'Errors' },
                { value: 'subagent', label: 'Sub-agent' },
                { value: 'text', label: 'Text' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onSetStatus(value)}
                  aria-pressed={filters.status === value}
                  className={`px-2 py-1 rounded border ${
                    filters.status === value
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {availableToolNames.length > 0 && (
            <fieldset>
              <legend className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tools
              </legend>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by tool name">
                {availableToolNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => onToggleToolName(name)}
                    aria-pressed={filters.toolNames.has(name)}
                    className={`px-2 py-1 rounded border ${
                      filters.toolNames.has(name)
                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {availableModels.length > 1 && (
            <fieldset>
              <legend className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </legend>
              <select
                value={filters.model}
                onChange={(e) => onSetModel(e.target.value)}
                aria-label="Filter by model"
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <option value="">All models</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </fieldset>
          )}
        </div>
      )}
    </div>
  )
}
