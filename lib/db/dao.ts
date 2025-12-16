/**
 * 数据库访问层 (Data Access Object)
 * 
 * 提供类型安全的数据库操作接口
 * 使用 Repository 模式封装数据访问逻辑
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase, transaction } from './connection';
import { TABLE_NAMES, DB_CONFIG } from './schema';
import type {
    PlayerTable,
    VehicleTable,
    GameRecordTable,
    PowerUpStatsTable,
    BossRecordTable,
    LeaderboardTable,
    SlotMachineRecordTable,
} from './schema';
import type {
    VehicleConfig,
    GameStatistics,
    LeaderboardEntry,
    PowerUpStats,
    BossRecord,
} from '@/types/game';

/**
 * 玩家 DAO
 */
export class PlayerDAO {
    /**
     * 创建新玩家
     */
    static create(username: string): PlayerTable {
        const db = getDatabase();
        const now = Date.now();
        const player: PlayerTable = {
            id: uuidv4(),
            username,
            total_coins: 0,
            total_distance: 0,
            games_played: 0,
            high_score: 0,
            created_at: now,
            updated_at: now,
        };

        db.prepare(`
      INSERT INTO ${TABLE_NAMES.PLAYERS} 
      (id, username, total_coins, total_distance, games_played, high_score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            player.id,
            player.username,
            player.total_coins,
            player.total_distance,
            player.games_played,
            player.high_score,
            player.created_at,
            player.updated_at
        );

        return player;
    }

    /**
     * 根据 ID 查询玩家
     */
    static findById(id: string): PlayerTable | null {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.PLAYERS} WHERE id = ?
    `).get(id) as PlayerTable | undefined ?? null;
    }

    /**
     * 根据用户名查询玩家
     */
    static findByUsername(username: string): PlayerTable | null {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.PLAYERS} WHERE username = ?
    `).get(username) as PlayerTable | undefined ?? null;
    }

    /**
     * 更新玩家统计数据
     */
    static updateStats(
        id: string,
        stats: {
            coins?: number;
            distance?: number;
            gamesPlayed?: number;
            highScore?: number;
        }
    ): void {
        const db = getDatabase();
        const updates: string[] = [];
        const values: (number | string)[] = [];

        if (stats.coins !== undefined) {
            updates.push('total_coins = total_coins + ?');
            values.push(stats.coins);
        }
        if (stats.distance !== undefined) {
            updates.push('total_distance = total_distance + ?');
            values.push(stats.distance);
        }
        if (stats.gamesPlayed !== undefined) {
            updates.push('games_played = games_played + ?');
            values.push(stats.gamesPlayed);
        }
        if (stats.highScore !== undefined) {
            updates.push('high_score = MAX(high_score, ?)');
            values.push(stats.highScore);
        }

        if (updates.length === 0) return;

        updates.push('updated_at = ?');
        values.push(Date.now());
        values.push(id);

        db.prepare(`
      UPDATE ${TABLE_NAMES.PLAYERS}
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    }

    /**
     * 获取排行榜（按最高分）
     */
    static getTopPlayers(limit: number = 10): PlayerTable[] {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.PLAYERS}
      ORDER BY high_score DESC
      LIMIT ?
    `).all(limit) as PlayerTable[];
    }
}

/**
 * 车辆 DAO
 */
export class VehicleDAO {
    /**
     * 创建车辆配置
     */
    static create(playerId: string, config: VehicleConfig): VehicleTable {
        const db = getDatabase();
        const now = Date.now();
        const vehicle: VehicleTable = {
            id: uuidv4(),
            player_id: playerId,
            vehicle_id: config.id,
            name: config.name,
            color: config.color,
            engine_level: config.engineLevel,
            tire_level: config.tireLevel,
            is_selected: false,
            created_at: now,
            updated_at: now,
        };

        db.prepare(`
      INSERT INTO ${TABLE_NAMES.VEHICLES}
      (id, player_id, vehicle_id, name, color, engine_level, tire_level, is_selected, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            vehicle.id,
            vehicle.player_id,
            vehicle.vehicle_id,
            vehicle.name,
            vehicle.color,
            vehicle.engine_level,
            vehicle.tire_level,
            vehicle.is_selected ? 1 : 0,
            vehicle.created_at,
            vehicle.updated_at
        );

        return vehicle;
    }

    /**
     * 获取玩家的所有车辆
     */
    static findByPlayerId(playerId: string): VehicleTable[] {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.VEHICLES}
      WHERE player_id = ?
      ORDER BY created_at DESC
    `).all(playerId) as VehicleTable[];
    }

    /**
     * 设置选中的车辆
     */
    static setSelected(playerId: string, vehicleId: string): void {
        const db = getDatabase();
        transaction(() => {
            // 取消所有选中状态
            db.prepare(`
        UPDATE ${TABLE_NAMES.VEHICLES}
        SET is_selected = 0, updated_at = ?
        WHERE player_id = ?
      `).run(Date.now(), playerId);

            // 设置新的选中车辆
            db.prepare(`
        UPDATE ${TABLE_NAMES.VEHICLES}
        SET is_selected = 1, updated_at = ?
        WHERE id = ? AND player_id = ?
      `).run(Date.now(), vehicleId, playerId);
        });
    }

    /**
     * 获取选中的车辆
     */
    static getSelected(playerId: string): VehicleTable | null {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.VEHICLES}
      WHERE player_id = ? AND is_selected = 1
      LIMIT 1
    `).get(playerId) as VehicleTable | undefined ?? null;
    }
}

