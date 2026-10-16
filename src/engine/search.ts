import { BoardState, Move, PieceColor } from '../types/chess';
import { AIMoveResult, DifficultyConfig } from '../types/ai';
import { applyMove, getLegalMoves } from '../core/rules';
import { evaluateBoard, PIECE_BASE_VALUES } from '../core/evaluation';
import { boardToFen } from '../core/fen';

const CHECKMATE_SCORE = 99999;
const MAX_QUIESCENCE_DEPTH = 3;

/**
 * 启发式走法排序（优先搜索吃大子、以小吃大 MVV-LVA、将军等）
 */
function scoreMoveForOrdering(board: BoardState, move: Move): number {
  let score = 0;
  const victim = move.captured;
  const attacker = board[move.from.row][move.from.col];

  if (victim && attacker) {
    // MVV-LVA: 10 * 目标子价值 - 攻击子价值
    score += 10 * PIECE_BASE_VALUES[victim.type] - PIECE_BASE_VALUES[attacker.type];
  }

  if (move.isCheck) {
    score += 120;
  }

  return score;
}

function orderMoves(board: BoardState, moves: Move[]): Move[] {
  return [...moves].sort((a, b) => scoreMoveForOrdering(board, b) - scoreMoveForOrdering(board, a));
}

/**
 * 静态搜索 (Quiescence Search) 解决地平线效应：
 * 限制最大深度与超时阻断，防止吃子爆炸
 */
