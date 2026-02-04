# Data Ingestion

Loads and parses JSONL conversation data from Claude Code output files.

## User Story

As a user, I want to load a Claude Code output file so I can visualize the conversation that took place.

## Requirements

### Input Format

The input is a JSONL file (one JSON object per line). Each line is a self-contained record with a top-level `type` field (`"assistant"` or `"user"`).

Example line:
```json
{"type":"assistant","message":{"model":"claude-opus-4-5-20251101","id":"msg_01Sks5UNaME53GphA3dBoRZG","type":"message","role":"assistant","content":[{"type":"text","text":"..."}],"stop_reason":null,"stop_sequence":null,"usage":{...},"context_management":null},"parent_tool_use_id":null,"session_id":"...","uuid":"..."}
```

### Loading Methods

| Method | Description |
|--------|-------------|
| File picker | User selects a `.jsonl` file from disk via browser file input |
| Drag and drop | User drops a file onto the app |
| Paste | User pastes JSONL text content directly |

### Streaming Parse

Parsing is incremental — records are processed and rendered one line at a time:
- As each JSONL line is parsed, it is immediately available for rendering
- The UI streams records into the visualization progressively
- A **Stop** button allows the user to halt parsing/rendering at any point
- After stopping, the user can resume or the already-parsed portion remains viewable

### Validation

Per-line validation:
- Each line must be valid JSON
- Each record must have a `type` field (`"assistant"` or `"user"`)
- Each record must have a `uuid` field
- Each record must have a `session_id` field

Invalid lines are skipped with a warning indicator (count of skipped lines shown in UI).

### Error Handling

- Empty file: show "No data found" message
- Non-JSONL content: show "Invalid format" message
- Partial parse (some lines valid, some not): render valid lines, show skip count

## Component

Top-level ingestion module consumed by the app shell.
