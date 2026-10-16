import React from 'react';
import { X, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';

interface RuleHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleHelpModal: React.FC<RuleHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-amber-900/60 rounded-3xl p-6 text-slate-100 shadow-2xl relative max-w-lg w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-amber-100">象棋对弈与积分规则</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 overflow-y-auto pr-1 text-xs sm:text-sm text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
          <section className="space-y-1.5">
            <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 棋子走法要诀
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li><strong>帥 / 將：</strong>九宫之内横竖一步；双方帅将不可在同一直线上照面（飞将违例）。</li>
              <li><strong>仕 / 士：</strong>九宫之内斜走一格，负责保卫帅营。</li>
              <li><strong>相 / 象：</strong>飞田字，不能过河；田字中心有子阻挡即“塞象眼”，不可飞。</li>
              <li><strong>傌 / 馬：</strong>走“日”字；若行进前方紧邻有子则为“蹩马腿”，不可跳。</li>
              <li><strong>俥 / 車：</strong>横冲直撞，沿直线任意行走，攻防核心。</li>
              <li><strong>砲 / 炮：</strong>行走如车，吃子时必须隔一个任意棋子（称为“炮架”）。</li>
              <li><strong>兵 / 卒：</strong>过河前只能向前一步；过河后可向前或左右横走一步；不可后退。</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 竞赛胜负与正规裁决
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li><strong>欠行困毙（判负）：</strong>不同于国际象棋的和棋，中国象棋中若某方轮到走棋却没有任何合法走法，直接判定该方失败。</li>
              <li><strong>单方面长将（判负）：</strong>单方面步步连续将军造成局面循环往复者，长将方必须主动变招，不变直接判负，严禁无赖长将！</li>
              <li><strong>自然限着（判和）：</strong>双方连续 60 回合（120 步）无任何吃子，自动裁定和棋。</li>
              <li><strong>三度重复（判和）：</strong>双方均无长将或长杀违例时，同一局面出现 3 次裁定和局。</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 积分与段位体系
            </h3>
            <p className="text-slate-400">
              采用经典 Elo 评分系统。战胜高水平电脑将获得更多加分；连胜还将获得额外积分奖励！段位从【业余九级】一路攀升至【特级大师】。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
