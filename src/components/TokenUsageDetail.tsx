import type { Usage } from '@/model/types.ts'

type TokenUsageDetailProps = {
  usage: Usage
  showServiceTier?: boolean
  className?: string
}

export function TokenUsageDetail({ usage, showServiceTier = true, className = '' }: TokenUsageDetailProps) {
  return (
    <div className={`grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <span>Input tokens:</span><span>{usage.input_tokens.toLocaleString()}</span>
      <span>Output tokens:</span><span>{usage.output_tokens.toLocaleString()}</span>
      <span>Cache creation:</span><span>{usage.cache_creation_input_tokens.toLocaleString()}</span>
      <span>Cache read:</span><span>{usage.cache_read_input_tokens.toLocaleString()}</span>
      {(usage.cache_creation?.ephemeral_5m_input_tokens ?? 0) > 0 && (
        <><span>Ephemeral 5m:</span><span>{usage.cache_creation!.ephemeral_5m_input_tokens.toLocaleString()}</span></>
      )}
      {(usage.cache_creation?.ephemeral_1h_input_tokens ?? 0) > 0 && (
        <><span>Ephemeral 1h:</span><span>{usage.cache_creation!.ephemeral_1h_input_tokens.toLocaleString()}</span></>
      )}
      {showServiceTier && usage.service_tier !== 'standard' && (
        <><span>Service tier:</span><span>{usage.service_tier}</span></>
      )}
    </div>
  )
}
