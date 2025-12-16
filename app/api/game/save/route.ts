/**
 * 游戏记录保存 API
 * POST /api/game/save
 *
 * 保存完整的游戏记录到数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import '@/lib/db/init'; // 确保数据库已初始化
import {
  PlayerDAO,
  VehicleDAO,
  GameRecordDAO,
  PowerUpStatsDAO,
  BossRecordDAO,
  LeaderboardDAO,
} from '@/lib/db/dao';
import { transaction } from '@/lib/db/connection';
import type { GameStatistics, VehicleConfig } from '@/types/game';

interface SaveGameRequest {
    // 玩家信息
    username: string;

    // 车辆信息
    vehicleConfig: VehicleConfig;

    // 游戏数据
    distance: number;
    score: number;
    coins: number;
    hearts: number;
    maxSpeed: number;
    obstaclesDestroyed: number;
    gameDuration: number;
    difficultyLevel: 'easy' | 'medium' | 'hard';
    bossDefeated: boolean;

    // 统计数据
    statistics: GameStatistics;
}

export async function POST(request: NextRequest) {
    try {
        const body: SaveGameRequest = await request.json();

        // 验证必需字段
        if (!body.username || !body.vehicleConfig) {
            return NextResponse.json(
                { error: '缺少必需字段' },
                { status: 400 }
            );
        }

        // 使用事务保存所有数据
        const result = transaction(() => {
            // 1. 查找或创建玩家
            let player = PlayerDAO.findByUsername(body.username);
            if (!player) {
                player = PlayerDAO.create(body.username);
            }

            // 2. 查找或创建车辆
            const vehicles = VehicleDAO.findByPlayerId(player.id);
            let vehicle = vehicles.find(v => v.vehicle_id === body.vehicleConfig.id);

            if (!vehicle) {
                vehicle = VehicleDAO.create(player.id, body.vehicleConfig);
            }

            // 3. 创建游戏记录
            const gameRecordId = GameRecordDAO.create({
                playerId: player.id,
                vehicleId: vehicle.id,
                distance: body.distance,
                score: body.score,
                coinsCollected: body.coins,
                heartsRemaining: body.hearts,
                maxSpeedReached: body.maxSpeed,
                obstaclesDestroyed: body.obstaclesDestroyed,
                gameDuration: body.gameDuration,
                difficultyLevel: body.difficultyLevel,
                bossDefeated: body.bossDefeated,
            });

            // 4. 保存道具统计
            if (body.statistics.powerUpStats.length > 0) {
                PowerUpStatsDAO.createBatch(gameRecordId, body.statistics.powerUpStats);
            }

            // 5. 保存 Boss 记录
            if (body.statistics.bossRecords.length > 0) {
                BossRecordDAO.createBatch(gameRecordId, body.statistics.bossRecords);
            }

            // 6. 更新玩家统计
            PlayerDAO.updateStats(player.id, {
                coins: body.coins,
                distance: body.distance,
                gamesPlayed: 1,
                highScore: body.score,
            });

            // 7. 添加到排行榜（如果分数足够高）
            LeaderboardDAO.create(player.id, gameRecordId, {
                distance: body.distance,
                score: body.score,
                coins: body.coins,
                timestamp: Date.now(),
                vehicleName: body.vehicleConfig.name,
                vehicleConfig: body.vehicleConfig,
                statistics: body.statistics,
            });

            return {
                gameRecordId,
                playerId: player.id,
                vehicleId: vehicle.id,
            };
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: '游戏记录已保存',
        });

    } catch (error) {
        console.error('保存游戏记录失败:', error);
        return NextResponse.json(
            {
                error: '保存失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}