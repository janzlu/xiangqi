import React from 'react';
import { X, Compass, ChevronRight } from 'lucide-react';
import { EndgameChallenge } from '../../types/chess';
import { ENDGAME_CHALLENGES } from '../../data/endgames';

interface EndgameModalProps {
  isOpen: boolean;
  onSelectChallenge: (c: EndgameChallenge) => void;
  onClose: () => void;
}

export const EndgameModal: React.FC<EndgameModalProps> = ({
  isOpen,
  onSelectChallenge,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-amber-900/60 rounded-3xl p-6 text-slate-100 shadow-2xl relative max-w-lg w-full animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-amber-100">经典名局残局挑战</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {ENDGAME_CHALLENGES.map(ch => {
            const diffColor =
              ch.difficulty === 'easy'
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                : ch.difficulty === 'medium'
                ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                : 'text-rose-400 bg-rose-950/60 border-rose-800';

            const diffText =
              ch.difficulty === 'easy' ? '初级' : ch.difficulty === 'medium' ? '中级' : '高手';

            return (
              <div
                key={ch.id}
                onClick={() => {
                  onSelectChallenge(ch);
                  onClose();
                }}
                className="group p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/60 cursor-pointer transition-all hover:bg-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-serif text-base text-amber-200 group-hover:text-amber-400 transition-colors">
                      {ch.title}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${diffColor}`}>
                      {diffText}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ch.description}</p>
                <div className="mt-2 text-[11px] text-amber-300/80 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                  🎯 <strong>目标：</strong>{ch.targetObjective}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
