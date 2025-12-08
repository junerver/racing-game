// Game entity types and interfaces

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Rectangle extends Position, Dimensions {}

// Vehicle configuration
export interface VehicleConfig {
  id: string;
  name: string;
  color: string;
  engineLevel: number; // 1-3, affects acceleration
  tireLevel: number; // 1-3, affects max speed and handling
}

export interface VehicleStats {
  acceleration: number;
  maxSpeed: number;
  handling: number;
  powerUpDurationMultiplier: number; // 道具持续时间修正（引擎等级越高越短）
  handlingStability: number; // 操控稳定性（轮胎等级越高越低，增加操作难度）
}

export interface Vehicle extends Rectangle {
  config: VehicleConfig;
  stats: VehicleStats;
  currentSpeed: number;
  lane: number;
}

// Obstacle types
export type ObstacleType = 'car' | 'truck' | 'bus';

export interface Obstacle extends Rectangle {
  type: ObstacleType;
  speed: number;
  lane: number;
  color: string;
}

// Power-up types
export type PowerUpType = 'speed_boost' | 'invincibility' | 'magnet' | 'score_multiplier' | 'coin' | 'shop_invincibility' | 'machine_gun' | 'rocket_fuel' | 'nitro_boost';

export interface PowerUp extends Rectangle {
  type: PowerUpType;
  duration: number;
  active: boolean;
  value?: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  startTime: number;
}

// Shop power-up types (purchasable with coins)
export type ShopPowerUpType = 'shop_invincibility' | 'machine_gun' | 'rocket_fuel' | 'nitro_boost';

export interface ShopPowerUp {
  type: ShopPowerUpType;
  name: string;
  price: number;
  duration: number;
  icon: string;
  description: string;
}

export interface ActiveShopPowerUp {
  type: ShopPowerUpType;
  remainingTime: number;
  startTime: number;
}

// Bullet for machine gun
export interface Bullet extends Rectangle {
  speed: number;
  active: boolean;
}

// Game state
export type GameStatus = 'idle' | 'playing' | 'paused' | 'game_over';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GameState {
  status: GameStatus;
  distance: number;
  score: number;
  currentSpeed: number;
  maxSpeed: number;
  vehicle: Vehicle | null;
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
  activeShopPowerUps: ActiveShopPowerUp[];
  bullets: Bullet[];
  difficulty: number;
  difficultyLevel: DifficultyLevel;
  highScore: number;
  coins: number;
  hearts: number;
  isRecovering: boolean;
  recoveryEndTime: number;
}

// Input state
export interface InputState {
  left: boolean;
  right: boolean;
}

// Game configuration
export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  laneCount: number;
  laneWidth: number;
  roadWidth: number;
  roadOffset: number;
}

// Difficulty configuration
export interface DifficultyConfig {
  level: number;
  speedMultiplier: number;
  obstacleSpawnRate: number;
  powerUpSpawnRate: number;
}

// Storage types
export interface SavedVehicle extends VehicleConfig {}

export interface LeaderboardEntry {
  id: string;
  distance: number;
  coins: number;
  score: number;
  timestamp: number;
  vehicleName: string;
  vehicleConfig: VehicleConfig;
}

export interface GameSave {
  highScore: number;
  totalDistance: number;
  gamesPlayed: number;
  selectedVehicle: SavedVehicle | null;
  coins: number;
  leaderboard: LeaderboardEntry[];
}
