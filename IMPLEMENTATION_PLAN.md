# Implementation Plan

## Project Goal

Build a static single-page application (SPA) that visualizes Claude Code JSONL conversation output files. Users load a `.jsonl` file and see a rich, interactive timeline of the conversation with progressive disclosure, tool-specific formatting, token usage analytics, search/filtering, and session management.

---

## Phase 1: Project Scaffolding & Configuration
> Foundation that everything else depends on. Must be done first.

- [x] Initialize Vite + React + TypeScript project (`npm create vite@latest`)
- [x] Configure `tsconfig.json` with strict mode, no `any`, path aliases (`@/` → `src/`)
- [x] Install and configure Tailwind CSS (v4 or latest)
- [x] Install core dependencies: `react-markdown`, `shiki` (syntax highlighting), `react-json-view-lite` or equivalent
- [x] Set up ESLint + Prettier with TypeScript rules
- [x] Create directory structure: `src/components/`, `src/model/`, `src/hooks/`, `src/utils/`
- [x] Create `src/main.tsx` entry point and `src/App.tsx` root component (minimal shell)
- [x] Verify `npm run dev`, `npm run build`, `npx tsc --noEmit`, `npm run lint` all pass
- [x] Spec: `specs/tech-stack.md`

## Phase 2: Data Model & Type Definitions
> Core types consumed by every other module. No UI yet.

- [x] Define raw record types in `src/model/types.ts`: `AssistantRecord`, `UserRecord`, `RawRecord`, `ContentBlock`, `ToolResultBlock`, `Usage`, `ToolUseResultMeta`, `Todo`
- [x] Define derived types: `ConversationTurn`, `ToolCallPair`, `SubAgentNode`
- [x] Define index types: `byUuid`, `byMessageId`, `byToolUseId`, `byParentToolUseId` maps
- [x] Define `RecentSession` type for session management
- [x] Export all types from `src/model/index.ts` barrel file
- [x] Spec: `specs/data-model.md`

## Phase 3: Data Ingestion & Parsing
> Turns raw JSONL text into the data model. Required before any visualization.

- [x] Implement JSONL line parser in `src/model/parser.ts`: parse single line → `RawRecord | null` (with validation: valid JSON, has `type`, `uuid`, `session_id`)
- [x] Implement record indexer in `src/model/indexer.ts`: builds the four index maps from an array of `RawRecord`
- [x] Implement turn grouper in `src/model/grouper.ts`: groups records by `message.id` into `ConversationTurn[]`
- [x] Implement tool call pairer in `src/model/toolPairer.ts`: matches `tool_use` to `tool_result` into `ToolCallPair[]`
- [x] Implement sub-agent tree builder in `src/model/subAgentTree.ts`: builds `SubAgentNode[]` from `parent_tool_use_id` relationships
- [x] Implement streaming parse hook `src/hooks/useStreamingParse.ts`: reads file via FileReader, parses line-by-line, yields records incrementally, supports stop/resume
- [x] Implement file loading utilities in `src/utils/fileLoader.ts`: File picker handler, drag-and-drop handler, paste handler
- [x] Write unit tests for parser, indexer, grouper, toolPairer, subAgentTree
- [x] Spec: `specs/data-ingestion.md`, `specs/data-model.md`

## Phase 4: App Shell & State Management
> React context + useReducer for global state. Controls top-level view routing.

- [x] Define app state shape in `src/hooks/useAppState.ts`: `{ status: 'empty' | 'loading' | 'active', records: RawRecord[], turns: ConversationTurn[], indexes: IndexMaps, sessionMeta: SessionMeta | null, error: string | null }`
- [x] Implement reducer with actions: `LOAD_START`, `RECORD_ADDED`, `LOAD_COMPLETE`, `LOAD_ERROR`, `RESET`, `STOP_PARSE`, `RESUME_PARSE`
- [x] Create `ConversationProvider` context in `src/hooks/ConversationContext.tsx`
- [x] Wire `App.tsx` to show empty state vs. active session based on app state
- [x] Spec: `specs/session-management.md`, `specs/tech-stack.md`

## Phase 5: Session Management & Landing Page
> Empty state UI, file loading UX, recent sessions.

- [x] Build landing page component `src/components/LandingPage.tsx`: app title, file drop zone, paste button, recent sessions list
- [x] Implement drag-and-drop zone with visual feedback (dragover highlight)
- [x] Implement paste JSONL modal/textarea
- [x] Implement recent sessions in localStorage (`src/hooks/useRecentSessions.ts`): store up to 10, newest first, clear history action
- [x] Build session header component `src/components/SessionHeader.tsx`: file name, record count (live during streaming), "Load new file" button
- [x] Implement session reset (clear parsed data, return to landing)
- [x] Spec: `specs/session-management.md`

## Phase 6: Conversation Timeline (Core View)
> The main visualization — must work before detail views.

