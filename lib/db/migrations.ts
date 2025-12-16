/**
 * 数据库迁移系统
 * 
 * 支持版本化的数据库架构升级和降级
 * 每个迁移包含 up (升级) 和 down (降级) 两个方法
 */

import type { Database } from 'better-sqlite3';
import { TABLE_NAMES, INDEXES, DB_CONFIG } from './schema';

export interface Migration {
    version: number;
    description: string;
    up: (db: Database) => void;
    down: (db: Database) => void;
}

/**
 * 迁移 V1: 初始数据库架构
 */
const migration_v1: Migration = {
    version: 1,
    description: '初始数据库架构 - 创建所有核心表',

    up: (db: Database) => {
        // 创建版本表
        db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.DB_VERSION} (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL,
        description TEXT NOT NULL
      );
    `);

        // 创建玩家表
        db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.PLAYERS} (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        total_coins INTEGER NOT NULL DEFAULT 0,
        total_distance INTEGER NOT NULL DEFAULT 0,
        games_played INTEGER NOT NULL DEFAULT 0,
        high_score INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE INDEX ${INDEXES.PLAYERS_USERNAME} ON ${TABLE_NAMES.PLAYERS}(username);
      CREATE INDEX ${INDEXES.PLAYERS_HIGH_SCORE} ON ${TABLE_NAMES.PLAYERS}(high_score DESC);
    `);

        // 创建车辆配置表
        db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.VEHICLES} (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        vehicle_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        engine_level INTEGER NOT NULL CHECK(engine_level BETWEEN 1 AND 3),
        tire_level INTEGER NOT NULL CHECK(tire_level BETWEEN 1 AND 3),
        is_selected BOOLEAN NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (player_id) REFERENCES ${TABLE_NAMES.PLAYERS}(id) ON DELETE CASCADE
      );
      
      CREATE INDEX ${INDEXES.VEHICLES_PLAYER_ID} ON ${TABLE_NAMES.VEHICLES}(player_id);
      CREATE INDEX ${INDEXES.VEHICLES_IS_SELECTED} ON ${TABLE_NAMES.VEHICLES}(player_id, is_selected);
    `);

        // 创建游戏记录表
        db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.GAME_RECORDS} (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        vehicle_id TEXT NOT NULL,
        distance INTEGER NOT NULL,
        score INTEGER NOT NULL,
        coins_collected INTEGER NOT NULL DEFAULT 0,
        hearts_remaining INTEGER NOT NULL DEFAULT 3,
        max_speed_reached REAL NOT NULL,
        obstacles_destroyed INTEGER NOT NULL DEFAULT 0,
        game_duration INTEGER NOT NULL,
        difficulty_level TEXT NOT NULL CHECK(difficulty_level IN ('easy', 'medium', 'hard')),
        boss_defeated BOOLEAN NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (player_id) REFERENCES ${TABLE_NAMES.PLAYERS}(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES ${TABLE_NAMES.VEHICLES}(id) ON DELETE SET NULL
      );
      
      CREATE INDEX ${INDEXES.GAME_RECORDS_PLAYER_ID} ON ${TABLE_NAMES.GAME_RECORDS}(player_id);
      CREATE INDEX ${INDEXES.GAME_RECORDS_DISTANCE} ON ${TABLE_NAMES.GAME_RECORDS}(distance DESC);
      CREATE INDEX ${INDEXES.GAME_RECORDS_SCORE} ON ${TABLE_NAMES.GAME_RECORDS}(score DESC);
      CREATE INDEX ${INDEXES.GAME_RECORDS_CREATED_AT} ON ${TABLE_NAMES.GAME_RECORDS}(created_at DESC);
    `);

        // 创建道具统计表
        db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.POWER_UP_STATS} (
        id TEXT PRIMARY KEY,
        game_record_id TEXT NOT NULL,
        power_up_type TEXT NOT NULL,
        collected_count INTEGER NOT NULL DEFAULT 0,
        combo_crafted_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (game_record_id) REFERENCES ${TABLE_NAMES.GAME_RECORDS}(id) ON DELETE CASCADE
      );
      
      CREATE INDEX ${INDEXES.POWER_UP_STATS_GAME_ID} ON ${TABLE_NAMES.POWER_UP_STATS}(game_record_id);
    `);

        // 创建 Boss 记录表
        db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.BOSS_RECORDS} (
        id TEXT PRIMARY KEY,
        game_record_id TEXT NOT NULL,
        boss_number INTEGER NOT NULL,
        boss_name TEXT NOT NULL,
        boss_shape TEXT NOT NULL,
        boss_color TEXT NOT NULL,
        distance_reached INTEGER NOT NULL,
        defeated BOOLEAN NOT NULL DEFAULT 0,
        elapsed_time INTEGER NOT NULL,
        power_ups_used TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (game_record_id) REFERENCES ${TABLE_NAMES.GAME_RECORDS}(id) ON DELETE CASCADE
      );
      
      CREATE INDEX ${INDEXES.BOSS_RECORDS_GAME_ID} ON ${TABLE_NAMES.BOSS_RECORDS}(game_record_id);
      CREATE INDEX ${INDEXES.BOSS_RECORDS_DEFEATED} ON ${TABLE_NAMES.BOSS_RECORDS}(defeated, boss_number);
    `);

        // 创建排行榜表
        db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.LEADERBOARD} (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        game_record_id TEXT NOT NULL,
        distance INTEGER NOT NULL,
        score INTEGER NOT NULL,
        coins INTEGER NOT NULL,
        vehicle_config TEXT NOT NULL,
        statistics TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (player_id) REFERENCES ${TABLE_NAMES.PLAYERS}(id) ON DELETE CASCADE,
        FOREIGN KEY (game_record_id) REFERENCES ${TABLE_NAMES.GAME_RECORDS}(id) ON DELETE CASCADE
      );
      
      CREATE INDEX ${INDEXES.LEADERBOARD_DISTANCE} ON ${TABLE_NAMES.LEADERBOARD}(distance DESC);
      CREATE INDEX ${INDEXES.LEADERBOARD_SCORE} ON ${TABLE_NAMES.LEADERBOARD}(score DESC);
      CREATE INDEX ${INDEXES.LEADERBOARD_CREATED_AT} ON ${TABLE_NAMES.LEADERBOARD}(created_at DESC);
    `);

        // 创建老虎机记录表
        db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.SLOT_MACHINE_RECORDS} (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        game_record_id TEXT,
        symbols TEXT NOT NULL,
        payout INTEGER NOT NULL,
        pool_amount INTEGER NOT NULL,
        is_jackpot BOOLEAN NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (player_id) REFERENCES ${TABLE_NAMES.PLAYERS}(id) ON DELETE CASCADE,
        FOREIGN KEY (game_record_id) REFERENCES ${TABLE_NAMES.GAME_RECORDS}(id) ON DELETE SET NULL
      );
      
      CREATE INDEX ${INDEXES.SLOT_MACHINE_PLAYER_ID} ON ${TABLE_NAMES.SLOT_MACHINE_RECORDS}(player_id);
    `);

        // 记录迁移版本
        db.prepare(`
      INSERT INTO ${TABLE_NAMES.DB_VERSION} (version, applied_at, description)
      VALUES (?, ?, ?)
    `).run(1, Date.now(), migration_v1.description);
    },

    down: (db: Database) => {
        // 删除所有表（按依赖顺序倒序删除）
        db.exec(`
      DROP TABLE IF EXISTS ${TABLE_NAMES.SLOT_MACHINE_RECORDS};
      DROP TABLE IF EXISTS ${TABLE_NAMES.LEADERBOARD};
      DROP TABLE IF EXISTS ${TABLE_NAMES.BOSS_RECORDS};
      DROP TABLE IF EXISTS ${TABLE_NAMES.POWER_UP_STATS};
      DROP TABLE IF EXISTS ${TABLE_NAMES.GAME_RECORDS};
      DROP TABLE IF EXISTS ${TABLE_NAMES.VEHICLES};
      DROP TABLE IF EXISTS ${TABLE_NAMES.PLAYERS};
      DROP TABLE IF EXISTS ${TABLE_NAMES.DB_VERSION};
    `);
    },
};

