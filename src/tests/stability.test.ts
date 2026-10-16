import { describe, it, expect } from 'vitest';
import { createInitialBoard } from '../core/constants';
import { isSquareAttackedBy, isInCheck, getLegalMoves } from '../core/rules';
import { fenToBoard } from '../core/fen';

describe('Game Stability & Edge Case Verification', () => {
  it('isSquareAttackedBy handles extreme board corners without out-of-bounds error', () => {
    const board = createInitialBoard();

    // Check all 4 corners and palace borders
    expect(() => isSquareAttackedBy(board, { row: 0, col: 0 }, 'red')).not.toThrow();
    expect(() => isSquareAttackedBy(board, { row: 0, col: 8 }, 'red')).not.toThrow();
    expect(() => isSquareAttackedBy(board, { row: 9, col: 0 }, 'black')).not.toThrow();
    expect(() => isSquareAttackedBy(board, { row: 9, col: 8 }, 'black')).not.toThrow();
  });

  it('isInCheck functions properly on bare king and endgame FENs', () => {
    // Bare king vs double chariots
    const fen = '4k4/9/9/9/9/9/9/9/9/3RK1R2 w - - 0 1';
    const { board } = fenToBoard(fen);

    expect(() => isInCheck(board, 'red')).not.toThrow();
    expect(() => isInCheck(board, 'black')).not.toThrow();
    expect(() => getLegalMoves(board, 'black')).not.toThrow();
  });

  it('handles horse jumps near boundaries with obstacle without undefined access', () => {
    const board = createInitialBoard();
    // Clear pieces and put a horse near corner
    board[0][1] = null;
    board[1][0] = { id: 'test-h', color: 'black', type: 'n' }; // Horse at edge
    board[1][1] = { id: 'test-p', color: 'red', type: 'p' }; // Leg obstacle

    expect(() => isSquareAttackedBy(board, { row: 0, col: 2 }, 'black')).not.toThrow();
    expect(() => isSquareAttackedBy(board, { row: 3, col: 1 }, 'black')).not.toThrow();
  });
});
