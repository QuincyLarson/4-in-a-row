# PRD — Drop Four Academy
**Version:** v1.0  
**Date:** 2026-03-23  
**Type:** Product Requirements Document  
**Target:** Static client-side app deployable to GitHub Pages  
**Stack:** TypeScript + React + Vite + inline SVG + Web Audio API + localStorage  
**Codename:** `drop-four-academy`

---

## 1. Product summary

Build a browser-based, no-login, no-server learning app that teaches a player the rules of Connect 4 immediately and then walks them through a tightly-designed 10-hour curriculum aimed at **near-perfect human play**, not theoretical perfection.

The experience should feel like:
- **freeCodeCamp for progression**
- **Duolingo for drills and encouragement**
- **a polished arcade toy for moment-to-moment feel**
- **a smart tactics trainer for board understanding**

Every important interaction runs client-side:
- game logic
- AI opponents
- tutorials
- spaced repetition
- progress persistence
- audio
- SVG rendering and animation

The app must feel responsive and game-like:
- immediate input response
- extremely fast AI moves
- satisfying chip drops
- small celebratory effects on success
- confetti for wins and boss clears
- short Arkanoid-style pings:
  - **higher pitch when the human moves**
  - **lower pitch when the CPU moves**

The public brand should avoid using the trademarked game name as the product name. Use a generic public name such as **Drop Four Academy** or **Four in a Row Academy**. “Connect 4” should only appear in editorial/SEO copy where legally appropriate.

---

## 2. Why this product should exist

Public browser experiences already cover three things reasonably well:
1. playing the game online,
2. solving positions,
3. scattered written strategy advice.

But they are rarely assembled into one cohesive learning journey.

Research inputs strongly suggest the gap is not “can people play Connect 4 online?” but “can people learn it interactively, with explanation, feedback, progression, and replay?” Modern public guides repeatedly emphasize center control, threat creation, and blocking; more advanced material emphasizes double threats, pattern recognition, odd/even threats, and zugzwang. Solver sites exist and can compute exact outcomes with alpha-beta search, but they are not structured curricula. A book also exists, but the category is still sparse enough that a polished browser-first curriculum remains a real opening.

### Research inputs used here
- Victor Allis, *A Knowledge-based Approach of Connect-Four* (1988)
- Pascal Pons, Connect 4 Solver
- Reader’s Digest strategy article
- Base Camp Math strategy overview
- Paper Games advanced guide
- John Tromp’s Connect Four pages / playground

See **Appendix G** for a short source list.

---

## 3. Product vision

### Vision statement
**Help a motivated player become “as strong as a human can reasonably get in 10 hours” through interactive lessons, AI battles, review, and delightfully responsive gameplay.**

### Product promise
By the end of the guided path, a learner should:
- know the rules instantly,
- almost never miss a 1-move win,
- almost never miss a required block,
- value the center correctly,
- reliably create and spot double threats,
- understand the practical meaning of odd/even access to key squares,
- convert many winning positions that casual players throw away,
- hold their own against a strong client-side AI.

### Non-goals
This v1 does **not** aim to:
- strongly solve every position in-browser,
- ship networked multiplayer,
- add accounts/auth/social features,
- support UGC/custom lesson authoring in the UI,
- become a general game engine for many abstract games.

---

## 4. Product principles

1. **Teach by doing.**  
   Every concept is demonstrated on a board before it is explained in prose.

2. **One idea per screen.**  
   No giant lectures. Small concept cards, then immediate interaction.

3. **Fast is a feature.**  
   AI thinking should feel instantaneous. Any heavy work must go to Web Workers.

4. **Never shame the player.**  
   Use coach language like “This move gave away an odd threat” instead of “Wrong.”

5. **Motion should clarify, not decorate.**  
   Animations must explain gravity, threats, wins, and mastery—not just look flashy.

6. **Everything important stays client-side.**  
   No server. No auth. localStorage only. Easy GitHub Pages deployment.

7. **Simple tech, strong craft.**  
   Inline SVG, CSS transforms, small pure TypeScript modules, deterministic tests.

---

## 5. Target users

### Primary
**Curious strategy learners**
- Knows the game or can learn it in minutes
- Wants to get “surprisingly good”
- Likes structured progression

### Secondary
**Puzzle-first learners**
- Enjoys tactics drills more than free play
- Wants short sessions and streaks

### Tertiary
**Teachers / parents / hobbyists**
- Wants a clean browser experience
- Wants local-only, easy-to-share deployment
- Appreciates educational framing

---

## 6. User stories

### Core learner stories
- As a new player, I want to learn the rules in under 3 minutes.
- As a learner, I want the app to show me *why* a move matters.
- As a learner, I want a path from beginner to advanced without needing a book or solver.
- As a learner, I want to battle AIs that get stronger with me.
- As a learner, I want mistakes resurfaced later until I stop making them.
- As a learner, I want progress saved automatically with no account.

