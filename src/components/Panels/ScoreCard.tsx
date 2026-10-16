import React from 'react';
import { Trophy, Flame, Award, BarChart3 } from 'lucide-react';
import { UserStats, RankTier } from '../../types/score';

interface ScoreCardProps {
  stats: UserStats;
  currentTier: RankTier;
  nextTier: RankTier | null;
  progress: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  stats,
  currentTier,
  nextTier,
  progress,
}) => {
  const winRate =
    stats.totalGames > 0
      ? Math.round((stats.wins / stats.totalGames) * 100)
      : 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-amber-900/40 text-slate-100 shadow-xl space-y-4">
      {/* 头部段位徽章与积分 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-serif font-black text-lg shadow-md"
            style={{
              backgroundColor: currentTier.badgeColor,
              color: currentTier.badgeTextColor,
            }}
          >
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-amber-100 tracking-wide">
                {currentTier.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                当前段位
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              最高积分：<span className="text-amber-200 font-mono font-medium">{stats.highestRating}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
            {stats.rating}
          </div>
          <div className="text-xs text-slate-400">天梯棋力积分</div>
        </div>
      </div>

      {/* 晋级进度条 */}
      <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
        <div className="flex justify-between text-xs text-slate-300">
          <span>晋升至：<strong className="text-amber-300">{nextTier ? nextTier.name : '巅峰顶极'}</strong></span>
          <span className="font-mono text-amber-400">{nextTier ? `${progress}%` : '已满级'}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {nextTier && (
          <div className="text-[11px] text-slate-400 text-right">
            还需 <span className="text-amber-300 font-mono">{nextTier.minRating - stats.rating}</span> 分
          </div>
        )}
      </div>

      {/* 战绩指标网格 */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-center">
        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> 总场
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-100 mt-0.5">
            {stats.totalGames}
          </div>
        </div>

        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <div className="text-xs text-emerald-400 flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> 胜率
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {winRate}%
          </div>
        </div>

        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <div className="text-xs text-rose-400">胜/负/和</div>
          <div className="text-xs font-mono text-slate-200 mt-1">
            <span className="text-emerald-400 font-bold">{stats.wins}</span>/
            <span className="text-rose-400">{stats.losses}</span>/
            <span className="text-slate-400">{stats.draws}</span>
          </div>
        </div>

        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <div className="text-xs text-orange-400 flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5" /> 连胜
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-orange-400 mt-0.5">
            {stats.currentStreak}
            <span className="text-[10px] text-slate-400 font-normal ml-0.5">
              (最高{stats.highestStreak})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
