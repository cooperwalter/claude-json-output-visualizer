# Message Detail View

Provides deep inspection of a single conversation turn when expanded.

## User Story

As a user, I want to drill into a specific message to see its full content and raw data so I can debug or understand exactly what happened.

## Requirements

### Activation

The detail view is reached by expanding a turn in the conversation timeline. It is **not a separate page** — it expands inline.

### Content Sections (Progressive Disclosure)

All sections below default to collapsed unless noted:

#### 1. Text Content (Expanded by Default When Present)

- Rendered as markdown
- Code blocks syntax-highlighted
- Long text truncated at ~120 chars in timeline; full text shown when turn is expanded

#### 2. Tool Calls (Collapsed by Default)

See `tool-use-visualization.md` for rendering details.

#### 3. Raw JSON (Always Collapsed)

A toggle to view the raw JSONL record(s) for this turn:
- Pretty-printed JSON
- Syntax-highlighted
- Copyable to clipboard

#### 4. Metadata (Always Collapsed)

| Field | Value |
|-------|-------|
| Message ID | `message.id` |
| UUID(s) | `uuid` for each record in the turn |
| Model | `message.model` |
| Session ID | `session_id` |
| Stop Reason | `message.stop_reason` |
| Parent Tool Use ID | `parent_tool_use_id` or "None" |

#### 5. Token Usage (Always Collapsed)

See `token-usage-display.md` for per-message details.

### TodoWrite Visualization

When a turn contains a `TodoWrite` tool call, the result includes `oldTodos` and `newTodos`. Display as:
- Side-by-side or inline diff of todo items
- Status changes highlighted (pending → in_progress, in_progress → completed)
- Added items in green, removed items in red

### Copy Actions

- Copy full text content
- Copy raw JSON
- Copy tool input
- Copy tool result

Each via a small copy icon, hidden until hover/focus.

## Component

Inline expandable section within each conversation timeline turn.
