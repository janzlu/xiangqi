import React from 'react';
import { AIDifficulty } from '../../types/ai';
import { PieceColor } from '../../types/chess';
import { DIFFICULTY_CONFIGS } from '../../core/constants';
import { Bot, User } from 'lucide-react';

interface DifficultySelectorProps {
  difficulty: AIDifficulty;
  onSelectDifficulty: (d: AIDifficulty) => void;
  playerColor: PieceColor;
  onSelectPlayerColor: (c: PieceColor) => void;
  disabled?: boolean;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  onSelectDifficulty,
  playerColor,
  onSelectPlayerColor,
  disabled,
}) => {
  const diffList = Object.values(DIFFICULTY_CONFIGS);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-amber-900/40 text-slate-100 shadow-xl space-y-3">
      {/* 执棋方选择 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <User className="w-4 h-4 text-amber-400" />
          玩家执子（红先黑后）：
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectPlayerColor('red')}
            disabled={disabled}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all border ${
              playerColor === 'red'
                ? 'bg-red-700/80 text-white border-red-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            执红 (先手)
          </button>
          <button
            onClick={() => onSelectPlayerColor('black')}
            disabled={disabled}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all border ${
              playerColor === 'black'
                ? 'bg-slate-700 text-white border-slate-400 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            执黑 (后手)
          </button>
        </div>
      </div>

      {/* 难度选择 */}
      <div>
        <div className="text-xs text-slate-400 font-medium flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-amber-400" />
            对弈电脑棋力：
          </span>
          <span className="text-amber-400 font-mono text-[11px]">
            当前对手等级分：{DIFFICULTY_CONFIGS[difficulty].rating}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {diffList.map(cfg => {
            const isSelected = difficulty === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => onSelectDifficulty(cfg.id)}
                disabled={disabled}
                className={`p-2 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm">{cfg.name}</span>
                </div>
                <div className="text-[11px] font-mono text-amber-400/90 mt-0.5">
                  Elo {cfg.rating}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                  {cfg.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
