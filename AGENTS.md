## Build & Run

- Install: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Preview production build: `npm run preview`

## Validation

Run these after implementing to get immediate feedback:

- Tests: `npm test`
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`

## Operational Notes

- Static SPA — no backend server. All processing happens client-side.
- Vite dev server with HMR for development.
- Build output is static files deployable to any static host.

### Codebase Patterns

- React + TypeScript with strict mode. No `any` — use explicit types or `unknown`.
- Tailwind CSS for styling (utility-first).
- State management via React context + useReducer (no external state library).
- Project structure:
  - `src/components/` — UI components
  - `src/model/` — Data model types and parsing logic
  - `src/hooks/` — Custom React hooks
  - `src/utils/` — Parsing, formatting helpers
- Specs live in `specs/` — one markdown file per topic of concern.