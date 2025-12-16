'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VehicleConfig, VehicleType } from '@/types/game';
import { VEHICLE_PRESETS, calculateVehicleStats, getVehicleAbilities } from '@/lib/game/constants';
import { saveSelectedVehicle } from '@/lib/utils/storage';

// 车辆图标映射
const VEHICLE_ICONS: Record<VehicleType, string> = {
  sports: '🏎️',
  sedan: '🚗',
  suv: '🚙',
  pickup: '🛻',
};

// 车辆特色标签
const VEHICLE_TAGS: Record<VehicleType, { label: string; color: string }[]> = {
  sports: [
    { label: '极速', color: 'bg-red-500' },
    { label: '灵活', color: 'bg-orange-500' },
  ],
  sedan: [
    { label: '均衡', color: 'bg-blue-500' },
    { label: '财富', color: 'bg-yellow-500' },
  ],
  suv: [
    { label: '火力', color: 'bg-green-500' },
    { label: '稳定', color: 'bg-teal-500' },
  ],
  pickup: [
    { label: '坦克', color: 'bg-amber-600' },
    { label: '耐久', color: 'bg-pink-500' },
  ],
};

export default function VehicleSelectPage() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState(VEHICLE_PRESETS[0]);
  const [engineLevel, setEngineLevel] = useState(selectedPreset.engineLevel);
  const [tireLevel, setTireLevel] = useState(selectedPreset.tireLevel);

  const customConfig: VehicleConfig = {
    ...selectedPreset,
    engineLevel,
    tireLevel,
  };

  const stats = calculateVehicleStats(customConfig);
  const abilities = getVehicleAbilities(selectedPreset.type);

  // 当选择新车辆时，重置引擎和轮胎等级为该车辆的默认值
  const handleSelectPreset = (preset: VehicleConfig) => {
    setSelectedPreset(preset);
    setEngineLevel(preset.engineLevel);
    setTireLevel(preset.tireLevel);
  };

  const handleStart = () => {
    saveSelectedVehicle(customConfig);
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full bg-gray-800 rounded-2xl shadow-2xl p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">🏎️ 车辆选择</h1>

        {/* Vehicle Preset Selection */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">选择车辆类型</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {VEHICLE_PRESETS.map((preset) => {
              const presetAbilities = getVehicleAbilities(preset.type);
              const tags = VEHICLE_TAGS[preset.type];
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 md:p-4 rounded-lg border-2 transition-all ${selectedPreset.id === preset.id
                      ? 'border-blue-500 bg-blue-900/50 scale-105'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
                    }`}
                >
                  {/* 车辆图标和颜色 */}
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-4xl md:text-5xl">{VEHICLE_ICONS[preset.type]}</span>
                  </div>

                  {/* 车辆名称 */}
                  <p className="text-white font-semibold text-center text-sm md:text-base">{preset.name}</p>

                  {/* 特色标签 */}
                  <div className="flex justify-center gap-1 mt-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`${tag.color} text-white text-xs px-2 py-0.5 rounded-full`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>

                  {/* 耐久度显示 */}
                  <div className="flex justify-center gap-0.5 mt-2">
                    {Array.from({ length: presetAbilities.baseHearts }).map((_, i) => (
                      <span key={i} className="text-red-500 text-sm">❤️</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Special Ability */}
        <div className="mb-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
          <h2 className="text-lg md:text-xl font-semibold text-purple-300 mb-2">
            ✨ 特殊能力
          </h2>
          <p className="text-white text-sm md:text-base">{abilities.description}</p>

          {/* 详细属性 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            <div className="bg-gray-800/50 rounded p-2 text-center">
              <p className="text-gray-400 text-xs">基础耐久</p>
              <p className="text-white font-bold">{abilities.baseHearts} ❤️</p>
            </div>
            {abilities.speedPowerUpBonus !== 1.0 && (
              <div className="bg-gray-800/50 rounded p-2 text-center">
                <p className="text-gray-400 text-xs">速度道具</p>
                <p className="text-green-400 font-bold">+{Math.round((abilities.speedPowerUpBonus - 1) * 100)}%</p>
              </div>
            )}
            {abilities.weaponPowerUpBonus !== 1.0 && (
              <div className="bg-gray-800/50 rounded p-2 text-center">
                <p className="text-gray-400 text-xs">武器道具</p>
                <p className="text-green-400 font-bold">+{Math.round((abilities.weaponPowerUpBonus - 1) * 100)}%</p>
              </div>
            )}
            {abilities.coinBonus !== 1.0 && (
              <div className="bg-gray-800/50 rounded p-2 text-center">
                <p className="text-gray-400 text-xs">金币加成</p>
                <p className="text-yellow-400 font-bold">+{Math.round((abilities.coinBonus - 1) * 100)}%</p>
              </div>
            )}
            {abilities.recoveryTimeMultiplier !== 1.0 && (
              <div className="bg-gray-800/50 rounded p-2 text-center">
                <p className="text-gray-400 text-xs">恢复时间</p>
                <p className="text-cyan-400 font-bold">-{Math.round((1 - abilities.recoveryTimeMultiplier) * 100)}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Engine Configuration */}
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-2">🔧 引擎配置</h2>
          <div className="flex items-center gap-4">
            <span className="text-white min-w-20">等级 {engineLevel}</span>
            <input
              type="range"
              min="1"
              max="3"
              value={engineLevel}
              onChange={(e) => setEngineLevel(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-gray-400 text-xs md:text-sm">影响加速度</span>
          </div>
        </div>

        {/* Tire Configuration */}
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-2">🛞 轮胎配置</h2>
          <div className="flex items-center gap-4">
            <span className="text-white min-w-20">等级 {tireLevel}</span>
            <input
              type="range"
              min="1"
              max="3"
              value={tireLevel}
              onChange={(e) => setTireLevel(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-gray-400 text-xs md:text-sm">影响极速和转向</span>
          </div>
        </div>

        {/* Vehicle Stats Display */}
        <div className="mb-6 bg-gray-700 rounded-lg p-4">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-3">📊 车辆属性</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">加速度</p>
              <p className="text-white text-xl md:text-2xl font-bold">{stats.acceleration.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">极速</p>
              <p className="text-white text-xl md:text-2xl font-bold">{stats.maxSpeed}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">操控</p>
              <p className="text-white text-xl md:text-2xl font-bold">{stats.handling.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">道具时长</p>
              <p className={`text-xl md:text-2xl font-bold ${stats.powerUpDurationMultiplier >= 1 ? 'text-green-400' : 'text-orange-400'}`}>
                {stats.powerUpDurationMultiplier >= 1 ? '+' : ''}{Math.round((stats.powerUpDurationMultiplier - 1) * 100)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">稳定性</p>
              <p className={`text-xl md:text-2xl font-bold ${stats.handlingStability >= 1 ? 'text-green-400' : 'text-orange-400'}`}>
                {stats.handlingStability.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-lg transition-colors"
          >
            返回
          </button>
          <button
            onClick={handleStart}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-lg transition-colors"
          >
            开始游戏
          </button>
        </div>
      </div>
    </div>
  );
}
