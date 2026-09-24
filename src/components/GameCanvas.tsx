import React, { useEffect, useRef } from 'react';
import { EngineCallbacks, GameEngine } from '../game/engine';

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
  callbacks: EngineCallbacks;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onEngineReady, callbacks }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, callbacks);
    engineRef.current = engine;
    onEngineReady(engine);
    engine.start();

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.cleanup();
    };
  }, []);

  // Update callbacks dynamically if props change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.callbacks = callbacks;
    }
  }, [callbacks]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block bg-slate-950 cursor-crosshair"
      tabIndex={0}
    />
  );
};