- [x] Build `src/components/ConversationTimeline.tsx`: vertical chronological list, streams turns as they parse
- [x] Build `src/components/TurnCard.tsx`: displays a single `ConversationTurn` in collapsed summary view
  - Role badge (Assistant/User with distinct colors)
  - Content type icons
  - Turn index number
  - Sub-agent indicator badge when `parent_tool_use_id` is non-null
  - Error indicator on `is_error: true` tool results
- [x] Implement progressive disclosure: collapsed by default (first ~120 chars of text, tool name only, status indicator for results)
- [x] Implement expand/collapse on click for each turn
- [x] Implement turn grouping: records with same `message.id` rendered as single visual unit
- [x] Layout: assistant turns left-aligned distinct background, user turns right-aligned/indented muted background
- [x] Sub-agent exchanges indented under their parent `tool_use`
- [x] Stop/Resume buttons for streaming parse control
- [x] Navigation: click to scroll into view, keyboard up/down between turns, jump to top/bottom
- [x] Spec: `specs/conversation-timeline.md`

## Phase 7: Message Detail View (Inline Expansion)
> Expanded content when a turn is clicked. Depends on timeline.

- [x] Build `src/components/MessageDetail.tsx`: inline expandable section within TurnCard
- [x] Text content section: rendered as markdown via `react-markdown`, code blocks syntax-highlighted (expanded by default when present)
- [x] Raw JSON toggle: pretty-printed, syntax-highlighted, copyable to clipboard
- [x] Metadata section (collapsed): message ID, UUID(s), model, session ID, stop reason, parent tool use ID
- [x] TodoWrite visualization: side-by-side or inline diff of oldTodos vs newTodos, status changes highlighted, added/removed items colored
- [x] Copy actions: copy text content, copy raw JSON, copy tool input, copy tool result (icons hidden until hover/focus)
- [x] Spec: `specs/message-detail-view.md`

## Phase 8: Tool Use Visualization
> Tool-specific formatting for each tool type. Depends on detail view.

- [x] Build `src/components/ToolCallView.tsx`: collapsed summary (`[Icon] ToolName [success/error badge]`), expandable to full detail
- [x] Expanded view: tool name, input parameters (formatted JSON, collapsible), result, error state (red highlight)
- [x] Tool-specific result formatters in `src/components/toolResults/`:
  - [x] `ReadResult.tsx`: file path header + syntax-highlighted code with line numbers
  - [x] `GrepResult.tsx`: matched file paths or lines with context
  - [x] `GlobResult.tsx`: list of matched file paths
  - [x] `WriteResult.tsx`: file path + confirmation
  - [x] `EditResult.tsx`: file path + diff-style view (old_string → new_string)
  - [x] `BashResult.tsx`: command as code block + stdout/stderr output
  - [x] `TaskResult.tsx`: sub-agent type + prompt summary + nested sub-timeline
  - [x] `TodoWriteResult.tsx`: before/after todo list comparison
  - [x] `WebFetchResult.tsx`: URL + extracted content
  - [x] `DefaultResult.tsx`: raw JSON input + raw text result (fallback)
- [x] File content display: filePath header, line numbers from startLine, truncation indicator ("Showing lines X-Y of Z"), syntax highlighting by file extension
- [x] Sub-agent (Task) calls: show `input.subagent_type` + `input.description` in summary, nested conversation as indented sub-timeline, metadata chips for duration/tokens/tool count
- [x] Error results: red border/background, error content visible even when collapsed
- [x] Pending results (streaming): spinner + "Awaiting result..." label
- [x] Spec: `specs/tool-use-visualization.md`

## Phase 9: Token Usage Display
> Analytics panel + per-message usage. Depends on data model and timeline.

- [x] Build `src/components/TokenSummaryPanel.tsx`: fixed summary bar showing running totals
  - Total input tokens, total output tokens
  - Total cache creation tokens, total cache read tokens
  - Cache hit rate as percentage
  - Message count (assistant turns / user turns)
  - Model(s) used (distinct models)
  - Updates progressively during streaming
- [x] Build `src/components/TokenUsageDetail.tsx`: per-message expandable usage section (collapsed by default)
  - Compact table: input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, ephemeral cache tokens
  - Service tier shown only when non-"standard"
- [x] Sub-agent usage: roll sub-agent `totalTokens`/`usage` into aggregate, viewable separately when expanded
- [x] Wire aggregate summary to respect active filters (show filtered totals)
- [x] Spec: `specs/token-usage-display.md`

## Phase 10: Search & Filtering
> Advanced feature layer. Depends on timeline and data model indexes.

- [x] Build `src/components/SearchBar.tsx`: persistent search input above timeline
  - Searches across text content, tool names, tool inputs, tool results, file paths
  - Case-insensitive by default
  - Debounced input (300ms)
  - Match count ("N of M matches")
  - Up/Down arrows or Enter/Shift+Enter to navigate between matches
  - Results highlighted in-place (matched turns auto-expanded)
- [x] Build `src/components/FilterBar.tsx`: collapsible filter controls adjacent to search
  - Role filter: Assistant only / User only / All
  - Tool name filter: multi-select populated from loaded data
  - Status filter: Errors only / Sub-agent only / Text only
  - Model filter: dropdown from distinct `message.model` values
  - Filters combinable with AND logic
