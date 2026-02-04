import type { RawRecord, IndexMaps, ToolCallPair } from './types.ts'

export function buildIndexes(records: RawRecord[]): IndexMaps {
  const byUuid = new Map<string, RawRecord>()
  const byMessageId = new Map<string, RawRecord[]>()
  const byToolUseId = new Map<string, ToolCallPair>()
  const byParentToolUseId = new Map<string, RawRecord[]>()

  for (const record of records) {
    byUuid.set(record.uuid, record)

    if (record.type === 'assistant') {
      const msgId = record.message.id
      const existing = byMessageId.get(msgId)
      if (existing) {
        existing.push(record)
      } else {
        byMessageId.set(msgId, [record])
      }

      for (const block of record.message.content) {
        if (block.type === 'tool_use') {
          byToolUseId.set(block.id, {
            toolUse: { id: block.id, name: block.name, input: block.input },
            toolResult: null,
          })
        }
      }
    }

    if (record.type === 'user') {
      for (const block of record.message.content) {
        const pair = byToolUseId.get(block.tool_use_id)
        if (pair) {
          pair.toolResult = {
            content: block.content,
            isError: block.is_error ?? false,
            meta: record.tool_use_result,
          }
        }
      }

      const msgKey = record.uuid
      const existing = byMessageId.get(msgKey)
      if (existing) {
        existing.push(record)
      } else {
        byMessageId.set(msgKey, [record])
      }
    }

    if (record.parent_tool_use_id !== null) {
      const pid = record.parent_tool_use_id
      const existing = byParentToolUseId.get(pid)
      if (existing) {
        existing.push(record)
      } else {
        byParentToolUseId.set(pid, [record])
      }
    }
  }

  return { byUuid, byMessageId, byToolUseId, byParentToolUseId }
}
