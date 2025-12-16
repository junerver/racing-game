/**
 * 数据库初始化脚本
 * 
 * 在应用启动时自动初始化数据库
 */

import { initDatabase } from './connection';

let initialized = false;

/**
 * 确保数据库已初始化
 * 此函数是幂等的，可以安全地多次调用
 */
export function ensureDatabase(): void {
    if (initialized) {
        return;
    }

    try {
        console.log('[Database] 初始化数据库...');
        initDatabase();
        initialized = true;
        console.log('[Database] 数据库初始化成功');
    } catch (error) {
        console.error('[Database] 数据库初始化失败:', error);
        throw error;
    }
}

// 在模块加载时自动初始化
if (typeof window === 'undefined') {
    // 仅在服务端执行
    ensureDatabase();
}