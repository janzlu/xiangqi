import { BoardState, Move, PieceColor } from '../types/chess';
import { AIMoveResult, DifficultyConfig } from '../types/ai';
import { applyMove, getLegalMoves } from '../core/rules';
import { evaluateBoard, PIECE_BASE_VALUES } from '../core/evaluation';

const CHECKMATE_SCORE = 99999;

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
    score += 150;
  }

  return score;
}

function orderMoves(board: BoardState, moves: Move[]): Move[] {
  return [...moves].sort((a, b) => scoreMoveForOrdering(board, b) - scoreMoveForOrdering(board, a));
}

/**
 * 静态搜索 (Quiescence Search) 解决地平线效应：
 * 当搜索达到叶子节点时，继续对所有吃子走法进行评估，避免在对子中途错误判断局面
 */
function quiescenceSearch(
  board: BoardState,
  alpha: number,
  beta: number,
  color: PieceColor,
  nodesRef: { count: number }
): number {
  nodesRef.count++;
  const standPat = (color === 'red' ? 1 : -1) * evaluateBoard(board);

  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  const allMoves = getLegalMoves(board, color);
  // 只搜索吃子动作
  const captureMoves = allMoves.filter(m => m.captured !== undefined);
  const orderedCaptures = orderMoves(board, captureMoves);

  const nextColor: PieceColor = color === 'red' ? 'black' : 'red';

  for (const move of orderedCaptures) {
    const nextBoard = applyMove(board, move);
    const score = -quiescenceSearch(nextBoard, -beta, -alpha, nextColor, nodesRef);

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
  timeLimitMs: number
): number {
  nodesRef.count++;

  // 超时检查
  if (Date.now() - startTime > timeLimitMs) {
    return (color === 'red' ? 1 : -1) * evaluateBoard(board);
  }

  const legalMoves = getLegalMoves(board, color);

  // 无合法走法：若被将军为绝杀，若未被将军为欠行困毙（在象棋中皆判负）
  if (legalMoves.length === 0) {
    return -CHECKMATE_SCORE + (10 - depth); // 越早绝杀分值越极端
  }

  // 达到搜索深度上限
  if (depth <= 0) {
    if (useQuiescence) {
      return quiescenceSearch(board, alpha, beta, color, nodesRef);
    }
    return (color === 'red' ? 1 : -1) * evaluateBoard(board);
  }

  const sortedMoves = orderMoves(board, legalMoves);
  const nextColor: PieceColor = color === 'red' ? 'black' : 'red';

  for (const move of sortedMoves) {
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
      timeLimitMs
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
 * AI 寻找最佳着法
 */
export function findBestMove(
  board: BoardState,
  color: PieceColor,
  config: DifficultyConfig
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

  // 初级 AI 增加适度随机性，提升趣味性
  if (config.id === 'novice') {
    // 80% 几率走最稳走法，20% 几率从前 3 优走法中随机挑选
    const scoredMoves = legalMoves.map(move => {
      const nextBoard = applyMove(board, move);
      let s = (color === 'red' ? 1 : -1) * evaluateBoard(nextBoard);
      if (move.captured) s += 40;
      if (move.isCheck) s += 20;
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

  let bestMove: Move = legalMoves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  const sortedMoves = orderMoves(board, legalMoves);
  const nextColor: PieceColor = color === 'red' ? 'black' : 'red';

  for (const move of sortedMoves) {
    const nextBoard = applyMove(board, move);
    const score = -alphaBeta(
      nextBoard,
      config.depth - 1,
      -beta,
      -alpha,
      nextColor,
      config.useQuiescence,
      nodesRef,
      startTime,
      config.timeLimitMs
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  return {
    bestMove,
    score: bestScore,
    depthReached: config.depth,
    nodesEvaluated: nodesRef.count,
    durationMs: Date.now() - startTime,
  };
}
