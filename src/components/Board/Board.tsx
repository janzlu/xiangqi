import React from 'react';
import { BoardState, Move, PieceColor, Position } from '../../types/chess';
import { BoardGrid, CELL_SIZE, PADDING, BOARD_WIDTH, BOARD_HEIGHT } from './BoardGrid';
import { PieceView } from './PieceView';
import { MoveMarker } from './MoveMarker';
import { isInCheck } from '../../core/rules';

interface BoardProps {
  board: BoardState;
  turn: PieceColor;
  playerColor: PieceColor;
  selectedPos: Position | null;
  validDestinations: Position[];
  lastMove: Move | null;
  hintMove: Move | null;
  onSquareClick: (pos: Position) => void;
  isAiThinking?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  board,
  playerColor,
  selectedPos,
  validDestinations,
  lastMove,
  hintMove,
  onSquareClick,
  isAiThinking,
}) => {
  const flipped = playerColor === 'black';

  // 将棋盘坐标 (row, col) 转换为在视图中的显示坐标
  const getDisplayCoords = (r: number, c: number) => {
    const vr = flipped ? 9 - r : r;
    const vc = flipped ? 8 - c : c;
    const x = PADDING + vc * CELL_SIZE;
    const y = PADDING + vr * CELL_SIZE;
    return { x, y };
  };

  // 检查是否有将处于将军危险
  const isRedInCheck = isInCheck(board, 'red');
  const isBlackInCheck = isInCheck(board, 'black');

  // 棋子直径
  const pieceDiameter = 50;

  return (
    <div className="relative inline-block p-3 sm:p-5 rounded-2xl shadow-2xl bg-amber-950/20 backdrop-blur-md border border-amber-900/40">
      {/* 棋盘木纹板底 */}
      <div
        className="relative rounded-xl overflow-hidden shadow-inner"
        style={{
          width: '100%',
          maxWidth: `${BOARD_WIDTH}px`,
          aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
          background: 'linear-gradient(135deg, #e8cca6 0%, #deb887 50%, #c99e6b 100%)',
          boxShadow: 'inset 0 0 40px rgba(115, 65, 25, 0.45), 0 8px 20px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* 背景木质纹理细线条 (纯 CSS 增强真实感) */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #7c4a1e 0, #7c4a1e 1px, transparent 0, transparent 8px)',
          }}
        />

        {/* 底层 SVG 棋盘网格 */}
        <BoardGrid flipped={flipped} />

        {/* 交互与棋子图层 */}
        <div className="absolute inset-0">
          {Array.from({ length: 10 }).map((_, r) =>
            Array.from({ length: 9 }).map((__, c) => {
              const piece = board[r][c];
              const { x, y } = getDisplayCoords(r, c);

              const isSelected = selectedPos?.row === r && selectedPos?.col === c;
              const isValidDest = validDestinations.some(d => d.row === r && d.col === c);
              const isLastFrom = lastMove?.from.row === r && lastMove?.from.col === c;
              const isLastTo = lastMove?.to.row === r && lastMove?.to.col === c;
              const isHint = hintMove?.from.row === r && hintMove?.from.col === c ||
                             hintMove?.to.row === r && hintMove?.to.col === c;

              const isKingInCheck =
                (piece?.type === 'k' && piece?.color === 'red' && isRedInCheck) ||
                (piece?.type === 'k' && piece?.color === 'black' && isBlackInCheck);

              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => onSquareClick({ row: r, col: c })}
                  className="absolute cursor-pointer transition-transform flex items-center justify-center"
                  style={{
                    left: `${(x / BOARD_WIDTH) * 100}%`,
                    top: `${(y / BOARD_HEIGHT) * 100}%`,
                    width: `${(pieceDiameter / BOARD_WIDTH) * 100}%`,
                    height: `${(pieceDiameter / BOARD_HEIGHT) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={piece ? `${piece.color === 'red' ? '红' : '黑'}${piece.type}` : `${r},${c}`}
                >
                  {/* 标记指示器 */}
                  {isLastFrom && <MoveMarker type="last-from" pos={{ row: r, col: c }} />}
                  {isLastTo && <MoveMarker type="last-to" pos={{ row: r, col: c }} />}
                  {isHint && <MoveMarker type="hint" pos={{ row: r, col: c }} />}
                  {isKingInCheck && <MoveMarker type="check" pos={{ row: r, col: c }} />}

                  {/* 合法目的地提示 */}
                  {isValidDest && (
                    <MoveMarker
                      type={piece ? 'valid-capture' : 'valid-empty'}
                      pos={{ row: r, col: c }}
                    />
                  )}

                  {/* 棋子主体 */}
                  {piece && (
                    <PieceView
                      piece={piece}
                      isSelected={isSelected}
                      isLastMoveTarget={isLastTo}
                      isInCheck={isKingInCheck}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* AI 思考中浮层指示 */}
        {isAiThinking && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 text-amber-200 text-xs shadow-lg backdrop-blur border border-amber-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>电脑推演中...</span>
          </div>
        )}
      </div>
    </div>
  );
};
