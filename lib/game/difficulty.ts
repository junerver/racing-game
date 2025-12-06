// Difficulty scaling system

import { DifficultyConfig } from '@/types/game';
import { SPEED, DIFFICULTY } from './constants';

// Calculate current difficulty based on distance traveled
export const calculateDifficulty = (distance: number): DifficultyConfig => {
  const kmTraveled = distance / DIFFICULTY.distancePerKm;
  const level = Math.floor(kmTraveled) + 1;

  // Speed multiplier increases with distance (exponential curve that plateaus)
  const speedMultiplier = 1 + (1 - Math.exp(-kmTraveled / 5)) * 2;

  // Obstacle spawn rate increases (interval decreases)
  const obstacleSpawnRate = Math.max(
    DIFFICULTY.minObstacleInterval,
    DIFFICULTY.initialObstacleInterval - kmTraveled * DIFFICULTY.obstacleIntervalDecrement
  );

  // Power-up spawn rate slightly increases with difficulty
  const powerUpSpawnRate = Math.max(
    3000,
    DIFFICULTY.powerUpInterval - kmTraveled * 100
  );

  return {
    level,
    speedMultiplier,
    obstacleSpawnRate,
    powerUpSpawnRate,
  };
};

// Calculate current game speed based on distance and base speed
export const calculateGameSpeed = (distance: number, baseMaxSpeed: number): number => {
  const progress = Math.min(1, distance / (DIFFICULTY.distancePerKm * 10)); // Max out at 10km
  const speedRange = baseMaxSpeed - SPEED.initial;

  // Smooth exponential curve for speed increase
  return SPEED.initial + speedRange * (1 - Math.exp(-progress * 3));
};

// Get difficulty tier name
export const getDifficultyTier = (level: number): string => {
  if (level <= 2) return 'Easy';
  if (level <= 5) return 'Medium';
  if (level <= 8) return 'Hard';
  return 'Extreme';
};

// Get difficulty color for UI
export const getDifficultyColor = (level: number): string => {
  if (level <= 2) return '#22c55e'; // green
  if (level <= 5) return '#f59e0b'; // yellow
  if (level <= 8) return '#ef4444'; // red
  return '#8b5cf6'; // purple
};

// Calculate obstacle spawn probability adjustment based on difficulty
export const getObstacleSpawnChance = (difficulty: DifficultyConfig): number => {
  // Base 70% chance, increases with difficulty up to 95%
  return Math.min(0.95, 0.7 + difficulty.level * 0.025);
};

// Calculate number of obstacles to spawn at once based on difficulty
export const getObstacleCount = (difficulty: DifficultyConfig): number => {
  // Start with 1, can increase to 2 at higher difficulties
  if (difficulty.level >= 5 && Math.random() > 0.7) {
    return 2;
  }
  return 1;
};
