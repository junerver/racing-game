// Game constants and configuration

import { GameConfig, VehicleConfig, VehicleStats } from '@/types/game';

// Canvas and road configuration
export const GAME_CONFIG: GameConfig = {
  canvasWidth: 400,
  canvasHeight: 600,
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

// Lane positions (center X of each lane)
export const getLanePositions = (): number[] => {
  const { roadOffset, laneWidth, laneCount } = GAME_CONFIG;
  const lanes: number[] = [];
  for (let i = 0; i < laneCount; i++) {
    lanes.push(roadOffset + laneWidth / 2 + i * laneWidth);
  }
  return lanes;
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
  };
};

// Obstacle colors
export const OBSTACLE_COLORS = {
  car: ['#6b7280', '#1f2937', '#dc2626', '#2563eb', '#16a34a'],
  truck: ['#78716c', '#44403c', '#854d0e'],
  bus: ['#fbbf24', '#f97316'],
};

// Power-up colors and icons
export const POWERUP_CONFIG = {
  speed_boost: { color: '#f59e0b', icon: '⚡', duration: 3000 },
  invincibility: { color: '#8b5cf6', icon: '🛡️', duration: 5000 },
  magnet: { color: '#ec4899', icon: '🧲', duration: 4000 },
  score_multiplier: { color: '#10b981', icon: '2×', duration: 5000 },
  coin: { color: '#fbbf24', icon: '💰', duration: 0 },
};

// Shop power-up configurations
export const SHOP_POWERUP_CONFIG = {
  shop_invincibility: { name: '无敌', price: 500, duration: 8000, icon: '🛡️', description: '无视碰撞' },
  machine_gun: { name: '机枪', price: 800, duration: 10000, icon: '🔫', description: '发射子弹摧毁前方车辆' },
  rocket_fuel: { name: '火箭燃料', price: 1000, duration: 6000, icon: '🚀', description: '速度提高两倍突破极速' },
  nitro_boost: { name: '氮气加速', price: 600, duration: 3000, icon: '⚡', description: '快速加速到极速' },
};

// Coin value
export const COIN_VALUE = 100;

// Animation and rendering
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

// Collision recovery
export const COLLISION_RECOVERY_TIME = 1500; // ms of invincibility after collision
export const COLLISION_KNOCKBACK = 30; // pixels to move vehicle back on collision

// Road appearance
export const ROAD_COLORS = {
  road: '#374151',
  lane: '#4b5563',
  line: '#fbbf24',
  grass: '#166534',
};
