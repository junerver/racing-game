// Slot machine system logic

import { SlotMachineState, SlotMachineSymbol } from '@/types/game';
import { SLOT_MACHINE_CONFIG } from './constants';

// Initialize slot machine state
export const createSlotMachineState = (): SlotMachineState => ({
  cards: [
    { value: 0, filled: false },
    { value: 0, filled: false },
    { value: 0, filled: false },
  ],
  isActive: false,
  isSpinning: false,
  results: [],
  poolAmount: 0,
});

// Add coin to slot machine card
export const addCoinToSlotMachine = (
  state: SlotMachineState,
  coinValue: number
): SlotMachineState => {
  const newState = { ...state };
  const emptyCardIndex = newState.cards.findIndex((card) => !card.filled);

  if (emptyCardIndex !== -1) {
    newState.cards[emptyCardIndex] = { value: coinValue, filled: true };
    newState.poolAmount += coinValue;

    // Check if all cards are filled
    if (newState.cards.every((card) => card.filled)) {
      newState.isActive = true;
    }
  }

  return newState;
};

// Spin slot machine
export const spinSlotMachine = (state: SlotMachineState): SlotMachineState => {
  if (!state.isActive || state.isSpinning) return state;

  const results: SlotMachineSymbol[] = [];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * SLOT_MACHINE_CONFIG.symbols.length);
    results.push(SLOT_MACHINE_CONFIG.symbols[randomIndex]);
  }

  return {
    ...state,
    isSpinning: true,
    results,
  };
};

// Calculate slot machine reward
export const calculateSlotMachineReward = (
  results: SlotMachineSymbol[],
  poolAmount: number
): number => {
  if (results.length !== 3) return 0;

  const [first, second, third] = results;

  // Check if all three are the same
  if (first === second && second === third) {
    // Three '谢谢'
    if (first === '谢谢') {
      return SLOT_MACHINE_CONFIG.rewards['谢谢'];
    }

    // Three '❌' - penalty
    if (first === '❌') {
      return -poolAmount;
    }

    // Three numbers - multiplier reward
    if (typeof first === 'number') {
      const multiplier = SLOT_MACHINE_CONFIG.multipliers[first];
      return Math.floor(poolAmount * (multiplier - 1));
    }
  }

  // No match - no reward
  return 0;
};

// Complete slot machine spin
export const completeSlotMachineSpin = (state: SlotMachineState): SlotMachineState => {
  return createSlotMachineState();
};

// Check if slot machine is ready to spin
export const isSlotMachineReady = (state: SlotMachineState): boolean => {
  return state.isActive && !state.isSpinning;
};
