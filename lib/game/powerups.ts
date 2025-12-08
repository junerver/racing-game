// Power-up system

import { PowerUp, PowerUpType, ActivePowerUp } from '@/types/game';
import { GAME_CONFIG, POWERUP_SIZE, POWERUP_CONFIG, getLanePositions } from './constants';

// Create a new power-up at a random lane (basic power-ups only)
export const createPowerUp = (): PowerUp => {
  const lanes = getLanePositions();
  const laneIndex = Math.floor(Math.random() * lanes.length);
  const types: PowerUpType[] = ['speed_boost', 'invincibility', 'magnet', 'score_multiplier', 'coin', 'coin', 'coin', 'coin', 'coin', 'coin'];
  const type = types[Math.floor(Math.random() * types.length)];

  let value: number | undefined;
  if (type === 'coin') {
    const coinValues = [100, 100, 100, 100, 100, 200, 200, 200, 500, 500];
    value = coinValues[Math.floor(Math.random() * coinValues.length)];
  }

  return {
    x: lanes[laneIndex] - POWERUP_SIZE / 2,
    y: -POWERUP_SIZE,
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    type,
    duration: POWERUP_CONFIG[type].duration,
    active: true,
    value,
  };
};

// Activate a power-up
export const activatePowerUp = (
  powerUp: PowerUp,
  currentTime: number,
  durationMultiplier: number = 1.0
): ActivePowerUp => {
  return {
    type: powerUp.type,
    remainingTime: powerUp.duration * durationMultiplier,
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
  gameSpeed: number,
  vehicleX?: number,
  vehicleY?: number,
  magnetActive?: boolean
): PowerUp => {
  let newX = powerUp.x;
  let newY = powerUp.y + gameSpeed;

  // Magnet effect: attract power-ups towards vehicle (global range)
  if (magnetActive && vehicleX !== undefined && vehicleY !== undefined) {
    const dx = vehicleX - powerUp.x;
    const dy = vehicleY - powerUp.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Attract all power-ups on screen
    if (distance > 0) {
      const attractionStrength = 0.15;
      newX += dx * attractionStrength;
      newY += dy * attractionStrength;
    }
  }

  return {
    ...powerUp,
    x: newX,
    y: newY,
  };
};

// Shop power-up functions
import { ShopPowerUpType, ActiveShopPowerUp } from '@/types/game';
import { SHOP_POWERUP_CONFIG } from './constants';

export const activateShopPowerUp = (
  type: ShopPowerUpType,
  currentTime: number
): ActiveShopPowerUp => {
  return {
    type,
    remainingTime: SHOP_POWERUP_CONFIG[type].duration,
    startTime: currentTime,
  };
};

export const updateActiveShopPowerUps = (
  activeShopPowerUps: ActiveShopPowerUp[],
  deltaTime: number
): ActiveShopPowerUp[] => {
  return activeShopPowerUps
    .map((powerUp) => ({
      ...powerUp,
      remainingTime: powerUp.remainingTime - deltaTime,
    }))
    .filter((powerUp) => powerUp.remainingTime > 0);
};

export const isShopPowerUpActive = (
  activeShopPowerUps: ActiveShopPowerUp[],
  type: ShopPowerUpType
): boolean => {
  return activeShopPowerUps.some((p) => p.type === type);
};
