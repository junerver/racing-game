// Combo power-up system logic

import { PowerUpType, ComboPowerUpType, ActivePowerUp, ActiveComboPowerUp } from '@/types/game';
import { COMBO_POWERUP_CONFIG } from './constants';

// Helper: Check if two power-up types are equivalent (e.g., invincibility and shop_invincibility)
const areEquivalentTypes = (type1: PowerUpType, type2: PowerUpType): boolean => {
  if (type1 === type2) return true;
  if ((type1 === 'invincibility' && type2 === 'shop_invincibility') ||
      (type1 === 'shop_invincibility' && type2 === 'invincibility')) {
    return true;
  }
  return false;
};

// Check if a combo can be formed
export const checkComboMatch = (
  newPowerUpType: PowerUpType,
  activePowerUps: ActivePowerUp[],
  activeShopPowerUps?: import('@/types/game').ActiveShopPowerUp[]
): ComboPowerUpType | null => {
  // Check each combo configuration
  for (const [comboType, config] of Object.entries(COMBO_POWERUP_CONFIG)) {
    const [firstType, secondType] = config.sourceTypes;

    // Check both directions: new matches second OR new matches first
    const newMatchesSecond = areEquivalentTypes(newPowerUpType, secondType);
    const newMatchesFirst = areEquivalentTypes(newPowerUpType, firstType);

    if (newMatchesSecond) {
      // Check if the first type is already active
      const hasFirstType = activePowerUps.some((p) => areEquivalentTypes(p.type, firstType)) ||
        (activeShopPowerUps?.some((p) => areEquivalentTypes(p.type, firstType)) ?? false);
      if (hasFirstType) {
        return comboType as ComboPowerUpType;
      }
    } else if (newMatchesFirst) {
      // Check if the second type is already active
      const hasSecondType = activePowerUps.some((p) => areEquivalentTypes(p.type, secondType)) ||
        (activeShopPowerUps?.some((p) => areEquivalentTypes(p.type, secondType)) ?? false);
      if (hasSecondType) {
        return comboType as ComboPowerUpType;
      }
    }
  }

  return null;
};

// Activate a combo power-up
export const activateComboPowerUp = (
  comboType: ComboPowerUpType,
  currentTime: number
): ActiveComboPowerUp => {
  const config = COMBO_POWERUP_CONFIG[comboType];
  return {
    type: comboType,
    remainingTime: config.duration,
    startTime: currentTime,
    totalDuration: config.duration,
  };
};

// Update active combo power-ups
export const updateActiveComboPowerUps = (
  activeComboPowerUps: ActiveComboPowerUp[],
  deltaTime: number
): ActiveComboPowerUp[] => {
  return activeComboPowerUps
    .map((powerUp) => ({
      ...powerUp,
      remainingTime: powerUp.remainingTime - deltaTime,
    }))
    .filter((powerUp) => powerUp.remainingTime > 0);
};

// Check if a combo power-up is active
export const isComboPowerUpActive = (
  activeComboPowerUps: ActiveComboPowerUp[],
  type: ComboPowerUpType
): boolean => {
  return activeComboPowerUps.some((p) => p.type === type);
};

// Get combo power-up display info
export const getComboPowerUpDisplayInfo = (type: ComboPowerUpType) => {
  return COMBO_POWERUP_CONFIG[type];
};

// Remove source power-ups when combo is formed
export const removeSourcePowerUps = (
  activePowerUps: ActivePowerUp[],
  comboType: ComboPowerUpType
): ActivePowerUp[] => {
  const config = COMBO_POWERUP_CONFIG[comboType];
  const [firstType, secondType] = config.sourceTypes;

  let firstRemoved = false;
  let secondRemoved = false;

  return activePowerUps.filter((powerUp) => {
    if (!firstRemoved && areEquivalentTypes(powerUp.type, firstType)) {
      firstRemoved = true;
      return false;
    }
    if (!secondRemoved && areEquivalentTypes(powerUp.type, secondType)) {
      secondRemoved = true;
      return false;
    }
    return true;
  });
};

// Remove source shop power-ups when combo is formed
export const removeSourceShopPowerUps = (
  activeShopPowerUps: import('@/types/game').ActiveShopPowerUp[],
  comboType: ComboPowerUpType
): import('@/types/game').ActiveShopPowerUp[] => {
  const config = COMBO_POWERUP_CONFIG[comboType];
  const [firstType, secondType] = config.sourceTypes;

  let firstRemoved = false;
  let secondRemoved = false;

  return activeShopPowerUps.filter((powerUp) => {
    if (!firstRemoved && areEquivalentTypes(powerUp.type, firstType)) {
      firstRemoved = true;
      return false;
    }
    if (!secondRemoved && areEquivalentTypes(powerUp.type, secondType)) {
      secondRemoved = true;
      return false;
    }
    return true;
  });
};
