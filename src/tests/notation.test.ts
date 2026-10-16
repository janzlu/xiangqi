import { describe, it, expect } from 'vitest';
import { createInitialBoard } from '../core/constants';
import { moveToNotation, colToNotationNumber } from '../core/notation';

describe('Xiangqi Notation Generator', () => {
  it('should correctly format column numbers', () => {
    // Red: col 8 is 一, col 0 is 九
    expect(colToNotationNumber(8, 'red')).toBe('一');
    expect(colToNotationNumber(7, 'red')).toBe('二');
    expect(colToNotationNumber(4, 'red')).toBe('五');
    expect(colToNotationNumber(0, 'red')).toBe('九');

    // Black: col 0 is 1, col 8 is 9
    expect(colToNotationNumber(0, 'black')).toBe('1');
    expect(colToNotationNumber(4, 'black')).toBe('5');
    expect(colToNotationNumber(7, 'black')).toBe('8');
    expect(colToNotationNumber(8, 'black')).toBe('9');
  });

  it('should correctly generate standard opening notation 炮二平五', () => {
    const board = createInitialBoard();
    // Red Cannon at (7, 7) - which is col 7 (二路) moving to (7, 4) (五路)
    const move = {
      from: { row: 7, col: 7 },
      to: { row: 7, col: 4 },
    };

    const notation = moveToNotation(board, move);
    expect(notation).toBe('砲二平五');
  });

  it('should correctly generate Black opening notation 马8进7', () => {
    const board = createInitialBoard();
    // Black Horse at (0, 7) - which is col 7 (8路) jumping to (2, 6) (7路)
    const move = {
      from: { row: 0, col: 7 },
      to: { row: 2, col: 6 },
    };
    const notation = moveToNotation(board, move);
    expect(notation).toBe('馬8进7');
  });

  it('should format 2 pieces in the same column as 前/后', () => {
    const board = createInitialBoard();
    // Put two Red rooks on column 8 (一路)
    board[8][8] = { id: 'r1', type: 'r', color: 'red' }; // Front
    board[9][8] = { id: 'r2', type: 'r', color: 'red' }; // Back

    const moveFront = { from: { row: 8, col: 8 }, to: { row: 6, col: 8 } };
    const moveBack = { from: { row: 9, col: 8 }, to: { row: 7, col: 8 } };

    expect(moveToNotation(board, moveFront)).toBe('前俥进二');
    expect(moveToNotation(board, moveBack)).toBe('后俥进二');
  });

  it('should format 3 pawns in the same column as 前/中/后', () => {
    const board = createInitialBoard();
    board[6][4] = null; // clear existing red pawn at (6, 4)
    // 3 Red pawns on col 4: rows 2, 3, 4
    board[2][4] = { id: 'p1', type: 'p', color: 'red' }; // Front
    board[3][4] = { id: 'p2', type: 'p', color: 'red' }; // Middle
    board[4][4] = { id: 'p3', type: 'p', color: 'red' }; // Back

    const moveMiddle = { from: { row: 3, col: 4 }, to: { row: 3, col: 3 } };
    expect(moveToNotation(board, moveMiddle)).toBe('中兵平六');
  });
});
