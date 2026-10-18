import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Copy, Check, Bell, MessageSquare, LogOut, Handshake, Flag } from 'lucide-react';
import { ChatMessage, PRESET_CHAT_PHRASES } from '../../types/online';
import { PieceColor } from '../../types/chess';

interface OnlinePanelProps {
  roomCode: string;
  myColor: PieceColor;
  turn: PieceColor;
  secondsInTurn: number;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, isPreset?: boolean) => void;
  onUrgeMove: () => void;
  onLeaveRoom: () => void;
  onOfferDraw?: () => void;
  onResign?: () => void;
  isGameOver?: boolean;
}

export const OnlinePanel: React.FC<OnlinePanelProps> = ({
  roomCode,
  myColor,
  turn,
  secondsInTurn,
  chatMessages,
  onSendMessage,
  onUrgeMove,
  onLeaveRoom,
  onOfferDraw,
  onResign,
  isGameOver,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [urgeCooldown, setUrgeCooldown] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Cooldown timer for urge button
  useEffect(() => {
    if (urgeCooldown > 0) {
      const timer = setTimeout(() => setUrgeCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [urgeCooldown]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), false);
    setInputText('');
  };

  const handleUrge = () => {
    if (urgeCooldown > 0) return;
    onUrgeMove();
    setUrgeCooldown(30); // 30s cooldown
  };

  const isMyTurn = turn === myColor;
  const minutes = Math.floor(secondsInTurn / 60);
  const seconds = secondsInTurn % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-amber-900/40 shadow-xl space-y-3 sm:space-y-4 flex flex-col h-auto min-h-[380px] sm:h-[520px]">
      {/* 顶部房间状态与快捷操作条 */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-slate-400">在线对战 · 房间</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-amber-300 tracking-wider">
              {roomCode}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {onOfferDraw && (
            <button
              onClick={onOfferDraw}
              disabled={isGameOver}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs flex items-center gap-1 border border-slate-700 hover:border-amber-500/40 transition-colors disabled:opacity-40 cursor-pointer"
              title="向对方提出和棋协商"
            >
              <Handshake className="w-3.5 h-3.5 text-amber-400" />
              <span>求和</span>
            </button>
          )}
          {onResign && (
            <button
              onClick={onResign}
              disabled={isGameOver}
              className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs flex items-center gap-1 border border-rose-800/50 transition-colors disabled:opacity-40 cursor-pointer"
              title="认输认负"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span>认输</span>
            </button>
          )}
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="复制对战链接"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onLeaveRoom}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs flex items-center gap-1 border border-slate-700/80 transition-colors cursor-pointer"
            title="离开房间"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 双方执子与回合提醒 */}
      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">您的执子</span>
          <span className={`font-bold px-2 py-0.5 rounded-md ${
            myColor === 'red'
              ? 'bg-red-950/80 text-red-400 border border-red-800'
              : 'bg-slate-800 text-slate-200 border border-slate-700'
          }`}>
            {myColor === 'red' ? '红方（先手）' : '黑方（后手）'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-400">当前回合思考时长</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${secondsInTurn >= 240 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
              {timeFormatted}
            </span>
            {!isMyTurn && (
              <button
                onClick={handleUrge}
                disabled={urgeCooldown > 0}
                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] border border-amber-500/30 disabled:opacity-40 transition-all flex items-center gap-1"
                title="向对方发出响铃提示"
              >
                <Bell className="w-2.5 h-2.5" />
                <span>{urgeCooldown > 0 ? `${urgeCooldown}s` : '催促'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 预设国风快捷短语 */}
      <div>
        <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-amber-400" />
          <span>棋韵快捷短语</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {PRESET_CHAT_PHRASES.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(phrase, true)}
              className="text-[11px] py-1 px-2 rounded-lg bg-slate-950/60 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors text-left"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* 聊天消息流 */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 p-2 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-xs scrollbar-thin scrollbar-thumb-slate-800"
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-[11px]">
            <span>棋逢对手，点击上方短语或输入文字打招呼吧</span>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'me'
                  ? 'items-end'
                  : msg.sender === 'peer'
                  ? 'items-start'
                  : 'items-center'
              }`}
            >
              {msg.sender === 'system' ? (
                <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full my-0.5">
                  {msg.text}
                </span>
              ) : (
                <div
                  className={`max-w-[85%] rounded-xl px-2.5 py-1.5 leading-relaxed break-all ${
                    msg.sender === 'me'
                      ? 'bg-amber-600/80 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  <p className="text-[11px]">{msg.text}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 自由输入打字栏 */}
      <form onSubmit={handleSend} className="flex gap-1.5 pt-1">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="打字切磋，文明对弈..."
          maxLength={60}
          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
