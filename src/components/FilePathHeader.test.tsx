import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FilePathHeader } from './FilePathHeader.tsx'

describe('FilePathHeader', () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } })
    writeTextMock.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays the file path text', () => {
    render(<FilePathHeader filePath="/path/to/file.txt" />)
    expect(screen.getByText('/path/to/file.txt')).toBeInTheDocument()
  })

  it('displays suffix when provided', () => {
    render(<FilePathHeader filePath="/path/to/file.txt" suffix={<span>★</span>} />)
    expect(screen.getByText('★')).toBeInTheDocument()
  })

  it('shows Copy text by default', () => {
    render(<FilePathHeader filePath="/path/to/file.txt" />)
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('copies file path to clipboard when clicked', () => {
    render(<FilePathHeader filePath="/path/to/file.txt" />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(writeTextMock).toHaveBeenCalledWith('/path/to/file.txt')
  })

  it('shows Copied! text after clicking', () => {
    render(<FilePathHeader filePath="/path/to/file.txt" />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('Copied!')).toBeInTheDocument()
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
  })

  it('reverts to Copy text after 1500ms timeout', () => {
    render(<FilePathHeader filePath="/path/to/file.txt" />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('Copied!')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(screen.getByText('Copy')).toBeInTheDocument()
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
  })

  it('has title attribute for copy instruction', () => {
    render(<FilePathHeader filePath="/path/to/file.txt" />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Click to copy file path')
  })
})