### Power learner stories
- As an advanced learner, I want targeted drills on parity, diagonals, and double threats.
- As a strong player, I want harder bosses and sparring mode.
- As a curious player, I want post-game review with better alternatives.

### Accessibility/user comfort stories
- As a colorblind player, I want piece patterns that do not rely on color only.
- As a motion-sensitive user, I want reduced motion.
- As a user in a quiet space, I want sound toggles.
- As a keyboard user, I want full keyboard play.

---

## 7. Success criteria

Because v1 is fully client-side with no backend, there are two classes of success metrics:

### Product success (qualitative + local measurable)
- Player can start game from landing page in under **2 clicks**
- Player reaches first interactive move in under **10 seconds**
- Rules lesson completion under **3 minutes**
- 10-hour guided path available end-to-end
- Every lesson has at least one interactive board state
- Every world ends with an AI boss
- Progress resumes after refresh and browser restart

### UX/performance success
- Human input feedback: **<16 ms**
- Animation frame rate: **60 fps target**
- AI move selection:
  - Easy/medium AIs: **p95 < 50 ms**
  - Hard/boss AIs: **p95 < 150 ms**
- Initial app load on GitHub Pages: **<2.5s on modern broadband**
- Zero illegal AI moves
- No board desync bugs after 1,000 automated simulated games

### Learning success (local-only)
After the capstone, the user should score:
- **95%+** on “win in 1 / block in 1”
- **85%+** on center/shape valuation drills
- **80%+** on double-threat drills
- **70%+** on parity/odd-even drills
- Positive record against at least one upper-tier AI

---

## 8. Core product loops

### 8.1 Learn loop
Concept card → guided example → 3–6 drills → short reflection → unlock next concept

### 8.2 Battle loop
Choose lesson AI or boss → play game → instant feedback → review turning point → earn XP/stars

### 8.3 Review loop
Miss concept → add tagged puzzle to review queue → surface later → mastery improves → concept marked stable

### 8.4 Progress loop
Complete lessons → gain stars/XP → unlock bosses/worlds → finish capstone → enter sparring mode

---

## 9. Information architecture

### Top-level routes
- `/` — landing page
- `/play` — instant play
- `/learn` — curriculum map
- `/lesson/:lessonId` — lesson player
- `/battle` — AI ladder / boss gauntlet
- `/review` — spaced repetition queue
- `/profile` — local progress + settings + export/import
- `/about` — what this is / privacy / offline-first
- `/strategy/*` — static SEO content pages
- `/sandbox` — open board / free analysis tools
- `/credits` — sources + acknowledgements

### Primary nav
- Learn
- Battle
- Review
- Play
- Settings

---

## 10. Curriculum design (10-hour path)

### Overview
The curriculum is a structured ladder of worlds. Every world has:
- 1 short intro
- 3–6 interactive lessons
- 1 practice set
- 1 boss battle
- 1 review checkpoint

### Total target time: **10 hours**
This is not “10 hours of reading.” It is 10 hours including play, drills, review, and bosses.

---

### World 0 — Zero to First Move
**Time:** 0.25h (15 min)  
**Goal:** teach the rules and get the learner playing immediately

#### Lessons
1. The board and gravity
2. Three win directions: vertical, horizontal, diagonal
3. Your first win
4. Your first required block

#### Battle
- “Warmup Bot” — legal moves only, light center bias

#### Exit criteria
- Complete 2 wins
- Correctly block 3 immediate threats

---

### World 1 — Never Miss the Obvious
**Time:** 0.75h (45 min)  
**Goal:** eliminate beginner blunders

#### Concepts
- Win in 1
- Block in 1
- Scan order before every move:
  1. Can I win now?
  2. Must I block now?
  3. If neither, improve shape

#### Exercise types
- Timed spot-the-win
- Timed must-block
- Mixed “win or block?” drill

#### Boss
- **Block Baron**
  - punishes missed immediate tactics
  - no deep strategy, just perfect tactical hygiene

#### Exit criteria
- 95%+ on immediate tactics checkpoint

---

### World 2 — Center Control and Column Value
**Time:** 1.0h  
**Goal:** teach why the center is special and how bad openings snowball

#### Concepts
- Center column participates in the most lines
- Adjacent columns are generally better than edge columns
- Early moves should improve future flexibility, not just occupy space

#### Exercises
- “Best opening move” drills
- “Which position is better?” side-by-side comparisons
- Guided games where edge openings are punished

#### Boss
- **Center Sentinel**
  - strongly prefers center
  - punishes edge-first play

#### Exit criteria
- Learner consistently opens center unless forced otherwise

---

### World 3 — Build Threats, Don’t Just React
**Time:** 1.0h  
**Goal:** transition from reactive play to proactive play

#### Concepts
- What counts as a threat
- Real threats vs fake threats
- Forcing your opponent to respond
- Supported squares and hidden preparation

