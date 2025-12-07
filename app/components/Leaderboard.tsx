'use client';

import { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@/types/game';
import { getLeaderboard } from '@/lib/utils/storage';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setLeaderboard(getLeaderboard());
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">🏆 排行榜</h2>

      {leaderboard.length === 0 ? (
        <p className="text-gray-400 text-center py-8">暂无记录</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-4 rounded-lg ${
                index === 0
                  ? 'bg-yellow-600'
                  : index === 1
                  ? 'bg-gray-400'
                  : index === 2
                  ? 'bg-orange-600'
                  : 'bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-white w-8">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <div>
                  <p className="text-white font-semibold">{entry.vehicleName}</p>
                  <p className="text-gray-300 text-sm">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">{entry.distance} km</p>
                <p className="text-gray-300 text-sm">💰 {entry.coins} | 🎯 {entry.score}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
