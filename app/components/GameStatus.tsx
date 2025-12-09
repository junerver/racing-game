'use client';

import { GameState } from '@/types/game';
import SlotMachineUI from './SlotMachineUI';

interface GameStatusProps {
  gameState: GameState;
  onSlotMachineSpin: () => void;
}

export default function GameStatus({ gameState, onSlotMachineSpin }: GameStatusProps) {
  return (
    <div className="absolute bottom-4 left-0 right-0 px-4 pointer-events-none">
      <div className="flex justify-between items-center">
        {/* Hearts (left) */}
        <div className="flex gap-1 bg-black/70 rounded-lg px-3 py-2">
          {Array.from({ length: gameState.hearts }).map((_, i) => (
            <span key={i} className="text-2xl">❤️</span>
          ))}
          {Array.from({ length: 3 - gameState.hearts }).map((_, i) => (
            <span key={`empty-${i}`} className="text-2xl opacity-30">🖤</span>
          ))}
        </div>

        {/* Slot Machine (center) */}
        <div className="bg-black/70 rounded-lg px-2 py-2 pointer-events-auto">
          <SlotMachineUI slotMachine={gameState.slotMachine} onSpin={onSlotMachineSpin} />
        </div>

        {/* Coins (right) */}
        <div className="bg-black/70 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-yellow-400">💰 {gameState.coins}</span>
        </div>
      </div>
    </div>
  );
}