/**
 * 游戏记录 DAO
 */
export class GameRecordDAO {
    /**
     * 创建游戏记录
     */
    static create(data: {
        playerId: string;
        vehicleId: string;
        distance: number;
        score: number;
        coinsCollected: number;
        heartsRemaining: number;
        maxSpeedReached: number;
        obstaclesDestroyed: number;
        gameDuration: number;
        difficultyLevel: 'easy' | 'medium' | 'hard';
        bossDefeated: boolean;
    }): string {
        const db = getDatabase();
        const id = uuidv4();
        const now = Date.now();

        db.prepare(`
      INSERT INTO ${TABLE_NAMES.GAME_RECORDS}
      (id, player_id, vehicle_id, distance, score, coins_collected, hearts_remaining,
       max_speed_reached, obstacles_destroyed, game_duration, difficulty_level, boss_defeated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.playerId,
            data.vehicleId,
            data.distance,
            data.score,
            data.coinsCollected,
            data.heartsRemaining,
            data.maxSpeedReached,
            data.obstaclesDestroyed,
            data.gameDuration,
            data.difficultyLevel,
            data.bossDefeated ? 1 : 0,
            now
        );

        return id;
    }

    /**
     * 获取玩家的游戏历史
     */
    static findByPlayerId(playerId: string, limit: number = 50): GameRecordTable[] {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.GAME_RECORDS}
      WHERE player_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(playerId, limit) as GameRecordTable[];
    }

    /**
     * 获取玩家的最佳成绩
     */
    static getBestScore(playerId: string): GameRecordTable | null {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.GAME_RECORDS}
      WHERE player_id = ?
      ORDER BY score DESC
      LIMIT 1
    `).get(playerId) as GameRecordTable | undefined ?? null;
    }
}

/**
 * 道具统计 DAO
 */
export class PowerUpStatsDAO {
    /**
     * 批量创建道具统计
     */
    static createBatch(gameRecordId: string, stats: PowerUpStats[]): void {
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO ${TABLE_NAMES.POWER_UP_STATS}
      (id, game_record_id, power_up_type, collected_count, combo_crafted_count)
      VALUES (?, ?, ?, ?, ?)
    `);

        transaction(() => {
            for (const stat of stats) {
                stmt.run(
                    uuidv4(),
                    gameRecordId,
                    stat.type,
                    stat.collected,
                    stat.comboCrafted
                );
            }
        });
    }

    /**
     * 获取游戏的道具统计
     */
    static findByGameRecordId(gameRecordId: string): PowerUpStats[] {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT power_up_type, collected_count, combo_crafted_count
      FROM ${TABLE_NAMES.POWER_UP_STATS}
      WHERE game_record_id = ?
    `).all(gameRecordId) as Array<{
            power_up_type: string;
            collected_count: number;
            combo_crafted_count: number;
        }>;

