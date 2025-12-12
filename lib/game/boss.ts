// Boss battle system

import {
    Boss,
    BossAttack,
    BossBattleState,
    BossPhase,
    PowerUpType,
} from '@/types/game';
import { GAME_CONFIG } from './constants';

// Boss配置
export const BOSS_CONFIG = {
    // 每100km出现一次Boss
    spawnInterval: 100000,
    // Boss基础属性
    baseHealth: 1000,
    healthIncrement: 500, // 每次增加500
    width: 120,
    height: 80,
    yPosition: 100, // 固定在顶部
    // 阶段配置
    phases: {
        1: {
            healthPercent: 0.5, // 50%血量
            attackInterval: 3000, // 3秒攻击一次
            powerUpSpawnInterval: 8000, // 8秒刷新一次道具
            powerUpSpawnChance: 0.9, // 90%刷新概率
        },
        2: {
            healthPercent: 0.3, // 30%血量
            attackInterval: 2000, // 2秒攻击一次
            powerUpSpawnInterval: 12000, // 12秒刷新一次道具
            powerUpSpawnChance: 0.6, // 60%刷新概率
        },
        3: {
            healthPercent: 0.2, // 20%血量
            attackInterval: 1000, // 1秒攻击一次
            powerUpSpawnInterval: 20000, // 20秒刷新一次道具
            powerUpSpawnChance: 0.3, // 30%刷新概率
        },
    },
    // Boss外观（赛博朋克风格车辆）
    colors: [
        '#ff006e', // 霓虹粉
        '#00f5ff', // 霓虹蓝
        '#ffbe0b', // 霓虹黄
        '#8338ec', // 霓虹紫
        '#06ffa5', // 霓虹绿
    ],
    names: [
        '赛博暴君',
        '霓虹猎手',
        '量子破坏者',
        '等离子主宰',
        '数据吞噬者',
    ],
};

// 创建初始Boss战状态
export const createBossBattleState = (): BossBattleState => ({
    active: false,
    boss: null,
    attacks: [],
    startTime: 0,
    elapsedTime: 0,
    powerUpSpawnTimer: 0,
    bossDefeated: false,
});

// 检查是否应该触发Boss战
export const shouldTriggerBossBattle = (distance: number): boolean => {
    // 只在100km, 200km, 300km等整数倍时触发
    // 使用小窗口检测避免重复触发
    const kmDistance = Math.floor(distance / 1000);
    const milestoneKm = BOSS_CONFIG.spawnInterval / 1000;

    // 检查是否刚好跨越里程碑（允许100单位的窗口）
    return kmDistance >= milestoneKm &&
        kmDistance % milestoneKm === 0 &&
        distance >= kmDistance * 1000 &&
        distance < kmDistance * 1000 + 100;
};

// 获取Boss编号（第几个Boss）
export const getBossNumber = (distance: number): number => {
    return Math.floor(distance / BOSS_CONFIG.spawnInterval);
};

// 创建Boss
export const createBoss = (distance: number): Boss => {
    const bossNumber = getBossNumber(distance);
    const maxHealth = BOSS_CONFIG.baseHealth + bossNumber * BOSS_CONFIG.healthIncrement;
    const colorIndex = bossNumber % BOSS_CONFIG.colors.length;
    const nameIndex = bossNumber % BOSS_CONFIG.names.length;

    return {
        x: GAME_CONFIG.canvasWidth / 2 - BOSS_CONFIG.width / 2,
        y: BOSS_CONFIG.yPosition,
        width: BOSS_CONFIG.width,
        height: BOSS_CONFIG.height,
        health: maxHealth,
        maxHealth,
        phase: 1,
        lastAttackTime: 0,
        attackPattern: 'machine_gun',
        color: BOSS_CONFIG.colors[colorIndex],
        name: `${BOSS_CONFIG.names[nameIndex]} Lv.${bossNumber + 1}`,
        velocityX: 2, // Boss horizontal movement speed
        direction: 1, // Start moving right
    };
};

// 更新Boss阶段
export const updateBossPhase = (boss: Boss): Boss => {
    const healthPercent = boss.health / boss.maxHealth;
    let newPhase: BossPhase = 1;

    if (healthPercent <= BOSS_CONFIG.phases[3].healthPercent) {
        newPhase = 3;
    } else if (healthPercent <= BOSS_CONFIG.phases[2].healthPercent) {
        newPhase = 2;
    }

    return {
        ...boss,
        phase: newPhase,
    };
};

