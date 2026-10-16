import { describe, it, expect } from 'vitest';
import { createInitialBoard } from '../core/constants';
import { MoveRecord, Move } from '../types/chess';
import { evaluateRepetitionAndRules } from '../core/repetition';
import { findBestMove } from '../engine/search';
import { DIFFICULTY_CONFIGS } from '../core/constants';
import { applyMove } from '../core/rules';
import { boardToFen } from '../core/fen';

describe('Chinese Xiangqi Official Repetition & Perpetual Check Rules', () => {
  it('detects unilateral oscillating perpetual check and rules a loss for checking side', () => {
    const board = createInitialBoard();
    // Simulate Red oscillating check (e.g. 俥六进一+ / 俥六退一+ vs 将5进1 / 将5退1)
    const redMove1: Move = { from: { row: 1, col: 5 }, to: { row: 0, col: 5 }, isCheck: true };
    const redMove2: Move = { from: { row: 0, col: 5 }, to: { row: 1, col: 5 }, isCheck: true };
    const redMove3: Move = { from: { row: 1, col: 5 }, to: { row: 0, col: 5 }, isCheck: true };

    const blackMove: Move = { from: { row: 0, col: 4 }, to: { row: 1, col: 4 }, isCheck: false };
    const blackMoveBack: Move = { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, isCheck: false };

    const history: MoveRecord[] = [
      { stepNumber: 1, color: 'red', move: redMove1, notation: '俥六进一', boardSnapshot: board },
      { stepNumber: 2, color: 'black', move: blackMove, notation: '將5进1', boardSnapshot: board },
      { stepNumber: 3, color: 'red', move: redMove2, notation: '俥六退一', boardSnapshot: board },
      { stepNumber: 4, color: 'black', move: blackMoveBack, notation: '将5退1', boardSnapshot: board },
      { stepNumber: 5, color: 'red', move: redMove3, notation: '俥六进一', boardSnapshot: board },
      { stepNumber: 6, color: 'black', move: blackMove, notation: '將5进1', boardSnapshot: board },
    ];

    const result = evaluateRepetitionAndRules(history, board, 'red');
    expect(result.isGameOver).toBe(true);
    expect(result.type).toBe('perpetual_check');
    expect(result.winner).toBe('black'); // Red loses due to perpetual check
    expect(result.reason).toContain('长将不变作负');
  });

  it('detects natural 60-round limit without captures as draw', () => {
    const board = createInitialBoard();
    const mockHistory: MoveRecord[] = [];
    for (let i = 0; i < 120; i++) {
      mockHistory.push({
        stepNumber: i + 1,
        color: i % 2 === 0 ? 'red' : 'black',
        move: { from: { row: 0, col: 0 }, to: { row: 0, col: 1 } },
        notation: '闲着',
        boardSnapshot: board,
      });
    }

    const result = evaluateRepetitionAndRules(mockHistory, board, 'red');
    expect(result.isGameOver).toBe(true);
    expect(result.type).toBe('natural_limit_draw');
    expect(result.winner).toBe(null);
    expect(result.reason).toContain('自然限着判和');
  });

  it('AI strictly refuses to perpetual check and varies move (变招)', () => {
    const board = createInitialBoard();
    // Simulate a position where Red could move a piece back into a recent FEN
    // Provide recent FENs that would be formed by a checking move
    const legalMoves = [
      { from: { row: 9, col: 0 }, to: { row: 8, col: 0 }, isCheck: true },
    ];
    const testNextBoard = applyMove(board, legalMoves[0]);
    const nextFen = boardToFen(testNextBoard, 'black');

    // Run AI with nextFen in recentFens
    const result = findBestMove(board, 'red', DIFFICULTY_CONFIGS.intermediate, [nextFen]);
    expect(result.bestMove).not.toBeNull();
    // AI should not pick the penalized move that leads to nextFen
    if (result.bestMove) {
      const chosenFen = boardToFen(applyMove(board, result.bestMove), 'black');
      expect(chosenFen).not.toBe(nextFen);
    }
  });
});
