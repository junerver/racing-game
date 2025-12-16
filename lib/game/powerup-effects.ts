// Power-up effect handlers - Strategy Pattern Implementation
// 道具效果处理器 - 策略模式实现

import {
    PowerUpEffect,
    PowerUpEffectRegistry,
    CollisionResult,
    createInvincibleCollisionResult,
    createDestroyCollisionResult,
} from '@/types/powerup-effects';
import { GameState, ActivePowerUp, PowerUpType } from '@/types/game';
import { MACHINE_GUN_COIN_REWARD } from './constants';

// ============================================================================
// 速度类道具效果
// ============================================================================

const speedBoostEffect: PowerUpEffect = {
    type: 'speed_boost',
    modifySpeed: () => ({
        multiplier: 1.5,
        override: false,
    }),
};

const hyperSpeedEffect: PowerUpEffect = {
    type: 'hyper_speed',
    modifySpeed: () => ({
        multiplier: 3,
        override: false,
    }),
};

const nitroBoostEffect: PowerUpEffect = {
    type: 'nitro_boost',
    modifySpeed: () => ({
        multiplier: 1,
        override: true,
        targetSpeedMultiplier: 1, // maxSpeed * 1
    }),
};

const rocketFuelEffect: PowerUpEffect = {
    type: 'rocket_fuel',
    modifySpeed: () => ({
        multiplier: 1,
        override: true,
        targetSpeedMultiplier: 2, // maxSpeed * 2
    }),
};

const turboOverloadEffect: PowerUpEffect = {
    type: 'turbo_overload',
    providesInvincibility: true,
    modifySpeed: () => ({
        multiplier: 1,
        override: true,
        targetSpeedMultiplier: 3, // maxSpeed * 3
    }),
    onObstacleCollision: () => createInvincibleCollisionResult(),
};

const supernovaBurstEffect: PowerUpEffect = {
    type: 'supernova_burst',
    providesInvincibility: true,
    modifySpeed: () => ({
        multiplier: 1,
        override: true,
        targetSpeedMultiplier: 4, // maxSpeed * 4
    }),
    onObstacleCollision: () => createInvincibleCollisionResult(),
    // 火焰轨迹效果在 onUpdate 中处理（摧毁身后障碍物）
    onUpdate: (state) => {
        if (!state.vehicle) return;

        // 摧毁车辆身后的障碍物
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
            const obstacle = state.obstacles[i];
            if (obstacle.y > state.vehicle.y + state.vehicle.height) {
                state.obstacles.splice(i, 1);
                state.destroyedObstacleCount++;
                state.statistics.totalObstaclesDestroyed = state.destroyedObstacleCount;
                state.coins = Math.min(state.coins + MACHINE_GUN_COIN_REWARD, 9999);
                state.statistics.totalCoinsCollected += MACHINE_GUN_COIN_REWARD;
            }
        }
    },
};

// ============================================================================
// 无敌类道具效果
// ============================================================================

const invincibilityEffect: PowerUpEffect = {
    type: 'invincibility',
    providesInvincibility: true,
    onObstacleCollision: () => createInvincibleCollisionResult(),
};

const timeDilationEffect: PowerUpEffect = {
    type: 'time_dilation',
    providesInvincibility: true,
    onObstacleCollision: () => createInvincibleCollisionResult(),
};

const rotatingShieldGunEffect: PowerUpEffect = {
    type: 'rotating_shield_gun',
    providesInvincibility: true,
    onObstacleCollision: () => createInvincibleCollisionResult(),
};

// ============================================================================
// 碰撞摧毁类道具效果
// ============================================================================

const ironBodyEffect: PowerUpEffect = {
    type: 'iron_body',
    providesCollisionDestroy: true,
    onObstacleCollision: () => createDestroyCollisionResult(MACHINE_GUN_COIN_REWARD),
};

const invincibleFireWheelEffect: PowerUpEffect = {
    type: 'invincible_fire_wheel',
    providesCollisionDestroy: true,
    onObstacleCollision: () => ({
        preventDefault: true,
        destroyObstacle: true,
        takeDamage: false,
        coinReward: MACHINE_GUN_COIN_REWARD,
        extendDuration: 250, // 延长 0.25 秒
    }),
};

// ============================================================================
// 金钟罩效果（特殊无敌）
// ============================================================================

