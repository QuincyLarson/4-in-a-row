# Learn Drop 4 Implementation Plan

## Goal
Build a polished static React/TypeScript learning app that teaches and drills Four in a Row strategy fully client-side, with deterministic board logic, worker-backed AI, SVG-first presentation, Web Audio API SFX, and localStorage persistence.

## Source of truth
- [`docs/prd.md`](/Users/m/Documents/code/4-in-a-row/docs/prd.md)
- [`svg-assets/ASSET_GUIDE.md`](/Users/m/Documents/code/4-in-a-row/svg-assets/ASSET_GUIDE.md)

## Delivery phases
1. Scaffold Vite + React + TypeScript, HashRouter, test tooling, theme tokens, and layout shell.
2. Build the perfect slice:
   - pure bigint bitboard engine
   - responsive SVG board
   - hover / keyboard preview
   - satisfying drop animation + impact ping + win highlight
   - human and CPU synth pings
   - worker-backed Warmup Bot and Block Baron
   - one lesson flow, one boss, one saved profile
   - GitHub Pages-safe build
3. Expand to v1:
   - curriculum map for worlds 0 through 8 plus capstone
   - battle ladder and boss gauntlet
   - review queue with concept tagging
   - coach analysis and post-game review
   - sandbox, profile, settings, import/export
   - accessibility modes and static strategy pages
4. Verify:
   - board / AI / save tests
   - random simulation guardrails
   - production build
   - GitHub Pages workflow

## Architecture decisions
- Router: `HashRouter` to avoid GitHub Pages refresh issues.
- State: React context + reducer backed by a single versioned save envelope.
- Engine: pure TypeScript bigint bitboards with column-major sentinel layout.
- AI: synchronous tactical tiers on main thread for the easiest bot, shared worker for medium+ battle search and coach analysis.
- Content: typed TypeScript data objects rather than ad hoc JSX so lessons, bosses, review, and strategy copy stay content-driven.
- Rendering: inline SVG components using the provided asset motifs; no canvas for the main board.

## Initial unspecified choices
- Import/export ships in v1 because it is cheap once the save envelope exists.
- Opening book is a small authored TypeScript map for predictable bundle shape.
- Coach analysis runs post-move and post-game asynchronously; no always-on deep per-move analysis in the main board UI.
- Curriculum content is compact but complete; where exact exercise counts are unspecified, each world will include an intro, lesson set, practice, checkpoint, and boss using reusable drill patterns.

## Commit plan
1. `chore: scaffold vite react typescript app with lint test and gh-pages base config`
2. `feat: add design tokens theme and global layout shell`
3. `feat: implement pure connect four board model and legal move generation`
4. `test: add exhaustive win detection and board parsing tests`
5. `feat: render responsive inline svg board frame and chip layers`
6. `feat: add hover preview keyboard controls and chip drop animation`
7. `feat: add ai worker with tactical prechecks and synth game feel`
8. `feat: build lesson runner progress save and early curriculum slice`
9. `feat: expand curriculum ai ladder review and sandbox`
10. `feat: add profile settings strategy pages accessibility and pages deploy`
11. `docs: add README and architecture notes`
