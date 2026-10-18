import React from 'react';
import { Bell, Clock, X } from 'lucide-react';

interface InactivityAlertModalProps {
  isOpen: boolean;
  message: string;
  isMyTurn: boolean;
  onClose: () => void;
}

export const InactivityAlertModal: React.FC<InactivityAlertModalProps> = ({
  isOpen,
  message,
  isMyTurn,
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
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl relative max-w-sm w-full animate-in zoom-in-95 duration-200 text-center space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-bounce">
          <Bell className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold font-serif text-amber-100 flex items-center justify-center gap-1.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>棋局等待提醒</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {message}
          </p>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
          {isMyTurn
            ? '轮到您走子，楚河汉界静候佳着。'
            : '已向对方播放声音提示，请耐心稍候。'}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 text-sm shadow-lg transition-all cursor-pointer"
        >
          <span>知道了</span>
        </button>
      </div>
    </div>
  );
};