        return rows.map(row => ({
            type: row.power_up_type as PowerUpStats['type'],
            collected: row.collected_count,
            comboCrafted: row.combo_crafted_count,
        }));
    }
}

/**
 * Boss 记录 DAO
 */
export class BossRecordDAO {
    /**
     * 创建 Boss 记录
     */
    static create(gameRecordId: string, record: BossRecord): void {
        const db = getDatabase();
        db.prepare(`
      INSERT INTO ${TABLE_NAMES.BOSS_RECORDS}
      (id, game_record_id, boss_number, boss_name, boss_shape, boss_color,
       distance_reached, defeated, elapsed_time, power_ups_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            uuidv4(),
            gameRecordId,
            record.bossNumber,
            record.bossName ?? '',
            record.bossShape ?? '',
            record.bossColor ?? '',
            record.distance,
            record.defeated ? 1 : 0,
            record.elapsedTime,
            JSON.stringify(record.powerUpsUsed),
            record.timestamp
        );
    }

    /**
     * 批量创建 Boss 记录
     */
    static createBatch(gameRecordId: string, records: BossRecord[]): void {
        transaction(() => {
            for (const record of records) {
                this.create(gameRecordId, record);
            }
        });
    }

    /**
     * 获取游戏的 Boss 记录
     */
    static findByGameRecordId(gameRecordId: string): BossRecord[] {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT * FROM ${TABLE_NAMES.BOSS_RECORDS}
      WHERE game_record_id = ?
      ORDER BY boss_number ASC
    `).all(gameRecordId) as BossRecordTable[];

        return rows.map(row => ({
            bossNumber: row.boss_number,
            distance: row.distance_reached,
            defeated: Boolean(row.defeated),
            elapsedTime: row.elapsed_time,
            powerUpsUsed: JSON.parse(row.power_ups_used),
            timestamp: row.created_at,
            bossShape: row.boss_shape as BossRecord['bossShape'],
            bossColor: row.boss_color,
            bossName: row.boss_name,
        }));
    }

    /**
     * 获取 Boss 击败统计
     */
    static getDefeatStats(): Array<{ bossNumber: number; defeats: number; attempts: number }> {
        const db = getDatabase();
        return db.prepare(`
      SELECT 
        boss_number,
        SUM(CASE WHEN defeated = 1 THEN 1 ELSE 0 END) as defeats,
        COUNT(*) as attempts
      FROM ${TABLE_NAMES.BOSS_RECORDS}
      GROUP BY boss_number
      ORDER BY boss_number ASC
    `).all() as Array<{ bossNumber: number; defeats: number; attempts: number }>;
    }
}

/**
 * 排行榜 DAO
 */
export class LeaderboardDAO {
    /**
     * 添加排行榜条目
     */
    static create(
        playerId: string,
        gameRecordId: string,
        entry: Omit<LeaderboardEntry, 'id'>
    ): void {
        const db = getDatabase();
        db.prepare(`
      INSERT INTO ${TABLE_NAMES.LEADERBOARD}
      (id, player_id, game_record_id, distance, score, coins, vehicle_config, statistics, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            uuidv4(),
            playerId,
            gameRecordId,
            entry.distance,
            entry.score,
            entry.coins,
            JSON.stringify(entry.vehicleConfig),
            JSON.stringify(entry.statistics),
            entry.timestamp
        );

        // 保持排行榜大小限制
        this.trimLeaderboard();
    }

    /**
     * 获取排行榜（按距离）
     */
    static getByDistance(limit: number = 100): Array<LeaderboardEntry & { username: string }> {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT
        l.*,
        p.username
      FROM ${TABLE_NAMES.LEADERBOARD} l
      JOIN ${TABLE_NAMES.PLAYERS} p ON l.player_id = p.id
      ORDER BY l.distance DESC, l.score DESC
      LIMIT ?
    `).all(limit) as Array<LeaderboardTable & { username: string }>;

        return this.mapToEntriesWithUsername(rows);
    }

