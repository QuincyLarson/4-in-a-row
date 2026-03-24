import { COLS, ROWS } from './constants';
import type { CellCoord, WinningLine } from './types';

const line = (...cells: CellCoord[]): WinningLine => ({ cells });

export const WIN_LINES: readonly WinningLine[] = (() => {
  const lines: WinningLine[] = [];

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col <= COLS - 4; col += 1) {
      lines.push(line(
        { col, row },
        { col: col + 1, row },
        { col: col + 2, row },
        { col: col + 3, row },
      ));
    }
  }

  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      lines.push(line(
        { col, row },
        { col, row: row + 1 },
        { col, row: row + 2 },
        { col, row: row + 3 },
      ));
    }
  }

  for (let col = 0; col <= COLS - 4; col += 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      lines.push(line(
        { col, row },
        { col: col + 1, row: row + 1 },
        { col: col + 2, row: row + 2 },
        { col: col + 3, row: row + 3 },
      ));
    }
  }

  for (let col = 0; col <= COLS - 4; col += 1) {
    for (let row = 3; row < ROWS; row += 1) {
      lines.push(line(
        { col, row },
        { col: col + 1, row: row - 1 },
        { col: col + 2, row: row - 2 },
        { col: col + 3, row: row - 3 },
      ));
    }
  }

  return lines;
})();

