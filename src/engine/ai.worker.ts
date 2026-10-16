import { findBestMove } from './search';
import { BoardState, PieceColor } from '../types/chess';
import { DifficultyConfig } from '../types/ai';

self.onmessage = (
  e: MessageEvent<{ id: number; board: BoardState; color: PieceColor; config: DifficultyConfig }>
) => {
  const { id, board, color, config } = e.data;
  const result = findBestMove(board, color, config);
  self.postMessage({ id, result });
};
