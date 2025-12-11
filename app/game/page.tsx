'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { GameState } from '@/types/game';
import { getGameEngine, resetGameEngine } from '@/lib/game/engine';
import { loadSelectedVehicle, updateHighScore, addTotalDistance, incrementGamesPlayed } from '@/lib/utils/storage';
import { DIFFICULTY } from '@/lib/game/constants';
import GameCanvas from '@/app/components/GameCanvas';
import GameHUD from '@/app/components/GameHUD';
import ShopUI from '@/app/components/ShopUI';
import GameStatus from '@/app/components/GameStatus';

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);

  // Initialize game engine
  useEffect(() => {
    const engine = getGameEngine();
    const vehicleConfig = loadSelectedVehicle();

    engine.initVehicle(vehicleConfig);
    engine.setOnStateChange(setGameState);
    setGameState(engine.getState());
    setIsInitialized(true);

    return () => {
      resetGameEngine();
    };
  }, []);

  // Handle touch/click controls
  const handleTouchLeft = useCallback((pressed: boolean) => {
    const engine = getGameEngine();
    engine.setInput({ left: pressed });
  }, []);

  const handleTouchRight = useCallback((pressed: boolean) => {
    const engine = getGameEngine();
    engine.setInput({ right: pressed });
  }, []);

  // Use ref to track last pause time to prevent rapid toggle
  const lastPauseTimeRef = useRef(0);

  const handleTouchCenter = useCallback(() => {
    const now = Date.now();
    // Prevent rapid toggle - require at least 300ms between pause/resume
    if (now - lastPauseTimeRef.current < 300) {
      return;
    }
    lastPauseTimeRef.current = now;

    const engine = getGameEngine();
    const state = engine.getState();

    // Only toggle pause/resume during gameplay
    // Prevent accidental triggers during other states
    if (state.status === 'playing') {
      engine.pause();
    } else if (state.status === 'paused') {
      engine.resume();
    }
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const engine = getGameEngine();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        engine.setInput({ left: true });
      } else if (e.key === 'ArrowRight') {
        engine.setInput({ right: true });
      } else if (e.key === ' ' || e.key === 'Enter') {
        const state = engine.getState();
        if (state.status === 'idle' || state.status === 'game_over') {
          engine.reset();
          engine.start();
          incrementGamesPlayed();
        } else if (state.status === 'paused') {
          engine.resume();
        }
      } else if (e.key === 'Escape') {
        const state = engine.getState();
        if (state.status === 'playing') {
          engine.pause();
        } else if (state.status === 'paused') {
          engine.resume();
        }
      } else if (e.key === '1') {
        engine.purchaseShopPowerUp('invincibility');
      } else if (e.key === '2') {
        engine.purchaseShopPowerUp('machine_gun');
      } else if (e.key === '3') {
        engine.purchaseShopPowerUp('rocket_fuel');
      } else if (e.key === '4') {
        engine.purchaseShopPowerUp('nitro_boost');
      } else if (e.key === 's' || e.key === 'S') {
        // Trigger slot machine
        engine.triggerSlotMachine();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        engine.setInput({ left: false });
      } else if (e.key === 'ArrowRight') {
        engine.setInput({ right: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle game over - save stats
  useEffect(() => {
    if (gameState?.status === 'game_over') {
      updateHighScore(gameState.score);
      addTotalDistance(gameState.distance);
    }
  }, [gameState?.status, gameState?.score, gameState?.distance]);

  const handleStart = useCallback(() => {
    setShowDifficultySelect(true);
  }, []);

  const handleDifficultySelect = useCallback((level: 'easy' | 'medium' | 'hard') => {
    const engine = getGameEngine();
    engine.setDifficultyLevel(level);
    engine.reset();
    engine.start();
    incrementGamesPlayed();
    setShowDifficultySelect(false);
  }, []);

  const handleRestart = useCallback(() => {
    const engine = getGameEngine();
    engine.reset();
    engine.start();
    incrementGamesPlayed();
  }, []);

  const handleResume = useCallback(() => {
    const engine = getGameEngine();
    engine.resume();
  }, []);

  const handlePause = useCallback(() => {
    const engine = getGameEngine();
    engine.pause();
  }, []);

  const handleExit = useCallback(() => {
    const engine = getGameEngine();
    engine.pause();
  }, []);

  if (!isInitialized || !gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-0 md:p-4">
      <div className="flex flex-col items-center gap-0 md:gap-4 w-full md:w-auto">
        {/* Game Container - Full screen on mobile */}
        <div className="relative w-full h-screen md:w-auto md:h-auto">
          <GameCanvas
            gameState={gameState}
            onTouchLeft={handleTouchLeft}
            onTouchRight={handleTouchRight}
            onTouchCenter={handleTouchCenter}
          />
          <GameHUD gameState={gameState} />
          {gameState.status === 'playing' && (
            <>
              <ShopUI
                gameState={gameState}
                onPurchase={(type) => getGameEngine().purchaseShopPowerUp(type)}
              />
              <GameStatus
                gameState={gameState}
                onSlotMachineSpin={() => getGameEngine().triggerSlotMachine()}
              />
            </>
          )}

          {/* Overlays */}
          {gameState.status === 'idle' && !showDifficultySelect && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Race?</h2>
              <div className="text-gray-300 mb-6 text-center">
                <p className="mb-2">使用方向键 或 点击屏幕左右侧 来移动</p>
                <p>点击中心暂停 | ESC 暂停</p>
              </div>
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold rounded-lg transition-colors"
              >
                Start
              </button>
              <p className="text-gray-400 text-sm mt-4">or press SPACE / ENTER</p>
            </div>
          )}

          {showDifficultySelect && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold text-white mb-6">Select Difficulty</h2>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDifficultySelect('easy')}
                  className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-lg transition-colors"
                >
                  🟢 Easy (70% Speed)
                </button>
                <button
                  onClick={() => handleDifficultySelect('medium')}
                  className="px-12 py-4 bg-yellow-600 hover:bg-yellow-700 text-white text-xl font-semibold rounded-lg transition-colors"
                >
                  🟡 Medium (100% Speed)
                </button>
                <button
                  onClick={() => handleDifficultySelect('hard')}
                  className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-semibold rounded-lg transition-colors"
                >
                  🔴 Hard (120% Speed)
                </button>
              </div>
              <button
                onClick={() => setShowDifficultySelect(false)}
                className="mt-6 text-gray-400 hover:text-gray-200 text-sm"
              >
                ← Back
              </button>
            </div>
          )}

          {gameState.status === 'paused' && (
            <div
              className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-white mb-6">已暂停</h2>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResume}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold rounded-lg transition-colors"
                >
                  继续游戏
                </button>
                <button
                  onClick={handleRestart}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-lg transition-colors"
                >
                  重新开始
                </button>
                <Link
                  href="/"
                  className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white text-xl font-semibold rounded-lg transition-colors text-center"
                >
                  返回菜单
                </Link>
              </div>
            </div>
          )}

          {gameState.status === 'game_over' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold text-red-500 mb-4">Game Over</h2>
              <div className="text-white text-center mb-6">
                <p className="text-2xl mb-2">
                  Distance: {(gameState.distance / DIFFICULTY.distancePerKm).toFixed(2)} km
                </p>
                <p className="text-xl text-gray-300">
                  Score: {gameState.score.toLocaleString()}
                </p>
                {gameState.score > gameState.highScore && (
                  <p className="text-yellow-400 mt-2 font-bold">New High Score!</p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleRestart}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold rounded-lg transition-colors"
                >
                  Play Again
                </button>
                <Link
                  href="/"
                  className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white text-xl font-semibold rounded-lg transition-colors"
                >
                  Menu
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint - Only show on desktop */}
        <div className="hidden md:flex gap-4 text-gray-400 text-sm flex-wrap justify-center">
          <span>← → / 点击左右 移动</span>
          <span>点击中心 / ESC 暂停</span>
          <span>SPACE 开始/重启</span>
          <span>S 老虎机</span>
          <span>1-4 购买道具</span>
        </div>

        {/* Back to menu - Only show on desktop */}
        <Link
          href="/"
          className="hidden md:block text-gray-500 hover:text-gray-300 text-sm mt-2"
        >
          ← Back to Menu
        </Link>
      </div>
    </div>
  );
}
