# Tech Stack & Project Setup

Defines the technology choices and project configuration for the application.

## User Story

As a developer, I need a well-configured project foundation so that I can build and deploy the visualizer reliably.

## Requirements

### Application Type

Static single-page application (SPA). No server required — all processing happens client-side in the browser.

### Framework

- **React** with TypeScript
- **Vite** for build tooling and dev server

### Key Libraries

| Concern | Library | Rationale |
|---------|---------|-----------|
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Syntax highlighting | Shiki or Prism | Code block rendering for file contents |
| JSON display | react-json-view or custom | Pretty-printed expandable JSON |
| Markdown | react-markdown | Rendering text content blocks |
| State management | React context + useReducer | Simple; no external state lib needed |
| File handling | Native File API | Drag/drop + file picker |

### Project Structure

```
src/
  components/        # UI components
  model/             # Data model types and parsing
  hooks/             # Custom React hooks (useConversation, useStreaming, etc.)
  utils/             # Parsing, formatting helpers
  App.tsx            # Root component
  main.tsx           # Entry point
specs/               # Specification files (this directory)
```

### TypeScript Configuration

- Strict mode enabled
- No `any` — use explicit types or `unknown`
- Path aliases for clean imports

### Build & Deploy

- `npm run dev` — local dev server
- `npm run build` — production build (static output)
- Deployable to any static host (GitHub Pages, Netlify, Vercel, S3)

### Browser Support

Modern browsers only (Chrome, Firefox, Safari, Edge — latest 2 versions). No IE support.

## Component

Project root configuration (package.json, tsconfig.json, vite.config.ts, tailwind.config.ts).
