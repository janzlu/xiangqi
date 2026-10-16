import { describe, it, expect } from 'vitest';
import { createEmptyBoard, createInitialBoard, createPiece, DIFFICULTY_CONFIGS } from '../core/constants';
import { findBestMove } from '../engine/search';

describe('AI Search Engine', () => {
  it('should find a valid opening move for Black', () => {
    const board = createInitialBoard();
    const result = findBestMove(board, 'black', DIFFICULTY_CONFIGS.novice);

    expect(result.bestMove).not.toBeNull();
    expect(result.bestMove?.from).toBeDefined();
    expect(result.bestMove?.to).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should find an obvious free piece capture', () => {
    const board = createEmptyBoard();
    board[9][4] = createPiece('k', 'red');
    board[0][4] = createPiece('k', 'black');
    board[5][4] = createPiece('p', 'red'); // Screen between kings

    // Red Chariot at (5, 0) can freely capture undefended Black Cannon at (2, 0)
    board[5][0] = createPiece('r', 'red');
    board[2][0] = createPiece('c', 'black');

    const result = findBestMove(board, 'red', DIFFICULTY_CONFIGS.intermediate);

    expect(result.bestMove).not.toBeNull();
    // Chariot should capture Black Cannon at (2, 0)
    expect(result.bestMove?.to.row).toBe(2);
    expect(result.bestMove?.to.col).toBe(0);
  });

  it('measures search time on opening', () => {
    const board = createInitialBoard();
    board[5][6] = board[6][6];
    board[6][6] = null;
    const t0 = Date.now();
    const result = findBestMove(board, 'black', DIFFICULTY_CONFIGS.intermediate);
    console.log('Search duration:', Date.now() - t0, 'ms, nodes:', result.nodesEvaluated);
    expect(result.bestMove).not.toBeNull();
  });

  it('computeAIMoveAsync returns a valid move asynchronously', async () => {
    const { computeAIMoveAsync } = await import('../engine/aiService');
    const board = createInitialBoard();
    board[5][6] = board[6][6];
    board[6][6] = null;
    const result = await computeAIMoveAsync(board, 'black', DIFFICULTY_CONFIGS.intermediate);
    expect(result.bestMove).not.toBeNull();
    expect(result.bestMove?.from).toBeDefined();
    expect(result.bestMove?.to).toBeDefined();
  });
});
