import React from 'react';
import { Piece } from '../../types/chess';
import { PIECE_NAMES } from '../../core/constants';

interface PieceViewProps {
  piece: Piece;
  isSelected?: boolean;
  isLastMoveTarget?: boolean;
  isHintTarget?: boolean;
  isInCheck?: boolean;
}

export const PieceView: React.FC<PieceViewProps> = React.memo(({
  piece,
  isSelected,
  isLastMoveTarget,
  isHintTarget,
  isInCheck,
}) => {
  const isRed = piece.color === 'red';
  const name = PIECE_NAMES[piece.color][piece.type];

  // 基础样式：纯 CSS 模拟立体车削木质棋子与双层外圈
  return (
    <div
      className={`
        relative w-full h-full rounded-full flex items-center justify-center select-none
        transition-all duration-150 transform
        ${isSelected ? 'scale-110 shadow-2xl ring-4 ring-amber-400 z-30' : 'hover:scale-105 z-10'}
        ${isHintTarget ? 'ring-4 ring-emerald-400 animate-bounce' : ''}
        ${isInCheck ? 'ring-4 ring-red-600 animate-pulse z-40' : ''}
        ${isLastMoveTarget ? 'ring-2 ring-amber-500' : ''}
      `}
      style={{
        background: isRed
          ? 'radial-gradient(circle at 35% 35%, #fff5e6 0%, #f7dcbb 45%, #deb887 80%, #b8860b 100%)'
          : 'radial-gradient(circle at 35% 35%, #f2efe9 0%, #d8cfc4 45%, #b3a492 80%, #786b59 100%)',
        boxShadow: isSelected
          ? '0 12px 24px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.3)'
          : '0 4px 10px rgba(0, 0, 0, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.8), inset 0 -2px 5px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* 棋子内圈倒角线 */}
      <div
        className="w-[84%] h-[84%] rounded-full flex items-center justify-center"
        style={{
          border: isRed ? '1.5px solid rgba(185, 28, 28, 0.45)' : '1.5px solid rgba(30, 41, 59, 0.45)',
          background: isRed
            ? 'radial-gradient(circle at 50% 50%, #fdf8ee 0%, #f5e3cb 100%)'
            : 'radial-gradient(circle at 50% 50%, #eae6de 0%, #cfc5b8 100%)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* 楷体篆刻字符：移动端 18px 加粗（font-black），PC端保持原版（sm:text-3xl md:text-4xl font-black） */}
        <span
          className={`font-serif font-black text-[18px] leading-none sm:text-3xl md:text-4xl tracking-tighter select-none flex items-center justify-center -translate-y-[0.5px] sm:translate-y-0 ${
            isRed ? 'text-red-700' : 'text-slate-900'
          }`}
          style={{
            fontFamily: '"Kaiti SC", "STKaiti", "KaiTi", "SimKai", "Noto Serif SC", serif',
            textShadow: isRed
              ? '0 1px 1px rgba(255, 255, 255, 0.8), 0 -1px 1px rgba(136, 19, 19, 0.4)'
              : '0 1px 1px rgba(255, 255, 255, 0.7), 0 -1px 1px rgba(0, 0, 0, 0.4)',
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
});
