'use client';

import { SlotMachineState } from '@/types/game';
import { useEffect } from 'react';

interface SlotMachineUIProps {
  slotMachine: SlotMachineState;
  onSpin: () => void;
}

export default function SlotMachineUI({ slotMachine, onSpin }: SlotMachineUIProps) {
  const { cards, isActive, isSpinning, results } = slotMachine;

  // Auto-spin when cards are filled
  useEffect(() => {
    if (isActive && !isSpinning) {
      onSpin();
    }
  }, [isActive, isSpinning, onSpin]);

  return (
    <div className="flex gap-1">
      {isSpinning ? (
        results.map((symbol, index) => (
          <div
            key={index}
            className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center text-sm font-bold animate-pulse"
          >
            {symbol}
          </div>
        ))
      ) : (
        cards.map((card, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${
              card.filled
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-700/50 text-gray-500'
            }`}
          >
            {card.filled ? `${card.value}` : '?'}
          </div>
        ))
      )}
    </div>
  );
}
