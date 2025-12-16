// Game constants and configuration

import { GameConfig, VehicleConfig, VehicleStats, PowerUpType, PowerUpConfig } from '@/types/game';

// Canvas and road configuration
export const GAME_CONFIG: GameConfig = {
  canvasWidth: 400,
  canvasHeight: 800,
  laneCount: 3,
  laneWidth: 80,
  roadWidth: 280,
  roadOffset: 60, // offset from left edge to road
};

// Vehicle dimensions
export const VEHICLE_WIDTH = 50;
export const VEHICLE_HEIGHT = 90;

// Obstacle dimensions by type
export const OBSTACLE_DIMENSIONS = {
  car: { width: 45, height: 80 },
  truck: { width: 50, height: 120 },
  bus: { width: 55, height: 140 },
};

// Power-up dimensions
export const POWERUP_SIZE = 50; // Increased from 30 to 50 for better visibility

// Speed configuration (pixels per frame at 60fps)
export const SPEED = {
  initial: 3,
  max: 12,
  increment: 0.001, // speed increase per frame
  obstacle: {
    car: 2,
    truck: 1.5,
    bus: 1,
  },
};

// Difficulty scaling
export const DIFFICULTY = {
  initialObstacleInterval: 2000, // ms between obstacles
  minObstacleInterval: 500,
  obstacleIntervalDecrement: 50, // decrease interval by this amount per km
  powerUpInterval: 5000, // ms between power-ups
  distancePerKm: 1000, // game units per km
};

// Difficulty level multipliers
export const DIFFICULTY_MULTIPLIERS = {
  easy: 0.7,
  medium: 1.0,
  hard: 1.2,
};

// Lane positions (center X of each lane)
export const getLanePositions = (): number[] => {
  const { roadOffset, laneWidth, laneCount } = GAME_CONFIG;
  const lanes: number[] = [];
  for (let i = 0; i < laneCount; i++) {
    lanes.push(roadOffset + laneWidth / 2 + i * laneWidth);
  }
  return lanes;
};

// Power-up spawn weight configuration (higher = more likely to spawn)
export interface PowerUpSpawnWeight {
  type: import('@/types/game').PowerUpType;
  weight: number;
}

// Basic power-up spawn weights (used in createPowerUp)
export const BASIC_POWERUP_SPAWN_WEIGHTS: PowerUpSpawnWeight[] = [
  { type: 'speed_boost', weight: 1 },
  { type: 'invincibility', weight: 1 },
  { type: 'magnet', weight: 1 },
  { type: 'score_multiplier', weight: 1 },
  { type: 'coin', weight: 6 }, // Coins are more common
];

// Shop power-up spawn weights (used in spawnShopPowerUp)
export const SHOP_POWERUP_SPAWN_WEIGHTS: PowerUpSpawnWeight[] = [
  { type: 'invincibility', weight: 1 },
  { type: 'machine_gun', weight: 1 },
  { type: 'rocket_fuel', weight: 1 },
  { type: 'nitro_boost', weight: 1 },
  { type: 'mystery_box', weight: 1 },
];

// Coin value weights by difficulty
export const COIN_VALUE_WEIGHTS: Record<import('@/types/game').DifficultyLevel, { value: number; weight: number }[]> = {
  easy: [
    { value: 100, weight: 5 },
    { value: 200, weight: 3 },
    { value: 500, weight: 2 },
  ],
  medium: [
    { value: 100, weight: 5 },
    { value: 200, weight: 4 },
    { value: 500, weight: 1 },
  ],
  hard: [
    { value: 100, weight: 10 },
  ],
};

// Helper function to select item based on weights
export const selectByWeight = <T extends { weight: number }>(items: T[]): T => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1]; // Fallback to last item
};

// Vehicle configurations available for selection
export const VEHICLE_PRESETS: VehicleConfig[] = [
  { id: 'sporty', name: 'Sports Car', color: '#ef4444', engineLevel: 3, tireLevel: 2 },
  { id: 'sedan', name: 'Sedan', color: '#3b82f6', engineLevel: 2, tireLevel: 2 },
  { id: 'suv', name: 'SUV', color: '#22c55e', engineLevel: 2, tireLevel: 3 },
  { id: 'truck', name: 'Pickup', color: '#f59e0b', engineLevel: 1, tireLevel: 3 },
];

