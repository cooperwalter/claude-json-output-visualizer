# Token Usage Display

Visualizes token consumption and caching metrics across the conversation.

## User Story

As a user, I want to understand token usage patterns so I can analyze cost and caching efficiency of a Claude Code session.

## Requirements

### Default State

Token usage is **hidden by default** at the per-message level. It is only visible:
- In an aggregate summary panel (always visible)
- Per-message when a turn is expanded and the user clicks a "usage" detail toggle

### Per-Message Usage (Hidden by Default)

Each assistant record contains a `usage` object:

```typescript
{
  input_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  cache_creation: {
    ephemeral_5m_input_tokens: number
    ephemeral_1h_input_tokens: number
  }
  output_tokens: number
  service_tier: string
}
```

When expanded, display as a compact table or labeled values.

### Aggregate Summary Panel

A fixed summary bar (top or sidebar) shows running totals:
- **Total input tokens** (sum of all `input_tokens`)
- **Total output tokens** (sum of all `output_tokens`)
- **Total cache creation tokens** (sum of all `cache_creation_input_tokens`)
- **Total cache read tokens** (sum of all `cache_read_input_tokens`)
- **Cache hit rate**: `cache_read / (cache_read + cache_creation + input)` as percentage
- **Message count**: total assistant turns / total user turns
- **Model(s) used**: distinct models seen

The summary updates progressively during streaming.

### Sub-Agent Usage

Sub-agent `Task` results include their own usage:
```typescript
{
  totalDurationMs: number
  totalTokens: number
  totalToolUseCount: number
  usage: Usage
}
```

These are rolled into the aggregate but can be viewed separately when the sub-agent node is expanded.

### Service Tier

Display `service_tier` value when it differs from "standard" (hidden otherwise).

## Component

Summary panel + per-turn expandable usage section.
