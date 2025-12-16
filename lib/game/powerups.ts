// Simplified power-up system

import { PowerUp, PowerUpType } from '@/types/game';
import { POWERUP_SIZE, POWERUP_CONFIG, getLanePositions } from './constants';

// Create a new power-up at a random lane
export const createPowerUp = (difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium'): PowerUp => {
  const lanes = getLanePositions();
  const laneIndex = Math.floor(Math.random() * lanes.length);

  // Select from basic power-ups that can spawn on road
  const spawnableTypes: PowerUpType[] = Object.entries(POWERUP_CONFIG)
    .filter(([, config]) => config.canSpawnOnRoad && config.spawnInterval === 2000)
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
  magnetActive?: boolean,
  superMagnetActive?: boolean
): PowerUp => {
  let newX = powerUp.x;
  let newY = powerUp.y + gameSpeed;

  // Magnet effect: attract power-ups towards vehicle center
  if ((magnetActive || superMagnetActive) && vehicleX !== undefined && vehicleY !== undefined) {
    // Calculate distance from power-up center to vehicle center
    const powerUpCenterX = powerUp.x + powerUp.width / 2;
    const powerUpCenterY = powerUp.y + powerUp.height / 2;
    const dx = vehicleX - powerUpCenterX;
    const dy = vehicleY - powerUpCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Super magnet has full screen range (unlimited), normal magnet has 300px range
    const inRange = superMagnetActive || distance < 300;

    if (distance > 0 && inRange) {
      // Super magnet has stronger attraction than normal magnet
      const baseStrength = superMagnetActive ? 0.5 : 0.25;
      const closeBoost = distance < 100 ? (superMagnetActive ? 0.3 : 0.15) : 0;
      const attractionStrength = baseStrength + closeBoost;
      
      // Apply attraction force
      newX += dx * attractionStrength;
      newY += dy * attractionStrength;
      
      // If very close, snap to vehicle center
      const snapDistance = superMagnetActive ? 50 : 30;
      if (distance < snapDistance) {
        newX = vehicleX - powerUp.width / 2;
        newY = vehicleY - powerUp.height / 2;
      }
    }
  }

  return {
    ...powerUp,
    x: newX,
    y: newY,
  };
};
