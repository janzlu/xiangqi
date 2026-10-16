import { BoardState, Move, PieceColor, Position } from '../types/chess';
import { BOARD_COLS, BOARD_ROWS } from './constants';

export function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

export function isInsidePalace(row: number, col: number, color: PieceColor): boolean {
  if (col < 3 || col > 5) return false;
  if (color === 'red') {
    return row >= 7 && row <= 9;
  }
  return row >= 0 && row <= 2;
}

export function findKing(board: BoardState, color: PieceColor): Position | null {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color && piece.type === 'k') {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

/**
 * 飞将检测：帅与将是否在同一列直面相对（中间无任何棋子阻隔）
 */
export function areKingsFacing(board: BoardState): boolean {
  const redKing = findKing(board, 'red');
  const blackKing = findKing(board, 'black');
  if (!redKing || !blackKing) return false;

  if (redKing.col !== blackKing.col) return false;

  const col = redKing.col;
  const minRow = Math.min(redKing.row, blackKing.row);
  const maxRow = Math.max(redKing.row, blackKing.row);

  for (let r = minRow + 1; r < maxRow; r++) {
    if (board[r][col] !== null) {
      return false;
    }
  }
  return true;
}

/**
 * 生成单个棋子的伪合法走法（尚未过滤走后己方被将军）
 */
export function getPseudoLegalMovesForPiece(
  board: BoardState,
  from: Position
): Move[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const moves: Move[] = [];
  const { color, type } = piece;

  const tryAdd = (toRow: number, toCol: number) => {
    if (!isInsideBoard(toRow, toCol)) return;
    const target = board[toRow][toCol];
    if (!target || target.color !== color) {
      moves.push({
        from: { ...from },
        to: { row: toRow, col: toCol },
        captured: target || undefined,
      });
    }
  };

  switch (type) {
    case 'k': {
      // 帅/将：九宫格内走一步横或竖
      const deltas = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of deltas) {
        const nr = from.row + dr;
        const nc = from.col + dc;
        if (isInsidePalace(nr, nc, color)) {
          tryAdd(nr, nc);
        }
      }
      break;
    }

    case 'a': {
      // 仕/士：九宫格内走斜一步
      const deltas = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
      for (const [dr, dc] of deltas) {
        const nr = from.row + dr;
        const nc = from.col + dc;
        if (isInsidePalace(nr, nc, color)) {
          tryAdd(nr, nc);
        }
      }
      break;
    }

    case 'b': {
      // 相/象：走田字，不能过河，塞象眼判定
      const deltas = [
        [-2, -2, -1, -1],
        [-2, 2, -1, 1],
        [2, -2, 1, -1],
        [2, 2, 1, 1],
      ];
      for (const [dr, dc, eyeR, eyeC] of deltas) {
        const nr = from.row + dr;
        const nc = from.col + dc;
        // 不能过河
        if (color === 'red' && nr < 5) continue;
        if (color === 'black' && nr > 4) continue;

        if (isInsideBoard(nr, nc)) {
          // 象眼必须无棋子
          if (board[from.row + eyeR][from.col + eyeC] === null) {
            tryAdd(nr, nc);
          }
        }
      }
      break;
    }

    case 'n': {
      // 傌/马：走日字，蹩马腿判定
      const jumps = [
        // [dr, dc, legR, legC]
        [-2, -1, -1, 0],
        [-2, 1, -1, 0],
        [2, -1, 1, 0],
        [2, 1, 1, 0],
        [-1, -2, 0, -1],
        [1, -2, 0, -1],
        [-1, 2, 0, 1],
        [1, 2, 0, 1],
      ];
      for (const [dr, dc, legR, legC] of jumps) {
        const nr = from.row + dr;
        const nc = from.col + dc;
        if (isInsideBoard(nr, nc)) {
          // 马腿位置无子
          if (board[from.row + legR][from.col + legC] === null) {
            tryAdd(nr, nc);
          }
        }
      }
      break;
    }

    case 'r': {
      // 俥/车：沿横竖线走任意步，遇到子阻挡
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of dirs) {
        let nr = from.row + dr;
        let nc = from.col + dc;
        while (isInsideBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            tryAdd(nr, nc);
          } else {
            if (target.color !== color) {
              tryAdd(nr, nc);
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'c': {
      // 砲/炮：不吃子如车；吃子需隔一个棋子（炮架）
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of dirs) {
        let nr = from.row + dr;
        let nc = from.col + dc;
        let foundPlatform = false;

        while (isInsideBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!foundPlatform) {
            if (!target) {
              tryAdd(nr, nc);
            } else {
              foundPlatform = true; // 找到炮架
            }
          } else {
            if (target) {
              if (target.color !== color) {
                tryAdd(nr, nc); // 隔山打牛吃子
              }
              break; // 炮最多越过一个子
            }
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'p': {
      // 兵/卒：过河前只能向前一步；过河后可前或左/右一步；不可后退
      const forward = color === 'red' ? -1 : 1;
      // 向前
      const fRow = from.row + forward;
      if (isInsideBoard(fRow, from.col)) {
        tryAdd(fRow, from.col);
      }

      // 判断是否已过河
      const crossedRiver = color === 'red' ? from.row < 5 : from.row > 4;
      if (crossedRiver) {
        // 横走
        const left = from.col - 1;
        const right = from.col + 1;
        if (isInsideBoard(from.row, left)) tryAdd(from.row, left);
        if (isInsideBoard(from.row, right)) tryAdd(from.row, right);
      }
      break;
    }
  }

  return moves;
}

/**
 * 在棋盘上模拟走一步（原地修改并返回还原信息，或深拷贝）
 */
export function applyMove(board: BoardState, move: Move): BoardState {
  const newBoard = board.map(row => [...row]);
  const movingPiece = newBoard[move.from.row][move.from.col];
  newBoard[move.from.row][move.from.col] = null;
  newBoard[move.to.row][move.to.col] = movingPiece;
  return newBoard;
}

/**
 * 判断指定阵营是否被将军
 */
export function isInCheck(board: BoardState, color: PieceColor): boolean {
  // 1. 飞将检测（若照面且无阻隔，即算将军或违例）
  if (areKingsFacing(board)) {
    return true;
  }

  const kingPos = findKing(board, color);
  if (!kingPos) return true; // 帅没了显然视为失守

  const opponentColor: PieceColor = color === 'red' ? 'black' : 'red';

  // 遍历敌方所有棋子，看是否有攻击到王位置的伪走法
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor) {
        const moves = getPseudoLegalMovesForPiece(board, { row: r, col: c });
        for (const m of moves) {
          if (m.to.row === kingPos.row && m.to.col === kingPos.col) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * 获取指定阵营的所有严格合法走法（已排除走后导致己方被将军或照面的无效走法）
 */
export function getLegalMoves(board: BoardState, color: PieceColor): Move[] {
  const legalMoves: Move[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const pseudoMoves = getPseudoLegalMovesForPiece(board, { row: r, col: c });
        for (const move of pseudoMoves) {
          const nextBoard = applyMove(board, move);
          // 移动后：己方不能处于被将军状态，且不能帅将照面
          if (!isInCheck(nextBoard, color) && !areKingsFacing(nextBoard)) {
            // 检测此步是否将了对方的军
            const oppColor: PieceColor = color === 'red' ? 'black' : 'red';
            const check = isInCheck(nextBoard, oppColor);
            legalMoves.push({
              ...move,
              isCheck: check,
            });
          }
        }
      }
    }
  }

  return legalMoves;
}

/**
 * 判断指定棋子在特定位置的所有合法目的地
 */
export function getLegalDestinationsForPosition(
  board: BoardState,
  pos: Position
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];
  const moves = getLegalMoves(board, piece.color);
  return moves
    .filter(m => m.from.row === pos.row && m.from.col === pos.col)
    .map(m => m.to);
}
