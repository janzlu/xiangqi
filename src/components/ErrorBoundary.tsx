import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error in Xiangqi App:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetGame = () => {
    try {
      localStorage.removeItem('xiangqi_game_state');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090604] text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-900/60 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold font-serif text-amber-100">
                对弈界面遇到异常
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                对弈过程发生未预期异常，已自动为您安全拦截保护，未影响天梯积分记录。
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-left text-[11px] font-mono text-rose-300 max-h-32 overflow-y-auto break-all scrollbar-thin scrollbar-thumb-slate-700">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 text-sm shadow-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>刷新恢复</span>
              </button>
              <button
                onClick={this.handleResetGame}
                className="py-2.5 px-4 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1.5 text-sm transition-colors"
                title="清除临时对弈缓存并重启"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重置棋局</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