    /**
     * 获取排行榜（按分数）
     */
    static getByScore(limit: number = 100): Array<LeaderboardEntry & { username: string }> {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT
        l.*,
        p.username
      FROM ${TABLE_NAMES.LEADERBOARD} l
      JOIN ${TABLE_NAMES.PLAYERS} p ON l.player_id = p.id
      ORDER BY l.score DESC, l.distance DESC
      LIMIT ?
    `).all(limit) as Array<LeaderboardTable & { username: string }>;

        return this.mapToEntriesWithUsername(rows);
    }

    /**
     * 限制排行榜大小
     */
    private static trimLeaderboard(): void {
        const db = getDatabase();
        db.prepare(`
      DELETE FROM ${TABLE_NAMES.LEADERBOARD}
      WHERE id NOT IN (
        SELECT id FROM ${TABLE_NAMES.LEADERBOARD}
        ORDER BY distance DESC
        LIMIT ?
      )
    `).run(DB_CONFIG.MAX_LEADERBOARD_ENTRIES);
    }

    /**
     * 映射数据库行到排行榜条目（包含玩家名称）
     */
    private static mapToEntriesWithUsername(
        rows: Array<LeaderboardTable & { username: string }>
    ): Array<LeaderboardEntry & { username: string }> {
        return rows.map(row => ({
            id: row.id,
            distance: row.distance,
            coins: row.coins,
            score: row.score,
            timestamp: row.created_at,
            vehicleName: JSON.parse(row.vehicle_config).name,
            vehicleConfig: JSON.parse(row.vehicle_config),
            statistics: JSON.parse(row.statistics),
            username: row.username,
        }));
    }

    /**
     * 映射数据库行到排行榜条目（兼容旧版本）
     */
    private static mapToEntries(rows: LeaderboardTable[]): LeaderboardEntry[] {
        return rows.map(row => ({
            id: row.id,
            distance: row.distance,
            coins: row.coins,
            score: row.score,
            timestamp: row.created_at,
            vehicleName: JSON.parse(row.vehicle_config).name,
            vehicleConfig: JSON.parse(row.vehicle_config),
            statistics: JSON.parse(row.statistics),
        }));
    }
}

/**
 * 老虎机记录 DAO
 */
export class SlotMachineDAO {
    /**
     * 创建老虎机记录
     */
    static create(data: {
        playerId: string;
        gameRecordId?: string;
        symbols: string[];
        payout: number;
        poolAmount: number;
        isJackpot: boolean;
    }): void {
        const db = getDatabase();
        db.prepare(`
      INSERT INTO ${TABLE_NAMES.SLOT_MACHINE_RECORDS}
      (id, player_id, game_record_id, symbols, payout, pool_amount, is_jackpot, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            uuidv4(),
            data.playerId,
            data.gameRecordId ?? null,
            JSON.stringify(data.symbols),
            data.payout,
            data.poolAmount,
            data.isJackpot ? 1 : 0,
            Date.now()
        );
    }

    /**
     * 获取玩家的老虎机历史
     */
    static findByPlayerId(playerId: string, limit: number = 50): SlotMachineRecordTable[] {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.SLOT_MACHINE_RECORDS}
      WHERE player_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(playerId, limit) as SlotMachineRecordTable[];
    }

    /**
     * 获取大奖记录
     */
    static getJackpots(limit: number = 20): SlotMachineRecordTable[] {
        const db = getDatabase();
        return db.prepare(`
      SELECT * FROM ${TABLE_NAMES.SLOT_MACHINE_RECORDS}
      WHERE is_jackpot = 1
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as SlotMachineRecordTable[];
    }
}