#### Exercises
- Create-a-threat in 1 move
- Create-a-threat in 2 moves
- “Which move forces a response?”

#### Boss
- **Threat Smith**
  - sets traps
  - not strong at parity yet

#### Exit criteria
- 80%+ on create-a-threat drills

---

### World 4 — Double Threats and Forks
**Time:** 1.25h  
**Goal:** teach the single most practical advanced idea

#### Concepts
- Double threats win because one block is not enough
- Horizontal + vertical forks
- Diagonal + horizontal forks
- Disguised forks
- Why some “good-looking” attacking moves are actually too slow

#### Exercises
- Find the fork
- Set the fork
- Prevent the fork
- Replay famous trap patterns

#### Boss
- **Forksmith**
  - decent tactician
  - actively hunts double threats

#### Exit criteria
- 80%+ on double-threat recognition
- Win or draw against Forksmith in at least one attempt

---

### World 5 — Diagonals, Supports, and Hidden Geometry
**Time:** 1.0h  
**Goal:** make diagonal patterns legible and practical

#### Concepts
- Supported diagonals
- Staircases and zig-zags
- Why diagonals are harder to see and more dangerous
- When to prefer vertical vs horizontal vs diagonal pressure

#### Exercises
- Highlight potential diagonals
- Fill the support square
- “Which diagonal is actually playable?”

#### Boss
- **Diagonal Djinn**
  - specializes in hidden diagonal threats

#### Exit criteria
- 75%+ on diagonal construction and defense

---

### World 6 — Odd/Even Threats and Practical Parity
**Time:** 1.75h  
**Goal:** deliver the hardest concept in a humane, visual way

#### Concepts
- Rows are not equally available
- You do not own a square just because it is part of your line
- Odd/even access changes who can actually claim a critical cell
- Practical zugzwang: making the opponent fill under your winning square
- “Poisoned” setup moves that give away access

#### Teaching strategy
This world must be the most visual and patient:
- parity overlays
- row coloring
- gravity-first explanations
- repeated mini-scenarios
- no theorem-heavy wording

#### Exercises
- Who gets this square?
- Which move gives away parity?
- Force them underneath
- Endgame access drills

#### Boss
- **Parity Phantom**
  - strongest conceptual boss
  - wins many games by forcing bad support moves

#### Exit criteria
- 70%+ on parity drills
- Clear evidence in post-game analysis that player no longer gives away obvious odd threats

---

### World 7 — Openings and Anti-Blunder Structures
**Time:** 1.0h  
**Goal:** teach practical openings without requiring giant memorization

#### Concepts
- Good first move: center
- Good responses to center openings
- Common practical traps in first 6–10 plies
- Symmetry and mirror play
- How to avoid “looks fine but is lost later” openings

#### Exercises
- Choose the best response
- Opening mini-lines
- “Which side is happier after this sequence?”

#### Boss
- **Mirror Master**
  - uses small opening book
  - punishes careless early structures

#### Exit criteria
- 80%+ on curated opening decisions
- Learner can explain why the center opening matters

---

### World 8 — Conversion, Defense, and Near-Perfect Sparring
**Time:** 1.25h  
**Goal:** turn strong understanding into reliable results

#### Concepts
- Converting winning positions without rushing
- Salvaging draws
- Defensive patience
- Trading one threat for a better one
- Recognizing when to simplify
- Avoiding self-traps under time pressure

#### Exercises
- Convert this win
- Save this draw
- “What is the cleanest move?”
- Mistake review from earlier worlds

#### Boss
- **Endgame Engine**
  - strongest production AI in battle mode
  - opening book + tactical search + parity-aware eval

#### Exit criteria
- Positive or even record over a short set against upper-tier AI
- 80%+ conversion score on curated endgame set

---

### Capstone — The 30-Position Exam + Final Gauntlet
**Time:** 0.75h  
**Goal:** certify practical mastery

#### Part 1 — 30 position test
- 8 win-in-1 / block-in-1
- 6 center/shape valuation
- 6 threat/fork
- 5 diagonal support
- 5 parity/endgame access

#### Part 2 — Gauntlet
- Beat or draw three bosses in sequence

#### Outcome badges
- Bronze: strong casual
- Silver: advanced
- Gold: near-perfect human track complete

---

## 11. Lesson format

Each lesson should use the same dependable structure.

### 11.1 Lesson screen anatomy
- Header: lesson title, world, estimated time
- Left/main: SVG board and overlays
- Right/bottom: coach panel
- Footer: progress dots, restart, hint, settings

### 11.2 Step types
1. **Concept**
   - tiny explainer
   - annotated board
2. **Guided move**
   - user must click the right column
   - coach explains result
3. **Drill**
   - multiple quick positions
4. **Puzzle**
   - deeper position, 1–3 best moves accepted depending on design
5. **Mini-battle**
   - short AI test
6. **Boss**
   - full game with concept pressure

