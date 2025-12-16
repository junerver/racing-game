/**
 * 数据库工具函数
 * 
 * 提供常用的数据库操作辅助函数
 */

import { getDatabase } from './connection';
import { TABLE_NAMES } from './schema';

/**
 * 检查表是否存在
 */
export function tableExists(tableName: string): boolean {
    const db = getDatabase();
    const result = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=?
  `).get(tableName);

    return result !== undefined;
}

/**
 * 获取表的行数
 */
export function getTableRowCount(tableName: string): number {
    const db = getDatabase();
    const result = db.prepare(`
    SELECT COUNT(*) as count FROM ${tableName}
  `).get() as { count: number };

    return result.count;
}

/**
 * 获取数据库统计信息
 */
export function getDatabaseStats(): {
    tables: Record<string, number>;
    totalSize: number;
    pageSize: number;
    pageCount: number;
} {
    const db = getDatabase();

    // 获取所有表的行数
    const tables: Record<string, number> = {};
    for (const tableName of Object.values(TABLE_NAMES)) {
        if (tableExists(tableName)) {
            tables[tableName] = getTableRowCount(tableName);
        }
    }

    // 获取数据库大小信息
    const pageSize = db.pragma('page_size', { simple: true }) as number;
    const pageCount = db.pragma('page_count', { simple: true }) as number;
    const totalSize = pageSize * pageCount;

    return {
        tables,
        totalSize,
        pageSize,
        pageCount,
    };
}

/**
 * 清空指定表的数据（保留结构）
 */
export function truncateTable(tableName: string): void {
    const db = getDatabase();
    db.prepare(`DELETE FROM ${tableName}`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name=?`).run(tableName);
}

/**
 * 执行数据库备份
 */
export function createBackup(backupPath: string): void {
    const db = getDatabase();
    db.backup(backupPath);
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 验证 UUID 格式
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * 构建 WHERE 子句
 */
export function buildWhereClause(
    conditions: Record<string, string | number | boolean>
): { clause: string; values: (string | number | boolean)[] } {
    const clauses: string[] = [];
    const values: (string | number | boolean)[] = [];

    for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined && value !== null) {
            clauses.push(`${key} = ?`);
            values.push(value);
        }
    }

    return {
        clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
        values,
    };
}

/**
 * 分页查询辅助函数
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export function paginate<T>(
    query: string,
    countQuery: string,
    params: PaginationParams,
    queryParams: unknown[] = []
): PaginationResult<T> {
    const db = getDatabase();

    // 获取总数
    const { total } = db.prepare(countQuery).get(...queryParams) as { total: number };

    // 计算分页
    const offset = (params.page - 1) * params.pageSize;
    const totalPages = Math.ceil(total / params.pageSize);

    // 执行查询
    const data = db.prepare(`${query} LIMIT ? OFFSET ?`)
        .all(...queryParams, params.pageSize, offset) as T[];

    return {
        data,
        pagination: {
            page: params.page,
            pageSize: params.pageSize,
            total,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
        },
    };
}

/**
 * 安全地解析 JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
}

/**
 * 批量插入辅助函数
 */
export function batchInsert<T extends Record<string, unknown>>(
    tableName: string,
    records: T[],
    batchSize: number = 100
): void {
    if (records.length === 0) return;

    const db = getDatabase();
    const columns = Object.keys(records[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    const stmt = db.prepare(sql);

    // 分批插入
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        db.transaction(() => {
            for (const record of batch) {
                const values = columns.map(col => record[col]);
                stmt.run(...values);
            }
        })();
    }
}

/**
 * 导出表数据为 JSON
 */
export function exportTableToJson(tableName: string): string {
    const db = getDatabase();
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    return JSON.stringify(rows, null, 2);
}

/**
 * 从 JSON 导入表数据
 */
export function importTableFromJson(tableName: string, json: string): void {
    const records = JSON.parse(json);
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('无效的 JSON 数据');
    }

    batchInsert(tableName, records);
}

/**
 * 执行数据库清理
 * 删除过期或无用的数据
 */
export function cleanupDatabase(options: {
    deleteOldRecords?: boolean;
    daysToKeep?: number;
    vacuum?: boolean;
}): { deletedRecords: number; freedSpace: number } {
    const db = getDatabase();
    let deletedRecords = 0;

    if (options.deleteOldRecords && options.daysToKeep) {
        const cutoffTime = Date.now() - (options.daysToKeep * 24 * 60 * 60 * 1000);

        // 删除旧的游戏记录（会级联删除相关数据）
        const result = db.prepare(`
      DELETE FROM ${TABLE_NAMES.GAME_RECORDS}
      WHERE created_at < ?
    `).run(cutoffTime);

        deletedRecords = result.changes;
    }

    let freedSpace = 0;
    if (options.vacuum) {
        const beforeSize = getDatabaseStats().totalSize;
        db.pragma('vacuum');
        const afterSize = getDatabaseStats().totalSize;
        freedSpace = beforeSize - afterSize;
    }

    return { deletedRecords, freedSpace };
}