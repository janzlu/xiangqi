import { BoardState, PieceColor } from '../types/chess';
import { DifficultyConfig } from '../types/ai';
import { LLMConfig, LLMMoveResult } from '../types/llm';
import { getLegalMoves } from '../core/rules';
import { findBestMove } from '../engine/search';
import { buildLLMChessPrompt } from '../engine/llmPrompt';
import { parseLLMDecision } from '../engine/llmParser';

// 连通性测试防并发锁
let isTestingConnectionInProgress = false;

/**
 * 校验并清理 API 端点地址
 */
export function sanitizeBaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return '';
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/v1') && !url.includes('/chat/completions')) {
    url = `${url}/v1`;
  }
  return url;
}

/**
 * 错误分类友好诊断
 */
export function formatHttpErrorMessage(status: number, rawError: string): string {
  switch (status) {
    case 401:
      return 'API Key 认证失败，请检查密钥是否填写正确或已过期';
    case 403:
      return '拒绝访问，请检查账户权限或模型调用权限';
    case 404:
      return '接口地址 404，请确认 Base URL 是否正确配置 /v1 路径';
    case 429:
      return 'API 调用过于频繁（频率超限）或账户额度不足 (429 Rate Limit/Quota)';
    case 500:
    case 502:
    case 503:
    case 504:
      return `模型服务提供商故障 (HTTP ${status})，请稍后再试`;
    default:
      return `HTTP ${status}: ${rawError.slice(0, 100)}`;
  }
}

/**
 * 测试大模型 API 连通性（带防并发锁与完整响应结构校验）
 */
export async function testLLMConnection(config: LLMConfig): Promise<{
  success: boolean;
  message: string;
  durationMs: number;
}> {
  if (isTestingConnectionInProgress) {
    return { success: false, message: '连通性测试正在进行中，请勿频繁点击', durationMs: 0 };
  }

  isTestingConnectionInProgress = true;
  const startTime = Date.now();

  try {
    const baseUrl = sanitizeBaseUrl(config.baseUrl);
    if (!baseUrl) {
      return { success: false, message: 'API Base URL 不能为空', durationMs: 0 };
    }
    if (!config.model || !config.model.trim()) {
      return { success: false, message: '模型名称不能为空', durationMs: 0 };
    }

    const endpoint = baseUrl.endsWith('/chat/completions')
      ? baseUrl
      : `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey && config.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model.trim(),
        messages: [{ role: 'user', content: '测试握手：请仅输出“连接成功”四个字。' }],
        max_tokens: 20,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (!resp.ok) {
      const errText = await resp.text();
      return {
        success: false,
        message: formatHttpErrorMessage(resp.status, errText),
        durationMs,
      };
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply && reply !== '') {
      return {
        success: false,
        message: '接口返回 HTTP 200，但未包含标准 choices[0].message.content 结构',
        durationMs,
      };
    }

    return {
      success: true,
      message: `握手成功！模型即时响应: "${reply.slice(0, 40)}"`,
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes('aborted');
    return {
      success: false,
      message: isTimeout ? '请求超时 (12秒)，请检查网络或代理连通性' : `连接异常: ${msg}`,
      durationMs,
    };
  } finally {
    isTestingConnectionInProgress = false;
  }
}

/**
 * 请求大模型下发走步决策
 */
async function callLLMChatApi(
  messages: { role: string; content: string }[],
  config: LLMConfig
): Promise<string> {
  const baseUrl = sanitizeBaseUrl(config.baseUrl);
  const endpoint = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey && config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model.trim(),
        messages,
        max_tokens: config.maxTokens || 400,
        temperature: config.temperature ?? 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errorBody = await resp.text();
      throw new Error(formatHttpErrorMessage(resp.status, errorBody));
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('API 返回的数据中无 choices[0].message.content 内容');
    }
    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * 完整异步计算 LLM 走步：
 * 1. 尝试大模型决策与解析
 * 2. 遇到任何异常自动平滑降级至本地 Alpha-Beta 引擎并向用户展现清晰根因
 */
export async function computeLLMMoveAsync(
  board: BoardState,
  color: PieceColor,
  fallbackDifficultyConfig: DifficultyConfig,
  llmConfig: LLMConfig
): Promise<LLMMoveResult> {
  const startTime = Date.now();
  const legalMoves = getLegalMoves(board, color);

  if (legalMoves.length === 0) {
    return {
      bestMove: null,
      score: 0,
      depthReached: 0,
      nodesEvaluated: 0,
      durationMs: 0,
      isLLM: false,
      thought: '无合法走法，已陷入死局',
    };
  }

  // 若未启用 LLM 或配置为空，直接调用本地引擎
  if (!llmConfig.enabled || !llmConfig.baseUrl || (!llmConfig.apiKey && llmConfig.preset !== 'ollama')) {
    const localResult = findBestMove(board, color, fallbackDifficultyConfig);
    return {
      ...localResult,
      isLLM: false,
      thought: '已使用本地深算引擎',
    };
  }

  try {
    const { system, user, formattedMoves } = buildLLMChessPrompt(board, color, legalMoves);
    const rawResponse = await callLLMChatApi(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      llmConfig
    );

    const { selected, thought } = parseLLMDecision(rawResponse, formattedMoves);
    const durationMs = Date.now() - startTime;

    return {
      bestMove: selected.move,
      score: 0,
      depthReached: 1,
      nodesEvaluated: formattedMoves.length,
      durationMs,
      thought,
      isLLM: true,
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.warn('LLM 对弈计算失败，启动本地引擎平滑降级:', errMessage);

    // 平滑降级：使用本地引擎推演
    const fallbackResult = findBestMove(board, color, fallbackDifficultyConfig);
    const durationMs = Date.now() - startTime;

    return {
      ...fallbackResult,
      durationMs,
      thought: `【系统降级】LLM 异常（${errMessage.slice(0, 45)}），已由本地引擎兜底落子`,
      isLLM: false,
      isFallback: true,
      fallbackReason: errMessage,
    };
  }
}
