import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TokenUsageDetail } from './TokenUsageDetail.tsx'
import type { Usage } from '@/model/types.ts'

function makeUsage(overrides: Partial<Usage> = {}): Usage {
  return {
    input_tokens: 100,
    output_tokens: 50,
    cache_creation_input_tokens: 20,
    cache_read_input_tokens: 30,
    service_tier: 'standard',
    ...overrides,
  }
}

describe('TokenUsageDetail', () => {
  it('displays input and output token counts', () => {
    const usage = makeUsage({ input_tokens: 1234, output_tokens: 5678 })
    render(<TokenUsageDetail usage={usage} />)
    expect(screen.getByText('Input tokens:')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('Output tokens:')).toBeInTheDocument()
    expect(screen.getByText('5,678')).toBeInTheDocument()
  })

  it('displays cache creation and cache read token counts', () => {
    const usage = makeUsage({ cache_creation_input_tokens: 150, cache_read_input_tokens: 250 })
    render(<TokenUsageDetail usage={usage} />)
    expect(screen.getByText('Cache creation:')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('Cache read:')).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()
  })

  it('shows ephemeral 5m tokens when they are greater than zero', () => {
    const usage = makeUsage({
      cache_creation: { ephemeral_5m_input_tokens: 175, ephemeral_1h_input_tokens: 0 },
    })
    render(<TokenUsageDetail usage={usage} />)
    expect(screen.getByText('Ephemeral 5m:')).toBeInTheDocument()
    expect(screen.getByText('175')).toBeInTheDocument()
  })

  it('shows ephemeral 1h tokens when they are greater than zero', () => {
    const usage = makeUsage({
      cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 285 },
    })
    render(<TokenUsageDetail usage={usage} />)
    expect(screen.getByText('Ephemeral 1h:')).toBeInTheDocument()
    expect(screen.getByText('285')).toBeInTheDocument()
  })

  it('hides ephemeral tokens when they are zero', () => {
    const usage = makeUsage({
      cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
    })
    render(<TokenUsageDetail usage={usage} />)
    expect(screen.queryByText('Ephemeral 5m:')).not.toBeInTheDocument()
    expect(screen.queryByText('Ephemeral 1h:')).not.toBeInTheDocument()
  })

  it('hides ephemeral tokens when cache_creation is undefined', () => {
    const usage = makeUsage()
    render(<TokenUsageDetail usage={usage} />)
    expect(screen.queryByText('Ephemeral 5m:')).not.toBeInTheDocument()
    expect(screen.queryByText('Ephemeral 1h:')).not.toBeInTheDocument()
  })

  it('shows service tier when it differs from standard and showServiceTier is true', () => {
    const usage = makeUsage({ service_tier: 'premium' })
    render(<TokenUsageDetail usage={usage} showServiceTier={true} />)
    expect(screen.getByText('Service tier:')).toBeInTheDocument()
    expect(screen.getByText('premium')).toBeInTheDocument()
  })

  it('hides service tier when it equals standard', () => {
    const usage = makeUsage({ service_tier: 'standard' })
    render(<TokenUsageDetail usage={usage} showServiceTier={true} />)
    expect(screen.queryByText('Service tier:')).not.toBeInTheDocument()
  })

  it('hides service tier when showServiceTier is false even if non-standard', () => {
    const usage = makeUsage({ service_tier: 'premium' })
    render(<TokenUsageDetail usage={usage} showServiceTier={false} />)
    expect(screen.queryByText('Service tier:')).not.toBeInTheDocument()
  })

  it('applies custom className to container', () => {
    const usage = makeUsage()
    const { container } = render(<TokenUsageDetail usage={usage} className="custom-class-name" />)
    const divElement = container.querySelector('div')
    expect(divElement?.className).toContain('custom-class-name')
  })
})
