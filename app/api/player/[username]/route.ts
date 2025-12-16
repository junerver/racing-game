/**
 * 玩家信息查询 API
 * GET /api/player/[username]
 *
 * 查询玩家的基本信息和游戏历史
 */

import { NextRequest, NextResponse } from 'next/server';
import '@/lib/db/init'; // 确保数据库已初始化
import { PlayerDAO, GameRecordDAO, VehicleDAO } from '@/lib/db/dao';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        if (!username) {
            return NextResponse.json(
                { error: '缺少用户名' },
                { status: 400 }
            );
        }

        // 查询玩家信息
        const player = PlayerDAO.findByUsername(username);

        if (!player) {
            return NextResponse.json(
                { error: '玩家不存在' },
                { status: 404 }
            );
        }

        // 查询车辆
        const vehicles = VehicleDAO.findByPlayerId(player.id);

        // 查询游戏历史（最近20局）
        const gameHistory = GameRecordDAO.findByPlayerId(player.id, 20);

        // 查询最佳成绩
        const bestScore = GameRecordDAO.getBestScore(player.id);

        return NextResponse.json({
            success: true,
            data: {
                player: {
                    id: player.id,
                    username: player.username,
                    totalCoins: player.total_coins,
                    totalDistance: player.total_distance,
                    gamesPlayed: player.games_played,
                    highScore: player.high_score,
                    createdAt: player.created_at,
                },
                vehicles: vehicles.map(v => ({
                    id: v.id,
                    vehicleId: v.vehicle_id,
                    name: v.name,
                    color: v.color,
                    engineLevel: v.engine_level,
                    tireLevel: v.tire_level,
                    isSelected: v.is_selected,
                })),
                gameHistory: gameHistory.map(g => ({
                    id: g.id,
                    distance: g.distance,
                    score: g.score,
                    coins: g.coins_collected,
                    hearts: g.hearts_remaining,
                    maxSpeed: g.max_speed_reached,
                    obstaclesDestroyed: g.obstacles_destroyed,
                    gameDuration: g.game_duration,
                    difficultyLevel: g.difficulty_level,
                    bossDefeated: g.boss_defeated,
                    createdAt: g.created_at,
                })),
                bestScore: bestScore ? {
                    distance: bestScore.distance,
                    score: bestScore.score,
                    createdAt: bestScore.created_at,
                } : null,
            },
        });

    } catch (error) {
        console.error('查询玩家信息失败:', error);
        return NextResponse.json(
            {
                error: '查询失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}