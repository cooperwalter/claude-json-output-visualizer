import { useState, useMemo } from 'react'
import type { RawRecord, ConversationTurn, IndexMaps } from '@/model/types.ts'

type TokenSummaryPanelProps = {
  records: RawRecord[]
  visibleTurns?: ConversationTurn[]
  isFiltered?: boolean
  indexes?: IndexMaps
}

type AggregateUsage = {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  ephemeral5mTokens: number
  ephemeral1hTokens: number
  assistantTurns: number
  userTurns: number
  models: Set<string>
  serviceTiers: Set<string>
}

function computeAggregate(records: RawRecord[]): AggregateUsage {
  const agg: AggregateUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    ephemeral5mTokens: 0,
    ephemeral1hTokens: 0,
    assistantTurns: 0,
    userTurns: 0,
    models: new Set(),
    serviceTiers: new Set(),
  }

  const seenAssistantMessageIds = new Set<string>()
  const seenUserUuids = new Set<string>()

  for (const record of records) {
    if (record.type === 'assistant') {
      if (!seenAssistantMessageIds.has(record.message.id)) {
        seenAssistantMessageIds.add(record.message.id)
        agg.assistantTurns++
      }
      agg.models.add(record.message.model)
      const u = record.message.usage
      if (u.service_tier && u.service_tier !== 'standard') {
        agg.serviceTiers.add(u.service_tier)
      }
      agg.inputTokens += u.input_tokens
      agg.outputTokens += u.output_tokens
      agg.cacheCreationTokens += u.cache_creation_input_tokens
      agg.cacheReadTokens += u.cache_read_input_tokens
      if (u.cache_creation) {
        agg.ephemeral5mTokens += u.cache_creation.ephemeral_5m_input_tokens
        agg.ephemeral1hTokens += u.cache_creation.ephemeral_1h_input_tokens
      }
    } else {
      if (!seenUserUuids.has(record.uuid)) {
        seenUserUuids.add(record.uuid)
        agg.userTurns++
      }
    }
  }

  return agg
}

function collectSubAgentRecords(
  parentToolUseId: string,
  indexes: IndexMaps,
  seen: Set<string>,
  records: RawRecord[],
): void {
  const subRecords = indexes.byParentToolUseId.get(parentToolUseId)
  if (!subRecords) return
  for (const sr of subRecords) {
    if (seen.has(sr.uuid)) continue
    seen.add(sr.uuid)
    records.push(sr)
    if (sr.type === 'assistant') {
      for (const block of sr.message.content) {
        if (block.type === 'tool_use' && block.name === 'Task') {
          collectSubAgentRecords(block.id, indexes, seen, records)
        }
      }
    }
  }
}

function recordsFromTurns(turns: ConversationTurn[], indexes?: IndexMaps): RawRecord[] {
  const records: RawRecord[] = []
  const seen = new Set<string>()

  for (const turn of turns) {
    for (const record of turn.records) {
      if (!seen.has(record.uuid)) {
        seen.add(record.uuid)
        records.push(record)
      }
    }

    if (indexes) {
      for (const block of turn.contentBlocks) {
        if (block.type === 'tool_use' && block.name === 'Task') {
          collectSubAgentRecords(block.id, indexes, seen, records)
        }
      }
    }
  }
  return records
}

export function TokenSummaryPanel({ records, visibleTurns, isFiltered, indexes }: TokenSummaryPanelProps) {
  const [showDetails, setShowDetails] = useState(false)

  const filteredRecords = useMemo(() => {
    if (!isFiltered || !visibleTurns) return null
    return recordsFromTurns(visibleTurns, indexes)
  }, [isFiltered, visibleTurns, indexes])

  const displayRecords = filteredRecords ?? records
  const mainRecords = displayRecords.filter((r) => r.parent_tool_use_id === null)
  const subAgentRecords = displayRecords.filter((r) => r.parent_tool_use_id !== null)

  const total = computeAggregate(displayRecords)
  const main = computeAggregate(mainRecords)
  const subAgent = subAgentRecords.length > 0 ? computeAggregate(subAgentRecords) : null

  const totalCacheRelated = total.cacheReadTokens + total.cacheCreationTokens + total.inputTokens
  const cacheHitRate = totalCacheRelated > 0
    ? ((total.cacheReadTokens / totalCacheRelated) * 100).toFixed(1)
    : '0.0'

  const hasEphemeralTokens = total.ephemeral5mTokens > 0 || total.ephemeral1hTokens > 0

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          {isFiltered && filteredRecords && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Filtered
            </span>
          )}
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Input:</span>{' '}
            {total.inputTokens.toLocaleString()}
          </span>
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Output:</span>{' '}
            {total.outputTokens.toLocaleString()}
          </span>
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Cache Create:</span>{' '}
            {total.cacheCreationTokens.toLocaleString()}
          </span>
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Cache Read:</span>{' '}
            {total.cacheReadTokens.toLocaleString()}
          </span>
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Cache Hit:</span>{' '}
            {cacheHitRate}%
          </span>
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Messages:</span>{' '}
            {total.assistantTurns}A / {total.userTurns}U
          </span>
          {total.models.size > 0 && (
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Models:</span>{' '}
              {Array.from(total.models).join(', ')}
            </span>
          )}
          {total.serviceTiers.size > 0 && (
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Tier:</span>{' '}
              {Array.from(total.serviceTiers).join(', ')}
            </span>
          )}
          {(subAgent || hasEphemeralTokens) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              {showDetails ? 'Less' : 'More'}
            </button>
          )}
        </div>

        {showDetails && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2 text-xs text-gray-600 dark:text-gray-400">
            {subAgent && (
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
                <span className="font-medium text-gray-700 dark:text-gray-300 col-span-2">Main conversation:</span>
                <span className="pl-2">Input / Output:</span>
                <span>{main.inputTokens.toLocaleString()} / {main.outputTokens.toLocaleString()}</span>
                <span className="pl-2">Cache Create / Read:</span>
                <span>{main.cacheCreationTokens.toLocaleString()} / {main.cacheReadTokens.toLocaleString()}</span>
                <span className="pl-2">Messages:</span>
                <span>{main.assistantTurns}A / {main.userTurns}U</span>

                <span className="font-medium text-purple-700 dark:text-purple-300 col-span-2 mt-1">Sub-agents:</span>
                <span className="pl-2">Input / Output:</span>
                <span>{subAgent.inputTokens.toLocaleString()} / {subAgent.outputTokens.toLocaleString()}</span>
                <span className="pl-2">Cache Create / Read:</span>
                <span>{subAgent.cacheCreationTokens.toLocaleString()} / {subAgent.cacheReadTokens.toLocaleString()}</span>
                <span className="pl-2">Messages:</span>
                <span>{subAgent.assistantTurns}A / {subAgent.userTurns}U</span>
              </div>
            )}
            {hasEphemeralTokens && (
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
                <span className="font-medium text-gray-700 dark:text-gray-300 col-span-2">Ephemeral cache:</span>
                {total.ephemeral5mTokens > 0 && (
                  <>
                    <span className="pl-2">5-min ephemeral:</span>
                    <span>{total.ephemeral5mTokens.toLocaleString()}</span>
                  </>
                )}
                {total.ephemeral1hTokens > 0 && (
                  <>
                    <span className="pl-2">1-hour ephemeral:</span>
                    <span>{total.ephemeral1hTokens.toLocaleString()}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
