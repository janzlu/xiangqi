import { BoardState, PieceColor } from '../types/chess';
import { AIMoveResult, DifficultyConfig } from '../types/ai';
import { findBestMove } from './search';
import { getLegalMoves } from '../core/rules';

/**
 * 异步计算 AI 走法：
 * 采用宏任务分帧机制，保证浏览器平滑上屏“思考中”动画状态；
 * 附带全量异常捕获与合法着法兜底，确保无论何种极端局面均 100% 正常落子、绝不卡死。
 */
export async function computeAIMoveAsync(
  board: BoardState,
  color: PieceColor,
  config: DifficultyConfig
): Promise<AIMoveResult> {
  return new Promise((resolve) => {
    // 留出 80ms 拟人化自然思考延时与 UI 状态渲染帧
    setTimeout(() => {
      try {
        const result = findBestMove(board, color, config);
        // 若推演得到有效着法直接返回
        if (result && result.bestMove) {
          resolve(result);
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
        });
      }
    }, 80);
  });
}
