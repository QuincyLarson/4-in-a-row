# Architecture Notes

## Overview
Drop Four Academy is a static Vite + React + TypeScript app deployed with `HashRouter` and a relative Vite `base`, so the same build works locally and on GitHub Pages without a server fallback.

## Core runtime layers
- `src/core/**`: pure bigint bitboard engine, notation helpers, opening book, evaluation, search, and coach analysis.
- `src/workers/ai.worker.ts`: shared worker entry for medium+ battle search and post-move analysis.
- `src/content/**`: typed curriculum worlds, lesson steps, battle ladder metadata, and static strategy copy.
- `src/features/**`: SVG board scene, game arena, lesson runner, review/profile UI.
- `src/storage/**`: versioned local save envelope, migrations, import/export helpers.
- `src/audio/**`: Web Audio API synth pings and win/loss cues.

## Engine notes
- Board representation uses 49-bit column-major sentinel bitboards with bigint.
- Legal move generation and win checks are deterministic and test-covered.
- Battle AI follows the PRD priority stack:
  1. win now
  2. block now
  3. opening book
  4. transposition hit
  5. search
  6. heuristic fallback
- Higher tiers use worker-backed search; low tiers fall back to synchronous instant-feel decisions.

## Product state
- The app uses React context plus reducer-backed actions instead of a separate store library.
- A single versioned save envelope keeps settings, progress, review entries, and recent games together.
- Import/export is plain JSON; migrations sanitize partial or stale envelopes.

## Rendering and feel
- Main play uses inline SVG, not canvas.
- Chips render behind the board shell and animate with CSS transforms.
- Hover and keyboard preview share the same column-selection state.
- Human and CPU chips use different motifs so the board is not color-only.

## Testing
- `src/tests/core/board.test.ts`: parsing, move legality, win detection, and board helpers.
- `src/tests/core/search.test.ts`: tactical prechecks, opening-book hits, legal AI moves, and deterministic random simulations.
- `src/tests/core/coach.test.ts`: move-quality classification sanity.
