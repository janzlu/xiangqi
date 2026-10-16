import { BoardState, Piece, PieceColor, PieceType } from '../types/chess';
import { RankTier } from '../types/score';
import { AIDifficulty, DifficultyConfig } from '../types/ai';

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

export const PIECE_NAMES: Record<PieceColor, Record<PieceType, string>> = {
  red: {
    k: '帥',
    a: '仕',
    b: '相',
    n: '傌',
    r: '俥',
    c: '砲',
    p: '兵',
  },
  black: {
    k: '將',
    a: '士',
    b: '象',
    n: '馬',
    r: '車',
    c: '炮',
    p: '卒',
  },
};

export const INITIAL_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w';

export function createEmptyBoard(): BoardState {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
}

let pieceIdCounter = 0;
export function createPiece(type: PieceType, color: PieceColor): Piece {
  pieceIdCounter += 1;
  return {
    id: `${color}-${type}-${pieceIdCounter}`,
    type,
    color,
  };
}

export function createInitialBoard(): BoardState {
  const board = createEmptyBoard();

  // Black pieces (Top: row 0 to 3)
  const blackBackRow: PieceType[] = ['r', 'n', 'b', 'a', 'k', 'a', 'b', 'n', 'r'];
  for (let c = 0; c < 9; c++) {
    board[0][c] = createPiece(blackBackRow[c], 'black');
  }
  board[2][1] = createPiece('c', 'black');
  board[2][7] = createPiece('c', 'black');
  for (let c = 0; c < 9; c += 2) {
    board[3][c] = createPiece('p', 'black');
  }

  // Red pieces (Bottom: row 6 to 9)
  const redBackRow: PieceType[] = ['r', 'n', 'b', 'a', 'k', 'a', 'b', 'n', 'r'];
  for (let c = 0; c < 9; c++) {
    board[9][c] = createPiece(redBackRow[c], 'red');
  }
  board[7][1] = createPiece('c', 'red');
  board[7][7] = createPiece('c', 'red');
  for (let c = 0; c < 9; c += 2) {
    board[6][c] = createPiece('p', 'red');
  }

  return board;
}

export const RANK_TIERS: RankTier[] = [
  { id: 't1', name: '业余九级', minRating: 0, badgeColor: '#64748b', badgeTextColor: '#f8fafc' },
  { id: 't2', name: '业余六级', minRating: 1100, badgeColor: '#059669', badgeTextColor: '#ffffff' },
  { id: 't3', name: '业余三级', minRating: 1250, badgeColor: '#2563eb', badgeTextColor: '#ffffff' },
  { id: 't4', name: '业余一级', minRating: 1400, badgeColor: '#7c3aed', badgeTextColor: '#ffffff' },
  { id: 't5', name: '业余名手', minRating: 1550, badgeColor: '#ea580c', badgeTextColor: '#ffffff' },
  { id: 't6', name: '棋协大师', minRating: 1700, badgeColor: '#dc2626', badgeTextColor: '#ffffff' },
  { id: 't7', name: '国家大师', minRating: 1900, badgeColor: '#b45309', badgeTextColor: '#ffffff' },
  { id: 't8', name: '特级大师', minRating: 2100, badgeColor: '#f59e0b', badgeTextColor: '#78350f' },
];

export const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  novice: {
    id: 'novice',
    name: '初学棋童',
    rating: 1100,
    depth: 1,
    description: '走子轻快，偶尔露出破绽，适合初学者热身练习',
    useQuiescence: false,
    timeLimitMs: 150,
  },
  intermediate: {
    id: 'intermediate',
    name: '街坊棋手',
    rating: 1400,
    depth: 2,
    description: '基本功扎实，善于捉子反击，具备基础大局观',
    useQuiescence: true,
    timeLimitMs: 400,
  },
  master: {
    id: 'master',
    name: '棋协大师',
    rating: 1750,
    depth: 3,
    description: '攻守兼备，算度深远，精通子力协调与静态杀法',
    useQuiescence: true,
    timeLimitMs: 700,
  },
  grandmaster: {
    id: 'grandmaster',
    name: '特级大师',
    rating: 2100,
    depth: 4,
    description: '极高深算，步步为营，无明显漏洞的顶级棋力',
    useQuiescence: true,
    timeLimitMs: 1200,
  },
};
