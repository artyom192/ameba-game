import React, { useState } from 'react';
import { X, Hammer, Backpack, Sparkles, Check, AlertCircle } from 'lucide-react';
import { ITEMS, RECIPES } from '../game/constants';
import { GameEngine } from '../game/engine';
import { ItemStack, Recipe } from '../game/types';

interface InventoryModalProps {
  engine: GameEngine | null;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ engine, onClose }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [, setRefresh] = useState(0);

  if (!engine) return null;

  const player = engine.player;

  // Helper to count items in player inventory
  const countItem = (itemId: string): number => {
    let total = 0;
    for (const slot of player.inventory) {
      if (slot && slot.item.id === itemId) {
        total += slot.count;
      }
    }
    return total;
  };

  const handleCraft = (recipe: Recipe) => {
    const success = engine.craftRecipe(recipe);
    if (success) {
      setRefresh((r) => r + 1);
    }
  };

  const selectedStack: ItemStack | null =
    selectedSlotIndex !== null ? player.inventory[selectedSlotIndex] : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 bg-slate-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'inventory'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Backpack className="w-4 h-4" />
              Рюкзак и Снаряжение
            </button>
            <button
              onClick={() => setActiveTab('crafting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'crafting'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hammer className="w-4 h-4" />
              Мастерская / Крафт
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col md:flex-row gap-4">
          {activeTab === 'inventory' ? (
            <>
              {/* Inventory Slots Grid */}
              <div className="flex-1 flex flex-col gap-3">
                {/* Hotbar (Row 1) */}
                <div>
                  <div className="text-[11px] text-cyan-400 font-bold mb-1.5 flex items-center justify-between">
                    <span>Быстрый доступ (Слоты 1 - 9)</span>
                    <span className="text-slate-500 font-normal">Клавиши 1-9</span>
                  </div>
                  <div className="grid grid-cols-9 gap-1.5">
                    {Array.from({ length: 9 }).map((_, idx) => {
                      const stack = player.inventory[idx];
                      const isSelected = selectedSlotIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedSlotIndex(idx)}
                          className={`relative aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/70 ring-2 ring-cyan-500/50'
                              : 'border-slate-700 bg-slate-800/80 hover:border-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          <span className="absolute top-0.5 left-1 text-[9px] text-slate-500 font-mono">
                            {idx + 1}
                          </span>
                          {stack && (
                            <>
                              {stack.item.iconType === 'axe' ? (
                                <span className="text-base select-none">🪓</span>
                              ) : (
                                <div
                                  className="w-5 h-5 rounded-sm"
                                  style={{ backgroundColor: stack.item.color }}
                                />
                              )}
                              {stack.count > 1 && (
                                <span className="absolute bottom-0.5 right-1 text-[10px] text-white font-mono font-bold">
                                  {stack.count}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Backpack (Rows 2 - 4) */}
                <div>
                  <div className="text-[11px] text-slate-400 font-bold mb-1.5">Основной рюкзак</div>
                  <div className="grid grid-cols-9 gap-1.5">
                    {Array.from({ length: 27 }).map((_, i) => {
                      const idx = 9 + i;
                      const stack = player.inventory[idx];
                      const isSelected = selectedSlotIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedSlotIndex(idx)}
                          className={`relative aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/70 ring-2 ring-cyan-500/50'
                              : 'border-slate-700 bg-slate-800/80 hover:border-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          {stack && (
                            <>
                              {stack.item.iconType === 'axe' ? (
                                <span className="text-base select-none">🪓</span>
                              ) : (
                                <div
                                  className="w-5 h-5 rounded-sm"
                                  style={{ backgroundColor: stack.item.color }}
                                />
                              )}
                              {stack.count > 1 && (
                                <span className="absolute bottom-0.5 right-1 text-[10px] text-white font-mono font-bold">
                                  {stack.count}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Item Details Panel */}
              <div className="w-full md:w-56 bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
                {selectedStack ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: selectedStack.item.color }}
                      />
                      <div>
                        <div className="text-xs font-bold text-cyan-300 leading-tight">
                          {selectedStack.item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                          {selectedStack.item.type} • {selectedStack.count} шт.
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800">
                      {selectedStack.item.description}
                    </div>

                    {/* Stats details */}
                    <div className="text-[10px] space-y-1 font-mono text-slate-400">
                      {selectedStack.item.damage && (
                        <div className="text-red-400">⚔ Урон: {selectedStack.item.damage}</div>
                      )}
                      {selectedStack.item.pickaxePower && (
                        <div className="text-amber-400">⛏ Мощь кирки: {selectedStack.item.pickaxePower}</div>
                      )}
                      {selectedStack.item.axePower && (
                        <div className="text-amber-300">🪓 Мощь топора: {selectedStack.item.axePower}</div>
                      )}
                      {selectedStack.item.healAmount && (
                        <div className="text-emerald-400">💚 Лечение: +{selectedStack.item.healAmount} HP</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs py-8">
                    Выберите предмет в инвентаре для просмотра свойств
                  </div>
                )}

                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 text-center">
                  Клавиша <b className="text-slate-300">[E]</b> закрывает инвентарь
                </div>
              </div>
            </>
          ) : (
            /* Crafting Panel */
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="text-xs text-slate-400 font-bold">
                Рецепты создания снаряжения и призыва боссов:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto max-h-[55vh] pr-1">
                {RECIPES.map((recipe) => {
                  const resItem = ITEMS[recipe.result.itemId];
                  if (!resItem) return null;

                  const canCraft = recipe.ingredients.every(
                    (ing) => countItem(ing.itemId) >= ing.count
                  );

                  return (
                    <div
                      key={recipe.id}
                      className={`p-2.5 rounded-xl border-2 flex flex-col justify-between gap-2 transition ${
                        canCraft
                          ? 'border-cyan-600/70 bg-slate-900/90 hover:border-cyan-400'
                          : 'border-slate-800 bg-slate-950/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-8 h-8 rounded border border-white/20 flex items-center justify-center flex-shrink-0 text-base"
                          style={{ backgroundColor: resItem.color }}
                        >
                          {resItem.iconType === 'axe' ? (
                            <span className="select-none leading-none">🪓</span>
                          ) : (
                            <Sparkles className="w-4 h-4 text-white/80" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-200">
                            {recipe.name}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {resItem.description}
                          </div>
                        </div>
                      </div>

                      {/* Ingredients requirement list */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        {recipe.ingredients.map((ing, i) => {
                          const has = countItem(ing.itemId);
                          const reqItem = ITEMS[ing.itemId];
                          const met = has >= ing.count;
                          return (
                            <span
                              key={i}
                              className={`px-1.5 py-0.5 rounded border ${
                                met
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                                  : 'bg-red-950/80 text-red-300 border-red-800/60'
                              }`}
                            >
                              {reqItem?.name || ing.itemId}: {has}/{ing.count}
                            </span>
                          );
                        })}
                      </div>

                      {/* Craft button */}
                      <button
                        onClick={() => handleCraft(recipe)}
                        disabled={!canCraft}
                        className={`w-full py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${
                          canCraft
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Создать
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
