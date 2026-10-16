import { FormattedLegalMove } from './llmPrompt';
import { ParsedLLMDecision } from '../types/llm';

export interface ValidatedLLMDecision {
  selected: FormattedLegalMove;
  thought: string;
}

/**
 * 清理并验证思考文本
 */
export function sanitizeThought(rawThought: unknown): string {
  if (typeof rawThought !== 'string' || !rawThought.trim()) {
    return '审局严谨，依势用子';
  }
  // 去除 script 标签及其内部脚本，过滤 HTML 标签并限制在 120 字内
  const cleaned = rawThought
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

/**
 * 解析大模型返回的决策文本，并执行严格边界检查
 */
export function parseLLMDecision(
  rawText: string,
  formattedMoves: FormattedLegalMove[]
): ValidatedLLMDecision {
  if (!rawText || !rawText.trim()) {
    throw new Error('LLM 响应内容为空');
  }

  if (!formattedMoves || formattedMoves.length === 0) {
    throw new Error('候选合法着法列表为空，无法进行决策匹配');
  }

  // 1. 提取 JSON 内容块
  let jsonString = '';
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    const objectMatch = rawText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonString = objectMatch[0].trim();
    } else {
      jsonString = rawText.trim();
    }
  }

  let parsed: ParsedLLMDecision | null = null;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    // 容错提取：正则提取 moveIndex 与 notation
    const indexMatch = rawText.match(/"moveIndex"\s*:\s*(\d+)/i) || rawText.match(/moveIndex[^\d]*(\d+)/i);
    const notationMatch = rawText.match(/"notation"\s*:\s*"([^"]+)"/i);
    const thoughtMatch = rawText.match(/"thought"\s*:\s*"([^"]+)"/i);

    if (indexMatch && indexMatch[1]) {
      parsed = {
        moveIndex: parseInt(indexMatch[1], 10),
        notation: notationMatch ? notationMatch[1] : undefined,
        thought: thoughtMatch ? thoughtMatch[1] : undefined,
      };
    } else if (notationMatch && notationMatch[1]) {
      parsed = {
        moveIndex: -1,
        notation: notationMatch[1],
        thought: thoughtMatch ? thoughtMatch[1] : undefined,
      };
    } else {
      throw new Error(`无法从模型输出中提取有效 JSON 或决策索引。模型原始输出: "${rawText.slice(0, 100)}"`);
    }
  }

  const thought = sanitizeThought(parsed?.thought);

  // 2. 严格校验 moveIndex：必须为 1 到 formattedMoves.length 之间的整数
  if (parsed && typeof parsed.moveIndex === 'number' && Number.isInteger(parsed.moveIndex)) {
    if (parsed.moveIndex >= 1 && parsed.moveIndex <= formattedMoves.length) {
      const matched = formattedMoves.find(m => m.index === parsed?.moveIndex);
      if (matched) {
        return { selected: matched, thought };
      }
    }
  }

  // 3. 次级兜底：通过 notation 中文记谱进行归一化精确匹配
  if (parsed && parsed.notation && typeof parsed.notation === 'string') {
    const cleanNotation = parsed.notation.replace(/\s+/g, '');
    const matchedByNotation = formattedMoves.find(
      m => m.notation.replace(/\s+/g, '') === cleanNotation || m.notation.includes(cleanNotation)
    );
    if (matchedByNotation) {
      return { selected: matchedByNotation, thought };
    }
  }

  throw new Error(
    `模型给出的着法索引 ${parsed?.moveIndex} 超出有效范围 [1, ${formattedMoves.length}]，且记谱 "${parsed?.notation || ''}" 无法匹配任何合法走法`
  );
}
