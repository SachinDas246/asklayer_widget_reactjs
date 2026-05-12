# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@asklayer/widget` is a React component library that embeds a floating AI chat widget on any React site. It ships as an ES module and a UMD bundle (peer-depends on React ≥ 18). The widget talks to the AskLayer Django backend at `POST /api/widget/chat/` using a Bearer API key.

Related directories (outside this repo):
- **Backend**: `C:\Projects\Business\Askito\source\backend\asklayer` — Django REST API that serves `/api/widget/chat/`
- **Demo site**: `C:\Projects\Business\Askito\source\widget_demo` — Vite + React app that consumes `@asklayer/widget` via a local `file:../widget` dependency for manual testing

## Commands

All commands run from `C:\Projects\Business\Askito\source\widget\`:

```bash
npm run build        # tsc (emit .d.ts) + vite build → dist/
```

After building, run the demo site from `C:\Projects\Business\Askito\source\widget_demo\`:

```bash
npm install          # first time only — pulls the local widget package
npm run dev          # dev server at http://127.0.0.1:5173
npm run build        # production build
npm run preview      # preview production build
```

There is no test runner configured yet.

## Build Output

`npm run build` in the widget repo runs two steps:

1. `tsc -p tsconfig.build.json` — emits `.d.ts` declaration files into `dist/`
2. `vite build` — bundles `src/index.ts` into:
   - `dist/asklayer-widget.js` (ESM)
   - `dist/asklayer-widget.umd.cjs` (UMD, for CDN/script-tag use)
   - `dist/asklayer-widget.css` (extracted styles)

`vite.config.ts` sets `emptyOutDir: false` so the `.d.ts` files from the tsc step are preserved when Vite runs. React and react-dom are externalized and must be provided by the host app.

## Architecture

### Widget (`src/`)

Each widget type lives in its own subfolder. Shared code stays at the `src/` root.

| Path | Role |
|------|------|
| `src/index.ts` | Public entry — re-exports all widget types and shared types |
| `src/types.ts` | Shared types: `AskLayerMessage`, `AskLayerSource`, `WidgetChatResponse` |
| `src/api.ts` | `sendWidgetMessage()` — thin `fetch` wrapper hitting `{apiBaseUrl}/api/widget/chat/` with Bearer auth |
| `src/hero_search/` | **HeroSearch** widget type (see below) |
| `src/hero_search/index.ts` | Barrel: exports `HeroSearchWidget` + `HeroSearchWidgetProps` |
| `src/hero_search/HeroSearchWidget.tsx` | Component + inline SVG icons |
| `src/hero_search/types.ts` | `HeroSearchWidgetProps` |
| `src/hero_search/styles.css` | Styles scoped to `.asklayer-widget` |

When adding a new widget type, create `src/<type_name>/` with the same structure: `index.ts`, component file, `types.ts`, `styles.css`. Then re-export from `src/index.ts`.

### HeroSearch UI layout

The widget has two visible regions rendered inside a single `<div class="asklayer-widget">`:

- **Search area** (always visible): a pill-shaped search bar + suggestion chip buttons. Submitting triggers the first question and opens the chat panel.
- **Chat panel** (hidden by default, toggled by `.asklayer-open`): a fixed-position floating card (360 × 580 px) that positions itself to the left of the search bar using a `panelPos` state calculated from a `getBoundingClientRect()` call on open. Contains a message history list, typing indicator, and a follow-up input.

CSS lives in `styles.css` using a flat `asklayer-*` BEM-style namespace with `--al-*` CSS custom properties for theming, all scoped under `.asklayer-widget`.

### API contract

`POST {apiBaseUrl}/api/widget/chat/`
```json
{ "message": "string", "history": [{ "role": "user|assistant", "content": "string" }] }
```
Response:
```json
{ "answer": "string", "sources": [{ "title": "string", "url": "string" }] }
```
Auth: `Authorization: Bearer <apiKey>` header.

### Demo site (`widget_demo/`)

Standalone Vite + React app. The `src/` directory needs to be created with at least `main.tsx` to mount `<AskLayerWidget>` for manual testing. The demo depends on the widget via `"@asklayer/widget": "file:../widget"`, so the widget must be built (`npm run build` in the widget dir) before running the demo.
