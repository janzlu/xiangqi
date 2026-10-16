import { BoardState, PieceColor, PieceType } from '../types/chess';
import { BOARD_COLS, BOARD_ROWS, createEmptyBoard, createPiece } from './constants';

export function boardToFen(board: BoardState, activeColor: PieceColor = 'red'): string {
  const rows: string[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    let emptyCount = 0;
    let rowStr = '';

    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        const char = piece.type;
        rowStr += piece.color === 'red' ? char.toUpperCase() : char.toLowerCase();
      }
    }

    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    rows.push(rowStr);
  }

  const turn = activeColor === 'red' ? 'w' : 'b';
  return `${rows.join('/')} ${turn}`;
}

export function fenToBoard(fen: string): { board: BoardState; activeColor: PieceColor } {
  const board = createEmptyBoard();
  const parts = fen.trim().split(' ');
  const rows = parts[0].split('/');
  const activeColor: PieceColor = parts[1] === 'b' ? 'black' : 'red';

  for (let r = 0; r < Math.min(BOARD_ROWS, rows.length); r++) {
    const rowStr = rows[r];
    let col = 0;

    for (const char of rowStr) {
      if (col >= BOARD_COLS) break;

      if (char >= '1' && char <= '9') {
        col += parseInt(char, 10);
      } else {
        const isUpper = char === char.toUpperCase();
        const color: PieceColor = isUpper ? 'red' : 'black';
        const type = char.toLowerCase() as PieceType;
        board[r][col] = createPiece(type, color);
        col++;
      }
    }
  }

  return { board, activeColor };
}
