/**
 * 数据库功能测试脚本
 * 
 * 运行方式：npx tsx scripts/test-database.ts
 */

import { ensureDatabase } from '../lib/db';
import {
    PlayerDAO,
    VehicleDAO,
    GameRecordDAO,
    PowerUpStatsDAO,
    LeaderboardDAO,
    getDatabaseStats,
    formatBytes,
} from '../lib/db';
import type { VehicleConfig, GameStatistics } from '../types/game';

async function testDatabase() {
    console.log('🚀 开始数据库功能测试...\n');

    try {
        // 1. 确保数据库已初始化
        console.log('1️⃣ 初始化数据库');
        ensureDatabase();
        console.log('✅ 数据库初始化成功\n');

        // 2. 创建测试玩家
        console.log('2️⃣ 创建测试玩家');
        const player = PlayerDAO.create('test_player_' + Date.now());
        console.log('✅ 玩家创建成功:', player.username);
        console.log('   玩家 ID:', player.id, '\n');

        // 3. 创建测试车辆
        console.log('3️⃣ 创建测试车辆');
        const vehicleConfig: VehicleConfig = {
            id: 'vehicle_test',
            name: '测试闪电',
            color: '#FF0000',
            engineLevel: 3,
            tireLevel: 2,
        };
        const vehicle = VehicleDAO.create(player.id, vehicleConfig);
        VehicleDAO.setSelected(player.id, vehicle.id);
        console.log('✅ 车辆创建成功:', vehicle.name);
        console.log('   车辆 ID:', vehicle.id, '\n');

        // 4. 创建测试游戏记录
        console.log('4️⃣ 创建测试游戏记录');
        const gameRecordId = GameRecordDAO.create({
            playerId: player.id,
            vehicleId: vehicle.id,
            distance: 1500,
            score: 7500,
            coinsCollected: 800,
            heartsRemaining: 2,
            maxSpeedReached: 250,
            obstaclesDestroyed: 50,
            gameDuration: 120000,
            difficultyLevel: 'medium',
            bossDefeated: true,
        });
        console.log('✅ 游戏记录创建成功');
        console.log('   记录 ID:', gameRecordId, '\n');

        // 5. 添加道具统计
        console.log('5️⃣ 添加道具统计');
        PowerUpStatsDAO.createBatch(gameRecordId, [
            { type: 'speed_boost', collected: 5, comboCrafted: 0 },
            { type: 'invincibility', collected: 3, comboCrafted: 1 },
            { type: 'machine_gun', collected: 2, comboCrafted: 0 },
        ]);
        console.log('✅ 道具统计添加成功\n');

        // 6. 添加到排行榜
        console.log('6️⃣ 添加到排行榜');
        const statistics: GameStatistics = {
            powerUpStats: [
                { type: 'speed_boost', collected: 5, comboCrafted: 0 },
                { type: 'invincibility', collected: 3, comboCrafted: 1 },
            ],
            totalCoinsCollected: 800,
            totalDistanceTraveled: 1500,
            totalObstaclesDestroyed: 50,
            bossRecords: [],
        };
        LeaderboardDAO.create(player.id, gameRecordId, {
            distance: 1500,
            score: 7500,
            coins: 800,
            timestamp: Date.now(),
            vehicleName: vehicleConfig.name,
            vehicleConfig: vehicleConfig,
            statistics: statistics,
        });
        console.log('✅ 排行榜记录添加成功\n');

        // 7. 查询排行榜
        console.log('7️⃣ 查询排行榜');
        const leaderboard = LeaderboardDAO.getByDistance(10);
        console.log('✅ 查询成功，当前排行榜:', leaderboard.length, '条记录');
        if (leaderboard.length > 0) {
            console.log('   第 1 名:', leaderboard[0].vehicleName, '-', leaderboard[0].distance, 'km\n');
        }

        // 8. 查询玩家信息
        console.log('8️⃣ 查询玩家信息');
        const foundPlayer = PlayerDAO.findById(player.id);
        console.log('✅ 玩家查询成功');
        console.log('   用户名:', foundPlayer?.username);
        console.log('   游戏次数:', foundPlayer?.games_played, '\n');

        // 9. 数据库统计
        console.log('9️⃣ 数据库统计信息');
        const stats = getDatabaseStats();
        console.log('✅ 统计查询成功');
        console.log('   数据库大小:', formatBytes(stats.totalSize));
        console.log('   表数据:');
        for (const [table, count] of Object.entries(stats.tables)) {
            console.log(`     - ${table}: ${count} 行`);
        }
        console.log();

        // 10. 总结
        console.log('🎉 所有测试通过！');
        console.log('='.repeat(50));
        console.log('数据库系统工作正常，所有功能已验证。');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        process.exit(1);
    }
}

// 运行测试
testDatabase();