import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { JsonTree } from './JsonTree.tsx'

describe('JsonTree', () => {
  describe('primitive values', () => {
    it('should render a string value with double quotes', () => {
      render(<JsonTree data="hello" />)
      expect(screen.getByText('"hello"')).toBeInTheDocument()
    })

    it('should render a number value', () => {
      render(<JsonTree data={42} />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should render a boolean true value', () => {
      render(<JsonTree data={true} />)
      expect(screen.getByText('true')).toBeInTheDocument()
    })

    it('should render a boolean false value', () => {
      render(<JsonTree data={false} />)
      expect(screen.getByText('false')).toBeInTheDocument()
    })

    it('should render null as italic text', () => {
      render(<JsonTree data={null} />)
      expect(screen.getByText('null')).toBeInTheDocument()
    })
  })

  describe('objects', () => {
    it('should render empty object as {}', () => {
      const { container } = render(<JsonTree data={{}} />)
      expect(container.textContent).toContain('{}')
    })

    it('should render object keys in purple and string values in amber', () => {
      const { container } = render(<JsonTree data={{ name: 'Alice' }} defaultExpandDepth={2} />)
      const purpleSpans = container.querySelectorAll('.text-purple-700')
      expect(purpleSpans.length).toBeGreaterThan(0)
      expect(purpleSpans[0].textContent).toBe('"name"')
    })

    it('should show item count when object is collapsed', () => {
      render(<JsonTree data={{ a: 1, b: 2, c: 3 }} defaultExpandDepth={0} />)
      expect(screen.getByText('3 items')).toBeInTheDocument()
    })

    it('should show singular item count for single-property objects', () => {
      render(<JsonTree data={{ key: 'val' }} defaultExpandDepth={0} />)
      expect(screen.getByText('1 item')).toBeInTheDocument()
    })

    it('should expand a collapsed object when the toggle button is clicked', () => {
      render(<JsonTree data={{ foo: 'bar' }} defaultExpandDepth={0} />)
      expect(screen.getByText('1 item')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Expand object'))
      expect(screen.getByText('"foo"')).toBeInTheDocument()
      expect(screen.getByText('"bar"')).toBeInTheDocument()
    })

    it('should collapse an expanded object when the toggle button is clicked', () => {
      render(<JsonTree data={{ foo: 'bar' }} defaultExpandDepth={1} />)
      expect(screen.getByText('"foo"')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Collapse object'))
      expect(screen.getByText('1 item')).toBeInTheDocument()
    })
  })

  describe('arrays', () => {
    it('should render empty array as []', () => {
      const { container } = render(<JsonTree data={[]} />)
      expect(container.textContent).toContain('[]')
    })

    it('should show item count when array is collapsed', () => {
      render(<JsonTree data={[1, 2, 3]} defaultExpandDepth={0} />)
      expect(screen.getByText('3 items')).toBeInTheDocument()
    })

    it('should expand a collapsed array when the toggle button is clicked', () => {
      render(<JsonTree data={[10, 20]} defaultExpandDepth={0} />)
      expect(screen.getByText('2 items')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Expand array'))
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
    })
  })

  describe('nested structures', () => {
    it('should expand first level but collapse deeper levels based on defaultExpandDepth', () => {
      const data = { outer: { inner: 'value' } }
      render(<JsonTree data={data} defaultExpandDepth={1} />)
      expect(screen.getByText('"outer"')).toBeInTheDocument()
      expect(screen.getByText('1 item')).toBeInTheDocument()
      expect(screen.queryByText('"inner"')).not.toBeInTheDocument()
    })

    it('should expand two levels deep when defaultExpandDepth is 2', () => {
      const data = { outer: { inner: 'value' } }
      render(<JsonTree data={data} defaultExpandDepth={2} />)
      expect(screen.getByText('"outer"')).toBeInTheDocument()
      expect(screen.getByText('"inner"')).toBeInTheDocument()
      expect(screen.getByText('"value"')).toBeInTheDocument()
    })

    it('should render commas between sibling entries', () => {
      const { container } = render(<JsonTree data={{ a: 1, b: 2 }} defaultExpandDepth={1} />)
      const commaSpans = container.querySelectorAll('.text-gray-500')
      const commaTexts = Array.from(commaSpans).map((s) => s.textContent)
      expect(commaTexts).toContain(',')
    })
  })

  describe('search highlighting', () => {
    it('should highlight matching text in string values when searchQuery is provided', () => {
      render(<JsonTree data={{ greeting: 'hello world' }} defaultExpandDepth={2} searchQuery="hello" />)
      const marks = document.querySelectorAll('mark')
      expect(marks.length).toBeGreaterThan(0)
      expect(marks[0].textContent).toBe('hello')
    })

    it('should highlight matching text in object keys when searchQuery is provided', () => {
      render(<JsonTree data={{ searchable: 'value' }} defaultExpandDepth={2} searchQuery="search" />)
      const marks = document.querySelectorAll('mark')
      expect(marks.length).toBeGreaterThan(0)
      expect(marks[0].textContent).toBe('search')
    })

    it('should not render mark elements when searchQuery does not match any content', () => {
      render(<JsonTree data={{ key: 'value' }} defaultExpandDepth={2} searchQuery="nonexistent" />)
      const marks = document.querySelectorAll('mark')
      expect(marks.length).toBe(0)
    })
  })

  describe('aria attributes', () => {
    it('should set aria-expanded to true on expanded nodes and false on collapsed nodes', () => {
      render(<JsonTree data={{ a: { b: 1 } }} defaultExpandDepth={1} />)
      const expandedButton = screen.getByLabelText('Collapse object')
      expect(expandedButton).toHaveAttribute('aria-expanded', 'true')

      const collapsedButton = screen.getByLabelText(/Expand object/)
      expect(collapsedButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should include key name in aria-label for nested expandable nodes', () => {
      render(<JsonTree data={{ nested: { a: 1 } }} defaultExpandDepth={1} />)
      expect(screen.getByLabelText('Expand object "nested"')).toBeInTheDocument()
    })
  })
})
