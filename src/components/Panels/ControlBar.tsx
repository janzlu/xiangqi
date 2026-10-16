import React from 'react';
import { RotateCcw, Lightbulb, RefreshCw, Volume2, VolumeX, Flag, BookOpen, Compass } from 'lucide-react';

interface ControlBarProps {
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
  onResign: () => void;
  onOpenEndgames: () => void;
  onOpenRules: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  canUndo: boolean;
  isAiThinking: boolean;
  isGameOver: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onUndo,
  onHint,
  onRestart,
  onResign,
  onOpenEndgames,
  onOpenRules,
  onToggleSound,
  soundEnabled,
  canUndo,
  isAiThinking,
  isGameOver,
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-amber-900/40 shadow-xl flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <button
          onClick={onUndo}
          disabled={!canUndo || isAiThinking || isGameOver}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all
            bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed
            border border-slate-700 hover:border-amber-500/50"
          title="悔棋两步回到自己回合"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>悔棋</span>
        </button>

        <button
          onClick={onHint}
          disabled={isAiThinking || isGameOver}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all
            bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed
            border border-slate-700 hover:border-emerald-500/50"
          title="AI 推演最优走法提示"
        >
          <Lightbulb className="w-4 h-4 text-emerald-400" />
          <span>锦囊</span>
        </button>

        <button
          onClick={onOpenEndgames}
          disabled={isAiThinking}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all
            bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 hover:border-amber-500/50"
          title="挑选经典名局残局挑战"
        >
          <Compass className="w-4 h-4 text-amber-400" />
          <span>名局挑战</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
          title={soundEnabled ? '静音' : '开启音效'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-amber-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <button
          onClick={onOpenRules}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
          title="象棋规则与记谱指南"
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={onResign}
          disabled={isAiThinking || isGameOver}
          className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all
            bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 disabled:opacity-40"
          title="认输结局"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>认输</span>
        </button>

        <button
          onClick={onRestart}
          disabled={isAiThinking}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all
            bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-md hover:shadow-amber-500/20"
          title="重新开局"
        >
          <RefreshCw className="w-4 h-4" />
          <span>重开</span>
        </button>
      </div>
    </div>
  );
};
