'use client';

import { useRef, useEffect } from 'react';
import { GameStatistics, BossShape } from '@/types/game';
import { POWERUP_CONFIG } from '@/lib/game/constants';

interface GameStatisticsProps {
    statistics: GameStatistics;
    onClose: () => void;
}

// Boss剪影绘制函数
const drawBossSilhouette = (
    ctx: CanvasRenderingContext2D,
    shape: BossShape,
    color: string,
    width: number = 60,
    height: number = 40
) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // 创建渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, '#000000');

    ctx.shadowBlur = 8;
    ctx.shadowColor = color;

    ctx.fillStyle = gradient;

    switch (shape) {
        case 'diamond':
            // 菱形
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(width, centerY);
            ctx.lineTo(centerX, height);
            ctx.lineTo(0, centerY);
            ctx.closePath();
            ctx.fill();
            break;

        case 'hexagon':
            // 六边形
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = centerX + Math.cos(angle) * width / 2.5;
                const y = centerY + Math.sin(angle) * height / 2.5;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;

        case 'star':
            // 五角星
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI / 5) * i - Math.PI / 2;
                const radius = (i % 2 === 0) ? width / 2.5 : width / 5;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius * 0.8;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;

        case 'triangle':
            // 三角形
            ctx.beginPath();
            ctx.moveTo(centerX, 2);
            ctx.lineTo(width - 2, height - 2);
            ctx.lineTo(2, height - 2);
            ctx.closePath();
            ctx.fill();
            break;

        case 'cross':
            // 十字形
            const armWidth = width * 0.25;
            const armHeight = height * 0.25;
            ctx.beginPath();
            ctx.rect(0, centerY - armHeight / 2, width, armHeight);
            ctx.rect(centerX - armWidth / 2, 0, armWidth, height);
            ctx.fill();
            break;
    }

    ctx.shadowBlur = 0;
};

// Boss剪影组件
interface BossSilhouetteProps {
    shape: BossShape;
    color: string;
    name: string;
}

function BossSilhouette({ shape, color, name }: BossSilhouetteProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 清空画布
        ctx.clearRect(0, 0, 60, 40);

        // 绘制boss剪影
        drawBossSilhouette(ctx, shape, color, 60, 40);
    }, [shape, color]);

    return (
        <div className="flex flex-col items-center gap-1">
            <canvas
                ref={canvasRef}
                width={60}
                height={40}
                className="border-2 border-gray-700 rounded bg-gray-950"
                style={{ imageRendering: 'crisp-edges' }}
            />
            <div className="text-xs text-gray-400 text-center truncate max-w-[70px]" title={name}>
                {name.split(' ')[0]}
            </div>
        </div>
    );
}

export default function GameStatisticsModal({ statistics, onClose }: GameStatisticsProps) {
    // Sort power-ups by total collected (collected + combo crafted)
    const sortedPowerUps = [...statistics.powerUpStats].sort((a, b) => {
        const totalA = a.collected + a.comboCrafted;
        const totalB = b.collected + b.comboCrafted;
        return totalB - totalA;
    });

    // Sort boss records by boss number
    const sortedBossRecords = [...statistics.bossRecords].sort((a, b) => a.bossNumber - b.bossNumber);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-cyan-500 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">📊 游戏统计详情</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-red-400 transition-colors text-3xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Overall Statistics */}
                    <div className="bg-gray-800 rounded-lg p-4 border-2 border-cyan-700">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">🎮 总体统计</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <div className="text-sm text-gray-400">总行驶距离</div>
                                <div className="text-2xl font-bold text-white">
                                    {statistics.totalDistanceTraveled} km
                                </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <div className="text-sm text-gray-400">总金币收集</div>
                                <div className="text-2xl font-bold text-yellow-400">
                                    {statistics.totalCoinsCollected.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <div className="text-sm text-gray-400">摧毁车辆</div>
                                <div className="text-2xl font-bold text-red-400">
                                    {statistics.totalObstaclesDestroyed}
                                </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <div className="text-sm text-gray-400">Boss挑战</div>
                                <div className="text-2xl font-bold text-purple-400">
                                    {statistics.bossRecords.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Power-ups Statistics */}
                    <div className="bg-gray-800 rounded-lg p-4 border-2 border-cyan-700">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">✨ 道具统计</h3>
                        {sortedPowerUps.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {sortedPowerUps.map((stat) => {
                                    const config = POWERUP_CONFIG[stat.type];
                                    const total = stat.collected + stat.comboCrafted;
                                    return (
                                        <div
                                            key={stat.type}
                                            className="bg-gray-900 p-3 rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{config.icon}</span>
                                                    <div>
                                                        <div className="text-white font-semibold">{config.name}</div>
                                                        <div className="text-xs text-gray-400">{config.description}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-cyan-400">×{total}</div>
                                                    {stat.comboCrafted > 0 && (
                                                        <div className="text-xs text-purple-400">
                                                            合成: {stat.comboCrafted}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">暂无道具收集记录</div>
                        )}
                    </div>

                    {/* Boss Records */}
                    <div className="bg-gray-800 rounded-lg p-4 border-2 border-cyan-700">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">👾 Boss挑战记录</h3>
                        {sortedBossRecords.length > 0 ? (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {sortedBossRecords.map((record, index) => (
                                    <div
                                        key={index}
                                        className={`bg-gray-900 p-4 rounded-lg border-2 ${record.defeated ? 'border-green-600' : 'border-red-600'
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Boss剪影 */}
                                            <div className="flex-shrink-0">
                                                {record.bossShape && record.bossColor && record.bossName ? (
                                                    <BossSilhouette
                                                        shape={record.bossShape}
                                                        color={record.bossColor}
                                                        name={record.bossName}
                                                    />
                                                ) : (
                                                    <div className="w-[60px] h-[40px] bg-gray-800 rounded flex items-center justify-center">
                                                        <span className="text-xs text-gray-500">Boss</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Boss信息 */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <div className="text-lg font-bold" style={{ color: record.bossColor || '#00ffff' }}>
                                                            {record.bossName || `Boss Lv.${record.bossNumber}`}
                                                        </div>
                                                        <div className="text-sm text-gray-400">
                                                            {record.distance} km 处遭遇
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`px-3 py-1 rounded-full text-sm font-bold ${record.defeated
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-red-600 text-white'
                                                            }`}
                                                    >
                                                        {record.defeated ? '✓ 击败' : '✗ 失败'}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    <div className="bg-gray-800 p-2 rounded">
                                                        <div className="text-xs text-gray-400">战斗时长</div>
                                                        <div className="text-white font-semibold">
                                                            {(record.elapsedTime / 1000).toFixed(1)}秒
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-800 p-2 rounded">
                                                        <div className="text-xs text-gray-400">使用道具</div>
                                                        <div className="text-white font-semibold">
                                                            {record.powerUpsUsed.length}个
                                                        </div>
                                                    </div>
                                                </div>

                                                {record.powerUpsUsed.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-700">
                                                        <div className="text-xs text-gray-400 mb-2">战斗中使用的道具：</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {record.powerUpsUsed.map((type, idx) => {
                                                                const config = POWERUP_CONFIG[type];
                                                                return (
                                                                    <span
                                                                        key={idx}
                                                                        className="inline-flex items-center gap-1 bg-gray-800 px-2 py-1 rounded text-xs"
                                                                        title={config.name}
                                                                    >
                                                                        <span>{config.icon}</span>
                                                                        <span className="text-gray-300">{config.name}</span>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">暂无Boss挑战记录</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}