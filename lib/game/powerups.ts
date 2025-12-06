// Power-up system

import { PowerUp, PowerUpType, ActivePowerUp } from '@/types/game';
import { GAME_CONFIG, POWERUP_SIZE, POWERUP_CONFIG, getLanePositions } from './constants';

// Create a new power-up at a random lane
export const createPowerUp = (): PowerUp => {
  const lanes = getLanePositions();
  const laneIndex = Math.floor(Math.random() * lanes.length);
  const types: PowerUpType[] = ['speed_boost', 'invincibility', 'magnet', 'score_multiplier'];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    x: lanes[laneIndex] - POWERUP_SIZE / 2,
    y: -POWERUP_SIZE,
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    type,
    duration: POWERUP_CONFIG[type].duration,
    active: true,
  };
};

// Activate a power-up
export const activatePowerUp = (
  powerUp: PowerUp,
  currentTime: number
): ActivePowerUp => {
  return {
    type: powerUp.type,
    remainingTime: powerUp.duration,
    startTime: currentTime,
  };
};

// Update active power-ups (decrease remaining time)
export const updateActivePowerUps = (
  activePowerUps: ActivePowerUp[],
  deltaTime: number
): ActivePowerUp[] => {
  return activePowerUps
    .map((powerUp) => ({
      ...powerUp,
      remainingTime: powerUp.remainingTime - deltaTime,
    }))
    .filter((powerUp) => powerUp.remainingTime > 0);
};

// Check if a power-up type is currently active
export const isPowerUpActive = (
  activePowerUps: ActivePowerUp[],
  type: PowerUpType
): boolean => {
  return activePowerUps.some((p) => p.type === type);
};

// Get speed multiplier from active power-ups
export const getSpeedMultiplier = (activePowerUps: ActivePowerUp[]): number => {
  if (isPowerUpActive(activePowerUps, 'speed_boost')) {
    return 1.5;
  }
  return 1;
};

// Get score multiplier from active power-ups
export const getScoreMultiplier = (activePowerUps: ActivePowerUp[]): number => {
  if (isPowerUpActive(activePowerUps, 'score_multiplier')) {
    return 2;
  }
  return 1;
};

// Check if player is invincible
export const isInvincible = (activePowerUps: ActivePowerUp[]): boolean => {
  return isPowerUpActive(activePowerUps, 'invincibility');
};

// Get power-up display info
export const getPowerUpDisplayInfo = (type: PowerUpType) => {
  return POWERUP_CONFIG[type];
};

// Update power-up position (move down with game speed)
export const updatePowerUpPosition = (
  powerUp: PowerUp,
  gameSpeed: number
): PowerUp => {
  return {
    ...powerUp,
    y: powerUp.y + gameSpeed,
  };
};
