import { describe, it, expect } from 'vitest'
import { formatModelShort } from './formatModel.ts'

describe('formatModelShort', () => {
  it('removes claude- prefix and date suffix from model name', () => {
    expect(formatModelShort('claude-opus-4-5-20251101')).toBe('opus-4-5')
  })

  it('removes claude- prefix when there is no date suffix', () => {
    expect(formatModelShort('claude-sonnet')).toBe('sonnet')
  })

  it('removes date suffix when there is no claude- prefix', () => {
    expect(formatModelShort('gpt-4o-20240101')).toBe('gpt-4o')
  })

  it('returns the input unchanged when there is no prefix or suffix to strip', () => {
    expect(formatModelShort('custom-model')).toBe('custom-model')
  })

  it('handles empty string input', () => {
    expect(formatModelShort('')).toBe('')
  })

  it('handles model names with only claude- prefix and date suffix', () => {
    expect(formatModelShort('claude-3-5-sonnet-20241022')).toBe('3-5-sonnet')
  })

  it('does not strip partial date-like suffixes that are not 8 digits', () => {
    expect(formatModelShort('claude-model-2024')).toBe('model-2024')
  })
})
