'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VehicleConfig } from '@/types/game';
import { VEHICLE_PRESETS, calculateVehicleStats } from '@/lib/game/constants';
import { saveSelectedVehicle } from '@/lib/utils/storage';

export default function VehicleSelectPage() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState(VEHICLE_PRESETS[0]);
  const [engineLevel, setEngineLevel] = useState(2);
  const [tireLevel, setTireLevel] = useState(2);

  const customConfig: VehicleConfig = {
    ...selectedPreset,
    engineLevel,
    tireLevel,
  };

  const stats = calculateVehicleStats(customConfig);

  const handleStart = () => {
    saveSelectedVehicle(customConfig);
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🏎️ 车辆自定义</h1>

        {/* Vehicle Preset Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">选择车辆外观</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VEHICLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPreset.id === preset.id
                    ? 'border-blue-500 bg-blue-900'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div
                  className="w-full h-20 rounded-lg mb-2"
                  style={{ backgroundColor: preset.color }}
                />
                <p className="text-white font-semibold text-center">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Engine Configuration */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">引擎配置</h2>
          <div className="flex items-center gap-4">
            <span className="text-white min-w-24">等级 {engineLevel}</span>
            <input
              type="range"
              min="1"
              max="3"
              value={engineLevel}
              onChange={(e) => setEngineLevel(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-400 text-sm">影响加速度</span>
          </div>
        </div>

        {/* Tire Configuration */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">轮胎配置</h2>
          <div className="flex items-center gap-4">
            <span className="text-white min-w-24">等级 {tireLevel}</span>
            <input
              type="range"
              min="1"
              max="3"
              value={tireLevel}
              onChange={(e) => setTireLevel(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-400 text-sm">影响极速和转向</span>
          </div>
        </div>

        {/* Vehicle Stats Display */}
        <div className="mb-8 bg-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">车辆属性</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">加速度</p>
              <p className="text-white text-2xl font-bold">{stats.acceleration.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">极速</p>
              <p className="text-white text-2xl font-bold">{stats.maxSpeed}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">操控</p>
              <p className="text-white text-2xl font-bold">{stats.handling.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 px-8 rounded-lg transition-colors"
          >
            返回
          </button>
          <button
            onClick={handleStart}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-lg transition-colors"
          >
            开始游戏
          </button>
        </div>
      </div>
    </div>
  );
}