const goldenBellEffect: PowerUpEffect = {
    type: 'golden_bell',
    providesInvincibility: true,
    onObstacleCollision: () => ({
        preventDefault: true,
        destroyObstacle: false,
        takeDamage: false,
        coinReward: 0,
        markCollision: true,
        breakShield: true,
    }),
    onExpire: (state) => {
        // 如果没有碰撞，双倍返还金币
        if (!state.goldenBellCollided && state.goldenBellCoinValue > 0) {
            const reward = state.goldenBellCoinValue * 2;
            state.coins = Math.min(state.coins + reward, 9999);
        }
        // 重置状态
        state.goldenBellCollided = false;
        state.goldenBellShieldBroken = false;
        state.goldenBellCoinValue = 0;
    },
};

// ============================================================================
// 攻击类道具效果
// ============================================================================

const machineGunEffect: PowerUpEffect = {
    type: 'machine_gun',
    // 子弹生成逻辑保留在引擎中，因为需要访问 bullets 数组
};

const quadMachineGunEffect: PowerUpEffect = {
    type: 'quad_machine_gun',
    // 四弹道机枪，子弹生成逻辑保留在引擎中
};

const deathStarBeamEffect: PowerUpEffect = {
    type: 'death_star_beam',
    // 死星射击效果在 onUpdate 中处理
    onUpdate: (state) => {
        if (!state.vehicle) return;

        // 摧毁车辆前方的所有障碍物
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
            const obstacle = state.obstacles[i];
            if (obstacle.y < state.vehicle.y) {
                state.obstacles.splice(i, 1);
                state.destroyedObstacleCount++;
                state.statistics.totalObstaclesDestroyed = state.destroyedObstacleCount;
                state.coins = Math.min(state.coins + MACHINE_GUN_COIN_REWARD, 9999);
                state.statistics.totalCoinsCollected += MACHINE_GUN_COIN_REWARD;
            }
        }
    },
};

const stormLightningEffect: PowerUpEffect = {
    type: 'storm_lightning',
    // 风暴闪电效果需要特殊的定时器逻辑，保留在引擎中
    // 但提供 onUpdate 钩子用于未来扩展
};

// ============================================================================
// 辅助类道具效果
// ============================================================================

const magnetEffect: PowerUpEffect = {
    type: 'magnet',
    // 磁铁效果在 updatePowerUpPosition 中处理
};

const superMagnetEffect: PowerUpEffect = {
    type: 'super_magnet',
    // 超级磁铁效果在 updatePowerUpPosition 中处理
};

const scoreMultiplierEffect: PowerUpEffect = {
    type: 'score_multiplier',
    // 分数倍增效果在分数计算中处理
};

// ============================================================================
// 道具效果注册表
// ============================================================================

