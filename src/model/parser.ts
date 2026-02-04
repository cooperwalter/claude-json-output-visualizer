import type { RawRecord } from './types.ts'

export function parseLine(line: string): RawRecord | null {
  const trimmed = line.trim()
  if (trimmed === '') return null

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null

  const record = parsed as Record<string, unknown>

  if (record.type !== 'assistant' && record.type !== 'user') return null
  if (typeof record.uuid !== 'string') return null
  if (typeof record.session_id !== 'string') return null

  return record as unknown as RawRecord
}
