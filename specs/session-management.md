# Session Management

Handles loading, switching, and managing conversation sessions within the app.

## User Story

As a user, I want to load a conversation session and have the app remember recently opened files so I can return to them without re-importing.

## Requirements

### Session Lifecycle

```
[Empty state] → Load file → [Active session] → Load another file → [Replace active session]
```

Only one session is active at a time. Loading a new file replaces the current session.

### Empty State (Landing)

When no session is loaded, the app shows:
- App title / logo
- A prominent file drop zone with instructions: "Drop a .jsonl file here or click to browse"
- A "Paste JSONL" button that opens a text area for pasting raw content
- Recently opened sessions list (if any exist in local storage)

### Loading a New Session

When a file is loaded:
1. The empty state is replaced with the conversation timeline
2. The session metadata is stored:
   - File name
   - File size
   - Timestamp of when it was loaded
   - Session ID (from the `session_id` field in the data)
   - Record count
3. Streaming parse begins immediately (see `data-ingestion.md`)

### Session Header

While a session is active, a compact header shows:
- File name
- Record count (updates during streaming)
- A "Load new file" button to return to the empty state / file picker

### Recent Sessions (Local Storage)

The app persists metadata about recently loaded sessions in `localStorage`:

```typescript
type RecentSession = {
  fileName: string
  fileSize: number
  loadedAt: string        // ISO timestamp
  sessionId: string
  recordCount: number
}
```

- Store up to 10 recent sessions
- Newest first
- Displayed on the landing/empty state
- Selecting a recent session does **not** reload the data — it only serves as a reminder of what was previously viewed. The user must re-load the file.
- A "Clear history" action removes all recent session entries

### File Content

File content is never persisted to local storage (files can be large). Only metadata is stored. The user must re-select the file to view it again.

### Session Reset

A "Close session" or "Load new file" action:
1. Clears the parsed data from memory
2. Returns to the empty/landing state
3. Does not remove the session from recent history

## Component

App shell — controls the top-level view state (landing vs. active session).
