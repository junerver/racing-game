/**
 * 数据库表结构定义
 * 
 * 设计原则：
 * 1. 使用版本化迁移系统，支持数据库升级
 * 2. 所有时间戳使用 Unix timestamp (毫秒)
 * 3. 使用外键约束保证数据完整性
 * 4. 合理使用索引优化查询性能
 * 5. JSON 字段存储复杂数据结构
 */

import type {
    VehicleConfig,
    GameStatistics,
    PowerUpType,
    BossShape,
} from '@/types/game';

/**
 * 数据库版本信息表
 * 用于跟踪数据库迁移状态
 */
export interface DbVersionTable {
    version: number; // 当前数据库版本号
    applied_at: number; // 应用时间戳
    description: string; // 版本描述
}

/**
 * 玩家表
 * 存储玩家基本信息
 */
export interface PlayerTable {
    id: string; // UUID，主键
    username: string; // 用户名
    total_coins: number; // 总金币数
    total_distance: number; // 总行驶距离
    games_played: number; // 游戏次数
    high_score: number; // 最高分数
    created_at: number; // 创建时间
    updated_at: number; // 更新时间
}

/**
 * 车辆配置表
 * 存储玩家的车辆配置
 */
export interface VehicleTable {
    id: string; // UUID，主键
    player_id: string; // 玩家 ID，外键
    vehicle_id: string; // 车辆类型 ID
    name: string; // 车辆名称
    color: string; // 车辆颜色
    engine_level: number; // 引擎等级 (1-3)
    tire_level: number; // 轮胎等级 (1-3)
    is_selected: boolean; // 是否当前选中
    created_at: number; // 创建时间
    updated_at: number; // 更新时间
}

/**
 * 游戏记录表
 * 存储每局游戏的核心数据
 */
export interface GameRecordTable {
    id: string; // UUID，主键
    player_id: string; // 玩家 ID，外键
    vehicle_id: string; // 车辆 ID，外键
    distance: number; // 行驶距离
    score: number; // 游戏分数
    coins_collected: number; // 收集的金币数
    hearts_remaining: number; // 剩余生命值
    max_speed_reached: number; // 达到的最高速度
    obstacles_destroyed: number; // 摧毁的障碍物数量
    game_duration: number; // 游戏时长（毫秒）
    difficulty_level: string; // 难度等级 (easy/medium/hard)
    boss_defeated: boolean; // 是否击败 Boss
    created_at: number; // 游戏时间戳
}

/**
 * 道具统计表
 * 存储每局游戏中道具的使用情况
 */
export interface PowerUpStatsTable {
    id: string; // UUID，主键
    game_record_id: string; // 游戏记录 ID，外键
    power_up_type: PowerUpType; // 道具类型
    collected_count: number; // 收集次数
    combo_crafted_count: number; // 合成次数
}

/**
 * Boss 战斗记录表
 * 存储 Boss 战斗的详细信息
 */
export interface BossRecordTable {
    id: string; // UUID，主键
    game_record_id: string; // 游戏记录 ID，外键
    boss_number: number; // Boss 编号
    boss_name: string; // Boss 名称
    boss_shape: BossShape; // Boss 形态
    boss_color: string; // Boss 颜色
    distance_reached: number; // 到达 Boss 时的距离
    defeated: boolean; // 是否击败
    elapsed_time: number; // 战斗时长（毫秒）
    power_ups_used: string; // 使用的道具列表（JSON 数组）
    created_at: number; // 记录时间
}

/**
 * 排行榜表
 * 存储全局排行榜数据
 */
export interface LeaderboardTable {
    id: string; // UUID，主键
    player_id: string; // 玩家 ID，外键
    game_record_id: string; // 游戏记录 ID，外键
    distance: number; // 行驶距离
    score: number; // 游戏分数
    coins: number; // 金币数
    vehicle_config: string; // 车辆配置（JSON）
    statistics: string; // 游戏统计（JSON）
    created_at: number; // 上榜时间
}

/**
 * 老虎机记录表
 * 存储老虎机游戏记录
 */
export interface SlotMachineRecordTable {
    id: string; // UUID，主键
    player_id: string; // 玩家 ID，外键
    game_record_id: string; // 游戏记录 ID，外键（可选）
    symbols: string; // 旋转结果（JSON 数组）
    payout: number; // 奖励金额
    pool_amount: number; // 奖池金额
    is_jackpot: boolean; // 是否大奖
    created_at: number; // 记录时间
}

/**
 * 数据库表名常量
 */
export const TABLE_NAMES = {
    DB_VERSION: 'db_version',
    PLAYERS: 'players',
    VEHICLES: 'vehicles',
    GAME_RECORDS: 'game_records',
    POWER_UP_STATS: 'power_up_stats',
    BOSS_RECORDS: 'boss_records',
    LEADERBOARD: 'leaderboard',
    SLOT_MACHINE_RECORDS: 'slot_machine_records',
} as const;

/**
 * 创建索引的配置
 */
export const INDEXES = {
    // 玩家表索引
    PLAYERS_USERNAME: 'idx_players_username',
    PLAYERS_HIGH_SCORE: 'idx_players_high_score',

    // 车辆表索引
    VEHICLES_PLAYER_ID: 'idx_vehicles_player_id',
    VEHICLES_IS_SELECTED: 'idx_vehicles_is_selected',

    // 游戏记录表索引
    GAME_RECORDS_PLAYER_ID: 'idx_game_records_player_id',
    GAME_RECORDS_DISTANCE: 'idx_game_records_distance',
    GAME_RECORDS_SCORE: 'idx_game_records_score',
    GAME_RECORDS_CREATED_AT: 'idx_game_records_created_at',

    // 道具统计表索引
    POWER_UP_STATS_GAME_ID: 'idx_power_up_stats_game_id',

    // Boss 记录表索引
    BOSS_RECORDS_GAME_ID: 'idx_boss_records_game_id',
    BOSS_RECORDS_DEFEATED: 'idx_boss_records_defeated',

    // 排行榜索引
    LEADERBOARD_DISTANCE: 'idx_leaderboard_distance',
    LEADERBOARD_SCORE: 'idx_leaderboard_score',
    LEADERBOARD_CREATED_AT: 'idx_leaderboard_created_at',

    // 老虎机记录索引
    SLOT_MACHINE_PLAYER_ID: 'idx_slot_machine_player_id',
} as const;

/**
 * 数据库配置
 */
export const DB_CONFIG = {
    DATABASE_NAME: 'racing_game.db',
    CURRENT_VERSION: 1,
    MAX_LEADERBOARD_ENTRIES: 100,
    TRANSACTION_TIMEOUT: 5000, // 5 秒
} as const;