### 11.3 Hint hierarchy
Hints should escalate:
1. “Look at the center”
2. “You need a threat, not just a move”
3. “This move forces a block”
4. Final reveal only if the user opts in

---

## 12. AI design

The product needs **two AI systems** that share the same board engine:

### 12.1 Battle AI
Purpose:
- feel immediate
- provide progressive difficulty
- play convincingly
- reinforce concepts

### 12.2 Coach/Analysis AI
Purpose:
- explain
- review
- classify mistakes
- run slightly deeper, asynchronously, after moves or games

This split is important:
- **battle AI optimizes for feel**
- **coach AI optimizes for insight**

---

## 13. AI levels

### Level 0 — Warmup Bot
- legal moves
- mild center preference
- misses many tactics
- useful for first lesson only

### Level 1 — Block Baron
- immediate win/block awareness
- otherwise heuristic choice
- very fast

### Level 2 — Center Sentinel
- immediate tactics
- strong center bias
- 2-ply or 3-ply search

### Level 3 — Threat Smith
- 4-ply search
- threat-building preference
- avoids obvious self-traps

### Level 4 — Forksmith
- stronger 4–6 ply selective search
- fork detection
- move ordering tuned toward tactical lines

### Level 5 — Diagonal Djinn
- stronger positional eval
- diagonal pattern bonus
- better support-square reasoning

### Level 6 — Parity Phantom
- parity-aware evaluation
- deeper search budget
- selective pruning on tactical forcing lines

### Level 7 — Mirror Master
- small opening book
- deeper early-game precision
- strong symmetry response

### Level 8 — Endgame Engine
- iterative deepening in worker
- opening book
- transposition table
- selective threat-space ideas
- still capped to feel instant

### Analysis Mode — Oracle
- not the default battle opponent
- deeper background search for explanation
- can label moves:
  - best
  - good
  - inaccuracy
  - mistake
  - blunder
- only runs after move/game or on explicit request

---

## 14. AI technical approach

### 14.1 Board representation
Use a compact **bitboard-based** representation for speed.

Recommended implementation:
- 49-bit column-major bitboard layout with sentinel bits
- one bitboard per side + occupancy helpers
- pure TypeScript using `bigint`

Why:
- very fast legal move generation
- cheap win detection with bit shifts
- deterministic and testable
- standard approach in strong Connect 4 engines

### 14.2 Search
Use:
- negamax / alpha-beta
- center-first move ordering
- immediate tactical prechecks
- iterative deepening for harder AIs
- transposition table
- killer move / history heuristic optional
- aspiration windows optional for harder tiers

### 14.3 Evaluation
Evaluation should combine:
- immediate win/loss checks
- center weight
- open three / supported three counts
- double-threat potential
- opponent immediate reply danger
- diagonal support value
- parity-aware bonuses and penalties in later tiers

### 14.4 Opening book
Ship a compact, curated opening book for:
- first move
- common early responses
- selected practical traps
- boss lines

Do **not** try to embed a full massive solution database in v1.

### 14.5 Worker model
AI search must run in a Web Worker for medium+ tiers.

Main thread responsibilities:
- input
- animation
- SVG rendering
- audio
- coaching UI

Worker responsibilities:
- search
- analysis
- caching

### 14.6 Instant-feel budget
Design for these budgets:
- easy bot: 0–10 ms
- mid bot: 5–30 ms
- boss bot: 20–120 ms
- coach analysis: background, non-blocking, may continue after move lands

### 14.7 Fallback hierarchy
For every AI move:
1. can win now?
2. must block now?
3. opening book hit?
4. transposition table hit?
5. search
6. fallback heuristic move if budget exceeded

---

## 15. Game feel and motion

### 15.1 Input feel
- hover a column → ghost chip appears
- click/tap/keyboard confirm → chip locks instantly
- chip falls with a clear ease-out and tiny bounce
- CPU chip should feel equally crisp, not sluggish

### 15.2 Animation principles
All important animations are SVG- and CSS-based:
- translate for falling chips
- scale micro-bounce on impact
- opacity/scale for hints and badges
- line glow for winning four
- burst confetti for wins and boss clears
- pulse ring on landing cell
- very slight board nudge on boss win/loss (disabled in reduced motion)

### 15.3 Sound design
Use Web Audio API synthesised tones only. No audio files required.

#### Human move
- high arcade ping
- target range ~ 880–1046 Hz
- 35–50 ms
- slight downward decay

#### CPU move
- lower arcade ping
- target range ~ 392–523 Hz
- 35–50 ms
- softer attack

#### Win
- bright 3-note arpeggio

#### Loss
- soft low double-tone

#### UI confirm
- tiny click or pop

### 15.4 Celebration tiers
- Lesson correct: sparkle + tiny ping
- Drill streak: badge pop
- Game win: confetti
- Boss win: bigger confetti + crown pulse + progress unlock animation
- Capstone clear: full-screen-but-lightweight SVG celebration

