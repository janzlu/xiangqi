import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInitialBoard, DIFFICULTY_CONFIGS } from '../core/constants';
import { getLegalMoves } from '../core/rules';
import {
  renderAsciiBoard,
  formatLegalMoves,
  buildLLMChessPrompt,
} from '../engine/llmPrompt';
import {
  parseLLMDecision,
  sanitizeThought,
} from '../engine/llmParser';
import {
  sanitizeBaseUrl,
  computeLLMMoveAsync,
  testLLMConnection,
  formatHttpErrorMessage,
} from '../services/llmService';
import { LLMConfig } from '../types/llm';

describe('LLM Chess Engine & Prompt Unit Tests', () => {
  const initialBoard = createInitialBoard();
  const legalMoves = getLegalMoves(initialBoard, 'red');

  it('renders ascii board with river and coordinates', () => {
    const ascii = renderAsciiBoard(initialBoard);
    expect(ascii).toContain('楚 河');
    expect(ascii).toContain('汉 界');
    expect(ascii).toContain('[帥]');
    expect(ascii).toContain('(將)');
  });

  it('formats candidate legal moves with 1-based index and notation', () => {
    const formatted = formatLegalMoves(initialBoard, legalMoves);
    expect(formatted.length).toBe(legalMoves.length);
    expect(formatted[0].index).toBe(1);
    expect(formatted[0].desc).toContain('[1]');
    expect(formatted[0].notation).toBeTruthy();
  });

  it('builds comprehensive prompt containing FEN and moves', () => {
    const prompt = buildLLMChessPrompt(initialBoard, 'red', legalMoves);
    expect(prompt.system).toContain('特级大师');
    expect(prompt.user).toContain('【当前对局信息】');
    expect(prompt.user).toContain('【候选合法着法列表');
    expect(prompt.formattedMoves.length).toBe(legalMoves.length);
  });

  it('sanitizes and truncates thoughts safely', () => {
    expect(sanitizeThought(null)).toBe('审局严谨，依势用子');
    expect(sanitizeThought('<script>alert("xss")</script>控盘要道')).toBe('控盘要道');
    const longThought = '这是一段非常长的大模型思考过程'.repeat(20);
    expect(sanitizeThought(longThought).length).toBeLessThanOrEqual(120);
  });

  it('parses valid JSON decision correctly', () => {
    const formatted = formatLegalMoves(initialBoard, legalMoves);
    const mockOutput = JSON.stringify({
      moveIndex: 2,
      notation: formatted[1].notation,
      thought: '快速出车抢占要道',
    });

    const parsed = parseLLMDecision(mockOutput, formatted);
    expect(parsed.selected.index).toBe(2);
    expect(parsed.thought).toBe('快速出车抢占要道');
  });

  it('parses markdown-fenced code block JSON correctly', () => {
    const formatted = formatLegalMoves(initialBoard, legalMoves);
    const markdownOutput = `Here is my decision:\n\`\`\`json\n{\n  "moveIndex": 1,\n  "thought": "起马保卒"\n}\n\`\`\``;

    const parsed = parseLLMDecision(markdownOutput, formatted);
    expect(parsed.selected.index).toBe(1);
    expect(parsed.thought).toBe('起马保卒');
  });

  it('parses fuzzy notation match if moveIndex is missing', () => {
    const formatted = formatLegalMoves(initialBoard, legalMoves);
    const targetMove = formatted[3];
    const output = JSON.stringify({
      notation: targetMove.notation,
      thought: '中炮控制',
    });

    const parsed = parseLLMDecision(output, formatted);
    expect(parsed.selected.index).toBe(targetMove.index);
  });

  it('throws error when JSON contains illegal move index or out-of-bounds index', () => {
    const formatted = formatLegalMoves(initialBoard, legalMoves);
    expect(() =>
      parseLLMDecision(JSON.stringify({ moveIndex: 0 }), formatted)
    ).toThrow('超出有效范围');
    expect(() =>
      parseLLMDecision(JSON.stringify({ moveIndex: 9999 }), formatted)
    ).toThrow('超出有效范围');
    expect(() =>
      parseLLMDecision(JSON.stringify({ moveIndex: -1 }), formatted)
    ).toThrow('超出有效范围');
  });

  it('sanitizes baseUrl correctly', () => {
    expect(sanitizeBaseUrl('https://api.deepseek.com/')).toBe(
      'https://api.deepseek.com/v1'
    );
    expect(sanitizeBaseUrl('https://api.openai.com/v1///')).toBe(
      'https://api.openai.com/v1'
    );
    expect(sanitizeBaseUrl('http://localhost:11434/v1')).toBe(
      'http://localhost:11434/v1'
    );
  });

  it('formats HTTP error status into actionable diagnostic message', () => {
    expect(formatHttpErrorMessage(401, 'Unauthorized')).toContain('API Key 认证失败');
    expect(formatHttpErrorMessage(429, 'Rate limit')).toContain('频率超限');
    expect(formatHttpErrorMessage(500, 'Server Error')).toContain('服务提供商故障');
  });
});

describe('LLM Service Fallback & API Execution', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const dummyBoard = createInitialBoard();
  const noviceConfig = DIFFICULTY_CONFIGS.novice;

  it('smoothly falls back to local engine when LLM is not enabled', async () => {
    const config: LLMConfig = {
      enabled: false,
      preset: 'deepseek',
      apiKey: '',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      temperature: 0.3,
      maxTokens: 500,
    };

    const result = await computeLLMMoveAsync(dummyBoard, 'red', noviceConfig, config);
    expect(result.bestMove).not.toBeNull();
    expect(result.isLLM).toBe(false);
  });

  it('smoothly falls back to local engine on API network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network connection timeout'));

    const config: LLMConfig = {
      enabled: true,
      preset: 'deepseek',
      apiKey: 'sk-dummy-test-key',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      temperature: 0.3,
      maxTokens: 500,
    };

    const result = await computeLLMMoveAsync(dummyBoard, 'red', noviceConfig, config);
    expect(result.bestMove).not.toBeNull();
    expect(result.isLLM).toBe(false);
    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toContain('Network connection timeout');
    expect(result.thought).toContain('系统降级');
  });

  it('successfully computes move when LLM API returns valid JSON', async () => {
    const legal = getLegalMoves(dummyBoard, 'red');
    const formatted = formatLegalMoves(dummyBoard, legal);

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              moveIndex: formatted[0].index,
              notation: formatted[0].notation,
              thought: '稳扎稳打抢占阵地',
            }),
          },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const config: LLMConfig = {
      enabled: true,
      preset: 'minimax',
      apiKey: 'sk-dummy-key',
      baseUrl: 'https://api.minimax.chat/v1',
      model: 'MiniMax-Text-01',
      temperature: 0.3,
      maxTokens: 500,
    };

    const result = await computeLLMMoveAsync(dummyBoard, 'red', noviceConfig, config);
    expect(result.isLLM).toBe(true);
    expect(result.isFallback).toBeFalsy();
    expect(result.bestMove).toEqual(formatted[0].move);
    expect(result.thought).toBe('稳扎稳打抢占阵地');
  });

  it('tests connection failure on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized: Invalid API key',
    } as Response);

    const config: LLMConfig = {
      enabled: true,
      preset: 'openai',
      apiKey: 'invalid-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 100,
    };

    const res = await testLLMConnection(config);
    expect(res.success).toBe(false);
    expect(res.message).toContain('API Key 认证失败');
  });
});
