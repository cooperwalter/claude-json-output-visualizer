# Tool Use Visualization

Displays tool_use / tool_result pairs with appropriate formatting per tool type.

## User Story

As a user, I want to see what tools Claude called and what results they returned so I can understand the agent's behavior.

## Requirements

### Tool Call Pairing

Each `tool_use` content block is matched to its `tool_result` by `tool_use.id` === `tool_result.tool_use_id`. The pair is displayed as a single visual unit.

### Default Collapsed View

Tool calls default to a compact summary:

```
[Icon] ToolName          [success/error badge]
```

No input or output shown until expanded.

### Expanded View

On expand, show:
1. **Tool name** (prominent)
2. **Input parameters** — formatted JSON, collapsible
3. **Result** — formatted based on tool type (see below)
4. **Error state** — if `is_error: true`, highlight in red

### Tool-Specific Result Formatting

| Tool Name | Result Display |
|-----------|---------------|
| Read | File path header + syntax-highlighted code with line numbers |
| Grep | Matched file paths or matched lines with context |
| Glob | List of matched file paths |
| Write | File path + confirmation |
| Edit | File path + diff-style view of old_string → new_string |
| Bash | Command shown as code block + stdout/stderr output |
| Task | Sub-agent type + prompt summary + nested result |
| TodoWrite | Before/after todo list comparison |
| WebFetch | URL + extracted content |
| Other | Raw JSON input + raw text result |

### File Content Display

When `tool_use_result.file` is present:
- Show `filePath` as a clickable header
- Show `startLine` through `startLine + numLines` with line numbers
- If `totalLines > numLines`, indicate truncation: "Showing lines X-Y of Z"
- Syntax highlighting based on file extension

### Sub-Agent (Task) Calls

When tool name is `Task`:
- Show `input.subagent_type` and `input.description` in the summary
- The nested conversation (linked by `parent_tool_use_id`) renders as an indented sub-timeline
- Sub-agent results show `totalDurationMs`, `totalTokens`, `totalToolUseCount` as metadata chips (hidden by default)

### Error Results

When `is_error` is true on the tool result:
- Red border / background on the tool call pair
- Error content displayed prominently even in collapsed state

### Pending Results

If a `tool_use` has no matching `tool_result` yet (during streaming):
- Show a spinner/loading indicator
- Label as "Awaiting result..."

## Component

Rendered inline within conversation timeline turns.
