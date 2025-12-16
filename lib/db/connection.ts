/**
 * 数据库连接管理器
 * 
 * 提供单例模式的数据库连接，确保整个应用只有一个数据库实例
 * 支持连接池和自动迁移
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DB_CONFIG } from './schema';
import { runMigrations, getCurrentVersion } from './migrations';

let dbInstance: Database.Database | null = null;

/**
 * 数据库连接选项
 */
export interface DatabaseOptions {
    filename?: string;
    memory?: boolean;
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
}

/**
 * 获取数据库文件路径
 */
function getDatabasePath(): string {
    // 在生产环境中，数据库存储在项目根目录的 data 文件夹
    const dataDir = path.join(process.cwd(), 'data');

    // 确保 data 目录存在
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    return path.join(dataDir, DB_CONFIG.DATABASE_NAME);
}

/**
 * 初始化数据库连接
 */
export function initDatabase(options?: DatabaseOptions): Database.Database {
    if (dbInstance) {
        return dbInstance;
    }

    const dbPath = options?.memory ? ':memory:' : (options?.filename ?? getDatabasePath());

    console.log(`初始化数据库: ${dbPath}`);

    // 创建数据库连接
    dbInstance = new Database(dbPath, {
        readonly: options?.readonly ?? false,
        fileMustExist: options?.fileMustExist ?? false,
        timeout: options?.timeout ?? 5000,
        verbose: options?.verbose,
    });

    // 启用外键约束
    dbInstance.pragma('foreign_keys = ON');

    // 设置 WAL 模式以提高并发性能
    dbInstance.pragma('journal_mode = WAL');

    // 设置同步模式为 NORMAL 以平衡性能和安全性
    dbInstance.pragma('synchronous = NORMAL');

    // 设置缓存大小 (10MB)
    dbInstance.pragma('cache_size = -10000');

    // 运行数据库迁移
    try {
        const currentVersion = getCurrentVersion(dbInstance);
        console.log(`当前数据库版本: v${currentVersion}`);

        if (currentVersion < DB_CONFIG.CURRENT_VERSION) {
            console.log(`需要升级数据库到 v${DB_CONFIG.CURRENT_VERSION}`);
            runMigrations(dbInstance);
        }
    } catch (error) {
        console.error('数据库迁移失败:', error);
        throw error;
    }

    // 注册进程退出时关闭数据库
    process.on('exit', () => {
        closeDatabase();
    });

    process.on('SIGINT', () => {
        closeDatabase();
        process.exit(0);
    });

    return dbInstance;
}

/**
 * 获取数据库实例
 */
export function getDatabase(): Database.Database {
    if (!dbInstance) {
        return initDatabase();
    }
    return dbInstance;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
    if (dbInstance) {
        console.log('关闭数据库连接');
        dbInstance.close();
        dbInstance = null;
    }
}

/**
 * 执行事务
 */
export function transaction<T>(
    callback: (db: Database.Database) => T
): T {
    const db = getDatabase();
    const wrappedCallback = () => callback(db);
    return db.transaction(wrappedCallback)();
}

/**
 * 数据库健康检查
 */
export function healthCheck(): {
    connected: boolean;
    version: number;
    path: string;
} {
    try {
        const db = getDatabase();
        const version = getCurrentVersion(db);

        return {
            connected: true,
            version,
            path: db.name,
        };
    } catch (error) {
        console.error('数据库健康检查失败:', error);
        return {
            connected: false,
            version: 0,
            path: '',
        };
    }
}

/**
 * 备份数据库
 */
export function backupDatabase(backupPath: string): void {
    const db = getDatabase();
    const backup = new Database(backupPath);

    try {
        db.backup(backupPath);
        console.log(`数据库已备份到: ${backupPath}`);
    } finally {
        backup.close();
    }
}

/**
 * 优化数据库
 */
export function optimizeDatabase(): void {
    const db = getDatabase();

    console.log('开始优化数据库...');

    // 分析查询性能
    db.pragma('optimize');

    // 压缩数据库
    db.pragma('vacuum');

    console.log('数据库优化完成');
}