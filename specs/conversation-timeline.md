# Conversation Timeline

Renders the sequential flow of assistant and user messages as a streamable timeline.

## User Story

As a user, I want to see the conversation flow at a glance so I can understand what Claude did and navigate to points of interest.

## Requirements

### Streaming Rendering

Messages appear in the timeline incrementally as JSONL records are parsed:
- Each record appended to the timeline as soon as it's available
- A **Stop** button pauses both parsing and rendering
- After stopping, the already-rendered portion remains interactive
- A **Resume** button continues from where parsing was halted

### Progressive Disclosure (Default Collapsed)

The timeline defaults to a **summary view** — unnecessary detail is hidden:

| Element | Default State | Expanded State |
|---------|--------------|----------------|
| Text content | First ~120 chars + ellipsis | Full text |
| Tool use | Tool name + icon only | Name + full input JSON |
| Tool result | Status indicator (success/error) | Full result content |
| File content | File path + line count | Syntax-highlighted source |
| Sub-agent calls | "Sub-agent: [type]" label | Full nested timeline |
| Usage stats | Hidden | Token breakdown |

Users expand any element by clicking/tapping it.

### Turn Grouping

JSONL records sharing the same `message.id` are grouped into a single visual turn:
- An assistant turn may contain multiple content blocks (text + multiple tool_use)
- Grouped blocks are displayed together under one turn header

### Visual Indicators

Each turn shows:
- **Role badge**: "Assistant" or "User" with distinct colors
- **Model indicator**: Shows model name (collapsed by default)
- **Content type icons**: Text icon, tool icon, etc.
- **Sub-agent indicator**: Badge when `parent_tool_use_id` is non-null
- **Error indicator**: Red badge on `tool_result` with `is_error: true`
- **Turn index**: Sequential number for quick reference

### Layout

Vertical chronological list, newest at bottom:
- Assistant turns: left-aligned with distinct background
- User turns (tool results): right-aligned or indented, muted background
- Sub-agent exchanges: indented under their parent tool_use

### Navigation

- Click any turn to scroll it into view and expand its detail
- Keyboard: Up/Down arrows move between turns
- Jump to top / Jump to bottom buttons

## Component

Main visualization panel, occupying the primary content area.
