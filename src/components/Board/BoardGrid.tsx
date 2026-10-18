import React from 'react';

export const CELL_SIZE = 72;
export const PADDING = 40;
export const BOARD_WIDTH = 8 * CELL_SIZE + PADDING * 2;
export const BOARD_HEIGHT = 9 * CELL_SIZE + PADDING * 2;

interface BoardGridProps {
  flipped?: boolean;
}

export const BoardGrid: React.FC<BoardGridProps> = React.memo(({ flipped }) => {
  // 10 条横线
  const horizontalLines = Array.from({ length: 10 }, (_, r) => {
    const y = PADDING + r * CELL_SIZE;
    return (
      <line
        key={`h-${r}`}
        x1={PADDING}
        y1={y}
        x2={PADDING + 8 * CELL_SIZE}
        y2={y}
        stroke="#5a3d28"
        strokeWidth={r === 0 || r === 9 ? '2.5' : '1.5'}
      />
    );
  });

  // 9 条竖线（边缘2条贯通，内部7条在楚河汉界处断开）
  const verticalLines = Array.from({ length: 9 }, (_, c) => {
    const x = PADDING + c * CELL_SIZE;
    if (c === 0 || c === 8) {
      return (
        <line
          key={`v-${c}`}
          x1={x}
          y1={PADDING}
          x2={x}
          y2={PADDING + 9 * CELL_SIZE}
          stroke="#5a3d28"
          strokeWidth="2.5"
        />
      );
    }

    return (
      <React.Fragment key={`v-split-${c}`}>
        {/* 上半段 */}
        <line
          x1={x}
          y1={PADDING}
          x2={x}
          y2={PADDING + 4 * CELL_SIZE}
          stroke="#5a3d28"
          strokeWidth="1.5"
        />
        {/* 下半段 */}
        <line
          x1={x}
          y1={PADDING + 5 * CELL_SIZE}
          x2={x}
          y2={PADDING + 9 * CELL_SIZE}
          stroke="#5a3d28"
          strokeWidth="1.5"
        />
      </React.Fragment>
    );
  });

  // 九宫格斜线
  const palaceLines = (
    <>
      {/* 顶部九宫格 (row 0..2, col 3..5) */}
      <line
        x1={PADDING + 3 * CELL_SIZE}
        y1={PADDING}
        x2={PADDING + 5 * CELL_SIZE}
        y2={PADDING + 2 * CELL_SIZE}
        stroke="#5a3d28"
        strokeWidth="1.5"
      />
      <line
        x1={PADDING + 5 * CELL_SIZE}
        y1={PADDING}
        x2={PADDING + 3 * CELL_SIZE}
        y2={PADDING + 2 * CELL_SIZE}
        stroke="#5a3d28"
        strokeWidth="1.5"
      />

      {/* 底部九宫格 (row 7..9, col 3..5) */}
      <line
        x1={PADDING + 3 * CELL_SIZE}
        y1={PADDING + 7 * CELL_SIZE}
        x2={PADDING + 5 * CELL_SIZE}
        y2={PADDING + 9 * CELL_SIZE}
        stroke="#5a3d28"
        strokeWidth="1.5"
      />
      <line
        x1={PADDING + 5 * CELL_SIZE}
        y1={PADDING + 7 * CELL_SIZE}
        x2={PADDING + 3 * CELL_SIZE}
        y2={PADDING + 9 * CELL_SIZE}
        stroke="#5a3d28"
        strokeWidth="1.5"
      />
    </>
  );

  // 炮位与兵位十字星位标记
  const renderStarMarker = (row: number, col: number) => {
    const cx = PADDING + col * CELL_SIZE;
    const cy = PADDING + row * CELL_SIZE;
    const d = 5;
    const len = 7;
    const isLeftEdge = col === 0;
    const isRightEdge = col === 8;

    return (
      <g key={`star-${row}-${col}`} stroke="#5a3d28" strokeWidth="1.2">
        {/* 左上折角 */}
        {!isLeftEdge && (
          <path d={`M ${cx - d - len} ${cy - d} L ${cx - d} ${cy - d} L ${cx - d} ${cy - d - len}`} fill="none" />
        )}
        {/* 右上折角 */}
        {!isRightEdge && (
          <path d={`M ${cx + d + len} ${cy - d} L ${cx + d} ${cy - d} L ${cx + d} ${cy - d - len}`} fill="none" />
        )}
        {/* 左下折角 */}
        {!isLeftEdge && (
          <path d={`M ${cx - d - len} ${cy + d} L ${cx - d} ${cy + d} L ${cx - d} ${cy + d + len}`} fill="none" />
        )}
        {/* 右下折角 */}
        {!isRightEdge && (
          <path d={`M ${cx + d + len} ${cy + d} L ${cx + d} ${cy + d} L ${cx + d} ${cy + d + len}`} fill="none" />
        )}
      </g>
    );
  };

  const starPositions = [
    // 炮位
    [2, 1], [2, 7], [7, 1], [7, 7],
    // 卒位
    [3, 0], [3, 2], [3, 4], [3, 6], [3, 8],
    // 兵位
    [6, 0], [6, 2], [6, 4], [6, 6], [6, 8],
  ];

  return (
    <svg
      viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
      className="w-full h-full pointer-events-none select-none"
    >
      {/* 棋盘外框双线边饰 */}
      <rect
        x={PADDING - 8}
        y={PADDING - 8}
        width={8 * CELL_SIZE + 16}
        height={9 * CELL_SIZE + 16}
        fill="none"
        stroke="#5a3d28"
        strokeWidth="3"
        rx="4"
      />
      <rect
        x={PADDING - 14}
        y={PADDING - 14}
        width={8 * CELL_SIZE + 28}
        height={9 * CELL_SIZE + 28}
        fill="none"
        stroke="#785034"
        strokeWidth="1.2"
        rx="6"
      />

      {horizontalLines}
      {verticalLines}
      {palaceLines}
      {starPositions.map(([r, c]) => renderStarMarker(r, c))}

      {/* 楚河汉界文字 */}
      <text
        x={PADDING + 2 * CELL_SIZE}
        y={PADDING + 4.5 * CELL_SIZE}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#66462c"
        fontSize="24"
        fontFamily='"Kaiti SC", "STKaiti", "KaiTi", "SimKai", serif'
        fontWeight="bold"
        letterSpacing="12"
      >
        {flipped ? '漢界' : '楚河'}
      </text>
      <text
        x={PADDING + 6 * CELL_SIZE}
        y={PADDING + 4.5 * CELL_SIZE}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#66462c"
        fontSize="24"
        fontFamily='"Kaiti SC", "STKaiti", "KaiTi", "SimKai", serif'
        fontWeight="bold"
        letterSpacing="12"
      >
        {flipped ? '楚河' : '漢界'}
      </text>
    </svg>
  );
});