// 获取当前阶段配置
export const getPhaseConfig = (phase: BossPhase) => {
    return BOSS_CONFIG.phases[phase];
};

// Boss攻击模式
export const createBossAttack = (
    boss: Boss,
    pattern: 'machine_gun' | 'laser' | 'throw_obstacle'
): BossAttack[] => {
    const attacks: BossAttack[] = [];
    const centerX = boss.x + boss.width / 2;
    const bottomY = boss.y + boss.height;

    switch (pattern) {
        case 'machine_gun': {
            // 三发子弹
            for (let i = -1; i <= 1; i++) {
                attacks.push({
                    x: centerX + i * 30 - 3,
                    y: bottomY,
                    width: 6,
                    height: 12,
                    type: 'bullet',
                    speed: 8,
                    active: true,
                    damage: 1,
                });
            }
            break;
        }
        case 'laser': {
            // 激光炮 - 宽激光束
            attacks.push({
                x: centerX - 15,
                y: bottomY,
                width: 30,
                height: GAME_CONFIG.canvasHeight, // 全屏高度
                type: 'laser',
                speed: 0, // 激光不移动
                active: true,
                damage: 1,
            });
            break;
        }
        case 'throw_obstacle': {
            // 投掷障碍车 - 随机3个位置
            const lanes = [100, 200, 300]; // 简化的车道位置
            for (let i = 0; i < 3; i++) {
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                attacks.push({
                    x: lane - 25,
                    y: bottomY,
                    width: 50,
                    height: 80,
                    type: 'obstacle',
                    speed: 5,
                    active: true,
                    damage: 1,
                });
            }
            break;
        }
    }

    return attacks;
};

// 选择Boss攻击模式
export const selectBossAttackPattern = (
    phase: BossPhase
): 'machine_gun' | 'laser' | 'throw_obstacle' => {
    const patterns: ('machine_gun' | 'laser' | 'throw_obstacle')[] = [
        'machine_gun',
        'laser',
        'throw_obstacle',
    ];

    // 阶段越高，越倾向于使用更强的攻击
    if (phase === 3) {
        return patterns[Math.floor(Math.random() * patterns.length)];
    } else if (phase === 2) {
        return Math.random() < 0.7 ? 'machine_gun' : 'throw_obstacle';
    } else {
        return 'machine_gun';
    }
};

// 更新Boss攻击
export const updateBossAttacks = (
    attacks: BossAttack[],
    timeScale: number
): BossAttack[] => {
    return attacks
        .map((attack) => {
            if (attack.type === 'laser') {
                // 激光持续一段时间后消失
                return attack;
            }
            return {
                ...attack,
                y: attack.y + attack.speed * timeScale,
            };
        })
        .filter((attack) => {
            if (attack.type === 'laser') return attack.active;
            return attack.active && attack.y < GAME_CONFIG.canvasHeight + attack.height;
        });
};

// Update boss position (horizontal movement)
export const updateBossPosition = (boss: Boss): Boss => {
    const minX = GAME_CONFIG.roadOffset;
    const maxX = GAME_CONFIG.roadOffset + GAME_CONFIG.roadWidth - boss.width;

    let newX = boss.x + boss.velocityX * boss.direction;
    let newDirection = boss.direction;

    // Bounce at edges
    if (newX <= minX) {
        newX = minX;
        newDirection = 1;
    } else if (newX >= maxX) {
        newX = maxX;
        newDirection = -1;
    }

    return {
        ...boss,
        x: newX,
        direction: newDirection,
    };
};

// Boss受到伤害
export const damageBoss = (boss: Boss, damage: number): Boss => {
    const newHealth = Math.max(0, boss.health - damage);
    return {
        ...boss,
        health: newHealth,
    };
};

// 检查Boss是否被击败
export const isBossDefeated = (boss: Boss): boolean => {
    return boss.health <= 0;
};

// Boss战道具刷新类型（优先级更高的道具）
export const BOSS_POWERUP_TYPES: PowerUpType[] = [
    'heart',
    'machine_gun',
    'invincibility',
    'score_multiplier',
    'speed_boost',
    'coin',
];