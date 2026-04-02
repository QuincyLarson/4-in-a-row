import { describe, expect, it } from 'vitest';

import {
  applyMove,
  boardFromHumanMoves,
  chooseBattleMove,
  createBoard,
  findWinningMoves,
  legalMoves,
} from '../../core';
import { curriculumLessons } from '../../content';

describe('curriculum tactics', () => {
  it('avoids ambiguous immediate wins in authored lesson positions', () => {
    const ambiguousWins: string[] = [];
    const ambiguousBlocks: string[] = [];
    const mismatchedWinningMoves: string[] = [];
    const mismatchedBlockingMoves: string[] = [];
    const invalidStartingBoards: string[] = [];

    for (const lesson of curriculumLessons) {
      for (const step of lesson.steps) {
        if (step.type === 'battle' || step.type === 'boss') {
          continue;
        }

        let board;
        try {
          board = step.position
            ? boardFromHumanMoves(step.position.moves, 'human')
            : createBoard('human');
        } catch (error) {
          invalidStartingBoards.push(
            `${step.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
          continue;
        }
        const winningMoves = legalMoves(board).filter(
          (column) => applyMove(board, column).winner === 'human',
        );
        const opponentWinningMoves =
          winningMoves.length === 0 ? findWinningMoves(board, 'cpu') : [];

        if (winningMoves.length > 1) {
          ambiguousWins.push(
            `${step.id}: ${winningMoves.map((column) => column + 1).join(', ')}`,
          );
          continue;
        }

        if (winningMoves.length === 1) {
          const authoredAnswers =
            step.acceptedColumns && step.acceptedColumns.length > 0
              ? step.acceptedColumns
              : step.hintColumns && step.hintColumns.length > 0
                ? step.hintColumns
                : (() => {
                    const best = chooseBattleMove(board, 2).column;
                    return [best === null ? 4 : best + 1];
                  })();

          if (!authoredAnswers.includes(winningMoves[0] + 1)) {
            mismatchedWinningMoves.push(
              `${step.id}: win ${winningMoves[0] + 1}, authored ${authoredAnswers.join(', ')}`,
            );
          }
        }

        if (opponentWinningMoves.length > 0) {
          const blockingMoves = legalMoves(board).filter((column) => {
            const after = applyMove(board, column);
            return findWinningMoves(after, 'cpu').length === 0;
          });

          if (blockingMoves.length !== 1) {
            ambiguousBlocks.push(
              `${step.id}: blocks ${blockingMoves.map((column) => column + 1).join(', ') || 'none'}`,
            );
            continue;
          }

          const authoredAnswers =
            step.acceptedColumns && step.acceptedColumns.length > 0
              ? step.acceptedColumns
              : step.hintColumns && step.hintColumns.length > 0
                ? step.hintColumns
                : (() => {
                    const best = chooseBattleMove(board, 2).column;
                    return [best === null ? 4 : best + 1];
                  })();

          if (!authoredAnswers.includes(blockingMoves[0] + 1)) {
            mismatchedBlockingMoves.push(
              `${step.id}: block ${blockingMoves[0] + 1}, authored ${authoredAnswers.join(', ')}`,
            );
          }
        }
      }
    }

    expect(
      { ambiguousWins, ambiguousBlocks, mismatchedWinningMoves, mismatchedBlockingMoves, invalidStartingBoards },
      [
        invalidStartingBoards.length > 0
          ? `invalid starting boards: ${invalidStartingBoards.join(' | ')}`
          : null,
        ambiguousWins.length > 0 ? `ambiguous immediate wins: ${ambiguousWins.join(' | ')}` : null,
        ambiguousBlocks.length > 0 ? `ambiguous forced blocks: ${ambiguousBlocks.join(' | ')}` : null,
        mismatchedWinningMoves.length > 0
          ? `winning move rejected by lesson answers: ${mismatchedWinningMoves.join(' | ')}`
          : null,
        mismatchedBlockingMoves.length > 0
          ? `blocking move rejected by lesson answers: ${mismatchedBlockingMoves.join(' | ')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
    ).toEqual({
      ambiguousWins: [],
      ambiguousBlocks: [],
      mismatchedWinningMoves: [],
      mismatchedBlockingMoves: [],
      invalidStartingBoards: [],
    });
  });
});
