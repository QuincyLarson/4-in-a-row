export const ROWS = 6;
export const COLS = 7;
export const COLUMN_HEIGHT = 7;
export const PLAYABLE_CELLS = ROWS * COLS;
export const MATE_SCORE = 1000000;

export const CENTER_ORDER = [3, 2, 4, 1, 5, 0, 6] as const;

export const COLUMN_MASKS = Array.from({ length: COLS }, (_, col) =>
  ((1n << BigInt(COLUMN_HEIGHT)) - 1n) << BigInt(col * COLUMN_HEIGHT),
);

export const PLAYABLE_MASK = COLUMN_MASKS.reduce((mask, columnMask) => mask | columnMask, 0n) &
  ((1n << BigInt(PLAYABLE_CELLS + COLS)) - 1n);

export const BOTTOM_MASKS = Array.from({ length: COLS }, (_, col) => 1n << BigInt(col * COLUMN_HEIGHT));
export const TOP_MASKS = Array.from({ length: COLS }, (_, col) => 1n << BigInt(col * COLUMN_HEIGHT + ROWS - 1));

export const CENTER_COLUMN = 3;
export const ADJACENT_COLUMNS = [2, 4] as const;

