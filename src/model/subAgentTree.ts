import type { RawRecord, SubAgentNode } from './types.ts'

export function buildSubAgentTree(records: RawRecord[]): SubAgentNode[] {
  const childMap = new Map<string, RawRecord[]>()

  for (const record of records) {
    if (record.parent_tool_use_id !== null) {
      const pid = record.parent_tool_use_id
      const existing = childMap.get(pid)
      if (existing) {
        existing.push(record)
      } else {
        childMap.set(pid, [record])
      }
    }
  }

  const rootToolUseIds = new Set<string>()
  for (const record of records) {
    if (record.type === 'assistant' && record.parent_tool_use_id === null) {
      for (const block of record.message.content) {
        if (block.type === 'tool_use' && childMap.has(block.id)) {
          rootToolUseIds.add(block.id)
        }
      }
    }
  }

  function buildNode(parentToolUseId: string): SubAgentNode {
    const nodeRecords = childMap.get(parentToolUseId) ?? []

    const childToolUseIds: string[] = []
    for (const record of nodeRecords) {
      if (record.type === 'assistant') {
        for (const block of record.message.content) {
          if (block.type === 'tool_use' && childMap.has(block.id)) {
            childToolUseIds.push(block.id)
          }
        }
      }
    }

    return {
      parentToolUseId,
      records: nodeRecords,
      children: childToolUseIds.map(buildNode),
    }
  }

  return Array.from(rootToolUseIds).map(buildNode)
}
