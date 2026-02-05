# Implementation Plan

## Project Goal

Build a static single-page application (SPA) that visualizes Claude Code JSONL conversation output files. Users load a `.jsonl` file and see a rich, interactive timeline of the conversation with progressive disclosure, tool-specific formatting, token usage analytics, search/filtering, and session management.

---

## Status: All Phases Complete

All 11 phases are fully implemented and verified against specs:

- [x] Phase 1: Project Scaffolding & Configuration
- [x] Phase 2: Data Model & Type Definitions
- [x] Phase 3: Data Ingestion & Parsing
- [x] Phase 4: App Shell & State Management
- [x] Phase 5: Session Management & Landing Page
- [x] Phase 6: Conversation Timeline (Core View)
- [x] Phase 7: Message Detail View (Inline Expansion)
- [x] Phase 8: Tool Use Visualization
- [x] Phase 9: Token Usage Display
- [x] Phase 10: Search & Filtering
- [x] Phase 11: Polish & Integration

---

## Learnings

### Architecture Decisions
- Sub-agent records are filtered out of the top-level timeline (`parent_tool_use_id === null` check in `rebuildDerived`), rendered as nested timelines inside `TaskResult` via `useConversation()` context
- The `SubAgentNode` type and `buildSubAgentTree` function exist but are not used — the `byParentToolUseId` index is sufficient
- Search operates on top-level turns only; sub-agent content is searchable when expanded via recursive `subAgentMatchesSearch`
- `useFilters` accepts `IndexMaps` to include paired tool_result turns when filtering by tool name
- Streaming parse batches records (50 at a time) to avoid O(n²) `rebuildDerived` calls
- Virtualized scrolling (`@tanstack/react-virtual`) activates for 100+ turns

### Tailwind CSS v4
- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- Dark mode via `@custom-variant dark (&:where(.dark, .dark *))` in `index.css`

### Shiki Syntax Highlighting
- Singleton `createHighlighter` pattern with lazy-loaded language grammars
- Theme detection: `classList.contains('dark')` + `prefers-color-scheme` media query
- When search is active, code display falls back to plain `<pre>` with `HighlightedText` instead of Shiki

### ESLint Patterns
- `react-refresh/only-export-components`: non-component exports must go in `.ts` files, not `.tsx`
- Context definitions in `.ts` files, provider components in `.tsx` files
- `react-hooks/set-state-in-effect`: derive state from props directly instead of syncing via effects

### Testing Patterns
- `CodeBlock` mock renders as `<pre data-testid="code-block">` to isolate async Shiki dependency
- TaskResult tests mock `ConversationContext` to provide `IndexMaps`
- Vitest requires separate `vitest.config.ts` with `jsdom` environment
- React 19's `act()` waits for all async state updates (Shiki WASM loading, react-markdown unified pipeline) — tests that expand components rendering `MessageDetail` must mock both `CodeBlock` and `react-markdown` to avoid 5s+ timeouts
- `TokenSummaryPanel` tests use `fireEvent.click` instead of `userEvent` to avoid `act()` overhead since the component has no async behavior

### CodeBlock Line Numbers
- `CodeBlock` accepts optional `showLineNumbers` and `startLine` props for gutter display
- Line number gutter is rendered as a separate column alongside the syntax-highlighted code
- Works with both Shiki-highlighted HTML and plain `<pre>` fallback
- Only `ReadResult` enables line numbers — other tools (Bash, Edit, Raw JSON) do not need them
- `ReadResult` passes `startLine` from `meta.file.startLine` so partial file reads show correct line offsets

### Spec Interpretation Notes
- `tech-stack.md` says "react-json-view or custom" for JSON display — the "or custom" permits the current approach of Shiki-highlighted `JSON.stringify` with collapsible sections, which avoids an extra dependency
- `conversation-timeline.md` says "Sub-agent exchanges: indented under their parent tool_use" — this is implemented as nested timelines inside expanded `TaskResult` components; `search-and-filtering.md` explicitly confirms sub-agent turns are "rendered as nested timelines inside their parent Task tool call, not as top-level turns"
- `TokenSummaryPanel.collectSubAgentRecords` recursively walks the Task→sub-agent tree so deeply nested sub-agents are included in filtered token totals

### Known Limitations (Intentional)
- Search highlighting does not apply inside code blocks within markdown (would conflict with shiki styling)
- Build produces large chunks from Shiki language grammars (code-split via dynamic imports)

---

## Spec Compliance Audit

Full audit of all 9 spec files completed. All spec requirements fully implemented.

### Resolved in v0.0.27
- Fixed `TokenSummaryPanel.recordsFromTurns` to recursively collect nested sub-agent records when computing filtered token totals — previously only looked one level deep via `byParentToolUseId`, now uses `collectSubAgentRecords` to walk the full Task→sub-agent tree

### Resolved in v0.0.26
- Added tool-type-specific SVG icons via `ToolIcon` component — each tool (Read, Write, Edit, Bash, Grep, Glob, Task, TodoWrite, WebFetch) now has a distinct icon in both `ToolCallView` collapsed state and `TurnCard` content type indicators, matching the spec requirement for `[Icon] ToolName [badge]`

### Resolved in v0.0.25
- Updated `specs/data-model.md` to make `cache_creation` optional (`cache_creation?:`) — the actual Claude Code JSONL output does not always include this field, so the spec now matches runtime data and the TypeScript type

### ToolIcon Design
- `ToolIcon` component in `src/components/ToolIcon.tsx` maps tool names to semantically meaningful SVG icons
- Read → document with text lines, Write → document with checkmark, Edit → pencil, Bash → terminal, Grep → magnifying glass, Glob → folder tree, Task → play button in box, TodoWrite → checklist, WebFetch → globe
- Unknown tool names fall back to the original wrench/link icon
- Used in both `ToolCallView` (collapsed tool header) and `TurnCard` `ContentTypeIcons` (timeline summary)

### Known Limitations (Data Format)
- Bash tool results do not differentiate stdout vs stderr — the JSONL data format does not separate them
- DefaultResult shows input in a collapsible `<details>` while ToolCallView also has a collapsible input section (minor redundancy, both are useful in different contexts)
