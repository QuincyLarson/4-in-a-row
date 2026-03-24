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
import {
  getDropDurationMs,
  getDropOffsetPx,
  getImpactDelayMs,
} from './motion';
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

const HOVER_CHIP_Y = 46;

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
      ? lastOccupiedRow(board, lastMoveColumn)
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
              <stop offset="0%" stopColor="#3b3b4f" />
              <stop offset="100%" stopColor="#2a2a40" />
            </linearGradient>
            <linearGradient id={`${defsId}-shine`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f5f6f7" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`${defsId}-human`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff1b8" />
              <stop offset="56%" stopColor="#f7d36a" />
              <stop offset="100%" stopColor="#d99a00" />
            </radialGradient>
            <radialGradient id={`${defsId}-cpu`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="52%" stopColor="#b9dcff" />
              <stop offset="100%" stopColor="#4e78ff" />
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
                          '--drop-offset': `${getDropOffsetPx(row)}px`,
                          '--drop-duration': `${getDropDurationMs(row)}ms`,
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
              stroke="#f5f6f7"
              strokeOpacity="0.28"
              strokeWidth="4"
            />
            {Array.from({ length: COLS }).map((_, col) =>
              Array.from({ length: ROWS }).map((_, rowFromBottom) => (
                <g key={`hole-${col}-${rowFromBottom}`}>
                  <circle
                    cx={columnX(col)}
                    cy={columnY(rowFromBottom)}
                    r="30"
                    fill="#0a0a23"
                    opacity="1"
                  />
                  <circle
                    cx={columnX(col)}
                    cy={columnY(rowFromBottom)}
                    r="34"
                    fill="none"
                    stroke="#f5f6f7"
                    strokeOpacity="0.24"
                    strokeWidth="2.5"
                  />
                </g>
              )),
            )}
          </g>

          {previewColumn !== null && legal.has(previewColumn) && previewRow !== null ? (
            <g
              className="board-preview board-preview--landing"
              transform={`translate(${columnX(previewColumn)} ${columnY(previewRow)})`}
              opacity={disabled ? 0.45 : 1}
            >
              <circle r="31" fill="none" stroke="#f5f6f7" strokeOpacity="0.2" strokeWidth="4" />
              <circle
                r="26"
                fill="none"
                stroke={board.turn === 'human' ? '#f1be32' : '#99c9ff'}
                strokeOpacity="0.92"
                strokeWidth="4"
                strokeDasharray="6 6"
              />
              <circle
                r="8"
                fill={board.turn === 'human' ? '#f1be32' : '#99c9ff'}
                fillOpacity="0.8"
              />
            </g>
          ) : null}

          {previewColumn !== null && legal.has(previewColumn) ? (
            <g
              className="board-preview board-preview--hover"
              transform={`translate(${columnX(previewColumn)} ${HOVER_CHIP_Y})`}
              opacity={disabled ? 0.62 : 1}
            >
              {board.turn === 'human' ? (
                <HumanChip defsId={defsId} preview />
              ) : (
                <CpuChip defsId={defsId} preview />
              )}
              <path
                d="M 0 42 V 58"
                fill="none"
                stroke="#f5f6f7"
                strokeOpacity="0.74"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M -8 54 L 0 64 L 8 54"
                fill="none"
                stroke="#f5f6f7"
                strokeOpacity="0.74"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ) : null}

          {winningLine ? (
            <line
              className="board-win-line"
              x1={columnX(winningLine.cells[0].col)}
              y1={columnY(winningLine.cells[0].row)}
              x2={columnX(winningLine.cells[winningLine.cells.length - 1].col)}
              y2={columnY(winningLine.cells[winningLine.cells.length - 1].row)}
              stroke="#acd157"
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
              style={
                {
                  '--impact-delay': `${getImpactDelayMs(dropRow)}ms`,
                } as CSSProperties
              }
            >
              <circle r="28" fill="none" stroke="#acd157" strokeWidth="4" />
              <circle
                r="28"
                fill="none"
                stroke="#f5f6f7"
                strokeOpacity="0.6"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
              <circle r="10" fill="#0a0a23" fillOpacity="0.15" />
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

function HumanChip({ defsId, preview = false }: { defsId: string; preview?: boolean }) {
  return (
    <>
      <circle r={GRID.chipRadius} fill={`url(#${defsId}-human)`} />
      <circle
        r={GRID.chipRadius}
        fill="none"
        stroke="#fff7d6"
        strokeOpacity={preview ? '0.95' : '0.82'}
        strokeWidth="3"
      />
      <circle
        r="26"
        fill="none"
        stroke="#6b4b07"
        strokeOpacity="0.9"
        strokeWidth="2.5"
      />
      <circle r="21" fill="none" stroke="#0a0a23" strokeOpacity="0.38" strokeWidth="2.5" />
      <path
        d="M-16 10 L-1 -12"
        stroke="#5c3f04"
        strokeOpacity="var(--human-pattern-opacity, 0.82)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M0 16 L15 -6"
        stroke="#0a0a23"
        strokeOpacity="0.9"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="-10" cy="-11" r="5" fill="#fff7d6" fillOpacity="0.55" />
    </>
  );
}

function CpuChip({ defsId, preview = false }: { defsId: string; preview?: boolean }) {
  return (
    <>
      <circle r={GRID.chipRadius} fill={`url(#${defsId}-cpu)`} />
      <circle
        r={GRID.chipRadius}
        fill="none"
        stroke="#f5fbff"
        strokeOpacity={preview ? '0.98' : '0.9'}
        strokeWidth="3"
      />
      <circle
        r="24"
        fill="none"
        stroke="#0d2454"
        strokeOpacity="0.82"
        strokeWidth="2.5"
      />
      <circle
        r="20.5"
        fill="none"
        stroke="#f5fbff"
        strokeOpacity="var(--cpu-pattern-opacity, 0.84)"
        strokeWidth="2.5"
      />
      <circle r="5.5" fill="#0d2454" fillOpacity="0.88" />
      <circle cy="-14" r="3.5" fill="#0d2454" fillOpacity="0.72" />
      <circle cx="-14" r="3.2" fill="#0d2454" fillOpacity="0.68" />
      <circle cx="14" r="3.2" fill="#0d2454" fillOpacity="0.68" />
      <circle cy="14" r="3.2" fill="#0d2454" fillOpacity="0.68" />
      <circle cx="-10" cy="-11" r="5" fill="#ffffff" fillOpacity="0.5" />
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

function lastOccupiedRow(board: BoardState, column: number) {
  let row = 0;
  while (row < ROWS && cellOwner(board, column, row) !== null) {
    row += 1;
  }
  return Math.max(0, row - 1);
}

const boardSceneStyles = {
  status: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
};
