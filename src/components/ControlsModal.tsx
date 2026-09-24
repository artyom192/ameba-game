import React from 'react';
import { X, Keyboard, MousePointer } from 'lucide-react';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm tracking-wider uppercase">
            <Keyboard className="w-5 h-5" />
            Схема управления
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keybindings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Движение влево / вправо</span>
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-cyan-300 font-bold">
              A / D
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Прыжок</span>
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-cyan-300 font-bold">
              Пробел / W
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Ломать / Атака (оружием и блоками)</span>
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-amber-300 font-bold">
              ЛКМ
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Установить блок / Исп.</span>
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-amber-300 font-bold">
              ПКМ (зажать)
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Масштаб камеры (Зум)</span>
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-cyan-300 font-bold">
              Колёсико / + -
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Сброс зума (100%)</span>
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-cyan-300 font-bold">
              Клик % / Ctrl+0
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Открыть инвентарь / крафт</span>
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-emerald-300 font-bold">
              E
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Выбор предмета</span>
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-emerald-300 font-bold">
              1 – 9
            </span>
          </div>
        </div>

        {/* Gameplay Tips */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1.5 font-mono">
          <div className="text-cyan-400 font-bold mb-1">Советы строительства и боя:</div>
          <div>• <b className="text-amber-300">Удары блоками:</b> выберите любой блок в хотбаре и бейте врагов (ЛКМ). Чем твёрже блок, тем выше урон и отдача!</div>
          <div>• <b className="text-purple-300">Музыка на фоне:</b> играет постоянно в цикле (loop). Кнопкой с нотой можно выбрать свой трек.</div>
          <div>• Для быстрой постройки зажмите <b className="text-emerald-400">ПКМ</b> и ведите курсором по клеткам.</div>
          <div>• Приближайте и отдаляйте камеру колёсиком мыши или кнопками зума на экране.</div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
        >
          Понятно, вернуться в игру
        </button>
      </div>
    </div>
  );
};
