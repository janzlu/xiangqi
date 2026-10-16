import React, { useState } from 'react';
import { X, Sparkles, Key, Globe, Cpu, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { LLMConfig, LLMPreset } from '../../types/llm';
import { LLM_PRESETS } from '../../services/llmStorage';
import { testLLMConnection } from '../../services/llmService';

interface LLMConfigModalProps {
  isOpen: boolean;
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
  onClose: () => void;
}

export const LLMConfigModal: React.FC<LLMConfigModalProps> = ({
  isOpen,
  config,
  onSave,
  onClose,
}) => {
  const [formConfig, setFormConfig] = useState<LLMConfig>(config);
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    durationMs?: number;
  }>({ status: 'idle', message: '' });

  if (!isOpen) return null;

  const handlePresetSelect = (preset: LLMPreset) => {
    const p = LLM_PRESETS[preset];
    setFormConfig(prev => ({
      ...prev,
      preset,
      baseUrl: p.baseUrl,
      model: p.defaultModel,
    }));
    setTestState({ status: 'idle', message: '' });
  };

  const handleTestConnection = async () => {
    setTestState({ status: 'loading', message: '正在向大模型 API 发起连通性握手测试...' });
    const res = await testLLMConnection(formConfig);
    if (res.success) {
      setTestState({
        status: 'success',
        message: res.message,
        durationMs: res.durationMs,
      });
    } else {
      setTestState({
        status: 'error',
        message: res.message,
        durationMs: res.durationMs,
      });
    }
  };

  const handleSave = () => {
    onSave(formConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-900/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                大模型对弈配置
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  OpenAI 规范
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">接入 LLM API 与大模型直接展开楚汉争雄</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {/* 启用开关 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <div className="text-sm font-semibold text-slate-200">启用大模型对手</div>
              <div className="text-xs text-slate-400 mt-0.5">开启后对弈电脑将由大模型驱动落子决策</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.enabled}
                onChange={e => setFormConfig(p => ({ ...p, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 预设平台快速选择 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              预设平台快捷填充
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(LLM_PRESETS) as LLMPreset[]).map(presetKey => {
                const isSelected = formConfig.preset === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => handlePresetSelect(presetKey)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all truncate ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {LLM_PRESETS[presetKey].name}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              {LLM_PRESETS[formConfig.preset].description}
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                API Key (密钥)
              </span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={formConfig.apiKey}
                onChange={e => setFormConfig(p => ({ ...p, apiKey: e.target.value }))}
                placeholder={formConfig.preset === 'ollama' ? 'Ollama 本地运行可免填' : 'sk-...'}
                className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                API Base URL (接口地址)
              </span>
            </label>
            <input
              type="text"
              value={formConfig.baseUrl}
              onChange={e => setFormConfig(p => ({ ...p, baseUrl: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                模型名称 (Model)
              </span>
            </label>
            <input
              type="text"
              value={formConfig.model}
              onChange={e => setFormConfig(p => ({ ...p, model: e.target.value }))}
              placeholder="deepseek-chat / gpt-4o-mini / MiniMax-Text-01"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* 温度控制 */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>随机度 (Temperature)</span>
              <span className="font-mono text-amber-400">{formConfig.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formConfig.temperature}
              onChange={e => setFormConfig(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>严谨推演 (0.1)</span>
              <span>均衡思考 (0.5)</span>
              <span>大胆创新 (1.0)</span>
            </div>
          </div>

          {/* 测试状态展示 */}
          {testState.status !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testState.status === 'loading'
                  ? 'bg-slate-800/50 border-slate-700 text-slate-300'
                  : testState.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {testState.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0 mt-0.5" />}
              {testState.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {testState.status === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <div>{testState.message}</div>
                {testState.durationMs !== undefined && (
                  <div className="text-[10px] opacity-75 mt-0.5">
                    网络往返延时: {testState.durationMs} ms
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testState.status === 'loading'}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {testState.status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>测试连接</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
