import React, { useEffect, useRef } from 'react';
import { MoveRecord, PieceColor, GameStatus } from '../../types/chess';
import { ScrollText, Swords, AlertCircle } from 'lucide-react';

interface HistoryLogProps {
  history: MoveRecord[];
  turn: PieceColor;
  playerColor: PieceColor;
  gameStatus: GameStatus;
  isAiThinking: boolean;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  history,
  turn,
  playerColor,
  gameStatus,
  isAiThinking,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 整理历史记录为回合列表 [ { round: 1, red: '炮二平五', black: '马8进7' } ]
  const rounds: { round: number; red?: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    const roundIdx = Math.floor(i / 2);
    if (!rounds[roundIdx]) {
      rounds[roundIdx] = { round: roundIdx + 1 };
    }
    if (item.color === 'red') {
      rounds[roundIdx].red = item;
    } else {
      rounds[roundIdx].black = item;
    }
  }

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  const isUserTurn = turn === playerColor;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-amber-900/40 text-slate-100 shadow-xl flex flex-col h-[280px] xl:h-[380px]">
      {/* 头部状态条 */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <span>棋谱记录 ({history.length} 手)</span>
        </div>

        {/* 当前回合指示 */}
        <div className="flex items-center gap-1.5 text-xs">
          {gameStatus === 'check' && (
            <span className="flex items-center gap-1 text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-950/50 border border-red-800 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" /> 将军！
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full font-medium ${
              isAiThinking
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                : isUserTurn
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isAiThinking
              ? '电脑思考中...'
              : isUserTurn
              ? '轮到您走棋'
              : '等待电脑'}
          </span>
        </div>
      </div>

      {/* 棋谱走法列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mt-2 space-y-1 pr-1 font-mono text-xs select-text scrollbar-thin scrollbar-thumb-slate-700"
      >
        {rounds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Swords className="w-6 h-6 mb-1 opacity-40" />
            <span>楚河汉界，静候开局第一手</span>
          </div>
        ) : (
          rounds.map(r => (
            <div
              key={`round-${r.round}`}
              className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-800/50 transition-colors"
            >
              <span className="w-8 text-slate-500">{r.round}.</span>
              <span className="flex-1 text-red-400 font-semibold tracking-wide">
                {r.red?.notation || ''}
                {r.red?.move.isCheck ? '+' : ''}
              </span>
              <span className="flex-1 text-slate-300 font-semibold tracking-wide">
                {r.black?.notation || ''}
                {r.black?.move.isCheck ? '+' : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
