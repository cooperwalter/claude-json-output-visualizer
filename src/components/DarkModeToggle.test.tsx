import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DarkModeToggle } from './DarkModeToggle'
import { useDarkMode } from '@/hooks/useDarkMode'

vi.mock('@/hooks/useDarkMode.ts', () => ({
  useDarkMode: vi.fn(),
}))

const mockUseDarkMode = useDarkMode as ReturnType<typeof vi.fn>

describe('DarkModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays aria-label showing current theme', () => {
    mockUseDarkMode.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      isDark: false,
    })
    render(<DarkModeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Theme: light. Click to change.')
  })

  it('cycles from light to dark on click', () => {
    const setTheme = vi.fn()
    mockUseDarkMode.mockReturnValue({
      theme: 'light',
      setTheme,
      isDark: false,
    })
    render(<DarkModeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('cycles from dark to system on click', () => {
    const setTheme = vi.fn()
    mockUseDarkMode.mockReturnValue({
      theme: 'dark',
      setTheme,
      isDark: true,
    })
    render(<DarkModeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(setTheme).toHaveBeenCalledWith('system')
  })

  it('cycles from system to light on click', () => {
    const setTheme = vi.fn()
    mockUseDarkMode.mockReturnValue({
      theme: 'system',
      setTheme,
      isDark: false,
    })
    render(<DarkModeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('renders an SVG icon for each theme state', () => {
    mockUseDarkMode.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      isDark: false,
    })
    const { rerender } = render(<DarkModeToggle />)
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()

    mockUseDarkMode.mockReturnValue({
      theme: 'dark',
      setTheme: vi.fn(),
      isDark: true,
    })
    rerender(<DarkModeToggle />)
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()

    mockUseDarkMode.mockReturnValue({
      theme: 'system',
      setTheme: vi.fn(),
      isDark: false,
    })
    rerender(<DarkModeToggle />)
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
  })
})
