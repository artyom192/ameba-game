import React, { useEffect } from 'react';
import { RotateCcw, Skull, Volume2 } from 'lucide-react';
import { soundManager } from '../game/audio';

interface GameOverModalProps {
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart }) => {
  useEffect(() => {
    soundManager.playDeathVoice();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-red-600/80 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.4)] flex flex-col items-center text-center animate-scale-up">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center mb-4">
          <Skull className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400 tracking-wider mb-2">
          Амёба погибла
        </h2>

        {/* Death Voice Quote Box */}
        <div className="w-full bg-slate-950/80 border border-red-500/40 rounded-xl p-3.5 mb-5 text-left relative group">
          <div className="text-[11px] text-red-400 font-mono font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Голосовое сообщение:</span>
            <button
              onClick={() => soundManager.playDeathVoice(true)}
              className="p-1 hover:bg-red-950 rounded text-red-300 hover:text-white transition cursor-pointer"
              title="Повторить фразу"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-200 font-sans italic leading-relaxed">
            «Вы погибли. Не переживайте, когда-нибудь вы научитесь играть в игры.»
          </p>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          Начать заново
        </button>
      </div>
    </div>
  );
};
