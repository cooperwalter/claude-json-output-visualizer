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

### Additional Testing Patterns
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

### Spec Interpretation Notes
- `tech-stack.md` says "react-json-view or custom" for JSON display — the "or custom" permits the current approach of Shiki-highlighted `JSON.stringify` with collapsible sections, which avoids an extra dependency
- `conversation-timeline.md` says "Sub-agent exchanges: indented under their parent tool_use" — this is implemented as nested timelines inside expanded `TaskResult` components; `search-and-filtering.md` explicitly confirms sub-agent turns are "rendered as nested timelines inside their parent Task tool call, not as top-level turns"
- `TokenSummaryPanel.collectSubAgentRecords` recursively walks the Task→sub-agent tree so deeply nested sub-agents are included in filtered token totals

### Known Limitations (Intentional)
- Search highlighting does not apply inside code blocks within markdown (would conflict with shiki styling)
- Shiki WASM engine chunk (~622 kB) and cpp grammar chunk (~626 kB) are inherently large but loaded on-demand; main bundle reduced to ~268 kB via `shiki/bundle/web` and manual chunk splitting

---

## Spec Compliance Audit

Full audit of all 9 spec files completed. All spec requirements fully implemented.

### Resolved in v0.0.33
- Added `JsonTree` component (`src/components/JsonTree.tsx`) — custom expandable/collapsible JSON tree viewer fulfilling the `tech-stack.md` spec requirement for "Pretty-printed expandable JSON" without adding an external dependency like `react-json-view`
- JSON objects and arrays render with expand/collapse toggles, item counts when collapsed, indentation lines, and color-coded values (purple keys, amber strings, green numbers, blue booleans, gray null)
- `defaultExpandDepth` prop controls initial expansion level (2 for tool inputs and raw JSON)
- Search highlighting works within JSON tree values and keys via `searchQuery` prop
- Integrated `JsonTree` into `ToolCallView.tsx` (Input Parameters), `MessageDetail.tsx` (Raw JSON), and `DefaultResult.tsx` (fallback tool input)
- Fixed sub-agent collapsed label to match `conversation-timeline.md` spec "Sub-agent: [type]" format — previously showed just the type name without "Sub-agent:" prefix
- Fixed model indicator visibility to match `conversation-timeline.md` spec "collapsed by default" — model badge now only shows when turn is expanded, not in collapsed summary
- Added 22 new tests in `JsonTree.test.tsx` covering primitives, objects, arrays, nested structures, expand/collapse interactions, search highlighting, and ARIA attributes
- Total test count: 459 (up from 437)

### JsonTree Design
- `JsonTree` component renders any JSON-serializable value as an interactive tree
- `JsonValue` typed as `unknown` to accept any data shape from tool inputs and raw records without type casting
- Each node manages its own `expanded` state independently — toggling one node does not affect siblings
- `CollapsibleNode` renders both the collapsed summary (`{3 items}`) and expanded children with indentation guides
- `PrimitiveValue` handles null, boolean, number, and string rendering with type-specific colors
- `HighlightedJsonText` reuses the same search-highlight pattern as `HighlightedText` in `TurnCard.tsx`
- ARIA: expand/collapse buttons have `aria-expanded` and descriptive `aria-label` including the key name and type (e.g., `Expand object "message"`)

