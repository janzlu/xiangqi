import { LLMConfig, LLMPreset, LLMPresetConfig } from '../types/llm';

export const LLM_STORAGE_KEY = 'xiangqi_llm_config_v1';

export const LLM_PRESETS: Record<LLMPreset, LLMPresetConfig> = {
  minimax: {
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-Text-01',
    description: '国内先进大模型，支持高速大上下文与深度推演',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    description: 'DeepSeek 官方 API，性价比与推理兼备',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    description: 'OpenAI 官方通用 API 接口',
  },
  siliconflow: {
    name: 'SiliconFlow 硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    description: '聚合大模型云平台，支持千问与 DeepSeek 等全开源阵列',
  },
  ollama: {
    name: 'Ollama 本地大模型',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:7b',
    description: '完全离线本地部署，无需外部网络与 API Key',
  },
  custom: {
    name: '自定义 OpenAI 规范接口',
    baseUrl: '',
    defaultModel: '',
    description: '支持任何兼容 OpenAI /v1/chat/completions 规范的推理端点',
  },
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  enabled: false,
  preset: 'deepseek',
  apiKey: '',
  baseUrl: LLM_PRESETS.deepseek.baseUrl,
  model: LLM_PRESETS.deepseek.defaultModel,
  temperature: 0.3,
  maxTokens: 500,
};

export function loadLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(LLM_STORAGE_KEY);
    if (!raw) return DEFAULT_LLM_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_LLM_CONFIG, ...parsed };
  } catch (err) {
    console.error('Failed to load LLM configuration from localStorage', err);
    return DEFAULT_LLM_CONFIG;
  }
}

export function saveLLMConfig(config: LLMConfig): boolean {
  try {
    localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Failed to save LLM configuration to localStorage', err);
    return false;
  }
}
