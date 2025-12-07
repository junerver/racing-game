'use client';

import { GameState } from '@/types/game';
import { POWERUP_CONFIG, DIFFICULTY } from '@/lib/game/constants';
import { getDifficultyTier, getDifficultyColor } from '@/lib/game/difficulty';

interface GameHUDProps {
  gameState: GameState;
}

export default function GameHUD({ gameState }: GameHUDProps) {
  const distanceKm = (gameState.distance / DIFFICULTY.distancePerKm).toFixed(2);
  const difficultyTier = getDifficultyTier(gameState.difficulty);
  const difficultyColor = getDifficultyColor(gameState.difficulty);

  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
      {/* Top bar */}
      <div className="flex justify-between items-start">
        {/* Distance and Score */}
        <div className="bg-black/70 rounded-lg px-4 py-2 text-white">
          <div className="text-2xl font-bold">{distanceKm} km</div>
          <div className="text-sm text-gray-300">Score: {gameState.score.toLocaleString()}</div>
        </div>

        {/* Speed and Difficulty */}
        <div className="bg-black/70 rounded-lg px-4 py-2 text-white text-right">
          <div className="text-lg font-semibold">
            {Math.round(gameState.currentSpeed * 20)} km/h
          </div>
          <div className="text-sm" style={{ color: difficultyColor }}>
            {difficultyTier}
          </div>
        </div>
      </div>

      {/* Active Power-ups */}
      {gameState.activePowerUps.length > 0 && (
        <div className="mt-4 flex gap-2 justify-center">
          {gameState.activePowerUps.map((powerUp, index) => {
            const config = POWERUP_CONFIG[powerUp.type];
            const progress = powerUp.remainingTime / config.duration;

            return (
              <div
                key={`${powerUp.type}-${index}`}
                className="bg-black/70 rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <span
                  className="text-xl"
                  style={{ filter: `drop-shadow(0 0 4px ${config.color})` }}
                >
                  {config.icon}
                </span>
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: config.color,
                      boxShadow: `0 0 8px ${config.color}`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-300">
                  {Math.ceil(powerUp.remainingTime / 1000)}s
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* High Score indicator */}
      {gameState.score > gameState.highScore && gameState.highScore > 0 && (
        <div className="mt-4 text-center">
          <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold animate-pulse">
            NEW HIGH SCORE!
          </span>
        </div>
      )}
    </div>
  );
}
