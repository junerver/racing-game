'use client';

import Link from "next/link";
import { useCallback, useState } from "react";
import { getLeaderboard, saveGameData } from "@/lib/utils/storage";
import { LeaderboardEntry } from "@/types/game";
import GameStatistics from "@/app/components/GameStatistics";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getLeaderboard());
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadLeaderboard = useCallback(() => {
    const data = getLeaderboard();
    setLeaderboard(data);
  }, []);

  const clearOldRecords = () => {
    // Only keep records with statistics
    const newLeaderboard = leaderboard.filter(entry => entry.statistics);
    saveGameData({ leaderboard: newLeaderboard });
    loadLeaderboard();
    setShowClearConfirm(false);
  };

  const clearAllRecords = () => {
    saveGameData({ leaderboard: [] });
    loadLeaderboard();
    setShowClearConfirm(false);
  };

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
                onClick={() => entry.statistics && setSelectedEntry(entry)}
                className={`bg-black/50 rounded-lg p-4 flex items-center gap-4 transition-colors ${entry.statistics
                  ? 'hover:bg-black/60 cursor-pointer hover:border-2 hover:border-cyan-500'
                  : 'opacity-75'
                  }`}
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
                {entry.statistics && (
                  <div className="text-cyan-400 text-sm">
                    点击查看详情 →
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 详情模态框 */}
        {selectedEntry && selectedEntry.statistics && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEntry(null)}
          >
            <div
              className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto border-2 border-cyan-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gray-900 border-b border-cyan-500 p-4 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400">游戏统计详情</h2>
                  <p className="text-sm text-gray-400">
                    {formatDate(selectedEntry.timestamp)} | {selectedEntry.distance} km | {selectedEntry.score.toLocaleString()} 分
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-3xl text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <GameStatistics
                  statistics={selectedEntry.statistics}
                  onClose={() => setSelectedEntry(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 清除确认对话框 */}
        {showClearConfirm && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setShowClearConfirm(false)}
          >
            <div
              className="bg-gray-800 rounded-lg p-6 max-w-md border-2 border-red-500"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">⚠️ 确认操作</h3>
              <p className="text-gray-300 mb-6">
                请选择要执行的操作：
              </p>
              <div className="space-y-3">
                {leaderboard.some(e => !e.statistics) && (
                  <button
                    onClick={clearOldRecords}
                    className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-left"
                  >
                    <div className="font-bold">清除旧记录</div>
                    <div className="text-sm text-orange-200">
                      只删除没有统计数据的旧记录（保留新记录）
                    </div>
                  </button>
                )}
                <button
                  onClick={clearAllRecords}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-left"
                >
                  <div className="font-bold">清除所有记录</div>
                  <div className="text-sm text-red-200">
                    删除所有排行榜记录（不可恢复）
                  </div>
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
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


