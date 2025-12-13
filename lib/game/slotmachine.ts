// Slot machine system logic

import { SlotMachineState, SlotMachineSymbol } from '@/types/game';
import { SLOT_MACHINE_CONFIG } from './constants';
import { saveSlotMachineFailureCount } from '@/lib/utils/storage';

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
  failureCount: 0,
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

// Spin slot machine with pity system
export const spinSlotMachine = (state: SlotMachineState): SlotMachineState => {
  if (!state.isActive || state.isSpinning) return state;

  // Calculate success rate: 10% per failure, capped at 100%
  const successRate = Math.min(state.failureCount * 0.1, 1.0);
  const isSuccess = Math.random() < successRate;

  let results: SlotMachineSymbol[];

  if (isSuccess) {
    // Success: pick reward based on weighted distribution
    const rand = Math.random() * 100;
    let symbol: SlotMachineSymbol;

    if (rand < 35) {
      symbol = '谢谢'; // 35%
    } else if (rand < 65) {
      symbol = 100; // 30% (1.5x)
    } else if (rand < 90) {
      symbol = 200; // 25% (2x)
    } else if (rand < 95) {
      symbol = 500; // 5% (3x)
    } else {
      symbol = '❌'; // 5% (penalty)
    }

    results = [symbol, symbol, symbol];
  } else {
    // Failure: generate 3 different symbols
    results = [];
    const availableSymbols = [...SLOT_MACHINE_CONFIG.symbols];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * availableSymbols.length);
      results.push(availableSymbols[randomIndex]);
      availableSymbols.splice(randomIndex, 1);
    }
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

    // Three '❌' - penalty (使用半池惩罚)
    if (first === '❌') {
      return -Math.floor(poolAmount / 2);
    }

    // Three numbers - multiplier reward (使用半池计算奖励)
    if (typeof first === 'number') {
      const multiplier = SLOT_MACHINE_CONFIG.multipliers[first];
      return Math.floor((poolAmount / 2) * (multiplier - 1));
    }
  }

  // No match - no reward
  return 0;
};

// Complete slot machine spin and update pity counter
export const completeSlotMachineSpin = (state: SlotMachineState): SlotMachineState => {
  const isSuccess = state.results.length === 3 &&
    state.results[0] === state.results[1] &&
    state.results[1] === state.results[2];

  const newState = createSlotMachineState();

  // Update failure count based on result
  if (isSuccess) {
    newState.failureCount = 0; // Reset on success
  } else {
    newState.failureCount = state.failureCount + 1; // Increment on failure
  }

  // Persist failure count to storage
  saveSlotMachineFailureCount(newState.failureCount);

  return newState;
};

// Check if slot machine is ready to spin
export const isSlotMachineReady = (state: SlotMachineState): boolean => {
  return state.isActive && !state.isSpinning;
};
