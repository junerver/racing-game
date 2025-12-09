'use client';

import { GameState, PowerUpType } from '@/types/game';
import { POWERUP_CONFIG } from '@/lib/game/constants';

interface ShopUIProps {
  gameState: GameState;
  onPurchase: (type: PowerUpType) => void;
}

export default function ShopUI({ gameState, onPurchase }: ShopUIProps) {
  const shopItems = Object.entries(POWERUP_CONFIG)
    .filter(([_, config]) => config.isSellable)
    .map(([type]) => type as PowerUpType);

  return (
    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
      <div className="grid grid-cols-2 gap-1">
        {shopItems.map((type) => {
          const config = POWERUP_CONFIG[type];
          const isActive = gameState.activePowerUps.some(p => p.type === type);
          const canAfford = gameState.coins >= (config.price || 0);

          return (
            <button
              key={type}
              onClick={() => onPurchase(type)}
              disabled={isActive || !canAfford}
              className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                isActive
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : canAfford
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              title={config.description}
            >
              <div className="flex items-center gap-1">
                <span className="text-sm">{config.icon}</span>
                <span className="text-xs">{config.price}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
