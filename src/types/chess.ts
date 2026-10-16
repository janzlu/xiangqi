export type PieceColor = 'red' | 'black';

export type PieceType = 
  | 'k' // 将 / 帅
  | 'a' // 士 / 仕
  | 'b' // 象 / 相
  | 'n' // 马 / 傌
  | 'r' // 车 / 俥
  | 'c' // 炮 / 砲
  | 'p'; // 卒 / 兵

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
}

export interface Position {
  row: number; // 0 to 9
  col: number; // 0 to 8
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Piece;
  notation?: string;
  isCheck?: boolean;
}

export type BoardState = (Piece | null)[][];

export type GameStatus = 
  | 'playing' 
  | 'check' 
  | 'checkmate' 
  | 'stalemate' // 欠行困毙
  | 'draw' 
  | 'resigned';

export interface MoveRecord {
  stepNumber: number;
  color: PieceColor;
  move: Move;
  notation: string;
  boardSnapshot: BoardState;
}

export interface EndgameChallenge {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  fen: string;
  turn: PieceColor;
  targetObjective: string;
}
