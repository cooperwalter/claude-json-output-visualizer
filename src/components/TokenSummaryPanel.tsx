import type { RawRecord } from '@/model/types.ts'

type TokenSummaryPanelProps = {
  records: RawRecord[]
}

type AggregateUsage = {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  assistantTurns: number
  userTurns: number
  models: Set<string>
}

function computeAggregate(records: RawRecord[]): AggregateUsage {
  const agg: AggregateUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    assistantTurns: 0,
    userTurns: 0,
    models: new Set(),
  }

  for (const record of records) {
    if (record.type === 'assistant') {
      agg.assistantTurns++
      agg.models.add(record.message.model)
      const u = record.message.usage
      agg.inputTokens += u.input_tokens
      agg.outputTokens += u.output_tokens
      agg.cacheCreationTokens += u.cache_creation_input_tokens
      agg.cacheReadTokens += u.cache_read_input_tokens
    } else {
      agg.userTurns++
    }
  }

  return agg
}

export function TokenSummaryPanel({ records }: TokenSummaryPanelProps) {
  const agg = computeAggregate(records)

  const totalCacheRelated = agg.cacheReadTokens + agg.cacheCreationTokens + agg.inputTokens
  const cacheHitRate = totalCacheRelated > 0
    ? ((agg.cacheReadTokens / totalCacheRelated) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        <span>
          <span className="font-medium text-gray-700 dark:text-gray-300">Input:</span>{' '}
          {agg.inputTokens.toLocaleString()}
        </span>
        <span>
          <span className="font-medium text-gray-700 dark:text-gray-300">Output:</span>{' '}
          {agg.outputTokens.toLocaleString()}
        </span>
        <span>
          <span className="font-medium text-gray-700 dark:text-gray-300">Cache Create:</span>{' '}
          {agg.cacheCreationTokens.toLocaleString()}
        </span>
        <span>
          <span className="font-medium text-gray-700 dark:text-gray-300">Cache Read:</span>{' '}
          {agg.cacheReadTokens.toLocaleString()}
        </span>
        <span>
          <span className="font-medium text-gray-700 dark:text-gray-300">Cache Hit:</span>{' '}
          {cacheHitRate}%
        </span>
        <span>
          <span className="font-medium text-gray-700 dark:text-gray-300">Messages:</span>{' '}
          {agg.assistantTurns}A / {agg.userTurns}U
        </span>
        {agg.models.size > 0 && (
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Models:</span>{' '}
            {Array.from(agg.models).join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}
