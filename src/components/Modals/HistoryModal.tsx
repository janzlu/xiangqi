import React from 'react';
import { X, History, Trash2 } from 'lucide-react';
import { MatchHistoryItem } from '../../types/score';

interface HistoryModalProps {
  isOpen: boolean;
  history: MatchHistoryItem[];
  onResetStats: () => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  onResetStats,
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
      <div className="bg-slate-900 border border-amber-900/60 rounded-3xl p-6 text-slate-100 shadow-2xl relative max-w-lg w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-amber-100">对弈战绩详单</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              暂无历史对局，快开始您的第一盘棋吧！
            </div>
          ) : (
            history.map(item => {
              const isWin = item.result === 'win';
              const isLoss = item.result === 'loss';

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isWin
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : isLoss
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isWin ? '胜利' : isLoss ? '落败' : '和棋'}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">
                        vs {item.opponent}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {item.date} · 共 {item.totalSteps} 步 · {item.reason}
                    </div>
                  </div>

                  <div
                    className={`font-mono text-base font-bold ${
                      item.ratingChange > 0
                        ? 'text-emerald-400'
                        : item.ratingChange < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.ratingChange > 0 ? `+${item.ratingChange}` : item.ratingChange}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end shrink-0">
            <button
              onClick={() => {
                if (window.confirm('确定要清空全部战绩和积分记录吗？此操作不可逆。')) {
                  onResetStats();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400/80 hover:text-rose-300 py-1 px-3 rounded-lg hover:bg-rose-950/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空战绩记录</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
