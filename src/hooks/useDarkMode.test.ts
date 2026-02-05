import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDarkMode, initDarkMode } from './useDarkMode'

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('defaults to system theme when localStorage is empty', () => {
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.theme).toBe('system')
  })

  it('reads stored theme from localStorage', () => {
    localStorage.setItem('theme-preference', 'dark')
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.theme).toBe('dark')
  })

  it('returns isDark=true when theme is dark', () => {
    localStorage.setItem('theme-preference', 'dark')
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.isDark).toBe(true)
  })

  it('returns isDark=false when theme is light', () => {
    localStorage.setItem('theme-preference', 'light')
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.isDark).toBe(false)
  })

  it('returns isDark based on system preference when theme is system', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.theme).toBe('system')
    expect(result.current.isDark).toBe(true)
  })

  it('setTheme updates theme and persists to localStorage', () => {
    const { result } = renderHook(() => useDarkMode())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('theme-preference')).toBe('dark')
  })

  it('setTheme applies dark class to document when setting dark theme', () => {
    const { result } = renderHook(() => useDarkMode())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme removes dark class when setting light theme', () => {
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useDarkMode())
    act(() => {
      result.current.setTheme('light')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('handles localStorage write failure gracefully', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    const { result } = renderHook(() => useDarkMode())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.theme).toBe('dark')
    mockSetItem.mockRestore()
  })

  it('registers media query change listener for system preference changes', () => {
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener,
        removeEventListener,
        dispatchEvent: vi.fn(),
      })),
    })
    const { unmount } = renderHook(() => useDarkMode())
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

describe('initDarkMode', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('applies stored theme from localStorage on init', () => {
    localStorage.setItem('theme-preference', 'dark')
    initDarkMode()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('defaults to system theme when no stored preference', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    initDarkMode()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
