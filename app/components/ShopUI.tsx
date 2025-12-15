'use client';

import { GameState, PowerUpType } from '@/types/game';
import { POWERUP_CONFIG } from '@/lib/game/constants';

interface ShopUIProps {
  gameState: GameState;
  onPurchase: (type: PowerUpType) => void;
}

export default function ShopUI({ gameState, onPurchase }: ShopUIProps) {
  // Regular shop items (exclude full_recovery)
  const shopItems = Object.entries(POWERUP_CONFIG)
    .filter(([type, config]) => config.isSellable && type !== 'full_recovery')
    .map(([type]) => type as PowerUpType);

  const hasShieldCombo = gameState.activePowerUps.some(p =>
    ['rotating_shield_gun', 'iron_body', 'golden_bell', 'invincible_fire_wheel'].includes(p.type)
  );

  // Check if full_recovery should be displayed
  const showFullRecovery = gameState.coins >= 9999 && gameState.hearts < 3;
  const fullRecoveryConfig = POWERUP_CONFIG['full_recovery'];

  return (
    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex flex-col gap-2">
        {/* Regular shop items */}
        <div className="grid grid-cols-2 gap-1">
          {shopItems.map((type) => {
            const config = POWERUP_CONFIG[type];
            const isActive = gameState.activePowerUps.some(p => p.type === type);
            const canAfford = gameState.coins >= (config.price || 0);
            const isShieldBlocked = type === 'invincibility' && hasShieldCombo;

            return (
              <button
                key={type}
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase(type);
                }}
                disabled={isActive || !canAfford || isShieldBlocked}
                className={`px-2 py-1 rounded text-xs font-bold transition-all touch-manipulation ${
                  isActive
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : isShieldBlocked
                    ? 'bg-red-400 text-gray-200 cursor-not-allowed'
                    : canAfford
                    ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                title={isShieldBlocked ? '护盾合成道具激活中，无法购买' : config.description}
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm">{config.icon}</span>
                  <span className="text-xs">{config.price}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Special full_recovery item with scaling animation */}
        {showFullRecovery && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPurchase('full_recovery');
            }}
            className="px-3 py-2 rounded-lg font-bold transition-all touch-manipulation bg-pink-600 text-white hover:bg-pink-700 active:bg-pink-800"
            style={{
              animation: 'heartbeat 1s ease-in-out infinite',
            }}
            title={fullRecoveryConfig.description}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{fullRecoveryConfig.icon}</span>
              <span className="text-sm">{fullRecoveryConfig.price}</span>
            </div>
          </button>
        )}
      </div>

      {/* CSS animation for heartbeat effect */}
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
