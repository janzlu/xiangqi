import { describe, it, expect } from 'vitest';
import { createInitialBoard, createEmptyBoard, createPiece } from '../core/constants';
import {
  getLegalMoves,
  isInCheck,
  areKingsFacing,
  getPseudoLegalMovesForPiece,
} from '../core/rules';

describe('Xiangqi Rules Engine', () => {
  it('should initialize a complete 32-piece board', () => {
    const board = createInitialBoard();
    let redCount = 0;
    let blackCount = 0;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const piece = board[r][c];
        if (piece) {
          if (piece.color === 'red') redCount++;
          if (piece.color === 'black') blackCount++;
        }
      }
    }

    expect(redCount).toBe(16);
    expect(blackCount).toBe(16);
  });

  it('should generate valid opening moves for Red (cannon, horse, pawn, etc.)', () => {
    const board = createInitialBoard();
    const legalMoves = getLegalMoves(board, 'red');

    // In Chinese chess opening, Red typically has 44 legal moves
    expect(legalMoves.length).toBeGreaterThan(40);

    // Initial board should not be in check
    expect(isInCheck(board, 'red')).toBe(false);
    expect(isInCheck(board, 'black')).toBe(false);
  });

  it('should correctly enforce horse leg blocking (蹩马腿)', () => {
    const board = createEmptyBoard();
    // Red horse at row 7, col 4
    board[7][4] = createPiece('n', 'red');
    // Place friendly piece at row 6, col 4 (blocks horse moving upward)
    board[6][4] = createPiece('p', 'red');
    // Ensure kings exist to satisfy flying general checks
    board[9][4] = createPiece('k', 'red');
    board[0][4] = createPiece('k', 'black');
    // Place a screen between kings so they do not face each other
    board[5][4] = createPiece('p', 'red');

    const moves = getPseudoLegalMovesForPiece(board, { row: 7, col: 4 });
    const blockedDestinations = moves.filter(m => m.to.row === 5 && (m.to.col === 3 || m.to.col === 5));

    // Both upward jumps should be blocked
    expect(blockedDestinations.length).toBe(0);
  });

  it('should correctly enforce elephant eye blocking (塞象眼) and river limit', () => {
    const board = createEmptyBoard();
    board[9][2] = createPiece('b', 'red'); // 相 at (9, 2)
    board[8][3] = createPiece('p', 'black'); // 塞象眼 at (8, 3)

    // King safety setup
    board[9][4] = createPiece('k', 'red');
    board[0][4] = createPiece('k', 'black');
    board[5][4] = createPiece('p', 'red');

    const moves = getPseudoLegalMovesForPiece(board, { row: 9, col: 2 });
    // Jumps towards (7, 4) should be blocked because eye (8, 3) has a piece
    const blockedMove = moves.find(m => m.to.row === 7 && m.to.col === 4);
    expect(blockedMove).toBeUndefined();

    // Jump towards (7, 0) should be open
    const openMove = moves.find(m => m.to.row === 7 && m.to.col === 0);
    expect(openMove).toBeDefined();
  });

  it('should correctly enforce Cannon jumping over exactly 1 piece to capture', () => {
    const board = createEmptyBoard();
    board[9][4] = createPiece('k', 'red');
    board[0][4] = createPiece('k', 'black');
    board[7][1] = createPiece('c', 'red'); // 炮
    board[5][1] = createPiece('p', 'red'); // 炮架
    board[2][1] = createPiece('c', 'black'); // 敌炮

    const moves = getPseudoLegalMovesForPiece(board, { row: 7, col: 1 });
    const captureMove = moves.find(m => m.to.row === 2 && m.to.col === 1);
    expect(captureMove).toBeDefined();
    expect(captureMove?.captured?.type).toBe('c');

    // Cannon cannot land on empty space behind the screen
    const emptyBeyondScreen = moves.find(m => m.to.row === 3 && m.to.col === 1);
    expect(emptyBeyondScreen).toBeUndefined();
  });

  it('should detect Flying General (对脸照面)', () => {
    const board = createEmptyBoard();
    board[9][4] = createPiece('k', 'red');
    board[0][4] = createPiece('k', 'black');

    // No pieces between them -> facing each other
    expect(areKingsFacing(board)).toBe(true);

    // Place a piece between them
    board[5][4] = createPiece('p', 'red');
    expect(areKingsFacing(board)).toBe(false);
  });

  it('should prevent moves that leave the King in check', () => {
    const board = createEmptyBoard();
    board[9][4] = createPiece('k', 'red');
    board[0][4] = createPiece('k', 'black');
    board[5][4] = createPiece('r', 'black'); // Black Chariot on column 4 attacking Red King!
    board[8][4] = createPiece('a', 'red'); // Red Advisor shielding King

    // If Red moves Advisor away, Red King would be directly exposed to Black Chariot
    const advisorMoves = getLegalMoves(board, 'red').filter(m => m.from.row === 8 && m.from.col === 4);

    // Moving Advisor away is illegal because King would be in check!
    expect(advisorMoves.length).toBe(0);
  });

  it('should correctly identify stalemate (欠行困毙) where a player has no legal moves but is not in check', () => {
    const board = createEmptyBoard();
    // Black King at (0, 3) in palace.
    // Red King at (9, 5) (safe, different column).
    // Red Chariot at (1, 4): attacks row 1 (covering (1, 3)) and col 4 (covering (0, 4)).
    // But does NOT check (0, 3) because it cannot attack diagonally!
    board[0][3] = createPiece('k', 'black');
    board[9][5] = createPiece('k', 'red');
    board[1][4] = createPiece('r', 'red');

    const moves = getLegalMoves(board, 'black');
    const inCheck = isInCheck(board, 'black');

    expect(moves.length).toBe(0);
    expect(inCheck).toBe(false);
  });
});
