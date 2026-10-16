import { BoardState, PieceColor } from '../types/chess';
import { AIMoveResult, DifficultyConfig } from '../types/ai';
import { findBestMove } from './search';

/**
 * 异步计算 AI 走法，避免阻塞 UI 渲染帧
 */
export async function computeAIMoveAsync(
  board: BoardState,
  color: PieceColor,
  config: DifficultyConfig
): Promise<AIMoveResult> {
  return new Promise((resolve) => {
    // 使用 setTimeout 将密集计算推入宏任务，确保 UI 思考动画能立即上屏
    setTimeout(() => {
      const result = findBestMove(board, color, config);
      resolve(result);
    }, 40);
  });
}
