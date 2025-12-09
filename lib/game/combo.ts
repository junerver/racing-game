// Simplified combo power-up system logic

import { PowerUpType, ActivePowerUp } from '@/types/game';
import { POWERUP_CONFIG } from './constants';

// Check if a combo can be formed with the last active power-up
export const checkComboMatch = (
  newPowerUpType: PowerUpType,
  activePowerUps: ActivePowerUp[]
): PowerUpType | null => {
  if (activePowerUps.length === 0) return null;

  // Get the last active power-up
  const lastPowerUp = activePowerUps[activePowerUps.length - 1];

  // Check all combo power-ups
  for (const [comboType, config] of Object.entries(POWERUP_CONFIG)) {
    if (!config.isCombo || !config.comboSources) continue;

    const [first, second] = config.comboSources;

    // Check both directions
    if ((lastPowerUp.type === first && newPowerUpType === second) ||
        (lastPowerUp.type === second && newPowerUpType === first)) {
      return comboType as PowerUpType;
    }
  }

  return null;
};

// Activate a combo power-up
export const activateComboPowerUp = (
  comboType: PowerUpType,
  currentTime: number
): ActivePowerUp => {
  const config = POWERUP_CONFIG[comboType];
  return {
    type: comboType,
    remainingTime: config.duration,
    startTime: currentTime,
    totalDuration: config.duration,
  };
};

// Update active power-ups
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
