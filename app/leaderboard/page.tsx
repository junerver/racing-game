'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/utils/storage";
import { LeaderboardEntry } from "@/types/game";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setLeaderboard(getLeaderboard());
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 py-8">
      <main className="flex flex-col items-center gap-8 px-4 max-w-4xl w-full">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            🏆 排行榜
          </h1>
          <p className="text-lg text-gray-300">
            Top 10 最佳成绩
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-xl mb-4">暂无记录</p>
            <p className="text-sm">开始游戏创建你的第一条记录！</p>
          </div>
        ) : (
          <div className="w-full space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className="bg-black/50 rounded-lg p-4 flex items-center gap-4 hover:bg-black/60 transition-colors"
              >
                <div className="text-3xl font-bold text-yellow-400 w-12 text-center">
                  #{index + 1}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">时间</div>
                    <div className="text-sm text-white">{formatDate(entry.timestamp)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">分数</div>
                    <div className="text-xl font-bold text-white">{entry.score.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">{entry.distance} km</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">车辆配置</div>
                    <div className="text-sm text-white flex items-center gap-2">
                      {entry.vehicleConfig && (
                        <span
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: entry.vehicleConfig.color }}
                        />
                      )}
                      {entry.vehicleName}
                    </div>
                    {entry.vehicleConfig && (
                      <div className="text-xs text-gray-400">
                        引擎 Lv.{entry.vehicleConfig.engineLevel} | 轮胎 Lv.{entry.vehicleConfig.tireLevel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/"
          className="mt-8 px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white text-lg font-medium rounded-lg transition-colors"
        >
          ← 返回首页
        </Link>
      </main>
    </div>
  );
}
