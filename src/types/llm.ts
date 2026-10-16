import { AIMoveResult } from './ai';

export type LLMPreset =
  | 'minimax'
  | 'deepseek'
  | 'openai'
  | 'siliconflow'
  | 'ollama'
  | 'custom';

export interface LLMConfig {
  enabled: boolean;
  preset: LLMPreset;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMPresetConfig {
  name: string;
  baseUrl: string;
  defaultModel: string;
  description: string;
}

export interface ParsedLLMDecision {
  moveIndex: number;
  notation?: string;
  thought?: string;
}

export interface LLMMoveResult extends AIMoveResult {
  thought?: string;
  isLLM: boolean;
  isFallback?: boolean;
  fallbackReason?: string;
}
