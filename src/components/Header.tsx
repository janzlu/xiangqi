import React from 'react';
import { History, Sparkles, Users } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenLLMConfig: () => void;
  onOpenOnlineRoom: () => void;
  isLLMActive?: boolean;
  isOnlineActive?: boolean;
  onlineRoomCode?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenLLMConfig,
  onOpenOnlineRoom,
  isLLMActive,
  isOnlineActive,
  onlineRoomCode,
}) => {
  return (
    <header className="flex items-center justify-between py-4 px-2 sm:px-4 max-w-6xl mx-auto border-b border-amber-900/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-amber-700 flex items-center justify-center shadow-lg border border-amber-500/30">
          <span className="font-serif font-black text-2xl text-amber-100">帥</span>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-serif tracking-wider text-amber-100 flex items-center gap-2">
            <span>中国象棋</span>
            <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              智弈争雄
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            人机深算对弈 · 大模型跨界对战 · 经典名局挑战 · 双人联机
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* 双人联机入口 */}
        <button
          type="button"
          onClick={onOpenOnlineRoom}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all shadow-sm ${
            isOnlineActive
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 animate-pulse'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-emerald-500/40'
          }`}
          title="创建或加入在线双人对局"
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>{isOnlineActive ? `联机中 · ${onlineRoomCode}` : '双人联机'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenLLMConfig}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all shadow-sm ${
            isLLMActive
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-amber-500/40'
          }`}
          title="配置大模型 API 与对弈引擎"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>大模型设置</span>
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-medium border border-slate-800 hover:border-amber-500/40 transition-all shadow-sm"
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>战绩详单</span>
        </button>
      </div>
    </header>
  );
};
