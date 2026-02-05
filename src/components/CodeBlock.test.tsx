import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { CodeBlock } from './CodeBlock'

const mockCodeToHtml = vi.fn().mockReturnValue('<pre class="shiki"><code>highlighted</code></pre>')
const mockGetLoadedLanguages = vi.fn().mockReturnValue(['typescript', 'json', 'text'])

let resolveHighlighter: (value: unknown) => void

vi.mock('@/utils/highlighter.ts', () => ({
  getHighlighter: vi.fn(() => new Promise((resolve) => { resolveHighlighter = resolve })),
}))

describe('CodeBlock', () => {
  beforeEach(() => {
    mockCodeToHtml.mockClear()
    mockGetLoadedLanguages.mockClear()
    mockGetLoadedLanguages.mockReturnValue(['typescript', 'json', 'text'])
    mockCodeToHtml.mockReturnValue('<pre class="shiki"><code>highlighted</code></pre>')
    document.documentElement.classList.remove('dark')
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  it('renders plain pre element before highlighting loads', () => {
    const { container } = render(<CodeBlock code="const x = 1" lang="typescript" />)

    const pre = container.querySelector('pre')
    expect(pre).toBeTruthy()
    expect(container.querySelector('.shiki-container')).toBeFalsy()
  })

  it('displays code text in fallback pre element', () => {
    const { container } = render(<CodeBlock code="const x = 1" lang="typescript" />)

    const pre = container.querySelector('pre')
    expect(pre?.textContent).toBe('const x = 1')
  })

  it('renders highlighted HTML after highlighter resolves', async () => {
    const { container } = render(<CodeBlock code="const x = 1" lang="typescript" />)

    await act(async () => {
      resolveHighlighter({
        codeToHtml: mockCodeToHtml,
        getLoadedLanguages: mockGetLoadedLanguages,
      })
    })

    expect(container.querySelector('.shiki-container')).toBeTruthy()
  })

  it('applies custom className to container', () => {
    const { container } = render(<CodeBlock code="const x = 1" lang="typescript" className="custom-class" />)

    const pre = container.querySelector('pre')
    expect(pre?.className).toContain('custom-class')
  })

  it('uses github-dark theme when dark mode class is present', async () => {
    document.documentElement.classList.add('dark')

    render(<CodeBlock code="const x = 1" lang="typescript" />)

    await act(async () => {
      resolveHighlighter({
        codeToHtml: mockCodeToHtml,
        getLoadedLanguages: mockGetLoadedLanguages,
      })
    })

    expect(mockCodeToHtml).toHaveBeenCalledWith('const x = 1', {
      lang: 'typescript',
      theme: 'github-dark',
    })
  })

  it('uses github-light theme when dark mode is not active', async () => {
    render(<CodeBlock code="const x = 1" lang="typescript" />)

    await act(async () => {
      resolveHighlighter({
        codeToHtml: mockCodeToHtml,
        getLoadedLanguages: mockGetLoadedLanguages,
      })
    })

    expect(mockCodeToHtml).toHaveBeenCalledWith('const x = 1', {
      lang: 'typescript',
      theme: 'github-light',
    })
  })

  it('falls back to text language when requested language is not loaded', async () => {
    mockGetLoadedLanguages.mockReturnValue(['typescript', 'json'])

    render(<CodeBlock code="fn main() {}" lang="rust" />)

    await act(async () => {
      resolveHighlighter({
        codeToHtml: mockCodeToHtml,
        getLoadedLanguages: mockGetLoadedLanguages,
      })
    })

    expect(mockCodeToHtml).toHaveBeenCalledWith('fn main() {}', {
      lang: 'text',
      theme: 'github-light',
    })
  })

  it('renders line numbers when showLineNumbers is true (before highlight)', () => {
    const code = `line1
line2
line3`
    const { container } = render(<CodeBlock code={code} showLineNumbers />)

    const gutter = container.querySelector('[aria-hidden="true"]')
    expect(gutter).toBeTruthy()
    const lineNumbers = gutter?.querySelectorAll('span.block')
    expect(lineNumbers?.length).toBe(3)
    expect(lineNumbers?.[0]?.textContent).toBe('1')
    expect(lineNumbers?.[1]?.textContent).toBe('2')
    expect(lineNumbers?.[2]?.textContent).toBe('3')
  })

  it('renders line numbers starting from startLine offset', () => {
    const code = `line1
line2
line3`
    const { container } = render(<CodeBlock code={code} showLineNumbers startLine={10} />)

    const gutter = container.querySelector('[aria-hidden="true"]')
    const lineNumbers = gutter?.querySelectorAll('span.block')
    expect(lineNumbers?.length).toBe(3)
    expect(lineNumbers?.[0]?.textContent).toBe('10')
    expect(lineNumbers?.[1]?.textContent).toBe('11')
    expect(lineNumbers?.[2]?.textContent).toBe('12')
  })

  it('renders line number gutter with highlighted HTML', async () => {
    const code = `line1
line2`
    const { container } = render(<CodeBlock code={code} showLineNumbers lang="typescript" />)

    await act(async () => {
      resolveHighlighter({
        codeToHtml: mockCodeToHtml,
        getLoadedLanguages: mockGetLoadedLanguages,
      })
    })

    const gutter = container.querySelector('[aria-hidden="true"]')
    expect(gutter).toBeTruthy()
    expect(container.querySelector('.shiki-container')).toBeTruthy()
  })

  it('hides line number gutter with aria-hidden', () => {
    const code = `line1
line2`
    const { container } = render(<CodeBlock code={code} showLineNumbers />)

    const gutter = container.querySelector('[aria-hidden="true"]')
    expect(gutter?.getAttribute('aria-hidden')).toBe('true')
  })
})
