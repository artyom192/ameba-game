import React from 'react';
import { Play, HelpCircle, Info, Sparkles } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenControls: () => void;
  onOpenAbout: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenControls,
  onOpenAbout,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 select-none">
      {/* Decorative background grid and animated stars */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full bg-slate-900/90 border-4 border-cyan-500/80 rounded-3xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.35)] backdrop-blur-md">
        {/* Animated Amoeba Blob Logo Mascot */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 border-4 border-cyan-200 animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.8)] flex items-center justify-center relative">
            {/* Nucleus */}
            <div className="w-9 h-9 rounded-full bg-pink-500 border-2 border-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.9)] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white opacity-80" />
            </div>

            {/* Cute eyes */}
            <div className="absolute top-5 right-5 flex gap-1.5">
              <div className="w-3.5 h-4 bg-white rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
              </div>
              <div className="w-3.5 h-4 bg-white rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Game Title */}
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-teal-200 to-emerald-400 tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] mb-1">
          АМЁБА
        </h1>
        <p className="text-xs text-cyan-300 font-mono tracking-wider mb-8 text-center uppercase">
          2D Sandbox Survival
        </p>

        {/* Buttons Menu */}
        <div className="flex flex-col gap-3.5 w-full">
          <button
            onClick={onStartGame}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            Новая игра
          </button>

          <button
            onClick={onOpenControls}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-cyan-400 text-slate-200 hover:text-white font-bold text-xs tracking-wider uppercase transition-all hover:scale-102 active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            Управление
          </button>

          <button
            onClick={onOpenAbout}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border-2 border-slate-700 text-slate-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all hover:scale-102 active:scale-95 cursor-pointer"
          >
            <Info className="w-4 h-4 text-amber-400" />
            Об игре
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-[11px] text-slate-400 font-mono text-center">
          Исследуйте мир, добывайте руду, стройте убежище и сразитесь с боссами!
        </div>
      </div>
    </div>
  );
};
