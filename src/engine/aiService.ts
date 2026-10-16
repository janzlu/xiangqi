import { BoardState, PieceColor } from '../types/chess';
import { DifficultyConfig } from '../types/ai';
import { LLMConfig, LLMMoveResult } from '../types/llm';
import { findBestMove } from './search';
import { getLegalMoves } from '../core/rules';
import { computeLLMMoveAsync } from '../services/llmService';

/**
 * 异步计算 AI 走法：
 * 1. 若启用了大模型（llmConfig?.enabled），通过 LLM 对弈引擎进行推演并提供本地兜底；
 * 2. 否则采用本地 Alpha-Beta 搜索引擎并分帧渲染，确保平滑思考且永不卡死。
 */
export async function computeAIMoveAsync(
  board: BoardState,
  color: PieceColor,
  config: DifficultyConfig,
  llmConfig?: LLMConfig,
  recentFens: string[] = []
): Promise<LLMMoveResult> {
  // 如果启用了 LLM 对弈
  if (llmConfig?.enabled) {
    return computeLLMMoveAsync(board, color, config, llmConfig);
  }

  return new Promise((resolve) => {
    // 留出 80ms 拟人化自然思考延时与 UI 状态渲染帧
    setTimeout(() => {
      try {
        const result = findBestMove(board, color, config, recentFens);
        if (result && result.bestMove) {
          resolve({
            ...result,
            isLLM: false,
          });
          return;
        }

        // 极端防御兜底：若搜索树无解但仍有合法走法，提取首个合法着法
        const fallbackMoves = getLegalMoves(board, color);
        resolve({
          bestMove: fallbackMoves[0] || null,
          score: 0,
          depthReached: 1,
          nodesEvaluated: 1,
          durationMs: 10,
          isLLM: false,
          thought: '搜索树无最优解，采用候选合法着法',
        });
      } catch (err) {
        console.error('AI compute exception caught, applying fallback:', err);
        const fallbackMoves = getLegalMoves(board, color);
        resolve({
          bestMove: fallbackMoves[0] || null,
          score: 0,
          depthReached: 1,
          nodesEvaluated: 1,
          durationMs: 10,
          isLLM: false,
          isFallback: true,
          fallbackReason: String(err),
          thought: '本地引擎异常，启用首选合法着法兜底',
        });
      }
    }, 80);
  });
}