---

## 16. Visual design direction

### Tone
- friendly
- sharp
- modern
- slightly retro arcade
- not toy-like
- not overdesigned

### Recommended palette
Avoid copying classic red/yellow/blue toy trade dress.

Suggested palette:
- Background: deep navy / charcoal
- Board: slate blue / ink
- Human disc: warm coral / amber
- CPU disc: cool indigo / cyan
- Accent: mint / electric blue
- Success: lime-mint
- Warning: soft gold
- Error: muted red

### Accessibility
Offer alternate piece patterns:
- human disc = stripe/slash motif
- CPU disc = ring/dot motif

---

## 17. SVG-only rendering model

### Core rule
Everything visible in play should render using **inline SVG**:
- board frame
- holes
- chips
- overlays
- arrows
- coach callouts
- badges
- confetti
- boss icons

### Why inline SVG
- easy DOM animation
- crisp at all sizes
- easy accessibility labels
- no canvas text blurriness
- simple CSS class targeting

### Rendering stack
Recommended board scene:
1. background layer
2. guide grid layer
3. chip layer
4. board frame layer (with hole cutouts)
5. overlay layer
6. celebration layer

### Board model
- 7 columns × 6 rows
- responsive sizing
- maintain aspect ratio
- minimum tap target on mobile: 44px

---

## 18. Feature set

### 18.1 MVP (must ship)
- playable local game vs AI
- full 10-hour curriculum
- 8 themed worlds + capstone
- AI ladder with named bosses
- local progress save
- lesson engine driven by JSON/TS data
- review queue
- SVG animations
- arcade pings
- GitHub Pages deployment
- keyboard + touch support
- reduced motion and sound toggle

### 18.2 Strong v1.1 candidates
- free-play board editor / sandbox
- per-move coach suggestions
- import/export progress JSON
- static article pages for SEO
- daily challenge
- puzzle streak mode

### 18.3 Out of scope
- multiplayer
- auth
- cloud sync
- leaderboards
- account recovery
- backend analytics

---

## 19. Lesson engine / content system

Lessons and puzzles must be content-driven, not hardcoded screen-by-screen.

### 19.1 Recommended lesson data model
```ts
export type Side = 'human' | 'cpu';

export interface PositionSpec {
  // 1-based columns for readability in authored content
  moves: number[];
  next: Side;
}

export interface CoachNote {
  id: string;
  conceptTag:
    | 'rules'
    | 'win-in-1'
    | 'block-in-1'
    | 'center'
    | 'threat'
    | 'double-threat'
    | 'diagonal'
    | 'parity'
    | 'opening'
    | 'endgame';
  title: string;
  body: string;
}

export interface DrillStep {
  id: string;
  type: 'concept' | 'guided' | 'drill' | 'puzzle' | 'battle' | 'boss';
  title: string;
  prompt: string;
  position?: PositionSpec;
  acceptedColumns?: number[];
  coachNotes?: CoachNote[];
  hintColumns?: number[];
  successMessage?: string;
  failureMessage?: string;
}

export interface LessonDef {
  id: string;
  worldId: string;
  slug: string;
  title: string;
  estMinutes: number;
  tags: string[];
  prerequisites: string[];
  steps: DrillStep[];
  bossAiId?: string;
}
```

### 19.2 Why 1-based authored columns
- matches how humans talk about columns
- easier for content writing
- convert to 0-based internally

### 19.3 Puzzle tagging
Every puzzle must carry tags:
- center
- immediate-tactics
- fork
- diagonal
- parity
- opening
- endgame
- defense

This powers the review queue and progress heatmap.

---

## 20. Review and spaced repetition

### 20.1 Principle
Missed concepts should return later automatically.

### 20.2 Triggers for queueing a review item
- missed puzzle
- hint used twice
- blunder in battle
- repeated pattern failure

### 20.3 Review queue structure
- today due
- overdue
- mastered
- trouble spots

### 20.4 Progress state
For each concept tag, track:
- attempts
- correct
- streak
- last seen
- confidence score

### 20.5 UX
Review should feel lightweight:
- 3–7 positions
- 2–5 minutes
- immediate clear reward
- visible “you fixed this” moment

---

## 21. Progression, stars, XP, and encouragement

### 21.1 Reward system
- stars for lesson performance
- XP for completion
- streak flame optional but gentle
- boss badges
- mastery ring around concept icons

### 21.2 Do not overgameify
Avoid:
- manipulative countdowns
- fake scarcity
- noisy reward spam

Use:
- clear forward motion
- tasteful celebration
- “You unlocked parity”
- “You no longer miss basic forks”

### 21.3 Failure framing
Bad:
- “You failed”
- “Wrong move”

Good:
- “That move lets your opponent claim the key odd square.”
- “You built a threat, but theirs was immediate.”

---

## 22. Play modes

### Learn
Linear guided curriculum.

