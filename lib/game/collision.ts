// Collision detection utilities

import { Rectangle, Vehicle, Obstacle, PowerUp } from '@/types/game';

// Check if two rectangles intersect (AABB collision)
export const checkRectCollision = (rect1: Rectangle, rect2: Rectangle): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// Check collision between vehicle and obstacle with some padding for better gameplay
export const checkVehicleObstacleCollision = (
  vehicle: Vehicle,
  obstacle: Obstacle,
  padding: number = 5
): boolean => {
  const paddedVehicle: Rectangle = {
    x: vehicle.x + padding,
    y: vehicle.y + padding,
    width: vehicle.width - padding * 2,
    height: vehicle.height - padding * 2,
  };

  const paddedObstacle: Rectangle = {
    x: obstacle.x + padding,
    y: obstacle.y + padding,
    width: obstacle.width - padding * 2,
    height: obstacle.height - padding * 2,
  };

  return checkRectCollision(paddedVehicle, paddedObstacle);
};

// Check collision between vehicle and power-up
export const checkVehiclePowerUpCollision = (
  vehicle: Vehicle,
  powerUp: PowerUp
): boolean => {
  return checkRectCollision(vehicle, powerUp);
};

// Check if an object is off screen (for cleanup)
export const isOffScreen = (
  rect: Rectangle,
  canvasHeight: number
): boolean => {
  return rect.y > canvasHeight + rect.height;
};

// Check if obstacle has passed the player (for scoring)
export const hasPassedPlayer = (
  obstacle: Obstacle,
  vehicle: Vehicle
): boolean => {
  return obstacle.y > vehicle.y + vehicle.height;
};

// Get collision point for effects (center of overlap)
export const getCollisionPoint = (
  rect1: Rectangle,
  rect2: Rectangle
): { x: number; y: number } | null => {
  if (!checkRectCollision(rect1, rect2)) return null;

  const overlapX = Math.max(
    0,
    Math.min(rect1.x + rect1.width, rect2.x + rect2.width) -
      Math.max(rect1.x, rect2.x)
  );
  const overlapY = Math.max(
    0,
    Math.min(rect1.y + rect1.height, rect2.y + rect2.height) -
      Math.max(rect1.y, rect2.y)
  );

  return {
    x: Math.max(rect1.x, rect2.x) + overlapX / 2,
    y: Math.max(rect1.y, rect2.y) + overlapY / 2,
  };
};
