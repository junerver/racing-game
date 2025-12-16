// Power-up system with weight-based spawning
// 道具系统 - 使用权重配置进行生成

import { PowerUp, PowerUpType, DifficultyLevel } from '@/types/game';
import {
  POWERUP_SIZE,
  POWERUP_CONFIG,
  getLanePositions,
  BASIC_POWERUP_SPAWN_WEIGHTS,
  COIN_VALUE_WEIGHTS,
  selectByWeight,
} from './constants';

/**
 * 创建基础道具（使用权重配置）
 * @param difficultyLevel 难度等级
 * @returns 新创建的道具
 */
export const createPowerUp = (difficultyLevel: DifficultyLevel = 'medium'): PowerUp => {
  const lanes = getLanePositions();
  const laneIndex = Math.floor(Math.random() * lanes.length);

  // 使用权重配置选择道具类型
  const selectedWeight = selectByWeight(BASIC_POWERUP_SPAWN_WEIGHTS);
  const type = selectedWeight.type;

  // 如果是金币，使用权重配置选择金币面额
  let value: number | undefined;
  if (type === 'coin') {
    const coinWeights = COIN_VALUE_WEIGHTS[difficultyLevel];
    const selectedCoin = selectByWeight(coinWeights);
    value = selectedCoin.value;
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

/**
 * 获取可生成的基础道具类型列表
 * @returns 道具类型数组
 */
export const getSpawnablePowerUpTypes = (): PowerUpType[] => {
  return BASIC_POWERUP_SPAWN_WEIGHTS.map(w => w.type);
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
