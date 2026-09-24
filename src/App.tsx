import React, { useCallback, useEffect, useState } from 'react';
import { soundManager } from './game/audio';
import { GameEngine } from './game/engine';
import { AboutModal } from './components/AboutModal';
import { ControlsModal } from './components/ControlsModal';
import { GameCanvas } from './components/GameCanvas';
import { GameOverModal } from './components/GameOverModal';
import { HUD } from './components/HUD';
import { InventoryModal } from './components/InventoryModal';
import { MainMenu } from './components/MainMenu';
import { VictoryModal } from './components/VictoryModal';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [victoryBossName, setVictoryBossName] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Show temporary toast notification
  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const handleStartGame = () => {
    setGameState('playing');
    if (engine) {
      engine.initGame();
      engine.isPaused = false;
    }
  };

  const handleRestart = () => {
    soundManager.stopDeathVoice();
    soundManager.startMusic();
    setGameState('playing');
    setIsInventoryOpen(false);
    setVictoryBossName(null);
    if (engine) {
      engine.initGame();
      engine.isPaused = false;
    }
  };

  const handleEngineReady = (newEngine: GameEngine) => {
    setEngine(newEngine);
    if (gameState === 'menu') {
      newEngine.isPaused = true;
    }
  };

  const handleToggleMute = () => {
    const enabled = soundManager.toggleMute();
    setIsMuted(!enabled);
  };

  const handleInventoryToggle = (open: boolean) => {
    setIsInventoryOpen(open);
  };

  const handleGameOver = () => {
    setGameState('gameover');
    setIsInventoryOpen(false);
    soundManager.playDeathVoice();
  };

  const handleVictory = (bossName: string) => {
    setVictoryBossName(bossName);
  };

  // Sync keyboard shortcut for Escape
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (isControlsOpen) {
          setIsControlsOpen(false);
        } else if (isAboutOpen) {
          setIsAboutOpen(false);
        } else if (victoryBossName) {
          setVictoryBossName(null);
        } else if (isInventoryOpen) {
          setIsInventoryOpen(false);
          engine?.toggleInventory(false);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isControlsOpen, isAboutOpen, victoryBossName, isInventoryOpen, engine]);

  // Regular UI update tick (20 Hz) to keep HUD health and items synchronized
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 50);
    return () => clearInterval(interval);
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 2D Game Canvas */}
      <GameCanvas
        onEngineReady={handleEngineReady}
        callbacks={{
          onInventoryToggle: handleInventoryToggle,
          onGameOver: handleGameOver,
          onVictory: handleVictory,
          onNotification: showNotification,
        }}
      />

      {/* In-Game HUD overlay */}
      {gameState === 'playing' && (
        <HUD
          engine={engine}
          onOpenInventory={() => {
            setIsInventoryOpen(true);
            engine?.toggleInventory(true);
          }}
          onOpenControls={() => setIsControlsOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          notification={notification}
        />
      )}

      {/* Inventory & Crafting Modal */}
      {isInventoryOpen && (
        <InventoryModal
          engine={engine}
          onClose={() => {
            setIsInventoryOpen(false);
            engine?.toggleInventory(false);
          }}
        />
      )}

      {/* Main Menu */}
      {gameState === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenControls={() => setIsControlsOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
        />
      )}

      {/* Death Screen */}
      {gameState === 'gameover' && <GameOverModal onRestart={handleRestart} />}

      {/* Boss Victory Celebration */}
      {victoryBossName && (
        <VictoryModal
          bossName={victoryBossName}
          onContinue={() => setVictoryBossName(null)}
        />
      )}

      {/* Controls Guide Modal */}
      {isControlsOpen && <ControlsModal onClose={() => setIsControlsOpen(false)} />}

      {/* About Info Modal */}
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
    </div>
  );
}
