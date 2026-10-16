import { BoardState, Move, PieceColor } from '../types/chess';
import { PIECE_NAMES } from '../core/constants';
import { boardToFen } from '../core/fen';
import { moveToNotation } from '../core/notation';

export interface FormattedLegalMove {
  index: number;
  notation: string;
  move: Move;
  desc: string;
}

/**
 * 将棋盘转换为直观的汉字文本棋盘布局（红方在下 5~9 行，黑方在上 0~4 行）
 */
export function renderAsciiBoard(board: BoardState): string {
  const lines: string[] = ['  0 1 2 3 4 5 6 7 8 (列号)'];
  for (let r = 0; r < 10; r++) {
    const rowChars: string[] = [];
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (!piece) {
        rowChars.push(' · ');
      } else {
        const char = PIECE_NAMES[piece.color][piece.type];
        rowChars.push(piece.color === 'red' ? `[${char}]` : `(${char})`);
      }
    }
    lines.push(`${r} ` + rowChars.join(''));
    if (r === 4) {
      lines.push('  --- 楚 河 --- 汉 界 ---');
    }
  }
  return lines.join('\n');
}

/**
 * 格式化所有候选合法着法为编号列表
 */
export function formatLegalMoves(board: BoardState, legalMoves: Move[]): FormattedLegalMove[] {
  return legalMoves.map((move, idx) => {
    const notation = moveToNotation(board, move) || `(${move.from.row},${move.from.col})->(${move.to.row},${move.to.col})`;
    const capturedDesc = move.captured ? ` 吃[${PIECE_NAMES[move.captured.color][move.captured.type]}]` : '';
    const desc = `[${idx + 1}] ${notation} (起点:[${move.from.row},${move.from.col}] -> 目标:[${move.to.row},${move.to.col}])${capturedDesc}`;
    return {
      index: idx + 1,
      notation,
      move,
      desc,
    };
  });
}

/**
 * 构造发送给大模型的 Prompt 消息体
 */
export function buildLLMChessPrompt(
  board: BoardState,
  color: PieceColor,
  legalMoves: Move[]
): { system: string; user: string; formattedMoves: FormattedLegalMove[] } {
  const colorName = color === 'red' ? '红方 (先手方，棋子用[]表示)' : '黑方 (后手方，棋子用()表示)';
  const fen = boardToFen(board, color);
  const asciiBoard = renderAsciiBoard(board);
  const formattedMoves = formatLegalMoves(board, legalMoves);

  const movesText = formattedMoves.map(m => m.desc).join('\n');

  const system = [
    '你是一位精通中国象棋的九段特级大师。你的目标是深谋远虑、严谨审局，在遵守全部棋规的前提下选择当前局面胜率最高、战术最优的着法。',
    '你必须严格从候选合法着法列表中挑选，绝对不能走非法着法。',
    '你必须只输出一个标准的 JSON 对象，不要输出任何其他的开场白、问候或多余解释。',
  ].join('\n');

  const user = [
    `【当前对局信息】`,
    `轮到你走子：${colorName}`,
    `局面 FEN 串：${fen}`,
    '',
    `【棋盘当前阵型】`,
    asciiBoard,
    '',
    `【候选合法着法列表（共 ${formattedMoves.length} 种可能）】`,
    movesText,
    '',
    `【决策输出要求】`,
    `请全面权衡子力价值、攻防阵型与杀法，从上述列表中选出你认为最佳的一步棋。`,
    `必须输出以下 JSON 格式：`,
    `{`,
    `  "moveIndex": 选中的着法编号 (整数 1 ~ ${formattedMoves.length}),`,
    `  "notation": "选中的着法记谱名称",`,
    `  "thought": "简短分析思路（50字以内，点明攻防要害）"`,
    `}`,
  ].join('\n');

  return { system, user, formattedMoves };
}

// 导出解析器
export { parseLLMDecision } from './llmParser';