export const POWERUP_EFFECTS: PowerUpEffectRegistry = {
    // 速度类
    speed_boost: speedBoostEffect,
    hyper_speed: hyperSpeedEffect,
    nitro_boost: nitroBoostEffect,
    rocket_fuel: rocketFuelEffect,
    turbo_overload: turboOverloadEffect,
    supernova_burst: supernovaBurstEffect,

    // 无敌类
    invincibility: invincibilityEffect,
    time_dilation: timeDilationEffect,
    rotating_shield_gun: rotatingShieldGunEffect,

    // 碰撞摧毁类
    iron_body: ironBodyEffect,
    invincible_fire_wheel: invincibleFireWheelEffect,

    // 特殊无敌
    golden_bell: goldenBellEffect,

    // 攻击类
    machine_gun: machineGunEffect,
    quad_machine_gun: quadMachineGunEffect,
    death_star_beam: deathStarBeamEffect,
    storm_lightning: stormLightningEffect,

    // 辅助类
    magnet: magnetEffect,
    super_magnet: superMagnetEffect,
    score_multiplier: scoreMultiplierEffect,
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 获取道具效果
 */
export const getPowerUpEffect = (type: PowerUpType): PowerUpEffect | undefined => {
    return POWERUP_EFFECTS[type];
};

/**
 * 检查道具是否提供无敌效果
 */
export const providesInvincibility = (type: PowerUpType): boolean => {
    const effect = POWERUP_EFFECTS[type];
    return effect?.providesInvincibility ?? false;
};

/**
 * 检查道具是否提供碰撞摧毁效果
 */
export const providesCollisionDestroy = (type: PowerUpType): boolean => {
    const effect = POWERUP_EFFECTS[type];
    return effect?.providesCollisionDestroy ?? false;
};

/**
 * 检查激活的道具中是否有任何提供无敌效果的
 */
export const hasAnyInvincibility = (activePowerUps: ActivePowerUp[]): boolean => {
    return activePowerUps.some(p => providesInvincibility(p.type));
};

/**
 * 检查激活的道具中是否有任何提供碰撞摧毁效果的
 */
export const hasAnyCollisionDestroy = (activePowerUps: ActivePowerUp[]): boolean => {
    return activePowerUps.some(p => providesCollisionDestroy(p.type));
};

/**
 * 计算所有激活道具的速度修改
 * 返回最终的速度修改器（优先级：override > multiplier）
 */
export const calculateSpeedModifier = (
    activePowerUps: ActivePowerUp[],
    baseSpeed: number,
    maxSpeed: number,
    state: GameState
): { finalSpeed: number; hasOverride: boolean } => {
    let hasOverride = false;
    let overrideMultiplier = 1;
    let totalMultiplier = 1;

    for (const activePowerUp of activePowerUps) {
        const effect = POWERUP_EFFECTS[activePowerUp.type];
        if (!effect?.modifySpeed) continue;

        const modifier = effect.modifySpeed(baseSpeed, maxSpeed, state);

        if (modifier.override && modifier.targetSpeedMultiplier !== undefined) {
            hasOverride = true;
            // 取最高的 override 倍率
            if (modifier.targetSpeedMultiplier > overrideMultiplier) {
                overrideMultiplier = modifier.targetSpeedMultiplier;
            }
        } else {
            // 累积非 override 的倍率
            totalMultiplier *= modifier.multiplier;
        }
    }

    if (hasOverride) {
        return {
            finalSpeed: maxSpeed * overrideMultiplier,
            hasOverride: true,
        };
    }

    return {
        finalSpeed: baseSpeed * totalMultiplier,
        hasOverride: false,
    };
};

/**
 * 处理障碍物碰撞
 * 返回合并后的碰撞结果
 */
export const handleObstacleCollision = (
    activePowerUps: ActivePowerUp[],
    state: GameState,
    obstacle: import('@/types/game').Obstacle
): CollisionResult => {
    // 默认结果：受到伤害
    const result: CollisionResult = {
        preventDefault: false,
        destroyObstacle: false,
        takeDamage: true,
        coinReward: 0,
    };

    for (const activePowerUp of activePowerUps) {
        const effect = POWERUP_EFFECTS[activePowerUp.type];
        if (!effect?.onObstacleCollision) continue;

        const effectResult = effect.onObstacleCollision(state, obstacle);

        // 合并结果（任何道具阻止伤害则不受伤害）
        if (effectResult.preventDefault) {
            result.preventDefault = true;
            result.takeDamage = false;
        }

        // 任何道具摧毁障碍物则摧毁
        if (effectResult.destroyObstacle) {
            result.destroyObstacle = true;
        }

        // 累加金币奖励
        result.coinReward += effectResult.coinReward;

        // 处理特殊效果
        if (effectResult.extendDuration !== undefined) {
            result.extendDuration = effectResult.extendDuration;
        }
        if (effectResult.markCollision) {
            result.markCollision = true;
        }
        if (effectResult.breakShield) {
            result.breakShield = true;
        }
    }

    return result;
};

/**
 * 执行所有激活道具的 onUpdate 回调
 */
export const executeOnUpdate = (
    activePowerUps: ActivePowerUp[],
    state: GameState,
    deltaTime: number,
    currentTime: number
): void => {
    for (const activePowerUp of activePowerUps) {
        const effect = POWERUP_EFFECTS[activePowerUp.type];
        if (effect?.onUpdate) {
            effect.onUpdate(state, deltaTime, currentTime);
        }
    }
};

/**
 * 执行道具过期回调
 */
export const executeOnExpire = (
    expiredType: PowerUpType,
    state: GameState
): void => {
    const effect = POWERUP_EFFECTS[expiredType];
    if (effect?.onExpire) {
        effect.onExpire(state);
    }
};

/**
 * 获取所有提供无敌效果的道具类型列表
 */
export const getInvincibilityPowerUpTypes = (): PowerUpType[] => {
    return Object.entries(POWERUP_EFFECTS)
        .filter(([, effect]) => effect?.providesInvincibility)
        .map(([type]) => type as PowerUpType);
};

/**
 * 获取所有提供碰撞摧毁效果的道具类型列表
 */
export const getCollisionDestroyPowerUpTypes = (): PowerUpType[] => {
    return Object.entries(POWERUP_EFFECTS)
        .filter(([, effect]) => effect?.providesCollisionDestroy)
        .map(([type]) => type as PowerUpType);
};