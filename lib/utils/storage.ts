// LocalStorage utilities for game persistence

import { GameSave, SavedVehicle, VehicleConfig, LeaderboardEntry, BossRecord } from '@/types/game';
import { VEHICLE_PRESETS } from '@/lib/game/constants';

const STORAGE_KEY = 'racing_game_save';

// Default game save data
const defaultGameSave: GameSave = {
  highScore: 0,
  totalDistance: 0,
  gamesPlayed: 0,
  selectedVehicle: null,
  coins: 0,
  leaderboard: [],
  slotMachineFailureCount: 0,
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
      const parsedData = JSON.parse(saved);

      // 数据迁移：确保leaderboard中的statistics字段兼容新的BossRecord格式
      if (parsedData.leaderboard && Array.isArray(parsedData.leaderboard)) {
        parsedData.leaderboard = parsedData.leaderboard.map((entry: LeaderboardEntry) => {
          // 确保statistics存在且bossRecords字段正确
          if (entry.statistics && entry.statistics.bossRecords) {
            entry.statistics.bossRecords = entry.statistics.bossRecords.map((record: BossRecord) => ({
              ...record,
              // 为旧记录添加默认值（如果字段不存在）
              bossShape: record.bossShape || undefined,
              bossColor: record.bossColor || undefined,
              bossName: record.bossName || undefined,
            }));
          }
          return entry;
        });
      }

      return { ...defaultGameSave, ...parsedData };
    }
  } catch (e) {
    console.error('Failed to load game save:', e);
    // 如果加载失败，尝试清除损坏的数据并返回默认值
    console.warn('Corrupted save data detected, resetting to default');
    return defaultGameSave;
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

// Get coins
export const getCoins = (): number => {
  return loadGameSave().coins;
};

// Add coins
export const addCoins = (amount: number): void => {
  const current = loadGameSave();
  saveGameData({ coins: current.coins + amount });
};

// Spend coins
export const spendCoins = (amount: number): boolean => {
  const current = loadGameSave();
  if (current.coins >= amount) {
    saveGameData({ coins: current.coins - amount });
    return true;
  }
  return false;
};

// Add leaderboard entry
export const addLeaderboardEntry = (entry: Omit<import('@/types/game').LeaderboardEntry, 'id'>): void => {
  const current = loadGameSave();
  const newEntry = {
    ...entry,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  };
  const leaderboard = [...current.leaderboard, newEntry]
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 10);
  saveGameData({ leaderboard });
};

// Get leaderboard
export const getLeaderboard = (): import('@/types/game').LeaderboardEntry[] => {
  return loadGameSave().leaderboard;
};

// Get slot machine failure count
export const getSlotMachineFailureCount = (): number => {
  return loadGameSave().slotMachineFailureCount;
};

// Save slot machine failure count
export const saveSlotMachineFailureCount = (count: number): void => {
  saveGameData({ slotMachineFailureCount: count });
};