### Battle
Pick AI, length, and assistance level.

### Review
Spaced repetition drills.

### Sandbox
Open board + move undo + optional coach overlay.

### Capstone
Locked until enough worlds complete.

---

## 23. Post-game review

After any battle:
- show result
- show turning point
- highlight first major mistake from each side
- offer “Replay with coach”
- offer “Practice this pattern”

### Review cards
- “Missed win on move 11”
- “Gave up center too early”
- “Allowed double threat”
- “Parity slip in column 5”

This is crucial: the player should leave a loss feeling taught, not punished.

---

## 24. Accessibility and inclusive design

### Required
- keyboard-only support
- visible focus states
- aria labels on controls
- optional piece patterns
- reduced motion mode
- sound mute
- high contrast mode
- captions/transcripts for sound cues in settings copy

### Keyboard controls
- Left / Right: move preview column
- Enter / Space: drop chip
- H: hint
- R: restart
- U: undo in allowed modes
- M: mute

### Reduced motion behavior
- remove bounce and board shake
- keep only essential fades/translates
- confetti reduced to small sparkle burst

---

## 25. Technical architecture

### 25.1 Recommended stack
- **Vite**
- **React**
- **TypeScript**
- **React Router** (or equivalent static-friendly router)
- **Vitest**
- **Testing Library**
- **ESLint + Prettier**
- optional lightweight state store if useful, but keep dependencies minimal

### 25.2 Project structure
```txt
src/
  app/
    routes/
    layout/
    state/
  core/
    board/
      bitboard.ts
      moves.ts
      winCheck.ts
      notation.ts
    ai/
      profiles.ts
      eval.ts
      search.ts
      openingBook.ts
      worker.ts
    coach/
      analyze.ts
      conceptTags.ts
  content/
    worlds/
    lessons/
    puzzles/
  features/
    board/
    battle/
    lesson-player/
    review/
    profile/
    settings/
  svg/
    symbols/
    components/
    animations/
  audio/
    synth.ts
    sfx.ts
  storage/
    localSave.ts
    migrations.ts
  styles/
    tokens.css
    motion.css
  tests/
public/
  favicon.svg
```

### 25.3 State boundaries
- app UI state
- board/game state
- lesson state
- review queue
- save data
- settings

### 25.4 localStorage
Use a single versioned save envelope:
```ts
export interface SaveEnvelopeV1 {
  version: 1;
  profile: {
    createdAt: string;
    displayName?: string;
  };
  settings: {
    soundEnabled: boolean;
    reducedMotion: boolean;
    colorMode: 'default' | 'pattern';
    cpuMoveSpeed: 'instant' | 'snappy';
  };
  progress: {
    completedLessonIds: string[];
    lessonStars: Record<string, number>;
    bossWins: string[];
    worldUnlocks: string[];
    conceptScores: Record<string, number>;
    capstonePassed: boolean;
  };
  review: {
    duePuzzleIds: string[];
    lastGeneratedAt?: string;
  };
  history: {
    recentGames: Array<{
      id: string;
      aiId: string;
      result: 'win' | 'loss' | 'draw';
      finishedAt: string;
      plyCount: number;
    }>;
  };
}
```

### 25.5 Save migration
Always include migration utilities so future versions can update old save data cleanly.

---

## 26. Performance requirements

### Rendering
- no React rerender storm on each animation frame
- use transforms, not layout-thrashing position changes
- memoize board cell geometry

### AI
- worker-based search
- cache repeated positions
- opening book on load or lazy-load from static asset
- cheap tactical checks before full search

### Bundle
- keep dependencies lean
- prefer hand-authored SVG over image libraries
- avoid heavyweight animation frameworks
- avoid monolithic sound libraries

---

## 27. SEO and static content plan

The product itself is app-first, but discoverability should come from static pages around search intent.

### Primary content clusters
- how to win connect 4
- connect 4 strategy
- connect 4 best first move
- connect 4 double threat
- connect 4 parity explained
- play connect 4 online
- connect 4 solver vs human strategy
- connect 4 tips for beginners

### Static pages to include
- `/strategy/how-to-win-connect-4`
- `/strategy/connect-4-best-first-move`
- `/strategy/connect-4-double-threats`
- `/strategy/connect-4-parity-explained`
- `/play/connect-4-online`
- `/learn/connect-4-course`

### SEO note
Use the public product name in branding, and “Connect 4” in editorial/educational copy where appropriate.

---

## 28. Quality assurance

### Unit tests
- move legality
- win detection
- board state parsing
- opening book lookups
- evaluation sanity
- save migration

### Property tests / simulation
- 1,000+ random legal games
- AI never produces illegal columns
- terminal positions always detected
- no dropped animation mismatch with board state

### Snapshot / component tests
- lesson screens
- progress map
- boss banner
- reduced motion variants

