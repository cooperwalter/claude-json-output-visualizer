import type { RawRecord, ToolCallPair } from './types.ts'

export function pairToolCalls(records: RawRecord[]): ToolCallPair[] {
  const pairs = new Map<string, ToolCallPair>()
  const order: string[] = []

  for (const record of records) {
    if (record.type === 'assistant') {
      for (const block of record.message.content) {
        if (block.type === 'tool_use') {
          pairs.set(block.id, {
            toolUse: { id: block.id, name: block.name, input: block.input },
            toolResult: null,
          })
          order.push(block.id)
        }
      }
    }

    if (record.type === 'user') {
      for (const block of record.message.content) {
        const pair = pairs.get(block.tool_use_id)
        if (pair) {
          pair.toolResult = {
            content: block.content,
            isError: block.is_error ?? false,
            meta: record.tool_use_result,
          }
        }
      }
    }
  }

  return order.map((id) => pairs.get(id)!)
}