/**
 * 所有迁移的注册表
 * 新增迁移时在此数组末尾添加
 */
export const MIGRATIONS: Migration[] = [
    migration_v1,
    // 未来的迁移在此添加
    // migration_v2,
    // migration_v3,
    // ...
];

/**
 * 获取当前数据库版本
 */
export function getCurrentVersion(db: Database): number {
    try {
        const result = db.prepare(`
      SELECT MAX(version) as version FROM ${TABLE_NAMES.DB_VERSION}
    `).get() as { version: number | null };

        return result?.version ?? 0;
    } catch {
        return 0;
    }
}

/**
 * 运行数据库迁移
 * @param db 数据库实例
 * @param targetVersion 目标版本（默认为最新版本）
 */
export function runMigrations(db: Database, targetVersion?: number): void {
    const currentVersion = getCurrentVersion(db);
    const target = targetVersion ?? DB_CONFIG.CURRENT_VERSION;

    if (currentVersion === target) {
        console.log(`数据库已是最新版本 v${currentVersion}`);
        return;
    }

    if (currentVersion > target) {
        // 降级迁移
        console.log(`开始数据库降级: v${currentVersion} -> v${target}`);
        for (let v = currentVersion; v > target; v--) {
            const migration = MIGRATIONS.find(m => m.version === v);
            if (!migration) {
                throw new Error(`未找到版本 v${v} 的迁移`);
            }

            console.log(`执行降级: v${v} - ${migration.description}`);
            db.transaction(() => {
                migration.down(db);
                db.prepare(`DELETE FROM ${TABLE_NAMES.DB_VERSION} WHERE version = ?`).run(v);
            })();
        }
    } else {
        // 升级迁移
        console.log(`开始数据库升级: v${currentVersion} -> v${target}`);
        for (let v = currentVersion + 1; v <= target; v++) {
            const migration = MIGRATIONS.find(m => m.version === v);
            if (!migration) {
                throw new Error(`未找到版本 v${v} 的迁移`);
            }

            console.log(`执行升级: v${v} - ${migration.description}`);
            db.transaction(() => {
                migration.up(db);
            })();
        }
    }

    console.log(`数据库迁移完成: v${target}`);
}

/**
 * 重置数据库到初始状态
 * 警告：此操作将删除所有数据！
 */
export function resetDatabase(db: Database): void {
    console.warn('警告: 正在重置数据库，所有数据将被删除！');

    const currentVersion = getCurrentVersion(db);

    // 降级到版本 0
    runMigrations(db, 0);

    // 再升级到当前版本
    runMigrations(db, DB_CONFIG.CURRENT_VERSION);

    console.log('数据库已重置');
}