import React from 'react';
import { Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  bossName: string;
  onContinue: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ bossName, onContinue }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-amber-500/80 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col items-center text-center animate-scale-up">
        <div className="w-16 h-16 rounded-full bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
        </div>

        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 tracking-wider mb-2">
          ПОБЕДА НАД БОССОМ!
        </h2>

        <div className="text-sm font-bold text-cyan-300 mb-2">
          «{bossName}» повержен!
        </div>

        <p className="text-xs text-slate-300 font-mono mb-6 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
          С поверженного владыки выпали редкие трофеи. Откройте инвентарь <b className="text-cyan-400">[E]</b>, чтобы создать усиленное оружие и снаряжение!
        </p>

        <button
          onClick={onContinue}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(245,158,11,0.5)] transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-5 h-5 fill-current" />
          Продолжить приключение
        </button>
      </div>
    </div>
  );
};
