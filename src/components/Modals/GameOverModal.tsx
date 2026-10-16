import React, { useEffect, useRef } from 'react';
import { Trophy, Frown, Award, RefreshCw, X } from 'lucide-react';
import { PieceColor } from '../../types/chess';

interface GameOverModalProps {
  isOpen: boolean;
  winner: PieceColor | null;
  playerColor: PieceColor;
  reason: string;
  ratingChange: number;
  newRating: number;
  onRestart: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  playerColor,
  reason,
  ratingChange,
  newRating,
  onRestart,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isWin = winner === playerColor;
  const isDraw = winner === null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto p-0 bg-transparent backdrop:bg-black/75 backdrop:backdrop-blur-sm outline-none border-none max-w-sm w-full"
    >
      <div className="bg-slate-900 border border-amber-900/60 rounded-3xl p-6 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 顶部图标与胜负标题 */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
            {isWin ? (
              <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-yellow-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-amber-500/30">
                <Trophy className="w-9 h-9" />
              </div>
            ) : isDraw ? (
              <div className="w-full h-full bg-gradient-to-tr from-slate-600 to-slate-400 rounded-2xl flex items-center justify-center text-slate-900">
                <Award className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-rose-700 to-rose-500 rounded-2xl flex items-center justify-center text-white">
                <Frown className="w-9 h-9" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-black font-serif tracking-wider">
            {isWin ? '旗开得胜！' : isDraw ? '握手言和' : '遗憾落败'}
          </h2>
          <p className="text-sm text-slate-400 font-sans">{reason}</p>
        </div>

        {/* 积分结算卡片 */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>天梯积分变动</span>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
              当前分：<span className="text-amber-400">{newRating}</span>
            </div>
          </div>

          <div
            className={`text-2xl font-black font-mono flex items-center ${
              ratingChange > 0
                ? 'text-emerald-400'
                : ratingChange < 0
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
          </div>
        </div>

        {/* 按钮 */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onRestart();
            }}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>再弈一局</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
