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

**Current version:** v0.0.34 — 459 tests, all passing. Full spec compliance audit completed.

---

## Learnings

### Architecture Decisions
- Sub-agent records are filtered out of the top-level timeline (`parent_tool_use_id === null` check in `rebuildDerived`), rendered as nested timelines inside `TaskResult` via `useConversation()` context
- The `SubAgentNode` type and `buildSubAgentTree` function exist but are not used — the `byParentToolUseId` index is sufficient
- Search operates on top-level turns only; sub-agent content is searchable when expanded via recursive `subAgentMatchesSearch`
- `useFilters` accepts `IndexMaps` to include paired tool_result turns when filtering by tool name
- Streaming parse batches records (50 at a time) to avoid O(n²) `rebuildDerived` calls
- Virtualized scrolling (`@tanstack/react-virtual`) activates for 100+ turns
- User records don't have `message.id` — the `byMessageId` index uses `uuid` for user records while assistant records use `message.id`

### Tailwind CSS v4
- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- Dark mode via `@custom-variant dark (&:where(.dark, .dark *))` in `index.css`

### Shiki Syntax Highlighting
- Uses `shiki/bundle/web` (56 common web languages) instead of full `shiki` bundle (298+ languages) to reduce chunk count and initial bundle size
- Extra languages not in the web bundle (`toml`, `rust`, `go`, `ruby`, `diff`) are loaded via explicit dynamic imports from `@shikijs/langs/[lang]` — must use static import paths (not template literals) to avoid Vite `dynamic-import-vars` warnings
- Singleton `createHighlighter` pattern with lazy-loaded language grammars
- Theme detection: `classList.contains('dark')` + `prefers-color-scheme` media query
- When search is active, code display falls back to plain `<pre>` with `HighlightedText` instead of Shiki
- Vite `build.rollupOptions.output.manualChunks` separates `shiki-core` and `react-vendor` into dedicated chunks for better caching

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
- `appReducer` and `initialState` are exported for direct unit testing — the reducer is a pure function, ideal for testing without React rendering
- `useFilters` tests use `renderHook` from `@testing-library/react` with `act()` for state updates
- Test generator functions (e.g. `makeAssistantRecord`, `makeUserTurn`) accept partial overrides for flexible fixture creation
- jsdom does not provide `scrollIntoView` or `scrollTo` — components using these (e.g. `ConversationTimeline`) need `beforeEach` mocks: `Element.prototype.scrollIntoView = vi.fn()` and `Element.prototype.scrollTo = vi.fn()`
- `useStreamingParse` is testable via `renderHook` — the hook returns `parseText`, `stop`, `resume`, `reset` which can be called in `act()` blocks; the mock `dispatch` captures all dispatched actions for assertion
- `useRecentSessions` relies on `localStorage` — tests use `localStorage.clear()` in `beforeEach` and `vi.spyOn(Storage.prototype, 'setItem')` to simulate quota-exceeded errors
- `useDarkMode` tests require mocking `window.matchMedia` since jsdom doesn't support it — use `Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation(...) })`
- `ErrorBoundary` (class component) tests use a `ThrowingComponent` helper and suppress `console.error` with `vi.spyOn(console, 'error').mockImplementation(() => {})` to avoid noisy output
- `FilePathHeader` tests mock `navigator.clipboard.writeText` and use `vi.useFakeTimers()` to test the 1500ms "Copied!" feedback timeout
- `CodeBlock` tests mock `@/utils/highlighter.ts` with a controllable promise — tests can either verify the pre-highlight fallback state or resolve the promise with `act()` to test the highlighted state
- `DarkModeToggle` tests mock the `useDarkMode` hook to isolate component behavior from theme state logic
- `SessionHeader` tests mock `DarkModeToggle` to avoid hook dependency chain

### Vitest 3.x Mock Typing
- `vi.fn()` generics changed in Vitest 3.x: use `vi.fn<Signature>()` not `vi.fn<[Args], Return>()`
- For React dispatch mocks: `vi.fn<Dispatch<AppAction>>()` with type `Mock<Dispatch<AppAction>>`
- Access `.mock.calls` via `Mock<T>` type, not `ReturnType<typeof vi.fn<...>>`
- Use `Extract<UnionType, { type: 'discriminant' }>` to narrow discriminated unions in filter callbacks

### CodeBlock Line Numbers
- `CodeBlock` accepts optional `showLineNumbers` and `startLine` props for gutter display
- Line number gutter is rendered as a separate column alongside the syntax-highlighted code
- Works with both Shiki-highlighted HTML and plain `<pre>` fallback
- Only `ReadResult` enables line numbers — other tools (Bash, Edit, Raw JSON) do not need them
- `ReadResult` passes `startLine` from `meta.file.startLine` so partial file reads show correct line offsets

### JsonTree Design
- `JsonTree` component renders any JSON-serializable value as an interactive tree
- `JsonValue` typed as `unknown` to accept any data shape from tool inputs and raw records without type casting
- Each node manages its own `expanded` state independently — toggling one node does not affect siblings
- `CollapsibleNode` renders both the collapsed summary (`{3 items}`) and expanded children with indentation guides
- `PrimitiveValue` handles null, boolean, number, and string rendering with type-specific colors
- `HighlightedJsonText` reuses the same search-highlight pattern as `HighlightedText` in `TurnCard.tsx`
- ARIA: expand/collapse buttons have `aria-expanded` and descriptive `aria-label` including the key name and type (e.g., `Expand object "message"`)

### ToolIcon Design
- `ToolIcon` component in `src/components/ToolIcon.tsx` maps tool names to semantically meaningful SVG icons
- Read → document with text lines, Write → document with checkmark, Edit → pencil, Bash → terminal, Grep → magnifying glass, Glob → folder tree, Task → play button in box, TodoWrite → checklist, WebFetch → globe
- Unknown tool names fall back to the original wrench/link icon
- Used in both `ToolCallView` (collapsed tool header) and `TurnCard` `ContentTypeIcons` (timeline summary)

### ToolCallView & DefaultResult
- `ToolCallView` uses `<details open>` for input parameters so they are visible by default when the tool call is expanded (spec says "Input parameters — formatted JSON, collapsible" meaning visible but collapsible)
- `DefaultResult` does NOT render its own input section — `ToolCallView` already renders "Input Parameters" for all tool types including unknown/Other tools, so `DefaultResult` only renders the raw text result to avoid duplication

### Spec Interpretation Notes
- `tech-stack.md` says "react-json-view or custom" for JSON display — the "or custom" permits the current approach of a custom `JsonTree` component with collapsible sections, which avoids an extra dependency
- `conversation-timeline.md` says "Sub-agent exchanges: indented under their parent tool_use" — this is implemented as nested timelines inside expanded `TaskResult` components; `search-and-filtering.md` explicitly confirms sub-agent turns are "rendered as nested timelines inside their parent Task tool call, not as top-level turns"
- `TokenSummaryPanel.collectSubAgentRecords` recursively walks the Task→sub-agent tree so deeply nested sub-agents are included in filtered token totals
- `data-model.md` specifies `cache_creation` as optional (`cache_creation?:`) — the actual Claude Code JSONL output does not always include this field

### Known Limitations (Intentional)
- Search highlighting does not apply inside code blocks within markdown (would conflict with shiki styling)
- Shiki WASM engine chunk (~622 kB) and cpp grammar chunk (~626 kB) are inherently large but loaded on-demand; main bundle reduced to ~268 kB via `shiki/bundle/web` and manual chunk splitting
- Bash tool results do not differentiate stdout vs stderr — the JSONL data format does not separate them
