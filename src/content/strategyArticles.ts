import { article, section } from './helpers';
import type { StrategyArticle } from './types';

export const strategyArticles: StrategyArticle[] = [
  article({
    slug: 'how-to-win-connect-4',
    title: 'How to Win Connect Four',
    description: 'A short practical guide to the board habits that matter most in real play.',
    keywords: ['how to win connect 4', 'connect 4 strategy', 'center control', 'forks'],
    sections: [
      section(
        'Start with the scan',
        'Every move begins with a fast tactical check. If you can win now, take it. If they can win now, block it. Only then should you think about shape.',
      ),
      section(
        'Own the middle',
        'The center column participates in more possible lines than the edges. That is why strong opening play usually prefers the middle or a nearby column.',
        ['Look for flexible moves', 'Avoid edge-first openings unless the board demands it'],
      ),
      section(
        'Win with pressure',
        'The strongest practical wins come from threats the opponent cannot answer cleanly. A single threat is good. A double threat is often decisive.',
      ),
    ],
    relatedLessonIds: ['world-1-scan-order', 'world-2-center-control', 'world-4-fork-recognition'],
  }),
  article({
    slug: 'connect-4-best-first-move',
    title: 'Connect 4 Best First Move',
    description: 'Why the center is usually the best first move and how to answer common opening replies.',
    keywords: ['connect 4 best first move', 'center opening', 'opening theory'],
    sections: [
      section(
        'Why the center wins the opening',
        'A first move in the center gives you the most future ways to build four-in-a-row. It also keeps your later replies flexible if the position turns tactical.',
      ),
      section(
        'Adjacent columns are the backup plan',
        'If the center is taken or the position is already asymmetric, the columns next to the center usually keep more value than the edge columns.',
      ),
      section(
        'Do not memorize too early',
        'Useful openings are about principles first. Memorized sequences matter later, after the learner understands why the center is special.',
      ),
    ],
    relatedLessonIds: ['world-2-center-control', 'world-7-opening-rules', 'world-7-symmetry-mirror'],
  }),
  article({
    slug: 'connect-4-double-threats',
    title: 'Connect 4 Double Threats',
    description: 'How forks work, why one block is sometimes not enough, and what to look for in practice.',
    keywords: ['connect 4 double threat', 'fork', 'forks', 'double threats'],
    sections: [
      section(
        'What a fork is',
        'A double threat is a move that creates two winning ideas at once. The opponent may be able to block one line, but not both on the same turn.',
      ),
      section(
        'How to build one',
        'Good fork play usually starts with support. You set up the square first, then you land the forcing move when the structure is ready.',
      ),
      section(
        'How to stop one',
        'Do not wait until the fork is fully visible. Remove the support square or the access point before the double threat lands.',
      ),
    ],
    relatedLessonIds: ['world-4-fork-recognition', 'world-4-fork-construction', 'world-4-fork-defense'],
  }),
  article({
    slug: 'connect-4-parity-explained',
    title: 'Connect 4 Parity Explained',
    description: 'A practical explanation of odd-even access, support squares, and why some endgame squares change hands.',
    keywords: ['connect 4 parity', 'odd even', 'parity explained', 'endgame'],
    sections: [
      section(
        'Access matters more than appearance',
        'A square only matters if the move order lets you claim it. In the late game, that is often controlled by who can reach the square on the correct turn.',
      ),
      section(
        'Poisoned moves',
        'Some moves look active but give the opponent access to the key square underneath or beside the target. The practical lesson is to respect the order of play.',
      ),
      section(
        'Make the opponent fill under you',
        'When parity is in your favor, the best move often forces the opponent to occupy a lower square and hand you the timing edge.',
      ),
    ],
    relatedLessonIds: ['world-6-parity-basics', 'world-6-odd-even-access', 'world-6-poisoned-moves'],
  }),
  article({
    slug: 'how-learn-drop-4-coach-evaluates-moves',
    title: 'How Learn Drop 4 Coach Evaluates Moves',
    description: 'A short explanation of the tactical checks, continuation search, and positional heuristics behind the coach panel.',
    keywords: ['connect 4 coach', 'connect 4 heuristics', 'move evaluation', 'analysis'],
    sections: [
      section(
        'The scan starts with forced tactics',
        'The coach first looks for immediate wins, immediate blocks, opening-book traps, and other urgent tactical checks. If the position is already forcing, that matters more than any quiet shape preference.',
        ['Win now before anything else', 'Block a one-move loss before trying to improve shape', 'Respect forced replies and double threats'],
      ),
      section(
        'It now judges continuations, not just the first picture',
        'Earlier versions could overreact to the immediate look of a move because they scored the child position with a shallow heuristic. The coach now re-searches the resulting position from the opponent side and scores the continuation, which makes it much better at recognizing forcing ideas such as mates in two or moves that block and threaten at the same time.',
      ),
      section(
        'When the line is not forced, shape still matters',
        'If no side has a direct tactical sequence, the coach falls back on practical board heuristics: center control, playable threats, double-threat potential, supported diagonals, parity pressure, mobility, and whether the move leaves the opponent an immediate shot back.',
        ['Center and adjacent-center columns keep more future lines alive', 'Supported threats matter more than decorative shapes', 'Parity and access matter more as the board fills'],
      ),
      section(
        'Why the coach can still disagree with you',
        'The coach is stronger than before, but it is still finite-depth search plus heuristics, not a solved endgame oracle on every move. In very deep or unusual positions it can still underrate a long forcing line, especially if the tactic sits beyond the current search budget. When that happens, the most trustworthy signal is whether your move removed the opponent threat, created a forced reply, or produced multiple winning continuations.',
      ),
    ],
    relatedLessonIds: ['world-1-scan-order', 'world-4-fork-recognition', 'world-6-parity-basics'],
  }),
  article({
    slug: 'play-connect-4-online',
    title: 'Play Connect 4 Online',
    description: 'What to expect from a polished client-side Four in a Row app and how the learning loop works.',
    keywords: ['play connect 4 online', 'four in a row online', 'browser connect 4'],
    sections: [
      section(
        'Fast local play',
        'A good browser version should feel immediate: hover preview, quick drops, short sound cues, and no server round-trip just to make a move.',
      ),
      section(
        'Battle, then review',
        'The best practice loop is not just playing. It is playing, seeing the first major mistake, and then drilling the pattern until it sticks.',
      ),
      section(
        'Client-side by design',
        'This app is designed to run entirely in the browser with static deployment, local save data, and worker-backed AI when the position gets harder.',
      ),
    ],
    relatedLessonIds: ['world-0-board-and-gravity', 'world-0-warmup-bot', 'world-8-endgame-engine'],
  }),
  article({
    slug: 'learn-connect-4-course',
    title: 'Learn Connect 4 in a Guided Course',
    description: 'A curriculum-first path from rules to strong practical play.',
    keywords: ['learn connect 4', 'connect 4 course', 'guided curriculum'],
    sections: [
      section(
        'One concept per screen',
        'Each lesson should teach one idea, show it on a board, and then let the learner act on it right away.',
      ),
      section(
        'The 10-hour path',
        'The course is organized into worlds that move from rules to tactical hygiene, then to threats, forks, diagonals, parity, openings, and endgame conversion.',
      ),
      section(
        'Review closes the loop',
        'Mistakes should not vanish. They should feed back into a review queue so the learner sees the pattern again later, then again more slowly, until it becomes reliable.',
      ),
    ],
    relatedLessonIds: ['world-1-scan-order', 'world-3-threat-smith', 'capstone-exam'],
  }),
];

export const strategyArticleBySlug = new Map(strategyArticles.map((entry) => [entry.slug, entry]));
