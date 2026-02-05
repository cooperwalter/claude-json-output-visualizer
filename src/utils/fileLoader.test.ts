import { describe, it, expect, vi } from 'vitest'
import { readFileAsText, createFileInput, handleDragOver, handleDrop } from './fileLoader.ts'

describe('readFileAsText', () => {
  it('resolves with text content of the file', async () => {
    const file = new File(['hello world'], 'test.jsonl', { type: 'text/plain' })
    const result = await readFileAsText(file)
    expect(result).toBe('hello world')
  })

  it('reads multi-line JSONL content correctly', async () => {
    const content = '{"line": 1}\n{"line": 2}\n{"line": 3}'
    const file = new File([content], 'data.jsonl', { type: 'text/plain' })
    const result = await readFileAsText(file)
    expect(result).toBe(content)
  })

  it('resolves with empty string for an empty file', async () => {
    const file = new File([''], 'empty.jsonl', { type: 'text/plain' })
    const result = await readFileAsText(file)
    expect(result).toBe('')
  })
})

describe('createFileInput', () => {
  it('creates an input element with type file and .jsonl accept', () => {
    const onFile = vi.fn()
    const input = createFileInput(onFile)
    expect(input.tagName).toBe('INPUT')
    expect(input.type).toBe('file')
    expect(input.accept).toBe('.jsonl')
  })

  it('calls onFile callback when a file is selected', () => {
    const onFile = vi.fn()
    const input = createFileInput(onFile)
    const file = new File(['test'], 'test.jsonl')
    Object.defineProperty(input, 'files', { value: [file] })
    input.dispatchEvent(new Event('change'))
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('does not call onFile when no file is selected', () => {
    const onFile = vi.fn()
    const input = createFileInput(onFile)
    Object.defineProperty(input, 'files', { value: [] })
    input.dispatchEvent(new Event('change'))
    expect(onFile).not.toHaveBeenCalled()
  })
})

describe('handleDragOver', () => {
  it('calls preventDefault and stopPropagation on the event', () => {
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.DragEvent
    handleDragOver(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.stopPropagation).toHaveBeenCalled()
  })
})

describe('handleDrop', () => {
  it('calls preventDefault, stopPropagation, and onFile with the dropped file', () => {
    const file = new File(['test'], 'dropped.jsonl')
    const onFile = vi.fn()
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files: [file] },
    } as unknown as React.DragEvent
    handleDrop(event, onFile)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.stopPropagation).toHaveBeenCalled()
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('does not call onFile when no files are dropped', () => {
    const onFile = vi.fn()
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files: [] },
    } as unknown as React.DragEvent
    handleDrop(event, onFile)
    expect(onFile).not.toHaveBeenCalled()
  })
})
