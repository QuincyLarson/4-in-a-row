import type { CSSProperties } from 'react';
import { useId, useRef } from 'react';

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
  reducedMotion?: boolean;
  showPreview?: boolean;
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
  reducedMotion = false,
  showPreview = true,
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
  const frameRef = useRef<HTMLDivElement | null>(null);
  const defsId = useId().replace(/:/g, '-');
  const dropRow =
    lastMoveColumn !== null && board.moves.length > 0
      ? lastOccupiedRow(board, lastMoveColumn)
      : null;
  const latestOwner =
    lastMoveColumn !== null && dropRow !== null
      ? cellOwner(board, lastMoveColumn, dropRow)
      : null;
  const latestMoveKey =
    lastMoveColumn !== null && dropRow !== null && latestOwner
      ? `${board.moves.length}-${lastMoveColumn}-${dropRow}-${latestOwner}`
      : 'no-latest-move';
  const previewRow =
    previewColumn !== null ? getDropRow(board, previewColumn) : null;
  const legal = new Set(legalMoves(board));

  return (
    <div className="board-scene">
      <div
        ref={frameRef}
        className="board-scene__frame"
        role="group"
        aria-label={status}
        tabIndex={0}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }
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
            <clipPath id={`${defsId}-chip-window`} clipPathUnits="userSpaceOnUse">
              {Array.from({ length: COLS * ROWS }, (_, index) => {
                const col = index % COLS;
                const rowFromTop = Math.floor(index / COLS);
                return (
                  <circle
                    key={`clip-${col}-${rowFromTop}`}
                    cx={GRID.left + col * GRID.colGap}
                    cy={GRID.top + rowFromTop * GRID.rowGap}
                    r="34"
                  />
                );
              })}
            </clipPath>
          </defs>

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

          {showPreview && previewColumn !== null && legal.has(previewColumn) ? (
            <g className="board-preview">
              <rect
                x={columnX(previewColumn) - 50}
                y="20"
                width="100"
                height="640"
                rx="28"
                fill={board.turn === 'human' ? '#f1be32' : '#99c9ff'}
                fillOpacity="0.16"
              />
              <rect
                x={columnX(previewColumn) - 50}
                y="20"
                width="100"
                height="640"
                rx="28"
                fill="none"
                stroke="#f5f6f7"
                strokeOpacity="0.16"
                strokeWidth="2"
              />
            </g>
          ) : null}

          <g clipPath={`url(#${defsId}-chip-window)`}>
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
                    className={`board-chip${isLatest ? ' board-chip--latest-hole' : ''}`}
                    transform={`translate(${columnX(col)} ${columnY(row)})`}
                  >
                    {owner === 'human' ? <HumanChip /> : <CpuChip />}
                    {isLatest ? (
                      <animate
                        attributeName="opacity"
                        values={reducedMotion ? '0;1;1' : '0;0;1;1'}
                        keyTimes={reducedMotion ? '0;0.45;1' : '0;0.72;0.9;1'}
                        dur={`${getDropDurationMs(row, reducedMotion)}ms`}
                        fill="freeze"
                      />
                    ) : null}
                  </g>
                );
              }),
            )}
          </g>

          {lastMoveColumn !== null && dropRow !== null && latestOwner ? (
            <g
              key={`drop-${latestMoveKey}`}
              className="board-chip board-chip--drop-overlay"
              data-owner={latestOwner}
              transform={`translate(${columnX(lastMoveColumn)} ${columnY(dropRow)})`}
            >
              <DroppingChipMotion owner={latestOwner} row={dropRow} reducedMotion={reducedMotion} />
            </g>
          ) : null}

          {showPreview && previewColumn !== null && legal.has(previewColumn) && previewRow !== null ? (
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
              />
              {landingReticleDots(board.turn === 'human' ? '#f1be32' : '#99c9ff')}
              <circle r="8" fill={board.turn === 'human' ? '#f1be32' : '#99c9ff'} fillOpacity="0.8" />
            </g>
          ) : null}

          {showPreview && previewColumn !== null && legal.has(previewColumn) ? (
            <g
              className="board-preview board-preview--hover"
              transform={`translate(${columnX(previewColumn)} ${HOVER_CHIP_Y})`}
              opacity={disabled ? 0.62 : 1}
            >
              {board.turn === 'human' ? <HumanChip preview /> : <CpuChip preview />}
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
              key={`impact-${latestMoveKey}`}
              className="board-impact"
              transform={`translate(${columnX(lastMoveColumn)} ${columnY(dropRow)})`}
            >
              <ImpactPulse row={dropRow} reducedMotion={reducedMotion} />
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
              tabIndex={-1}
              disabled={disabled || !legal.has(column)}
              onMouseDown={(event) => {
                event.preventDefault();
                frameRef.current?.focus();
              }}
              onMouseEnter={() => onHoverColumn?.(column)}
              onMouseLeave={() => onHoverColumn?.(null)}
              onFocus={() => frameRef.current?.focus()}
              onClick={() => onSelectColumn?.(column)}
            />
          ))}
        </div>
      </div>
      <p style={boardSceneStyles.status}>{status}</p>
    </div>
  );
}