### Resolved in v0.0.32
- Optimized Shiki bundle: switched from `shiki` (full bundle, 298+ languages) to `shiki/bundle/web` (56 web languages) — main bundle reduced from 528 kB to 268 kB (49% reduction), eliminated `emacs-lisp` 780 kB chunk
- Extra languages (`toml`, `rust`, `go`, `ruby`, `diff`) loaded via explicit static dynamic imports from `@shikijs/langs/[lang]` to avoid Vite `dynamic-import-vars` warnings
- Added Vite `build.rollupOptions.output.manualChunks` to separate `shiki-core` (111 kB) and `react-vendor` (130 kB) into dedicated cacheable chunks
- Added `build.chunkSizeWarningLimit: 650` to suppress expected large chunk warnings (WASM engine, cpp grammar)
- Added 96 new tests across 9 previously untested files, bringing total from 341 to 437
- New test files: `FilterBar.test.tsx` (30 tests: expand/collapse, role/status/tool/model filters, active indicator, clear filters, accessibility attributes), `SessionHeader.test.tsx` (14 tests: file name display, record count, loading indicator, skipped lines, Stop/Resume/Load buttons, DarkModeToggle rendering), `DarkModeToggle.test.tsx` (5 tests: theme cycling light→dark→system→light, aria-label, SVG icons), `useDarkMode.test.ts` (12 tests: localStorage persistence, system preference detection, media query listener, dark class toggling, write failure handling, initDarkMode), `ErrorBoundary.test.tsx` (7 tests: child rendering, error UI, custom fallback, Try again reset, componentDidCatch logging), `TokenUsageDetail.test.tsx` (10 tests: token counts, ephemeral cache display, service tier visibility, className), `FilePathHeader.test.tsx` (7 tests: path display, clipboard copy, Copied! feedback with timer), `CodeBlock.test.tsx` (11 tests: plain fallback, highlighted HTML, dark/light theme selection, language fallback, line numbers with gutter, startLine offset)

### Resolved in v0.0.31
- Fixed `useStreamingParse.test.ts` build failure — Vitest 3.x changed `vi.fn()` generics from `vi.fn<[Args], Return>()` to `vi.fn<Signature>()`, causing 12 TypeScript errors; updated mock typing to use `Mock<Dispatch<AppAction>>` and replaced raw `.mock.calls` filter callbacks with typed `callArgs()` helper using `Extract<AppAction, { type: 'RECORDS_BATCH' }>` discriminated union narrowing

### Resolved in v0.0.30
- Added 138 new tests across 8 previously untested files, bringing total from 203 to 341
- New test files: `useStreamingParse.test.ts` (14 tests: batch processing, pause/resume, abort, empty/invalid input errors), `useRecentSessions.test.ts` (11 tests: localStorage persistence, dedup by sessionId, MAX_SESSIONS limit, malformed data resilience, write failure handling), `fileLoader.test.ts` (9 tests: readFileAsText, createFileInput, handleDragOver, handleDrop), `highlighter.test.ts` (30 tests: langFromFilePath for all mapped extensions, unknown/missing extensions, case-insensitive, nested paths), `ConversationTimeline.test.tsx` (14 tests: empty state, clear filters button, keyboard nav j/k/arrows/Home/End, input focus exclusion, jump buttons, feed role), `MessageDetail.test.tsx` (15 tests: Raw JSON/Metadata/Token Usage toggles, aria-expanded, copy text, tool_use rendering), `SearchBar.test.tsx` (24 tests: keyboard shortcuts / Ctrl+F Escape Enter Shift+Enter arrows, match count display, navigation buttons, accessibility), `LandingPage.test.tsx` (21 tests: title, drop zone drag states, paste modal open/close/submit/disable, recent sessions rendering, file size formatting, clear history)

### Resolved in v0.0.29
- Fixed `ReadResult` truncation indicator to match spec: changed `(lines X-Y of Z)` to `Showing lines X-Y of Z`
- Added root-level `ErrorBoundary` in `main.tsx` wrapping `<App />` to catch errors during initialization that would otherwise cause a blank white screen
- Full spec compliance audit of all 9 spec files (451 requirements) — all requirements verified as implemented

### Resolved in v0.0.28
- Fixed unhandled promise rejection in `App.tsx` `handleFileLoaded` — added `.catch()` to `parseText` promise chain
- Eliminated duplicate JSONL parsing — `handleFileLoaded` previously parsed the entire file twice (once to count records, once via `parseText`); now `parseText` returns the record count directly
- `parseText` return type changed from `Promise<void>` to `Promise<number>` (total valid records parsed)
- Exported `appReducer` and `initialState` from `useAppState.ts` for direct unit testing
- Added 36 new tests: `useAppState.test.ts` (14 tests for all reducer actions), `useFilters.test.ts` (15 tests for role/tool/status/model filtering with AND logic), `formatModel.test.ts` (7 tests for model name formatting)
- Total test count: 203 (up from 167)

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
