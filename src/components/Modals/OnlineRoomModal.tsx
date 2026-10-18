import React, { useState } from 'react';
import { X, Users, Copy, Check, Radio, LogIn, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { OnlineColorChoice, OnlineConnectionState } from '../../types/online';

interface OnlineRoomModalProps {
  isOpen: boolean;
  connectionState: OnlineConnectionState;
  roomCode: string;
  errorMessage: string;
  onCreateRoom: (colorChoice: OnlineColorChoice) => void;
  onJoinRoom: (roomCode: string) => void;
  onCancel: () => void;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  connectionState,
  roomCode,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
  onCancel,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(() => {
    const roomParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room') : null;
    return roomParam ? 'join' : 'create';
  });
  const [colorChoice, setColorChoice] = useState<OnlineColorChoice>('random');
  const [inputCode, setInputCode] = useState<string>(() => {
    const roomParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room') : null;
    return roomParam ? roomParam.trim().toUpperCase() : '';
  });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCreate = () => {
    onCreateRoom(colorChoice);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    onJoinRoom(inputCode.trim().toUpperCase());
  };

  const isWaiting = connectionState === 'waiting_peer';
  const isConnecting = connectionState === 'connecting' || connectionState === 'generating_room';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-900/60 rounded-3xl p-6 text-slate-100 shadow-2xl relative max-w-md w-full animate-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 标题 */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
              在线双人对战
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                P2P 直连
              </span>
            </h2>
            <p className="text-xs text-slate-400">零服务器纯前端联机 · 房号链接直达</p>
          </div>
        </div>

        {/* 标签切换 */}
        {!isWaiting && !isConnecting && (
          <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800 my-4 text-xs font-medium">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                tab === 'create'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              创建新房间
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                tab === 'join'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              加入已有房间
            </button>
          </div>
        )}

        {/* 错误提示 */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 房主建房待客状态 */}
        {isWaiting && (
          <div className="py-4 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>房间已就绪，静候好友接入...</span>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-amber-500/30">
              <span className="text-xs text-slate-400 block mb-1">专属 6 位房间码</span>
              <div className="text-3xl font-mono font-black text-amber-400 tracking-widest select-all">
                {roomCode}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 text-xs shadow-lg transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '邀请链接已复制到剪贴板！' : '复制对战邀请链接发给好友'}</span>
              </button>
              <p className="text-[11px] text-slate-500">好友打开链接或在“加入房间”输入房间码即可秒进对局</p>
            </div>
          </div>
        )}

        {/* 正在连接动画 */}
        {isConnecting && (
          <div className="py-8 space-y-4 text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-amber-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm text-slate-300 font-medium">正在建立 P2P 加密通信隧道...</p>
              <p className="text-xs text-slate-500">连接中继信令节点中，约 1~3 秒</p>
            </div>
            <button
              onClick={onCancel}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        )}

        {/* 创建房间表单 */}
        {!isWaiting && !isConnecting && tab === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                先后手执子分配
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'random', label: '随机抽签', icon: Sparkles },
                  { id: 'red', label: '我执红（先手）' },
                  { id: 'black', label: '我执黑（后手）' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setColorChoice(item.id as OnlineColorChoice)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      colorChoice === item.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              • 采用 WebRTC 技术，双方浏览器直接点对点通信，速度快且无后台记录。<br />
              • 创建房间后将生成 6 位代码与专属链接，可随心转发。
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>立即创建房间</span>
            </button>
          </div>
        )}

        {/* 加入房间表单 */}
        {!isWaiting && !isConnecting && tab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                输入 6 位房间码
              </label>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="例如：XQ792B"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-center text-xl text-amber-300 tracking-widest uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={inputCode.trim().length !== 6}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 flex items-center justify-center gap-2 text-sm shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>加入对局</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
