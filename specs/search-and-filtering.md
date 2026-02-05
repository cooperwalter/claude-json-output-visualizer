# Search & Filtering

Enables finding specific messages, tool calls, or content within a loaded conversation.

## User Story

As a user, I want to search and filter the conversation so I can quickly locate specific tool calls, errors, or text without scrolling through the entire timeline.

## Requirements

### Search Bar

A persistent search input at the top of the conversation timeline:
- Searches across text content, tool names, tool inputs, tool results, and file paths
- Results highlighted in-place within the timeline (matched turns expanded automatically)
- Match count displayed: "N of M matches"
- Up/Down arrows or Enter/Shift+Enter to navigate between matches
- Search is case-insensitive by default
- Debounced input (300ms) to avoid excessive re-rendering during typing

### Filter Controls

A collapsible filter bar adjacent to the search input. Filters are combinable (AND logic).

#### By Role

| Filter | Effect |
|--------|--------|
| Assistant only | Show only assistant turns |
| User only | Show only user (tool result) turns |
| All | Default — show both |

#### By Tool Name

- Dropdown/multi-select populated from tool names present in the loaded data
- Example values: `Read`, `Bash`, `Edit`, `Write`, `Grep`, `Glob`, `Task`, `TodoWrite`, `WebFetch`
- Selecting one or more tool names shows only turns that contain those tool calls (and their paired results)

#### By Status

| Filter | Effect |
|--------|--------|
| Errors only | Show only turns containing `is_error: true` tool results |
| Sub-agent only | Show only turns that contain `Task` tool_use blocks (i.e., turns that spawn sub-agents). Note: sub-agent turns themselves are rendered as nested timelines inside their parent Task tool call, not as top-level turns. |
| Text only | Show only turns that contain `type: "text"` content blocks |

#### By Model

- Dropdown populated from distinct `message.model` values in the data
- Useful when a session spans multiple models (e.g., parent opus, sub-agent sonnet/haiku)

### Filtered State

When filters are active:
- Non-matching turns are hidden from the timeline (not greyed out — fully removed)
- A "Showing N of M turns" indicator is visible
- A "Clear filters" button resets all filters
- The aggregate token summary in the summary panel reflects only the visible (filtered) turns

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` or `Ctrl+F` | Focus the search bar |
| `Escape` | Clear search and return focus to timeline |
| `Enter` | Next match |
| `Shift+Enter` | Previous match |

### No Results State

When search or filters yield no matches:
- Show "No matching messages" in the timeline area
- Suggest clearing filters

## Component

Search bar + filter controls, rendered above the conversation timeline.
