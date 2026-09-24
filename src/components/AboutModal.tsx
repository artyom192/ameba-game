import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm tracking-wider uppercase">
            <BookOpen className="w-5 h-5" />
            ОБ ИГРЕ «АМЁБА»
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-300 font-mono space-y-3 leading-relaxed">
          <p>
            <b className="text-cyan-300">«Амёба»</b> — это браузерная 2D sandbox survival-игра, вдохновленная классическими двухмерными играми про выживание, копание и строительство.
          </p>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold">Зоны мира:</div>
            <div>• <b className="text-emerald-400">Поверхность и Лес:</b> деревья, трава, мирные и прыгающие слизни.</div>
            <div>• <b className="text-yellow-400">Пустыня:</b> песчаные дюны и руины.</div>
            <div>• <b className="text-slate-400">Подземелья:</b> жилы меди, железа и камня, пещерные монстры.</div>
            <div>• <b className="text-cyan-400">Кристальная пещера:</b> редкие био-кристаллы.</div>
            <div>• <b className="text-purple-400">Бездна:</b> опасная зона поздней игры с абиссальным камнем и боссами.</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-amber-400 font-bold">Боссы:</div>
            <div>1. <b className="text-blue-400">Королевский Гель</b> — призывается Короной Слизевика.</div>
            <div>2. <b className="text-purple-400">Кристальный Колосс</b> — владыка глубин.</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};