// Calculate vehicle stats based on configuration
export const calculateVehicleStats = (config: VehicleConfig): VehicleStats => {
  return {
    acceleration: 0.5 + config.engineLevel * 0.3, // 0.8 - 1.4
    maxSpeed: 8 + config.tireLevel * 2, // 10 - 14
    handling: 3 + config.tireLevel * 1.5, // 4.5 - 7.5 pixels per frame
    // 平衡机制：引擎等级越高，道具持续时间越短 (1.0 -> 0.7)
    powerUpDurationMultiplier: 1.15 - config.engineLevel * 0.15,
    // 平衡机制：轮胎等级越高，操控稳定性越低 (1.0 -> 0.4)
    handlingStability: 1.2 - config.tireLevel * 0.2,
  };
};

// Obstacle colors
export const OBSTACLE_COLORS = {
  car: ['#6b7280', '#1f2937', '#dc2626', '#2563eb', '#16a34a'],
  truck: ['#78716c', '#44403c', '#854d0e'],
  bus: ['#fbbf24', '#f97316'],
};

// Unified power-up configurations
export const POWERUP_CONFIG: Record<PowerUpType, PowerUpConfig> = {
  // Basic power-ups (spawn on road)
  speed_boost: { name: '速度提升', icon: '⚡', color: '#f59e0b', duration: 8000, description: '速度提升至1.5倍', canSpawnOnRoad: true, spawnInterval: 2000 },
  invincibility: { name: '无敌', icon: '🛡️', color: '#8b5cf6', duration: 8000, description: '无视碰撞', isSellable: true, price: 500, canSpawnOnRoad: true, spawnInterval: 2000 },
  magnet: { name: '磁铁', icon: '🧲', color: '#ec4899', duration: 8000, description: '自动吸引道具', canSpawnOnRoad: true, spawnInterval: 2000 },
  score_multiplier: { name: '分数倍增', icon: '2×', color: '#10b981', duration: 8000, description: '分数获取翻倍', canSpawnOnRoad: true, spawnInterval: 2000 },
  coin: { name: '金币', icon: '$', color: '#fbbf24', duration: 0, description: '获得金币', canSpawnOnRoad: true, spawnInterval: 2000 },
  heart: { name: '爱心', icon: '❤', color: '#ef4444', duration: 0, description: '恢复1点生命', canSpawnOnRoad: true, spawnInterval: 30000 },

  // Shop power-ups (sellable)
  machine_gun: { name: '机枪', icon: '🔫', color: '#ef4444', duration: 10000, description: '发射子弹摧毁前方车辆', isSellable: true, price: 800, canSpawnOnRoad: true, spawnInterval: 30000 },
  rocket_fuel: { name: '火箭燃料', icon: '🚀', color: '#f97316', duration: 6000, description: '速度提高两倍突破极速', isSellable: true, price: 1000, canSpawnOnRoad: true, spawnInterval: 30000 },
  nitro_boost: { name: '氮气加速', icon: '⚡', color: '#06b6d4', duration: 3000, description: '快速加速到极速', isSellable: true, price: 600, canSpawnOnRoad: true, spawnInterval: 30000 },

  // Special shop power-ups (conditional display)
  full_recovery: { name: '完全恢复', icon: '❤️', color: '#ff1493', duration: 10000, description: '补满全部耐久值并提供10秒无敌时间', isSellable: true, price: 9999, canSpawnOnRoad: false },

  // Mystery box (spawns on road, randomly gives one of the 4 shop power-ups)
  mystery_box: { name: '神秘宝箱', icon: '❓', color: '#00d4ff', duration: 0, description: '随机获得一个商店道具', canSpawnOnRoad: true, spawnInterval: 30000 },

  // Combo power-ups (generated by combining)
  rotating_shield_gun: { name: '旋转弹幕射击', icon: '🌀🔫', color: '#a855f7', duration: 10000, description: '旋转的无敌护盾发射机枪子弹', isCombo: true, comboSources: ['invincibility', 'machine_gun'] },
  quad_machine_gun: { name: '四弹道机枪', icon: '🔫🔫', color: '#a855f7', duration: 10000, description: '射击弹幕从2弹道扩展为4弹道', isCombo: true, comboSources: ['score_multiplier', 'machine_gun'] },
  storm_lightning: { name: '风暴闪电', icon: '⚡🌩️', color: '#a855f7', duration: 10000, description: '每2秒全屏攻击清除所有障碍', isCombo: true, comboSources: ['machine_gun', 'nitro_boost'] },
  double_heart: { name: '双倍爱心', icon: '❤❤', color: '#a855f7', duration: 0, description: '获得两个爱心补充两点耐久', isCombo: true, comboSources: ['score_multiplier', 'heart'] },
  double_coin: { name: '双倍金币', icon: '💰💰', color: '#a855f7', duration: 0, description: '金币面额两倍', isCombo: true, comboSources: ['score_multiplier', 'coin'] },
  turbo_overload: { name: '涡轮过载', icon: '🚀⚡', color: '#ff6b35', duration: 10000, description: '3倍速度，半透明车身，无视碰撞', isCombo: true, comboSources: ['rocket_fuel', 'nitro_boost'] },
  iron_body: { name: '钢铁之躯', icon: '🛡️🔺', color: '#64748b', duration: 10000, description: '三角光环包围，碰撞摧毁障碍奖励10金币', isCombo: true, comboSources: ['invincibility', 'invincibility'] },
  golden_bell: { name: '金钟罩', icon: '🛡️💰', color: '#fbbf24', duration: 12000, description: '无碰撞则双倍返还金币面额', isCombo: true, comboSources: ['invincibility', 'coin'] },
  death_star_beam: { name: '死星射击', icon: '🔫⚡', color: '#8b5cf6', duration: 10000, description: '白色射线柱摧毁障碍奖励10金币', isCombo: true, comboSources: ['machine_gun', 'machine_gun'] },
  invincible_fire_wheel: { name: '无敌风火轮', icon: '🔥🛡️', color: '#ef4444', duration: 10000, description: '碰撞摧毁障碍并延长持续时间0.25秒', isCombo: true, comboSources: ['iron_body', 'invincibility'] },

  // New score_multiplier combo power-ups
  hyper_speed: { name: '极速狂飙', icon: '⚡⚡', color: '#fbbf24', duration: 10000, description: '速度提升至3倍，留下金色残影', isCombo: true, comboSources: ['score_multiplier', 'speed_boost'] },
  super_magnet: { name: '超级磁铁', icon: '🧲🧲', color: '#ec4899', duration: 12000, description: '吸引范围翻倍，全屏吸引道具', isCombo: true, comboSources: ['score_multiplier', 'magnet'] },
  time_dilation: { name: '时间膨胀', icon: '🛡️⏰', color: '#06b6d4', duration: 16000, description: '无敌时间翻倍，周围时间减缓', isCombo: true, comboSources: ['score_multiplier', 'invincibility'] },
  supernova_burst: { name: '超新星爆发', icon: '🚀💥', color: '#ff4500', duration: 8000, description: '4倍速度，留下火焰轨迹摧毁障碍', isCombo: true, comboSources: ['score_multiplier', 'rocket_fuel'] },
};

// Coin value
export const COIN_VALUE = 100;

// Animation and rendering
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

// Collision recovery
export const COLLISION_RECOVERY_TIME = 2500; // ms of invincibility after collision
export const COLLISION_RECOVERY_VISUAL_TIME = 1500; // ms of visual effect (flashing)
export const COLLISION_KNOCKBACK = 30; // pixels to move vehicle back on collision

// Road appearance
export const ROAD_COLORS = {
  road: '#374151',
  lane: '#4b5563',
  line: '#fbbf24',
  grass: '#166534',
};

// Slot machine configurations (老虎机)
export const SLOT_MACHINE_CONFIG = {
  symbols: ['❌', '谢谢', 100, 200, 500] as const,
  multipliers: {
    100: 1.5,
    200: 2.0,
    500: 3.0,
  },
  rewards: {
    '谢谢': 10, // 三个谢谢奖励10金币
  },
  spinDuration: 2000, // 旋转持续时间(ms)
  spinInterval: 500, // 每个滚轮停止间隔(ms)
};

// Machine gun coin reward
export const MACHINE_GUN_COIN_REWARD = 10; // 每摧毁一辆障碍车辆奖励10金币
