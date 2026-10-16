import { BoardState, MoveRecord, PieceColor } from '../types/chess';
import { boardToFen } from './fen';

export interface RepetitionResult {
  isGameOver: boolean;
  winner: PieceColor | null;
  reason: string;
  type: 'perpetual_check' | 'repetition_draw' | 'natural_limit_draw' | null;
}

/**
 * 依据中国象棋协会《象棋竞赛规则》第 22 条、第 23 条（棋例与裁决通则）：
 * 1. 单方面长将判负：凡单方面步步连续将军、造成局面循环往复者，长将方必须变招，不变作负！
 * 2. 同一局面三度重复：若非单方长将且均无违规，判和棋（和局）。
 * 3. 自然限着：双方连续 60 回合（120 步）无吃子，判和棋。
 */
export function evaluateRepetitionAndRules(
  history: MoveRecord[],
  currentBoard: BoardState,
  currentTurn: PieceColor
): RepetitionResult {
  const currentFen = boardToFen(currentBoard, currentTurn);

  // 1. 自然限着检测（连续 60 回合 / 120 步无吃子判和）
  let movesSinceCapture = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].move.captured) {
      break;
    }
    movesSinceCapture++;
  }
  if (movesSinceCapture >= 120) {
    return {
      isGameOver: true,
      winner: null,
      reason: '双方连续60回合无吃子，依正规赛制自然限着判和',
      type: 'natural_limit_draw',
    };
  }

  // 构建历史局面 FEN 序列（包含当前局面）
  const allFens: { fen: string; step: number; record?: MoveRecord }[] = [];
  for (let i = 0; i < history.length; i++) {
    const rec = history[i];
    // 每个记录中的 snapshot 代表落子后的棋盘，下一个走棋方为对方
    const nextTurn: PieceColor = rec.color === 'red' ? 'black' : 'red';
    allFens.push({
      fen: boardToFen(rec.boardSnapshot, nextTurn),
      step: i + 1,
      record: rec,
    });
  }

  // 统计当前局面在对局中出现的总次数
  const occurrences: number[] = [];
  allFens.forEach((item, idx) => {
    if (item.fen === currentFen) {
      occurrences.push(idx);
    }
  });

  // 2. 局部连续反复单子长将快速判定（防止用户连续数手无意义往返）
  // 检查最近 6 步（双方各 3 步），若某一方连续 3 步都是同一个子在同一两个格子里反复将军
  if (history.length >= 6) {
    const recent6 = history.slice(-6);
    const redMoves = recent6.filter(m => m.color === 'red');
    const blackMoves = recent6.filter(m => m.color === 'black');

    // 检查红方是否单方面连续 3 步往返将军
    if (
      redMoves.length === 3 &&
      redMoves.every(m => m.move.isCheck) &&
      !blackMoves.some(m => m.move.isCheck)
    ) {
      const m1 = redMoves[0].move;
      const m2 = redMoves[1].move;
      const m3 = redMoves[2].move;
      const isOscillating =
        m1.from.row === m2.to.row &&
        m1.from.col === m2.to.col &&
        m2.from.row === m3.to.row &&
        m2.from.col === m3.to.col;
      if (isOscillating) {
        return {
          isGameOver: true,
          winner: 'black',
          reason: '红方单方面连续往返长将违规（象棋竞赛规则：长将不变作负）',
          type: 'perpetual_check',
        };
      }
    }

    // 检查黑方是否单方面连续 3 步往返将军
    if (
      blackMoves.length === 3 &&
      blackMoves.every(m => m.move.isCheck) &&
      !redMoves.some(m => m.move.isCheck)
    ) {
      const m1 = blackMoves[0].move;
      const m2 = blackMoves[1].move;
      const m3 = blackMoves[2].move;
      const isOscillating =
        m1.from.row === m2.to.row &&
        m1.from.col === m2.to.col &&
        m2.from.row === m3.to.row &&
        m2.from.col === m3.to.col;
      if (isOscillating) {
        return {
          isGameOver: true,
          winner: 'red',
          reason: '黑方单方面连续往返长将违规（象棋竞赛规则：长将不变作负）',
          type: 'perpetual_check',
        };
      }
    }
  }

  // 3. 同一局面三度重复检测（Threefold Repetition）
  if (occurrences.length >= 3) {
    const firstIdx = occurrences[0];
    const lastIdx = occurrences[occurrences.length - 1];
    const cycleMoves = history.slice(firstIdx, lastIdx + 1);

    const redCheckMoves = cycleMoves.filter(m => m.color === 'red' && m.move.isCheck);
    const redTotalMoves = cycleMoves.filter(m => m.color === 'red');
    const blackCheckMoves = cycleMoves.filter(m => m.color === 'black' && m.move.isCheck);
    const blackTotalMoves = cycleMoves.filter(m => m.color === 'black');

    const redAllChecks = redTotalMoves.length > 0 && redCheckMoves.length === redTotalMoves.length;
    const blackAllChecks = blackTotalMoves.length > 0 && blackCheckMoves.length === blackTotalMoves.length;

    if (redAllChecks && !blackAllChecks) {
      return {
        isGameOver: true,
        winner: 'black',
        reason: '红方单方面长将违规（同一局面三度重复，长将不变判负）',
        type: 'perpetual_check',
      };
    }

    if (blackAllChecks && !redAllChecks) {
      return {
        isGameOver: true,
        winner: 'red',
        reason: '黑方单方面长将违规（同一局面三度重复，长将不变判负）',
        type: 'perpetual_check',
      };
    }

    // 双方均非单方长将，判和局
    return {
      isGameOver: true,
      winner: null,
      reason: '同一局面出现三次且双方均无长将违例，判和棋（握手言和）',
      type: 'repetition_draw',
    };
  }

  return {
    isGameOver: false,
    winner: null,
    reason: '',
    type: null,
  };
}
