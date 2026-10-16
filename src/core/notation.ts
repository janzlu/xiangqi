import { BoardState, Move, PieceColor } from '../types/chess';
import { PIECE_NAMES } from './constants';

const RED_NUMBERS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const BLACK_NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * 转换列坐标为中国象棋传统称谓：
 * 红方自右向左为 一 至 九 (col 8 -> 一, col 0 -> 九)
 * 黑方自右向左为 1 至 9 (col 0 -> 1, col 8 -> 9)
 */
export function colToNotationNumber(col: number, color: PieceColor): string {
  if (color === 'red') {
    const num = 9 - col;
    return RED_NUMBERS[num] || String(num);
  } else {
    const num = col + 1;
    return BLACK_NUMBERS[num] || String(num);
  }
}

/**
 * 生成中国象棋标准中文记谱，如“炮二平五”、“马8进7”
 */
export function moveToNotation(board: BoardState, move: Move): string {
  const piece = board[move.from.row][move.from.col];
  if (!piece) return '';

  const { color, type } = piece;
  const pieceChar = PIECE_NAMES[color][type];

  // 1. 检查同列是否有同种棋子（如双车同列、前后炮等）
  const samePiecesInCol: { row: number; col: number }[] = [];
  for (let r = 0; r < 10; r++) {
    const p = board[r][move.from.col];
    if (p && p.color === color && p.type === type) {
      samePiecesInCol.push({ row: r, col: move.from.col });
    }
  }

  let prefix = '';
  if (samePiecesInCol.length === 2) {
    // 区分“前”和“后”
    const sorted = [...samePiecesInCol].sort((a, b) =>
      color === 'red' ? a.row - b.row : b.row - a.row
    );
    const isFront = sorted[0].row === move.from.row;
    prefix = isFront ? `前${pieceChar}` : `后${pieceChar}`;
  } else if (samePiecesInCol.length === 3) {
    // 同列三子（如三兵/三卒同列）：前、中、后
    const sorted = [...samePiecesInCol].sort((a, b) =>
      color === 'red' ? a.row - b.row : b.row - a.row
    );
    if (sorted[0].row === move.from.row) prefix = `前${pieceChar}`;
    else if (sorted[1].row === move.from.row) prefix = `中${pieceChar}`;
    else prefix = `后${pieceChar}`;
  } else {
    // 常规：棋子名 + 原列号
    prefix = `${pieceChar}${colToNotationNumber(move.from.col, color)}`;
  }

  // 2. 运动方向：进、退、平
  let direction = '平';
  const rowDelta = move.to.row - move.from.row;

  if (color === 'red') {
    if (rowDelta < 0) direction = '进';
    else if (rowDelta > 0) direction = '退';
  } else {
    if (rowDelta > 0) direction = '进';
    else if (rowDelta < 0) direction = '退';
  }

  // 3. 终点或者步数：
  // 斜线行进棋子（马、相/象、士/仕）：第四字必定为目标列
  // 直线行进棋子（车、炮、将/帅、兵/卒）：
  // 平：目标列
  // 进/退：步数
  const isDiagonalPiece = type === 'n' || type === 'b' || type === 'a';
  let targetDesc = '';

  if (isDiagonalPiece) {
    targetDesc = colToNotationNumber(move.to.col, color);
  } else {
    if (direction === '平') {
      targetDesc = colToNotationNumber(move.to.col, color);
    } else {
      const stepCount = Math.abs(rowDelta);
      targetDesc = color === 'red' ? RED_NUMBERS[stepCount] : BLACK_NUMBERS[stepCount];
    }
  }

  return `${prefix}${direction}${targetDesc}`;
}
