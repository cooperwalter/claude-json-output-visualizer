import type { RawRecord, ConversationTurn, ContentBlock } from './types.ts'

export function groupIntoTurns(records: RawRecord[]): ConversationTurn[] {
  const groupMap = new Map<string, RawRecord[]>()
  const groupOrder: string[] = []

  for (const record of records) {
    const key = record.type === 'assistant' ? record.message.id : record.uuid

    const existing = groupMap.get(key)
    if (existing) {
      existing.push(record)
    } else {
      groupMap.set(key, [record])
      groupOrder.push(key)
    }
  }

  return groupOrder.map((key) => {
    const group = groupMap.get(key)!
    const first = group[0]

    const contentBlocks: ContentBlock[] = []
    for (const rec of group) {
      if (rec.type === 'assistant') {
        contentBlocks.push(...rec.message.content)
      }
    }

    return {
      messageId: key,
      role: first.type === 'assistant' ? 'assistant' : 'user',
      records: group,
      contentBlocks,
      parentToolUseId: first.parent_tool_use_id,
      sessionId: first.session_id,
    } satisfies ConversationTurn
  })
}
