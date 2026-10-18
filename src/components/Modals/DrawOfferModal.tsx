import React from 'react';
import { Handshake, Check, X } from 'lucide-react';

interface DrawOfferModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export const DrawOfferModal: React.FC<DrawOfferModalProps> = ({
  isOpen,
  onAccept,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-900/60 rounded-3xl p-6 text-slate-100 shadow-2xl relative max-w-sm w-full animate-in zoom-in-95 duration-200 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Handshake className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold font-serif text-amber-100">
            对方提议和棋
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            对手认为局面势均力敌，向您申请提议握手言和。是否同意和棋？
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 text-sm shadow-lg transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>同意和棋</span>
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1.5 text-sm border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>继续对弈</span>
          </button>
        </div>
      </div>
    </div>
  );
};
