# Learn Drop 4

Learn Drop 4 is a fully client-side Connect 4 learning site built with Vite, React, and TypeScript. It ships a typed curriculum, AI ladder, SVG board rendering, Web Audio API synth SFX, local-only persistence, and a GitHub Pages deployment workflow.

## Stack
- Vite
- React
- TypeScript
- HashRouter for Pages-safe routing
- Vitest
- Inline SVG + CSS animation
- Web Workers for medium+ AI and analysis

## Local development
```bash
npm install
npm run dev
```

The app uses a relative Vite `base` and `HashRouter`, so local and GitHub Pages builds share the same routing model.

## Verification
```bash
npm run lint
npm test
npm run test:coverage
npm run build
npm run check
```

## Deployment
1. Push the repo to GitHub.
2. In repository settings, enable GitHub Pages and select “GitHub Actions” as the source.
3. Push to `main` or run the `Pages` workflow manually.
4. The workflow runs `npm run check`, uploads `dist/`, and deploys it to Pages.

## App routes
- `#/` landing page
- `#/play` instant play
- `#/learn` curriculum map
- `#/lesson/:lessonId` lesson runner
- `#/battle` AI ladder
- `#/review` review queue
- `#/profile` local settings and import/export
- `#/sandbox` open board
- `#/strategy/:slug` static strategy pages
- `#/about`
- `#/credits`

SEO-friendly aliases from the PRD also resolve:
- `#/play/connect-4-online`
- `#/learn/connect-4-course`

## Architecture summary
- `src/core/**` contains the pure bigint board engine, evaluation, search, and coach analysis.
- `src/workers/ai.worker.ts` runs higher-tier search and analysis off the main thread.
- `src/content/**` holds authored worlds, lessons, battle ladder metadata, and strategy copy.
- `src/storage/**` provides the versioned save envelope, migrations, legacy save-key fallback, and import/export helpers.
- `src/features/**` contains the SVG board, lesson runner, battle arena, and route-facing UI.

More detail lives in [`docs/architecture-notes.md`](/Users/m/Documents/code/4-in-a-row/docs/architecture-notes.md).

## Product notes
- Core gameplay, AI, lessons, review, persistence, rendering, and SFX are all client-side.
- Main board visuals are inline SVG only.
- Sound effects are synthesised with the Web Audio API only.
- Progress persists in localStorage with a versioned envelope and migration path.
- The board supports hover preview, keyboard input, reduced motion, pattern mode, high contrast, mute, import/export, undo in sandbox, and a playable review queue.
