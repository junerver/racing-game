/**
 * 数据库健康检查 API
 * GET /api/db/health
 *
 * 检查数据库连接状态和版本信息
 */

import { NextResponse } from 'next/server';
import '@/lib/db/init'; // 确保数据库已初始化
import { healthCheck } from '@/lib/db/connection';

export async function GET() {
    try {
        const health = healthCheck();

        return NextResponse.json({
            success: health.connected,
            data: {
                connected: health.connected,
                version: health.version,
                databasePath: health.path,
                timestamp: Date.now(),
            },
        }, {
            status: health.connected ? 200 : 503,
        });

    } catch (error) {
        console.error('数据库健康检查失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: '健康检查失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 503 }
        );
    }
}