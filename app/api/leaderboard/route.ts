/**
 * 排行榜查询 API
 * GET /api/leaderboard?type=distance&limit=100
 *
 * 查询排行榜数据
 */

import { NextRequest, NextResponse } from 'next/server';
import '@/lib/db/init'; // 确保数据库已初始化
import { LeaderboardDAO } from '@/lib/db/dao';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'distance';
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        // 验证参数
        if (!['distance', 'score'].includes(type)) {
            return NextResponse.json(
                { error: '无效的排行榜类型，支持: distance, score' },
                { status: 400 }
            );
        }

        if (limit < 1 || limit > 100) {
            return NextResponse.json(
                { error: '限制数量必须在 1-100 之间' },
                { status: 400 }
            );
        }

        // 查询排行榜
        const leaderboard = type === 'distance'
            ? LeaderboardDAO.getByDistance(limit)
            : LeaderboardDAO.getByScore(limit);

        return NextResponse.json({
            success: true,
            data: {
                type,
                entries: leaderboard,
                total: leaderboard.length,
            },
        });

    } catch (error) {
        console.error('查询排行榜失败:', error);
        return NextResponse.json(
            {
                error: '查询失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}