# Data Model

Defines the internal representation of parsed Claude Code conversation data.

## User Story

As the application, I need a structured internal model of conversation data so that visualization components can render it consistently.

## Requirements

### Raw Record Structure

Every JSONL line maps to one of two record types:

#### Assistant Record

```typescript
{
  type: "assistant"
  message: {
    model: string                    // e.g. "claude-opus-4-5-20251101"
    id: string                       // message ID, shared across content blocks
    type: "message"
    role: "assistant"
    content: ContentBlock[]          // one or more content blocks
    stop_reason: string | null
    stop_sequence: string | null
    usage: Usage
    context_management: unknown | null
  }
  parent_tool_use_id: string | null  // non-null for sub-agent calls
  session_id: string
  uuid: string                       // unique per JSONL line
}
```

#### User Record

```typescript
{
  type: "user"
  message: {
    role: "user"
    content: ToolResultBlock[]
  }
  parent_tool_use_id: string | null
  session_id: string
  uuid: string
  tool_use_result: ToolUseResultMeta  // rich metadata about the result
}
```

### Content Block Types

```typescript
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }

type ToolResultBlock = {
  tool_use_id: string
  type: "tool_result"
  content: string          // formatted file content with line numbers
  is_error?: boolean
}
```

### Usage Structure

```typescript
type Usage = {
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

### Tool Use Result Metadata

```typescript
type ToolUseResultMeta = {
  type: "text"
  file?: {
    filePath: string
    content: string
    numLines: number
    startLine: number
    totalLines: number
  }
  // Tool results from sub-agents
  status?: string           // "completed"
  prompt?: string
  agentId?: string
  content?: unknown[]
  totalDurationMs?: number
  totalTokens?: number
  totalToolUseCount?: number
  usage?: Usage
  // TodoWrite results
  oldTodos?: Todo[]
  newTodos?: Todo[]
}
```

### Derived Structures

After parsing, the app builds these derived structures:

#### Conversation Turn

Multiple JSONL records with the same `message.id` are grouped into a single logical turn:

```typescript
type ConversationTurn = {
  messageId: string          // shared message.id
  role: "assistant" | "user"
  records: RawRecord[]       // the individual JSONL lines
  contentBlocks: ContentBlock[]
  parentToolUseId: string | null
  sessionId: string
}
```

#### Tool Call Pair

A `tool_use` content block is paired with its corresponding `tool_result`:

```typescript
type ToolCallPair = {
  toolUse: {
    id: string
    name: string
    input: Record<string, unknown>
  }
  toolResult: {
    content: string
    isError: boolean
    meta: ToolUseResultMeta
  } | null                  // null if result not yet received (streaming)
}
```

#### Sub-Agent Tree

Records with non-null `parent_tool_use_id` form a tree:

```typescript
type SubAgentNode = {
  parentToolUseId: string
  records: RawRecord[]
  children: SubAgentNode[]
}
```

### Indexing

The data model maintains these indexes for efficient lookup:
- `byUuid`: Map from `uuid` to raw record
- `byMessageId`: Map from `message.id` to array of records (turns)
- `byToolUseId`: Map from `tool_use.id` to its ToolCallPair
- `byParentToolUseId`: Map from `parent_tool_use_id` to array of child records

## Component

Core data layer consumed by all visualization components.
