import React from 'react';
import { AIDifficulty } from '../../types/ai';
import { PieceColor } from '../../types/chess';
import { LLMConfig } from '../../types/llm';
import { DIFFICULTY_CONFIGS } from '../../core/constants';
import { LLM_PRESETS } from '../../services/llmStorage';
import { Bot, User, Sparkles, Settings2, KeyRound, CheckCircle } from 'lucide-react';

interface DifficultySelectorProps {
  difficulty: AIDifficulty;
  onSelectDifficulty: (d: AIDifficulty) => void;
  playerColor: PieceColor;
  onSelectPlayerColor: (c: PieceColor) => void;
  disabled?: boolean;
  isLLMMode: boolean;
  onToggleLLMMode: (enabled: boolean) => void;
  onOpenLLMConfig: () => void;
  llmConfig: LLMConfig;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  onSelectDifficulty,
  playerColor,
  onSelectPlayerColor,
  disabled,
  isLLMMode,
  onToggleLLMMode,
  onOpenLLMConfig,
  llmConfig,
}) => {
  const diffList = Object.values(DIFFICULTY_CONFIGS);
  const isKeyConfigured = Boolean(
    (llmConfig.apiKey && llmConfig.apiKey.trim()) || llmConfig.preset === 'ollama'
  );

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
            type="button"
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
            type="button"
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

      {/* 对手驱动类型切换：经典引擎 vs 大模型 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-amber-400" />
            对手对弈引擎：
          </span>
          <div className="flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onToggleLLMMode(false)}
              disabled={disabled}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                !isLLMMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              经典深算
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleLLMMode(true);
                if (!isKeyConfigured) {
                  onOpenLLMConfig();
                }
              }}
              disabled={disabled}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                isLLMMode
                  ? 'bg-gradient-to-r from-amber-500/30 to-purple-500/30 text-amber-200 border border-amber-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              大模型对弈
            </button>
          </div>
        </div>

        {/* 经典引擎模式：选择难度 */}
        {!isLLMMode ? (
          <div>
            <div className="text-[11px] text-amber-400 font-mono text-right mb-1.5">
              当前对手等级分：Elo {DIFFICULTY_CONFIGS[difficulty].rating}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {diffList.map(cfg => {
                const isSelected = difficulty === cfg.id;
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => onSelectDifficulty(cfg.id)}
                    disabled={disabled}
                    className={`p-2 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50 shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">{cfg.name}</div>
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
        ) : (
          /* 大模型模式：展示当前配置与快捷入口 */
          <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-200">
                  {LLM_PRESETS[llmConfig.preset]?.name || '自定义大模型'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {llmConfig.model || '未设定模型'}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenLLMConfig}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>配置</span>
              </button>
            </div>

            {/* API Key 状态 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">密钥状态：</span>
              {isKeyConfigured ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  已就绪
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLLMConfig}
                  className="flex items-center gap-1 text-amber-400 font-medium hover:underline animate-pulse"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  需配置 API Key
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
              大模型将根据棋盘 FEN 串与候选合法步推演落子，并在落子时展示大师心法与攻防解读。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
