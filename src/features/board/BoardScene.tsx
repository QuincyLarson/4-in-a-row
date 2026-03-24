import type { CSSProperties } from 'react';
import { useId } from 'react';

import {
  COLS,
  ROWS,
  cellOwner,
  getDropRow,
  legalMoves,
  type BoardState,
  type WinningLine,
} from '../../core';
import './boardScene.css';

const GRID = {
  left: 90,
  top: 110,
  colGap: 100,
  rowGap: 90,
  boardWidth: 780,
  boardHeight: 680,
  chipRadius: 30,
};

type BoardSceneProps = {
  board: BoardState;
  previewColumn: number | null;
  onHoverColumn?: (column: number | null) => void;
  onSelectColumn?: (column: number) => void;
  onMovePreview?: (direction: -1 | 1) => void;
  onPrimaryAction?: () => void;
  onHint?: () => void;
  onRestart?: () => void;
  onUndo?: () => void;
  onToggleMute?: () => void;
  status: string;
  disabled?: boolean;
  showConfetti?: boolean;
  lastMoveColumn?: number | null;
  winningLine?: WinningLine | null;
};

export function BoardScene({
  board,
  previewColumn,
  onHoverColumn,
  onSelectColumn,
  onMovePreview,
  onPrimaryAction,
  onHint,
  onRestart,
  onUndo,
  onToggleMute,
  status,
  disabled = false,
  showConfetti = false,
  lastMoveColumn = board.moves.at(-1) ?? null,
  winningLine,
}: BoardSceneProps) {
  const defsId = useId().replace(/:/g, '-');
  const dropRow =
    lastMoveColumn !== null && board.moves.length > 0
      ? Math.max(
          0,
          board.moves.filter((move, index) => move === lastMoveColumn && index <= board.moves.length - 1)
            .length - 1,
        )
      : null;
  const previewRow =
    previewColumn !== null ? getDropRow(board, previewColumn) : null;
  const legal = new Set(legalMoves(board));

  return (
    <div className="board-scene">
      <div
        className="board-scene__frame"
        role="group"
        aria-label={status}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            onMovePreview?.(-1);
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            onMovePreview?.(1);
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPrimaryAction?.();
          } else if (event.key.toLowerCase() === 'h') {
            onHint?.();
          } else if (event.key.toLowerCase() === 'r') {
            onRestart?.();
          } else if (event.key.toLowerCase() === 'u') {
            onUndo?.();
          } else if (event.key.toLowerCase() === 'm') {
            onToggleMute?.();
          }
        }}
      >
        <svg
          className="board-scene__svg"
          viewBox={`0 0 ${GRID.boardWidth} ${GRID.boardHeight}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${defsId}-frame`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1f4a73" />
              <stop offset="100%" stopColor="#16324f" />
            </linearGradient>
            <linearGradient id={`${defsId}-shine`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`${defsId}-human`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ff8a5b" />
              <stop offset="100%" stopColor="#ff5d6c" />
            </radialGradient>
            <radialGradient id={`${defsId}-cpu`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#8fa8ff" />
              <stop offset="100%" stopColor="#5e6cff" />
            </radialGradient>
            <mask id={`${defsId}-holes`}>
              <rect width="100%" height="100%" fill="white" />
              {Array.from({ length: COLS * ROWS }, (_, index) => {
                const col = index % COLS;
                const rowFromTop = Math.floor(index / COLS);
                return (
                  <circle
                    key={`${col}-${rowFromTop}`}
                    cx={GRID.left + col * GRID.colGap}
                    cy={GRID.top + rowFromTop * GRID.rowGap}
                    r="34"
                    fill="black"
                  />
                );
              })}
            </mask>
          </defs>

          {previewColumn !== null && legal.has(previewColumn) ? (
            <g
              className="board-preview"
              transform={`translate(${columnX(previewColumn)} ${Math.max(40, columnY(previewRow ?? 0) - 72)})`}
              opacity={disabled ? 0.4 : 1}
            >
              <circle
                r="30"
                fill={`url(#${board.turn === 'human' ? `${defsId}-human` : `${defsId}-cpu`})`}
                opacity="0.28"
              />
              <circle r="36" fill="none" stroke="#71f7d5" strokeWidth="4" />
              <circle
                r="27"
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.42"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
            </g>
          ) : null}

          {Array.from({ length: COLS }).map((_, col) =>
            Array.from({ length: ROWS }).map((_, row) => {
              const owner = cellOwner(board, col, row);
              if (!owner) {
                return null;
              }
              const isLatest =
                lastMoveColumn === col &&
                dropRow === row &&
                board.moves.length > 0;

              return (
                <g
                  key={`${col}-${row}-${owner}`}
                  className={`board-chip${isLatest ? ' is-dropping' : ''}`}
                  transform={`translate(${columnX(col)} ${columnY(row)})`}
                  style={
                    isLatest
                      ? ({
                          '--drop-offset': `${Math.max(120, 520 - row * 50)}px`,
                          '--drop-duration': `${180 + (ROWS - row) * 16}ms`,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  {owner === 'human' ? (
                    <HumanChip defsId={defsId} />
                  ) : (
                    <CpuChip defsId={defsId} />
                  )}
                </g>
              );
            }),
          )}

          <g>
            <rect
              x="20"
              y="20"
              width="740"
              height="640"
              rx="44"
              fill={`url(#${defsId}-frame)`}
              mask={`url(#${defsId}-holes)`}
            />
            <rect
              x="20"
              y="20"
              width="740"
              height="640"
              rx="44"
              fill={`url(#${defsId}-shine)`}
              opacity="0.8"
            />
            <rect
              x="20"
              y="20"
              width="740"
              height="640"
              rx="44"
              fill="none"
              stroke="#7FDBFF"
              strokeOpacity="0.18"
              strokeWidth="3"
            />
            {Array.from({ length: COLS }).map((_, col) =>
              Array.from({ length: ROWS }).map((_, rowFromBottom) => (
                <g key={`hole-${col}-${rowFromBottom}`}>
                  <circle
                    cx={columnX(col)}
                    cy={columnY(rowFromBottom)}
                    r="30"
                    fill="#09111c"
                    opacity="0.92"
                  />
                  <circle
                    cx={columnX(col)}
                    cy={columnY(rowFromBottom)}
                    r="34"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.08"
                  />
                </g>
              )),
            )}
          </g>

          {winningLine ? (
            <line
              className="board-win-line"
              x1={columnX(winningLine.cells[0].col)}
              y1={columnY(winningLine.cells[0].row)}
              x2={columnX(winningLine.cells[winningLine.cells.length - 1].col)}
              y2={columnY(winningLine.cells[winningLine.cells.length - 1].row)}
              stroke="#71f7d5"
              strokeWidth="10"
              strokeLinecap="round"
              strokeOpacity="0.78"
              pathLength="1"
            />
          ) : null}

          {lastMoveColumn !== null && dropRow !== null ? (
            <g
              className="board-impact"
              transform={`translate(${columnX(lastMoveColumn)} ${columnY(dropRow)})`}
            >
              <circle r="28" fill="none" stroke="#71f7d5" strokeWidth="4" />
              <circle
                r="28"
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.6"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
            </g>
          ) : null}

          {showConfetti ? (
            <g className="board-confetti" transform="translate(390 72)">
              <rect x="-4" y="-10" width="8" height="16" rx="2" fill="#FF8A5B" style={pieceMove(0, -56)} />
              <rect x="-4" y="-10" width="8" height="16" rx="2" fill="#8FA8FF" style={pieceMove(40, -34)} />
              <rect x="-4" y="-10" width="8" height="16" rx="2" fill="#FFD46B" style={pieceMove(56, 0)} />
              <rect x="-4" y="-10" width="8" height="16" rx="2" fill="#71F7D5" style={pieceMove(34, 40)} />
              <rect x="-4" y="-10" width="8" height="16" rx="2" fill="#ffffff" style={pieceMove(0, 58)} />
              <rect x="-4" y="-10" width="8" height="16" rx="2" fill="#FF5D6C" style={pieceMove(-34, 40)} />
              <rect x="-4" y="-10" width="8" height="16" rx="2" fill="#5E6CFF" style={pieceMove(-56, 0)} />
              <rect x="-4" y="-10" width="8" height="16" rx="2" fill="#FFB84D" style={pieceMove(-34, -40)} />
            </g>
          ) : null}
        </svg>

        <div className="board-scene__hitboxes">
          {Array.from({ length: COLS }, (_, column) => (
            <button
              key={column}
              type="button"
              className={`board-scene__column${
                previewColumn === column ? ' is-active' : ''
              }`}
              aria-label={`Drop in column ${column + 1}`}
              disabled={disabled || !legal.has(column)}
              onMouseEnter={() => onHoverColumn?.(column)}
              onMouseLeave={() => onHoverColumn?.(null)}
              onFocus={() => onHoverColumn?.(column)}
              onClick={() => onSelectColumn?.(column)}
            />
          ))}
        </div>
      </div>
      <p style={boardSceneStyles.status}>{status}</p>
    </div>
  );
}

function HumanChip({ defsId }: { defsId: string }) {
  return (
    <>
      <circle r={GRID.chipRadius} fill={`url(#${defsId}-human)`} />
      <circle r="22" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="2" />
      <path
        d="M-16 10 L-1 -12"
        stroke="#ffffff"
        strokeOpacity="var(--human-pattern-opacity, 0.55)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M0 16 L15 -6"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </>
  );
}

function CpuChip({ defsId }: { defsId: string }) {
  return (
    <>
      <circle r={GRID.chipRadius} fill={`url(#${defsId}-cpu)`} />
      <circle r="21" fill="none" stroke="#ffffff" strokeOpacity="var(--cpu-pattern-opacity, 0.25)" strokeWidth="2" />
      <circle r="5.5" fill="#ffffff" fillOpacity="0.55" />
      <circle cy="-14" r="3.5" fill="#ffffff" fillOpacity="0.35" />
      <circle cx="-14" r="3.2" fill="#ffffff" fillOpacity="0.25" />
      <circle cx="14" r="3.2" fill="#ffffff" fillOpacity="0.25" />
      <circle cy="14" r="3.2" fill="#ffffff" fillOpacity="0.25" />
    </>
  );
}

function columnX(col: number) {
  return GRID.left + col * GRID.colGap;
}

function columnY(rowFromBottom: number) {
  return 560 - rowFromBottom * GRID.rowGap;
}

function pieceMove(x: number, y: number) {
  return {
    '--x': `${x}px`,
    '--y': `${y}px`,
  } as CSSProperties;
}

const boardSceneStyles = {
  status: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
};
