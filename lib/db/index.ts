/**
 * 数据库模块统一导出
 *
 * 提供数据库系统的单一入口点
 */

// 初始化
export { ensureDatabase } from './init';

// 连接管理
export {
    initDatabase,
    getDatabase,
    closeDatabase,
    transaction,
    healthCheck,
    backupDatabase,
    optimizeDatabase,
} from './connection';

// 数据访问对象
export {
    PlayerDAO,
    VehicleDAO,
    GameRecordDAO,
    PowerUpStatsDAO,
    BossRecordDAO,
    LeaderboardDAO,
    SlotMachineDAO,
} from './dao';

// 数据库架构
export {
    TABLE_NAMES,
    INDEXES,
    DB_CONFIG,
} from './schema';

export type {
    DbVersionTable,
    PlayerTable,
    VehicleTable,
    GameRecordTable,
    PowerUpStatsTable,
    BossRecordTable,
    LeaderboardTable,
    SlotMachineRecordTable,
} from './schema';

// 迁移系统
export {
    MIGRATIONS,
    getCurrentVersion,
    runMigrations,
    resetDatabase,
} from './migrations';

export type { Migration } from './migrations';

// 工具函数
export {
    tableExists,
    getTableRowCount,
    getDatabaseStats,
    truncateTable,
    createBackup,
    formatBytes,
    isValidUUID,
    buildWhereClause,
    paginate,
    safeJsonParse,
    batchInsert,
    exportTableToJson,
    importTableFromJson,
    cleanupDatabase,
} from './utils';

export type {
    PaginationParams,
    PaginationResult,
} from './utils';
