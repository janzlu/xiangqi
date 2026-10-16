import { describe, it, expect } from 'vitest';
import { createInitialBoard } from '../core/constants';
import { boardToFen, fenToBoard } from '../core/fen';
import { ENDGAME_CHALLENGES } from '../data/endgames';

describe('FEN Serializer & Deserializer', () => {
  it('should serialize initial board to standard Xiangqi FEN', () => {
    const board = createInitialBoard();
    const fen = boardToFen(board, 'red');

    expect(fen).toBe('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w');
  });

  it('should roundtrip board to FEN and back without piece loss', () => {
    const initial = createInitialBoard();
    const fen = boardToFen(initial, 'red');
    const { board: parsedBoard, activeColor } = fenToBoard(fen);

    expect(activeColor).toBe('red');
    expect(boardToFen(parsedBoard, activeColor)).toBe(fen);
  });

  it('should successfully parse all built-in endgame challenges', () => {
    for (const challenge of ENDGAME_CHALLENGES) {
      const { board, activeColor } = fenToBoard(challenge.fen);
      expect(activeColor).toBe(challenge.turn);

      // Verify that pieces are loaded on the board
      let pieceCount = 0;
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c]) pieceCount++;
        }
      }
      expect(pieceCount).toBeGreaterThan(0);
    }
  });
});
