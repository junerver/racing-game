// Power-up effect system types - Strategy Pattern Architecture

import { GameState, PowerUpType, Obstacle, PowerUp, ActivePowerUp } from './game';

/**
 * 碰撞结果类型
 */
export interface CollisionResult {
    /** 是否阻止默认碰撞处理 */
    preventDefault: boolean;
    /** 是否摧毁障碍物 */
    destroyObstacle: boolean;
    /** 是否造成伤害 */
    takeDamage: boolean;
    /** 额外金币奖励 */
    coinReward: number;
    /** 是否延长道具持续时间 */
    extendDuration?: number;
    /** 是否标记碰撞（用于金钟罩等） */
    markCollision?: boolean;
    /** 是否破盾 */
    breakShield?: boolean;
}

/**
 * 速度修改器结果
 */
export interface SpeedModifier {
    /** 速度倍率 */
    multiplier: number;
    /** 是否覆盖基础速度计算 */
    override: boolean;
    /** 覆盖时的目标速度倍率（相对于 maxSpeed） */
    targetSpeedMultiplier?: number;
}

/**
 * 道具收集结果
 */
export interface CollectResult {
    /** 是否阻止默认收集处理 */
    preventDefault: boolean;
    /** 金币奖励 */
    coinReward: number;
    /** 生命值变化 */
    heartsChange: number;
    /** 是否添加到老虎机 */
    addToSlotMachine: boolean;
    /** 老虎机金币值 */
    slotMachineCoinValue?: number;
    /** 额外状态更新 */
    stateUpdates?: Partial<Pick<GameState, 'goldenBellCoinValue' | 'goldenBellCollided'>>;
}

/**
 * 道具效果接口 - 策略模式核心
 */
export interface PowerUpEffect {
    /** 道具类型 */
    type: PowerUpType;

    /**
     * 道具激活时调用
     * @param state 当前游戏状态
     * @param activePowerUp 激活的道具信息
     */
    onActivate?(state: GameState, activePowerUp: ActivePowerUp): void;

    /**
     * 每帧更新时调用
     * @param state 当前游戏状态
     * @param deltaTime 帧间隔时间
     * @param currentTime 当前时间戳
     */
    onUpdate?(state: GameState, deltaTime: number, currentTime: number): void;

    /**
     * 道具过期时调用
     * @param state 当前游戏状态
     */
    onExpire?(state: GameState): void;

    /**
     * 修改速度计算
     * @param baseSpeed 基础速度
     * @param maxSpeed 最大速度
     * @param state 当前游戏状态
     * @returns 速度修改器
     */
    modifySpeed?(baseSpeed: number, maxSpeed: number, state: GameState): SpeedModifier;

    /**
     * 处理与障碍物的碰撞
     * @param state 当前游戏状态
     * @param obstacle 碰撞的障碍物
     * @returns 碰撞结果
     */
    onObstacleCollision?(state: GameState, obstacle: Obstacle): CollisionResult;

    /**
     * 是否提供无敌效果
     */
    providesInvincibility?: boolean;

    /**
     * 是否提供碰撞摧毁效果（如钢铁之躯）
     */
    providesCollisionDestroy?: boolean;
}

/**
 * 道具收集处理器接口
 */
export interface PowerUpCollectHandler {
    /** 道具类型 */
    type: PowerUpType;

    /**
     * 处理道具收集
     * @param state 当前游戏状态
     * @param powerUp 收集的道具
     * @param activePowerUps 当前激活的道具列表
     * @returns 收集结果
     */
    onCollect(
        state: GameState,
        powerUp: PowerUp,
        activePowerUps: ActivePowerUp[]
    ): CollectResult;
}

/**
 * 道具效果注册表类型
 */
export type PowerUpEffectRegistry = Partial<Record<PowerUpType, PowerUpEffect>>;

/**
 * 道具收集处理器注册表类型
 */
export type PowerUpCollectHandlerRegistry = Partial<Record<PowerUpType, PowerUpCollectHandler>>;

/**
 * 默认碰撞结果
 */
export const DEFAULT_COLLISION_RESULT: CollisionResult = {
    preventDefault: false,
    destroyObstacle: false,
    takeDamage: true,
    coinReward: 0,
};

/**
 * 默认收集结果
 */
export const DEFAULT_COLLECT_RESULT: CollectResult = {
    preventDefault: false,
    coinReward: 0,
    heartsChange: 0,
    addToSlotMachine: false,
};

/**
 * 创建无敌碰撞结果的辅助函数
 */
export const createInvincibleCollisionResult = (): CollisionResult => ({
    preventDefault: true,
    destroyObstacle: false,
    takeDamage: false,
    coinReward: 0,
});

/**
 * 创建摧毁障碍物碰撞结果的辅助函数
 */
export const createDestroyCollisionResult = (coinReward: number = 10): CollisionResult => ({
    preventDefault: true,
    destroyObstacle: true,
    takeDamage: false,
    coinReward,
});