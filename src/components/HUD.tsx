import React, { useRef } from 'react';
import { Volume2, VolumeX, Backpack, HelpCircle, ShieldAlert, ZoomIn, ZoomOut, Music } from 'lucide-react';
import { soundManager } from '../game/audio';
import { BLOCKS } from '../game/constants';
import { GameEngine } from '../game/engine';

interface HUDProps {
  engine: GameEngine | null;
  onOpenInventory: () => void;
  onOpenControls: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  notification: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  onOpenInventory,
  onOpenControls,
  isMuted,
  onToggleMute,
  notification,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!engine) return null;

  const player = engine.player;
  const activeBoss = engine.entities.getActiveBoss();
  const selectedStack = player.getSelectedItem();

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      soundManager.loadCustomMusic(file);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3">
      {/* Top Bar */}
      <div className="flex items-start justify-between">
        {/* Health Container */}
        <div className="pointer-events-auto bg-slate-900/90 border-2 border-slate-700/80 rounded-lg p-2.5 shadow-xl backdrop-blur-sm flex flex-col gap-1.5 min-w-[210px]">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold tracking-wider">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              АМЁБА
            </span>
            <span className="text-emerald-400 font-mono text-sm">
              {Math.round(player.hp)} / {player.maxHp} HP
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full h-4 bg-slate-950 rounded border border-slate-700 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-150"
              style={{ width: `${hpPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/90 font-mono drop-shadow">
              {Math.round(hpPercent)}%
            </div>
          </div>
        </div>

        {/* Center: Boss Health Bar if Active */}
        {activeBoss && (
          <div className="pointer-events-auto flex-1 max-w-md mx-4 bg-slate-950/90 border-2 border-red-600/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-md animate-bounce-subtle">
            <div className="flex items-center justify-between text-xs font-bold text-red-400 mb-1">
              <span className="flex items-center gap-1 tracking-widest uppercase">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                {activeBoss.name}
              </span>
              <span className="font-mono text-amber-300">
                {Math.max(0, activeBoss.hp)} / {activeBoss.maxHp}
              </span>
            </div>
            <div className="w-full h-4 bg-slate-900 rounded border border-red-900/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-100"
                style={{ width: `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Top Right Buttons & Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Zoom controls widget */}
          <div className="flex items-center bg-slate-900/90 border-2 border-slate-700/90 rounded-lg p-0.5 shadow-md">
            <button
              onClick={() => engine.setZoom(engine.zoom - 0.2)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded transition active:scale-95 cursor-pointer"
              title="Отдалить камеру (Колёсико назад / Минус)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => engine.setZoom(1.0)}
              className="px-2 py-1 text-[11px] font-mono font-bold text-cyan-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              title="Сбросить масштаб (100%)"
            >
              {Math.round(engine.zoom * 100)}%
            </button>
            <button
              onClick={() => engine.setZoom(engine.zoom + 0.2)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded transition active:scale-95 cursor-pointer"
              title="Приблизить камеру (Колёсико вперёд / Плюс)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Music Track Indicator & Custom Audio Upload */}
          <div className="flex items-center gap-1 bg-slate-900/90 border-2 border-purple-500/60 rounded-lg p-0.5 shadow-md">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 text-xs font-mono text-purple-300 hover:text-white hover:bg-purple-950/50 rounded transition cursor-pointer flex items-center gap-1.5"
              title="Фоновая музыка. Нажмите, чтобы загрузить другой трек"
            >
              <Music className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="truncate max-w-[140px] font-semibold">
                {soundManager.customTrackName || 'Terraria — Day'}
              </span>
            </button>
            {soundManager.customTrackName && (
              <button
                onClick={() => {
                  soundManager.customTrackName = null;
                  soundManager.startMusic();
                }}
                className="px-1.5 py-0.5 text-[10px] bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded cursor-pointer"
                title="Вернуть Terraria Overworld Day"
              >
                ✕
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAudioUpload}
              accept="audio/*"
              className="hidden"
            />
          </div>

          <button
            onClick={onToggleMute}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 text-slate-300 hover:text-white rounded-lg transition shadow-md active:scale-95 cursor-pointer"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>

          <button
            onClick={onOpenControls}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 text-slate-300 hover:text-white rounded-lg transition shadow-md active:scale-95 cursor-pointer"
            title="Управление"
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </button>

          <button
            onClick={onOpenInventory}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-700/80 hover:bg-cyan-600/90 border-2 border-cyan-400/80 text-white rounded-lg transition shadow-md active:scale-95 font-bold text-xs cursor-pointer"
            title="Открыть инвентарь (E)"
          >
            <Backpack className="w-4 h-4" />
            <span className="hidden sm:inline">Инвентарь</span> [E]
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="self-center bg-slate-900/95 border-2 border-cyan-400 text-cyan-200 px-4 py-1.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in">
          {notification}
        </div>
      )}

      {/* Bottom Area: Active Item label & Hotbar */}
      <div className="flex flex-col items-center gap-2">
        {/* Selected Item Banner */}
        <div className="h-6 flex items-center">
          {selectedStack && (
            <div className="bg-slate-900/90 border border-slate-700 text-cyan-300 px-3 py-0.5 rounded text-xs font-mono tracking-wide shadow-md flex items-center gap-1.5">
              <span>{selectedStack.item.name}</span>
              {selectedStack.item.blockId && (
                <>
                  <span className="text-amber-400 font-sans">
                    🗡 {Math.max(7, Math.round(8 + (BLOCKS[selectedStack.item.blockId]?.hardness || 1) * 4))} ур. блоком
                  </span>
                  <span className="text-emerald-400 font-sans">• ПКМ: Ставить</span>
                </>
              )}
              {selectedStack.item.iconType === 'axe' && (
                <>
                  <span className="text-red-400 font-bold font-sans">🪓 {selectedStack.item.damage} рубящий урон</span>
                  <span className="text-amber-300 font-sans">• ЛКМ: Рассекающий удар</span>
                </>
              )}
              {selectedStack.item.type === 'weapon' && selectedStack.item.iconType !== 'axe' && selectedStack.item.damage && (
                <span className="text-red-400">🗡 {selectedStack.item.damage} ур.</span>
              )}
              {selectedStack.item.type === 'tool' && selectedStack.item.iconType !== 'axe' && selectedStack.item.pickaxePower && (
                <span className="text-amber-400">⛏ {selectedStack.item.pickaxePower} мощь</span>
              )}
            </div>
          )}
        </div>

        {/* Hotbar Slots (1-9) */}
        <div className="pointer-events-auto bg-slate-900/95 border-2 border-slate-700/90 rounded-xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1.5">
          {Array.from({ length: 9 }).map((_, idx) => {
            const stack = player.inventory[idx];
            const isSelected = player.selectedSlot === idx;

            return (
              <button
                key={idx}
                onClick={() => player.setSelectedSlot(idx)}
                className={`relative w-11 h-11 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/70 shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-105'
                    : 'border-slate-700 bg-slate-800/80 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                {/* Slot Number Badge */}
                <span className="absolute top-0.5 left-1 text-[10px] text-slate-400 font-mono font-bold leading-none">
                  {idx + 1}
                </span>

                {/* Item Icon / Color block */}
                {stack ? (
                  <>
                    {stack.item.iconType === 'axe' ? (
                      <span className="text-xl leading-none select-none drop-shadow">🪓</span>
                    ) : (
                      <div
                        className="w-5 h-5 rounded-sm shadow-sm"
                        style={{
                          backgroundColor: stack.item.color,
                          boxShadow: `0 0 6px ${stack.item.color}88`,
                        }}
                      />
                    )}
                    {/* Count */}
                    {stack.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[11px] text-white font-mono font-bold drop-shadow leading-none">
                        {stack.count}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-600 text-xs">•</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Controls Hint Bar */}
        <div className="text-[11px] text-slate-400 bg-slate-950/80 px-3 py-0.5 rounded-full border border-slate-800/80 font-mono flex items-center gap-2">
          <span><b className="text-slate-200">A/D</b> Движение</span>
          <span>•</span>
          <span><b className="text-slate-200">Пробел</b> Прыжок</span>
          <span>•</span>
          <span><b className="text-amber-300">ЛКМ</b> Ломать / Бить (в т.ч. блоками)</span>
          <span>•</span>
          <span><b className="text-emerald-400">ПКМ</b> Строить (зажать)</span>
          <span>•</span>
          <span><b className="text-cyan-300">Колёсико</b> Зум</span>
          <span>•</span>
          <span><b className="text-slate-200">E</b> Инвентарь</span>
        </div>
      </div>
    </div>
  );
};