### Manual QA checklist
- mobile portrait
- mobile landscape
- desktop keyboard-only
- mute on/off
- reduced motion
- save/refresh/restore
- capstone unlocks correctly
- GitHub Pages base path works

---

## 29. Acceptance criteria

### Learning experience
- User can finish rules tutorial in under 15 minutes, ideally under 3 for the critical path
- Full curriculum exists and is navigable
- Each world has at least one battle and one boss

### Gameplay
- Hover preview works on desktop
- Tap-to-drop works on mobile
- Animations are SVG-driven
- Sound effects play only after user interaction and can be muted
- Winning four is visually highlighted

### Persistence
- Refresh preserves lesson progress, settings, and recent history
- Clear “reset progress” and “export progress” actions exist

### Deployment
- `npm run build` outputs a static site
- deployable to GitHub Pages with no backend changes
- correct relative paths for base URL

---

## 30. Risks and mitigations

### Risk 1 — AI is strong but too slow
**Mitigation:** split battle AI and coach AI; use opening book, worker search, hard budgets

### Risk 2 — Parity lessons feel too abstract
**Mitigation:** use overlays, repeated micro-scenarios, “who gets this square?” framing

### Risk 3 — Curriculum becomes text-heavy
**Mitigation:** enforce one-concept-per-screen and board-first demonstrations

### Risk 4 — SVG animation becomes hard to manage
**Mitigation:** build a tiny animation utility layer; standardize IDs/classes and transform origins

### Risk 5 — localStorage schema becomes messy
**Mitigation:** single envelope + migrations + strict types

### Risk 6 — Trademark confusion
**Mitigation:** use a generic product name; keep trademarked term to descriptive editorial contexts

---

## 31. Implementation phases

### Phase 1 — Core engine and single polished game loop
- board model
- rules
- SVG board
- chip drop
- human vs simple AI
- sound effects
- win highlight
- local save

### Phase 2 — Lesson engine and first 3 worlds
- JSON lesson runner
- coach panel
- hints
- review queue basics

### Phase 3 — advanced curriculum + bosses
- parity world
- opening world
- endgame world
- capstone

### Phase 4 — polish and static pages
- SEO pages
- accessibility pass
- reduced motion
- export/import progress
- GitHub Pages workflow

---

## 32. Atomic commit plan

These are intentionally small, reviewable commits suitable for Codex-assisted implementation.

1. **chore: scaffold vite react typescript app with lint test and gh-pages base config**
2. **feat: add design tokens theme and global layout shell**
3. **feat: implement pure connect four board model and legal move generation**
4. **test: add exhaustive win detection and board parsing tests**
5. **feat: render responsive inline svg board frame and chip layers**
6. **feat: add hover preview keyboard controls and chip drop animation**
7. **feat: add simple local human-vs-human play flow**
8. **feat: add ai worker with warmup bot and tactical prechecks**
9. **feat: add post-move win highlight confetti and synth sfx**
10. **feat: persist settings and progress in versioned localStorage envelope**
11. **feat: build lesson runner with content-driven steps**
12. **feat: author world 0 and world 1 lessons and drills**
13. **feat: add review queue and concept tagging**
14. **feat: implement center sentinel and threat smith ai profiles**
15. **feat: author worlds 2 through 4 and boss battles**
16. **feat: implement diagonal and parity evaluation heuristics**
17. **feat: author worlds 5 through 6 with overlays and parity visualizations**
18. **feat: add opening book lookup and mirror master boss**
19. **feat: author world 8 and capstone gauntlet**
20. **feat: build battle menu profile page and progress map**
21. **feat: add reduced motion high contrast and pattern mode**
22. **feat: add static strategy pages and metadata for seo**
23. **chore: add github actions build test and pages deploy workflow**
24. **docs: add README architecture notes and contribution guide**

---

## 33. Recommended first milestone for Codex

If the team wants the fastest path to visible progress, the first milestone should be:

### “One perfect slice”
A single vertical slice with:
- one polished board
- one satisfying chip animation
- one human ping and one CPU ping
- one easy AI
- one lesson
- one boss
- saved progress
- GitHub Pages build working

That slice should prove:
- the feel
- the rendering approach
- the worker architecture
- the lesson engine pattern
- the audio style
- the deployment model

Do **not** start by authoring all content before the feel is right.

---

## 34. Naming recommendation

### Public-facing brand
Recommended:
- **Drop Four Academy**
- **Four in a Row Academy**
- **Drop Four Trainer**
- **Row Forge**

### SEO/editorial usage
Use article titles like:
- “How to Win Connect 4: Interactive Lessons”
- “Connect 4 Strategy: Center, Forks, and Parity”
- “Play Connect 4 Online and Learn as You Go”

---

## 35. Open decisions for implementation

These are choices Codex can implement, but the team should settle early:

1. **React state pattern**
   - Context + reducer
   - or tiny store library

2. **Opening book format**
   - hardcoded TS map
   - or compressed static JSON

