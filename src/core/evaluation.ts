import { BoardState, PieceType } from '../types/chess';
import { BOARD_COLS, BOARD_ROWS } from './constants';

export const PIECE_BASE_VALUES: Record<PieceType, number> = {
  k: 10000,
  r: 1000,
  c: 460,
  n: 430,
  a: 220,
  b: 220,
  p: 100,
};

// 马的位置权重（鼓励跃向中路，厌恶边缘）
const HORSE_PST = [
  [-10, -5, -5,  0,  0,  0, -5, -5, -10],
  [-5,   0,  5, 10, 10, 10,  5,  0,  -5],
  [-5,   5, 15, 20, 20, 20, 15,  5,  -5],
  [-5,  10, 20, 25, 25, 25, 20, 10,  -5],
  [-5,  10, 20, 30, 35, 30, 20, 10,  -5],
  [-5,  10, 20, 30, 35, 30, 20, 10,  -5],
  [-5,  10, 20, 25, 25, 25, 20, 10,  -5],
  [-5,   5, 15, 20, 20, 20, 15,  5,  -5],
  [-5,   0,  5, 10, 10, 10,  5,  0,  -5],
  [-10, -5, -5,  0,  0,  0, -5, -5, -10],
];

// 车的位置权重（鼓励占领要道、下底线、巡河）
const CHARIOT_PST = [
  [10, 15, 15, 20, 20, 20, 15, 15, 10],
  [15, 20, 20, 25, 25, 25, 20, 20, 15],
  [10, 15, 15, 20, 20, 20, 15, 15, 10],
  [10, 15, 15, 20, 20, 20, 15, 15, 10],
  [15, 20, 25, 30, 30, 30, 25, 20, 15],
  [15, 20, 25, 30, 30, 30, 25, 20, 15],
  [10, 15, 15, 20, 20, 20, 15, 15, 10],
  [10, 15, 15, 20, 20, 20, 15, 15, 10],
  [15, 20, 20, 25, 25, 25, 20, 20, 15],
  [10, 15, 15, 20, 20, 20, 15, 15, 10],
];

// 炮的位置权重（中炮、巡河、沉底）
const CANNON_PST = [
  [ 5, 10, 10, 15, 20, 15, 10, 10,  5],
  [ 5, 10, 10, 15, 25, 15, 10, 10,  5],
  [ 5, 10, 15, 25, 30, 25, 15, 10,  5],
  [10, 15, 20, 25, 25, 25, 20, 15, 10],
  [10, 15, 20, 25, 25, 25, 20, 15, 10],
  [10, 15, 20, 25, 25, 25, 20, 15, 10],
  [ 5, 10, 15, 20, 20, 20, 15, 10,  5],
  [ 5, 10, 15, 25, 30, 25, 15, 10,  5],
  [ 5,  5, 10, 15, 20, 15, 10,  5,  5],
  [ 0,  5,  5, 10, 15, 10,  5,  5,  0],
];

// 兵/卒位置权重（红方从下往上进，过河后逼近敌营价值猛增）
const RED_PAWN_PST = [
  [ 0,  3,  6,  9,  9,  9,  6,  3,  0],
  [30, 45, 60, 75, 75, 75, 60, 45, 30],
  [30, 45, 55, 65, 70, 65, 55, 45, 30],
  [20, 30, 40, 50, 55, 50, 40, 30, 20],
  [10, 20, 30, 40, 45, 40, 30, 20, 10], // 过河前线
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0, -5,  0, 10,  0, -5,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
];

// 黑卒从上往下进
const BLACK_PAWN_PST = [...RED_PAWN_PST].reverse();

/**
 * 局面静态估值（红方为正，黑方为负）
 */
export function evaluateBoard(board: BoardState): number {
  let redScore = 0;
  let blackScore = 0;

  let redAdvisors = 0;
  let blackAdvisors = 0;
  let redElephants = 0;
  let blackElephants = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      let val = PIECE_BASE_VALUES[piece.type];

      const evalRow = piece.color === 'red' ? r : 9 - r;

      // 叠加位置分
      switch (piece.type) {
        case 'n':
          val += HORSE_PST[evalRow][c];
          break;
        case 'r':
          val += CHARIOT_PST[evalRow][c];
          break;
        case 'c':
          val += CANNON_PST[evalRow][c];
          break;
        case 'p':
          if (piece.color === 'red') {
            val += RED_PAWN_PST[r][c];
            // 过河兵额外加成
            if (r < 5) val += 90;
          } else {
            val += BLACK_PAWN_PST[r][c];
            // 过河卒额外加成
            if (r > 4) val += 90;
          }
          break;
        case 'a':
          if (piece.color === 'red') redAdvisors++;
          else blackAdvisors++;
          break;
        case 'b':
          if (piece.color === 'red') redElephants++;
          else blackElephants++;
          break;
        default:
          break;
      }

      if (piece.color === 'red') {
        redScore += val;
      } else {
        blackScore += val;
      }
    }
  }

  // 双仕完整、双相连环有护帅阵型加成
  if (redAdvisors === 2) redScore += 35;
  if (redElephants === 2) redScore += 35;
  if (blackAdvisors === 2) blackScore += 35;
  if (blackElephants === 2) blackScore += 35;

  return redScore - blackScore;
}
