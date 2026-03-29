import { describe, expect, it } from 'vitest';

import { applyMove, boardFromHumanMoves, chooseBattleMove, createBoard, legalMoves } from '../../core';
import { curriculumLessons } from '../../content';

describe('curriculum tactics', () => {
  it('avoids ambiguous immediate wins in authored lesson positions', () => {
    const ambiguousWins: string[] = [];
    const mismatchedWinningMoves: string[] = [];
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
      }
    }

    expect(
      { ambiguousWins, mismatchedWinningMoves, invalidStartingBoards },
      [
        invalidStartingBoards.length > 0
          ? `invalid starting boards: ${invalidStartingBoards.join(' | ')}`
          : null,
        ambiguousWins.length > 0 ? `ambiguous immediate wins: ${ambiguousWins.join(' | ')}` : null,
        mismatchedWinningMoves.length > 0
          ? `winning move rejected by lesson answers: ${mismatchedWinningMoves.join(' | ')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
    ).toEqual({ ambiguousWins: [], mismatchedWinningMoves: [], invalidStartingBoards: [] });
  });
});
