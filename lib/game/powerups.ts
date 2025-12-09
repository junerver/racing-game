// Simplified power-up system

import { PowerUp, PowerUpType } from '@/types/game';
import { GAME_CONFIG, POWERUP_SIZE, POWERUP_CONFIG, getLanePositions } from './constants';

// Create a new power-up at a random lane
export const createPowerUp = (difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium'): PowerUp => {
  const lanes = getLanePositions();
  const laneIndex = Math.floor(Math.random() * lanes.length);

  // Select from basic power-ups that can spawn on road
  const spawnableTypes: PowerUpType[] = Object.entries(POWERUP_CONFIG)
    .filter(([_, config]) => config.canSpawnOnRoad && config.spawnInterval === 2000)
    .map(([type]) => type as PowerUpType);

  const types: PowerUpType[] = [...spawnableTypes, 'coin', 'coin', 'coin', 'coin', 'coin', 'coin'];
  const type = types[Math.floor(Math.random() * types.length)];

  let value: number | undefined;
  if (type === 'coin') {
    const coinValues = difficultyLevel === 'hard'
      ? [100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
      : difficultyLevel === 'medium'
      ? [100, 100, 100, 100, 100, 200, 200, 200, 200, 200]
      : [100, 100, 100, 100, 100, 200, 200, 200, 500, 500];
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

  // Magnet effect: attract power-ups towards vehicle
  if (magnetActive && vehicleX !== undefined && vehicleY !== undefined) {
    const dx = vehicleX - powerUp.x;
    const dy = vehicleY - powerUp.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

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
