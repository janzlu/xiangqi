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
});
