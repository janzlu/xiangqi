import { describe, it, expect } from 'vitest';
import { createInitialBoard, DIFFICULTY_CONFIGS } from '../core/constants';
import { getLegalMoves, applyMove } from '../core/rules';
import { moveToNotation } from '../core/notation';
import { findBestMove } from '../engine/search';
import { PieceColor } from '../types/chess';

describe('Full Game Simulation', () => {
  it('should play 30 moves between AI players without crashing or throwing errors', () => {
    let board = createInitialBoard();
    let turn: PieceColor = 'red';
    const history: string[] = [];

    for (let step = 1; step <= 30; step++) {
      const legalMoves = getLegalMoves(board, turn);
      if (legalMoves.length === 0) {
        console.log(`Game ended at step ${step}: ${turn} has no legal moves`);
        break;
      }

      const aiResult = findBestMove(board, turn, DIFFICULTY_CONFIGS.intermediate);
      expect(aiResult.bestMove).not.toBeNull();
      const move = aiResult.bestMove!;

      // Check notation generation
      const notation = moveToNotation(board, move);
      expect(notation).toBeTruthy();
      history.push(`${step}. ${turn}: ${notation}`);

      // Apply move
      board = applyMove(board, move);
      turn = turn === 'red' ? 'black' : 'red';
    }

    expect(history.length).toBeGreaterThan(10);
  });
});