function quiescenceSearch(
  board: BoardState,
  alpha: number,
  beta: number,
  color: PieceColor,
  nodesRef: { count: number },
  startTime: number,
  timeLimitMs: number,
  qDepth: number
): number {
  nodesRef.count++;
  if (Date.now() - startTime > timeLimitMs || qDepth >= MAX_QUIESCENCE_DEPTH) {
    return (color === 'red' ? 1 : -1) * evaluateBoard(board);
  }

  const standPat = (color === 'red' ? 1 : -1) * evaluateBoard(board);

  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  const allMoves = getLegalMoves(board, color);
  const captureMoves = allMoves.filter(m => m.captured !== undefined);
  if (captureMoves.length === 0) return standPat;

  const orderedCaptures = orderMoves(board, captureMoves);
  const nextColor: PieceColor = color === 'red' ? 'black' : 'red';

  for (const move of orderedCaptures) {
    const nextBoard = applyMove(board, move);
    const score = -quiescenceSearch(
      nextBoard,
      -beta,
      -alpha,
      nextColor,
      nodesRef,
      startTime,
      timeLimitMs,
      qDepth + 1
    );

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}

/**
 * 核心 Alpha-Beta 负极大值极小化搜索
 */
function alphaBeta(
  board: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  color: PieceColor,
  useQuiescence: boolean,
  nodesRef: { count: number },
  startTime: number,
  timeLimitMs: number,
  abortRef: { isAborted: boolean }
): number {
  nodesRef.count++;

  // 严格超时检查：一旦超时立刻标记并中止深入
  if (Date.now() - startTime > timeLimitMs) {
    abortRef.isAborted = true;
    return (color === 'red' ? 1 : -1) * evaluateBoard(board);
  }

  const legalMoves = getLegalMoves(board, color);

  if (legalMoves.length === 0) {
    return -CHECKMATE_SCORE + (10 - depth);
  }

  if (depth <= 0) {
    if (useQuiescence) {
      return quiescenceSearch(board, alpha, beta, color, nodesRef, startTime, timeLimitMs, 0);
    }
    return (color === 'red' ? 1 : -1) * evaluateBoard(board);
  }

  const sortedMoves = orderMoves(board, legalMoves);
  const nextColor: PieceColor = color === 'red' ? 'black' : 'red';

  for (const move of sortedMoves) {
    if (abortRef.isAborted) break;

    const nextBoard = applyMove(board, move);
    const score = -alphaBeta(
      nextBoard,
      depth - 1,
      -beta,
      -alpha,
      nextColor,
      useQuiescence,
      nodesRef,
      startTime,
      timeLimitMs,
      abortRef
    );

    if (score >= beta) {
      return beta; // Beta 剪枝
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  return alpha;
}

/**
 * AI 寻找最佳着法（采用迭代加深 Iterative Deepening + 毫秒级超时熔断 + 防长将/防重复判定）
 */
export function findBestMove(
  board: BoardState,
  color: PieceColor,
  config: DifficultyConfig,
  recentFens: string[] = []
): AIMoveResult {
  const startTime = Date.now();
  const nodesRef = { count: 0 };
  const legalMoves = getLegalMoves(board, color);

  if (legalMoves.length === 0) {
    return {
      bestMove: null,
      score: -CHECKMATE_SCORE,
      depthReached: 0,
      nodesEvaluated: 0,
      durationMs: 0,
    };
  }

  const nextColor: PieceColor = color === 'red' ? 'black' : 'red';

  // 初级 AI：快速 1 层估值 + 适度随机性，耗时极短（< 30ms）
  if (config.id === 'novice') {
    const scoredMoves = legalMoves.map(move => {
      const nextBoard = applyMove(board, move);
      let s = (color === 'red' ? 1 : -1) * evaluateBoard(nextBoard);
      if (move.captured) s += 40;
      if (move.isCheck) s += 20;

      const nextFen = boardToFen(nextBoard, nextColor);
      if (recentFens.includes(nextFen)) {
        if (move.isCheck) {
          s -= 100000; // 象棋铁律：长将不变作负，重罚强制变招
        } else {
          s -= 300;
        }
      }
      return { move, score: s };
    });
    scoredMoves.sort((a, b) => b.score - a.score);

    const pickIdx = Math.random() < 0.75 ? 0 : Math.min(scoredMoves.length - 1, Math.floor(Math.random() * 3));
    return {
      bestMove: scoredMoves[pickIdx].move,
      score: scoredMoves[pickIdx].score,
      depthReached: 1,
      nodesEvaluated: legalMoves.length,
      durationMs: Date.now() - startTime,
    };
  }

  // 迭代加深搜索 (Iterative Deepening)
  // 先搜深度 1，再搜深度 2、3... 超时后立即安全降级使用上一完整层的结果
  let confirmedBestMove: Move = legalMoves[0];
  let confirmedScore = -CHECKMATE_SCORE;
  let lastCompletedDepth = 1;

  const targetMaxDepth = config.depth;
  let candidateMoves = orderMoves(board, legalMoves);

  for (let currentDepth = 1; currentDepth <= targetMaxDepth; currentDepth++) {
    const abortRef = { isAborted: false };
    let depthBestMove: Move = candidateMoves[0];
    let depthBestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of candidateMoves) {
      if (Date.now() - startTime > config.timeLimitMs) {
        abortRef.isAborted = true;
        break;
      }

      const nextBoard = applyMove(board, move);
      const nextFen = boardToFen(nextBoard, nextColor);
      let repetitionPenalty = 0;
      if (recentFens.includes(nextFen)) {
        if (move.isCheck) {
          repetitionPenalty = 100000; // 严厉封杀长将
        } else {
          repetitionPenalty = 400; // 抑制无吃子无进展往返
        }
      }

      let score = -alphaBeta(
        nextBoard,
        currentDepth - 1,
        -beta,
        -alpha,
        nextColor,
        config.useQuiescence,
        nodesRef,
        startTime,
        config.timeLimitMs,
        abortRef
      );

      score -= repetitionPenalty;

      if (abortRef.isAborted) break;

      if (score > depthBestScore) {
        depthBestScore = score;
        depthBestMove = move;
      }
      if (score > alpha) {
        alpha = score;
      }
    }

    if (!abortRef.isAborted) {
      confirmedBestMove = depthBestMove;
      confirmedScore = depthBestScore;
      lastCompletedDepth = currentDepth;

      // 调整走法顺序：将当前深度最优走法置顶，极大提升后续深度的剪枝率
      candidateMoves = [
        depthBestMove,
        ...candidateMoves.filter(
          m => !(m.from.row === depthBestMove.from.row && m.from.col === depthBestMove.from.col &&
                 m.to.row === depthBestMove.to.row && m.to.col === depthBestMove.to.col)
        ),
      ];
    } else {
      // 本层未完全搜完（已超时熔断），中止后续加深
      break;
    }

    // 若当前时间已消耗超过 60% 限时，不再开启更深一层的搜索
    if (Date.now() - startTime > config.timeLimitMs * 0.6) {
      break;
    }
  }

  return {
    bestMove: confirmedBestMove,
    score: confirmedScore,
    depthReached: lastCompletedDepth,
    nodesEvaluated: nodesRef.count,
    durationMs: Date.now() - startTime,
  };
}