function DroppingChipMotion({
  owner,
  row,
  reducedMotion,
}: {
  owner: 'human' | 'cpu';
  row: number;
  reducedMotion: boolean;
}) {
  const dropOffset = reducedMotion
    ? Math.min(120, getDropOffsetPx(row))
    : getDropOffsetPx(row);
  const durationMs = getDropDurationMs(row, reducedMotion);

  return (
    <g transform={`translate(0 ${-dropOffset})`}>
      {owner === 'human' ? <HumanChip /> : <CpuChip />}
      <animateTransform
        attributeName="transform"
        type="translate"
        values={
          reducedMotion
            ? `0 ${-dropOffset}; 0 0`
            : `0 ${-dropOffset}; 0 0; 0 8; 0 0`
        }
        keyTimes={reducedMotion ? '0;1' : '0;0.74;0.88;1'}
        calcMode={reducedMotion ? 'linear' : 'spline'}
        keySplines={
          reducedMotion
            ? undefined
            : '0.22 1 0.36 1; 0.14 0.82 0.3 1; 0.2 0.9 0.3 1'
        }
        dur={`${durationMs}ms`}
        fill="freeze"
      />
      <animate
        attributeName="opacity"
        values={reducedMotion ? '1;0' : '1;1;1;0'}
        keyTimes={reducedMotion ? '0;1' : '0;0.88;0.98;1'}
        dur={`${durationMs}ms`}
        fill="freeze"
      />
    </g>
  );
}

function ImpactPulse({ row, reducedMotion }: { row: number; reducedMotion: boolean }) {
  const durationMs = reducedMotion ? 140 : 460;
  const beginMs = getImpactDelayMs(row, reducedMotion);

  return (
    <>
      <circle r="28" fill="none" stroke="#acd157" strokeWidth="4" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0.92;0"
          keyTimes="0;0.18;1"
          dur={`${durationMs}ms`}
          begin={`${beginMs}ms`}
          fill="freeze"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          values="0.4;1;1.35"
          keyTimes="0;0.18;1"
          dur={`${durationMs}ms`}
          begin={`${beginMs}ms`}
          fill="freeze"
        />
      </circle>
              <circle
                r="28"
                fill="none"
                stroke="#f5f6f7"
                strokeOpacity="0.6"
                strokeWidth="2"
                strokeDasharray="5 5"
                opacity="0"
              >
        <animate
          attributeName="opacity"
          values="0;0.75;0"
          keyTimes="0;0.18;1"
          dur={`${durationMs}ms`}
          begin={`${beginMs}ms`}
          fill="freeze"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          values="0.55;1;1.25"
          keyTimes="0;0.18;1"
          dur={`${durationMs}ms`}
          begin={`${beginMs}ms`}
          fill="freeze"
        />
      </circle>
      <circle r="10" fill="#0a0a23" fillOpacity="0.18" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0.24;0"
          keyTimes="0;0.2;1"
          dur={`${durationMs}ms`}
          begin={`${beginMs}ms`}
          fill="freeze"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          values="0.5;1;1.1"
          keyTimes="0;0.2;1"
          dur={`${durationMs}ms`}
          begin={`${beginMs}ms`}
          fill="freeze"
        />
      </circle>
    </>
  );
}

function HumanChip({ preview = false }: { preview?: boolean }) {
  return (
    <>
      <circle r={GRID.chipRadius} fill="#f1be32" />
      <circle
        r={GRID.chipRadius}
        fill="none"
        stroke="#fff4c2"
        strokeOpacity={preview ? '1' : '0.92'}
        strokeWidth="2.5"
      />
      <circle
        r="24"
        fill="none"
        stroke="#0a0a23"
        strokeOpacity="0.22"
        strokeWidth="2"
      />
      <path
        d="M-14 -14 L14 14"
        stroke="#7b5600"
        strokeOpacity="var(--human-pattern-opacity, 0.96)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M14 -14 L-14 14"
        stroke="#7b5600"
        strokeOpacity="0.96"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </>
  );
}

function CpuChip({ preview = false }: { preview?: boolean }) {
  return (
    <>
      <circle r={GRID.chipRadius} fill="#99c9ff" />
      <circle
        r={GRID.chipRadius}
        fill="none"
        stroke="#edf7ff"
        strokeOpacity={preview ? '1' : '0.94'}
        strokeWidth="2.5"
      />
      <circle
        r="24"
        fill="none"
        stroke="#2f5ea8"
        strokeOpacity="0.24"
        strokeWidth="2"
      />
      <path
        d="M-14 0 H14"
        fill="none"
        stroke="#1b4da1"
        strokeOpacity="var(--cpu-pattern-opacity, 0.96)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M0 -14 V14"
        fill="none"
        stroke="#1b4da1"
        strokeOpacity="var(--cpu-pattern-opacity, 0.96)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <circle r="5" fill="#edf7ff" fillOpacity="0.9" />
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

function landingReticleDots(color: string) {
  return Array.from({ length: 14 }, (_, index) => {
    const angle = (-90 + index * (360 / 14)) * (Math.PI / 180);
    const radius = 30;
    return (
      <circle
        key={`reticle-dot-${index}`}
        cx={Math.cos(angle) * radius}
        cy={Math.sin(angle) * radius}
        r="2.5"
        fill={color}
        fillOpacity="0.92"
      />
    );
  });
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
