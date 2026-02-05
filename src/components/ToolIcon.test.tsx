import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToolIcon } from './ToolIcon.tsx'

const KNOWN_TOOLS = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob', 'Task', 'TodoWrite', 'WebFetch']

describe('ToolIcon', () => {
  it('should render a distinct SVG path for each known tool name', () => {
    const pathsByTool = new Map<string, string>()

    for (const tool of KNOWN_TOOLS) {
      const { container } = render(<ToolIcon toolName={tool} />)
      const svg = container.querySelector('svg')
      expect(svg, `${tool} should render an SVG element`).toBeTruthy()
      const paths = Array.from(svg!.querySelectorAll('path, circle, rect'))
        .map((el) => el.outerHTML)
        .sort()
        .join('|')
      pathsByTool.set(tool, paths)
    }

    const uniquePaths = new Set(pathsByTool.values())
    expect(uniquePaths.size).toBe(KNOWN_TOOLS.length)
  })

  it('should render a fallback icon for unknown tool names', () => {
    const { container } = render(<ToolIcon toolName="UnknownTool" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('should apply custom className when provided', () => {
    const { container } = render(<ToolIcon toolName="Read" className="w-5 h-5 text-blue-500" />)
    const svg = container.querySelector('svg')
    expect(svg?.className.baseVal).toContain('w-5')
    expect(svg?.className.baseVal).toContain('h-5')
    expect(svg?.className.baseVal).toContain('text-blue-500')
  })

  it('should use default w-3.5 h-3.5 className when no className is provided', () => {
    const { container } = render(<ToolIcon toolName="Bash" />)
    const svg = container.querySelector('svg')
    expect(svg?.className.baseVal).toContain('w-3.5')
    expect(svg?.className.baseVal).toContain('h-3.5')
  })

  it('should set aria-hidden on all icons', () => {
    for (const tool of [...KNOWN_TOOLS, 'UnknownTool']) {
      const { container } = render(<ToolIcon toolName={tool} />)
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('aria-hidden'), `${tool} icon should be aria-hidden`).toBe('true')
    }
  })
})