3. **Import/export**
   - include in v1
   - or defer to v1.1

4. **Color system**
   - default only
   - or pattern/high-contrast at launch

5. **Analysis depth**
   - only post-game
   - or per-move with idle-time worker analysis

Recommended answers:
- Context + reducer or very small store
- compressed static JSON opening book
- import/export in v1 if cheap
- pattern + reduced motion at launch
- post-game analysis first, per-move later

---

## 36. Final product thesis

The opportunity is not to build “another Connect 4 site.”  
The opportunity is to build the **best way to learn it**.

That means:
- faster onboarding than articles,
- more explanation than solvers,
- better progression than plain browser games,
- stronger feel than classroom tools,
- and enough structure that a serious learner can get dramatically better in about 10 hours.

If this PRD is implemented faithfully, the resulting app should feel:
- elegant,
- immediate,
- educational,
- surprisingly deep,
- and highly replayable.

---

# Appendix A — Example lesson seeds

## A1. Lesson: “Center beats edge”
- Show empty board
- Ask for best first move
- Accept column 4 only
- Coach note: center participates in the most potential fours
- Then show two 4-ply miniature games:
  - center opening leads to flexible responses
  - edge opening cedes influence

## A2. Lesson: “Win now or regret it”
- Position with human to move
- Human has immediate vertical win
- Distractor move creates pretty shape but loses tempo
- Coach note: scan immediate wins before strategic plans

## A3. Lesson: “Fork coming”
- Position where opponent threatens to create two wins next turn
- Ask for preventive move
- Coach note: stop the fork before it exists

## A4. Lesson: “Who owns this square?”
- Parity overlay
- Highlight a key square
- Ask which player can realistically claim it
- Coach explains support row logic visually

---

# Appendix B — Suggested AI evaluation weights (initial draft)

These are starter values, not final truths. Tune empirically.

```ts
export const evalWeights = {
  centerControl: 12,
  adjacentCenter: 6,
  openTwo: 2,
  openThree: 8,
  supportedThree: 14,
  immediateThreat: 50,
  doubleThreat: 120,
  forcedBlockPenalty: -40,
  giveOpponentImmediateWin: -999999,
  parityBonusLate: 18,
  parityPenaltyLate: -22,
  diagonalPotential: 7,
  verticalThreat: 10,
};
```

Difficulty profiles can scale these and cap search depth/time.

---

# Appendix C — SVG asset list

Assets included in this bundle:
- `board-frame.svg`
- `disc-human.svg`
- `disc-cpu.svg`
- `drop-preview.svg`
- `selection-ring.svg`
- `confetti-burst.svg`
- `coach-bubble.svg`
- `boss-crown.svg`
- `star-badge.svg`
- `impact-ping.svg`
- `sprite.svg`

Implementation note:
Prefer inlining these SVGs as React components or as `<symbol>` references from `sprite.svg` so they can be animated via class toggles and transforms.

---

# Appendix D — Recommended motion timings

- hover preview fade in: **100ms**
- chip drop: **180–240ms** depending on distance
- chip bounce settle: **80ms**
- win-line glow pulse: **350ms**
- badge pop: **180ms**
- confetti burst: **600–900ms**
- coach panel slide/fade: **140ms**

Reduced motion version:
- replace bounce with simple translate
- replace confetti burst with sparkle fade

---

# Appendix E — Suggested copy tone

### Good
- “Nice. You forced a block.”
- “That move is legal, but it gives away the key square.”
- “You saw the diagonal before it became dangerous.”
- “Great patience. You improved the board without rushing.”

### Avoid
- “Wrong.”
- “Obviously bad.”
- “You should have known.”
- “Beginner mistake.”

---

# Appendix F — GitHub Pages notes

- configure Vite `base` correctly
- avoid absolute asset paths unless base-aware
- ensure refresh-safe routing (hash router or static fallback strategy)
- keep all content bundled statically
- optionally add service worker later; not required for v1

---

# Appendix G — Short source list used to shape the spec

1. Victor Allis, *A Knowledge-based Approach of Connect-Four* (1988)  
   Key relevance: nine strategic rules; odd/even threats; zugzwang/control; real-time play using a database and evaluation rules.

2. Pascal Pons, Connect 4 Solver  
   Key relevance: exact position solving in browser; alpha-beta; demonstrates that battle/analysis features are feasible client-side.

3. Reader’s Digest article on how to win Connect 4  
   Key relevance: mainstream beginner advice emphasizes going first, center control, and response discipline.

4. Base Camp Math article  
   Key relevance: points learners toward the solved-game framing, parity, threats, and available learning resources.

5. Paper Games advanced guide  
   Key relevance: practical public-language framing for forced moves, double threats, center dominance, pattern recognition, and predictive thinking.

6. John Tromp’s Connect Four pages  
   Key relevance: historical solution context, strong-solve work, and compact engine/bitboard implementation ideas.