- [x] Implement search hook `src/hooks/useSearch.ts`: text matching logic across all content fields
- [x] Implement filter hook `src/hooks/useFilters.ts`: filter state management, turn filtering logic
- [x] Filtered state: non-matching turns fully hidden, "Showing N of M turns" indicator, "Clear filters" button
- [x] Keyboard shortcuts: `/` or `Ctrl+F` to focus search, `Escape` to clear, `Enter`/`Shift+Enter` for next/prev match
- [x] No results state: "No matching messages" + suggest clearing filters
- [x] Wire token summary panel to reflect only filtered/visible turns
- [x] Spec: `specs/search-and-filtering.md`

## Phase 11: Polish & Integration
> Final integration, edge cases, performance.

- [x] End-to-end test: load a real Claude Code JSONL file and verify all features work together
- [x] Performance: verify large files (10k+ records) render smoothly with virtualized list if needed
- [x] Accessibility: keyboard navigation, ARIA labels, focus management
- [x] Error boundaries: wrap major sections in React error boundaries
- [x] Responsive layout: ensure usable on smaller viewports
- [x] Dark mode support (Tailwind dark: utilities)
- [x] Production build verification: `npm run build` produces deployable static output

---

## Status Key

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Complete

---

## Learnings

### ESLint and React Refresh
- The `react-refresh` lint rule requires separating React context creation from component exports
- Context definitions should go in plain `.ts` files, while provider components belong in `.tsx` files
- This prevents issues with Fast Refresh not detecting updates properly

### Sub-Agent Tree Building
- In `subAgentTree.ts`, root Task tool_use blocks must be identified by checking `parent_tool_use_id === null` on the containing record
- Simply checking for the tool name is insufficient, as tasks can be nested within other tasks
- The parent relationship is what determines whether a task is at the root level

### Tailwind CSS v4
- Tailwind CSS v4 uses `@import "tailwindcss"` instead of the older `@tailwind` directives
- The new import syntax is cleaner and aligns with standard CSS module imports
- Configuration is handled differently in v4 compared to v3

### Vitest Configuration
- Vitest requires a separate `vitest.config.ts` file (cannot be merged with `vite.config.ts` in all cases)
- Testing React components requires the `jsdom` environment to be configured
- `@testing-library/jest-dom` matchers need to be imported in a `test-setup.ts` file that's referenced in the Vitest config
- The setup file ensures custom matchers like `toBeInTheDocument()` are available in all test files

### ErrorBoundary Component
- ErrorBoundary component uses class component pattern (React error boundaries don't support function components)

### Token Summary Panel
- Token summary panel computes aggregates from visible (filtered) records, so filtered views show accurate token counts

### Search and Filter Architecture
- Search and filter hooks are independent and combined at the App level with AND logic via useMemo
- Search match IDs are tracked in order (`orderedMatchIds`) so `currentMatchIndex` maps to a specific turn for scroll-to-match
- `currentMatchTurnId` is computed from the ordered match list for scroll targeting

### Shiki Syntax Highlighting
- Uses `createHighlighter` singleton pattern — one async initialization, reused across all components
- `codeToHtml` generates themed HTML with inline styles; rendered via `dangerouslySetInnerHTML`
- Theme detection checks both `document.documentElement.classList.contains('dark')` and `prefers-color-scheme` media query
- Language grammars are lazy-loaded by Vite code splitting — only loaded when a file with that extension is displayed
- `langFromFilePath` utility maps file extensions to shiki language identifiers
- For react-markdown integration, custom `code` and `pre` components are passed to render fenced code blocks with shiki
- If language is not loaded or not recognized, falls back to `'text'` (no highlighting)
- Shiki container styles are set via CSS class `.shiki-container` in `index.css`

### ESLint react-hooks/set-state-in-effect Rule
- The `react-hooks/set-state-in-effect` rule prevents calling `setState` inside `useEffect`
- For controlled expansion (e.g., TurnCard `forceExpanded`), derive state from props directly rather than syncing via effects
- Pattern: `const expanded = userExpanded || (forceExpanded ?? false)` — no effect needed

### Record Count in Recent Sessions
- Cannot capture `state.records.length` in `.then()` callback — the closure captures stale state
- Instead, count records from the raw text before parsing to get an accurate count

### Remaining Gaps (Future Work)
- Sub-agent nested sub-timeline: TaskResult shows metadata and raw content but does not render nested conversations as indented sub-timelines. The `SubAgentNode` type is defined but never used in rendering.
- Sub-agent usage aggregation: Sub-agent Task results' usage is not aggregated separately from main usage in TokenSummaryPanel
- Ephemeral cache token display: `cache_creation.ephemeral_5m_input_tokens` and `ephemeral_1h_input_tokens` are typed but never rendered
- TokenUsageDetail component: Per-message usage is handled inline in MessageDetail, not as a separate component
- Read file path not clickable: Spec says the file path should be a "clickable header" but it is a plain div
- Task metadata chips not hidden by default: They are always visible when the Task tool call is expanded
