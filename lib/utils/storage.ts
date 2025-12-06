// LocalStorage utilities for game persistence

import { GameSave, SavedVehicle, VehicleConfig } from '@/types/game';
import { VEHICLE_PRESETS } from '@/lib/game/constants';

const STORAGE_KEY = 'racing_game_save';

// Default game save data
const defaultGameSave: GameSave = {
  highScore: 0,
  totalDistance: 0,
  gamesPlayed: 0,
  selectedVehicle: null,
};

// Check if localStorage is available
const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Load game save from localStorage
export const loadGameSave = (): GameSave => {
  if (!isStorageAvailable()) return defaultGameSave;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultGameSave, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load game save:', e);
  }

  return defaultGameSave;
};

// Save game data to localStorage
export const saveGameData = (data: Partial<GameSave>): void => {
  if (!isStorageAvailable()) return;

  try {
    const current = loadGameSave();
    const updated = { ...current, ...data };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save game data:', e);
  }
};

// Update high score if new score is higher
export const updateHighScore = (score: number): boolean => {
  const current = loadGameSave();
  if (score > current.highScore) {
    saveGameData({ highScore: score });
    return true;
  }
  return false;
};

// Add distance to total
export const addTotalDistance = (distance: number): void => {
  const current = loadGameSave();
  saveGameData({ totalDistance: current.totalDistance + distance });
};

// Increment games played
export const incrementGamesPlayed = (): void => {
  const current = loadGameSave();
  saveGameData({ gamesPlayed: current.gamesPlayed + 1 });
};

// Save selected vehicle
export const saveSelectedVehicle = (vehicle: VehicleConfig): void => {
  const savedVehicle: SavedVehicle = {
    id: vehicle.id,
    name: vehicle.name,
    color: vehicle.color,
    engineLevel: vehicle.engineLevel,
    tireLevel: vehicle.tireLevel,
  };
  saveGameData({ selectedVehicle: savedVehicle });
};

// Load selected vehicle or return default
export const loadSelectedVehicle = (): VehicleConfig => {
  const save = loadGameSave();
  if (save.selectedVehicle) {
    return save.selectedVehicle;
  }
  return VEHICLE_PRESETS[0]; // Default to first preset
};

// Get high score
export const getHighScore = (): number => {
  return loadGameSave().highScore;
};

// Reset all game data
export const resetGameData = (): void => {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset game data:', e);
  }
};
