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

// Unified power-up types
export type PowerUpType =
  // Basic power-ups
  | 'speed_boost' | 'invincibility' | 'magnet' | 'score_multiplier' | 'coin' | 'heart'
  // Shop power-ups
  | 'machine_gun' | 'rocket_fuel' | 'nitro_boost'
  // Combo power-ups
  | 'rotating_shield_gun' | 'quad_machine_gun' | 'storm_lightning' | 'double_heart' | 'double_coin';

export interface PowerUpConfig {
  name: string;
  icon: string;
  color: string;
  duration: number;
  description: string;
  // Shop properties
  isSellable?: boolean;
  price?: number;
  // Spawn properties
  canSpawnOnRoad?: boolean;
  spawnInterval?: number; // ms
  // Combo properties
  isCombo?: boolean;
  comboSources?: [PowerUpType, PowerUpType];
  // Special properties
  value?: number; // for coins
}

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
  totalDuration: number;
}

// Bullet for machine gun
export interface Bullet extends Rectangle {
  speed: number;
  active: boolean;
}

// Slot machine (老虎机)
export type SlotMachineSymbol = '❌' | '谢谢' | 100 | 200 | 500;

export interface SlotMachineCard {
  value: number; // 金币值
  filled: boolean; // 是否已填充
}

export interface SlotMachineState {
  cards: SlotMachineCard[]; // 3张卡片
  isActive: boolean; // 是否激活老虎机
  isSpinning: boolean; // 是否正在旋转
  results: SlotMachineSymbol[]; // 旋转结果
  poolAmount: number; // 奖池金额
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
  activePowerUps: ActivePowerUp[]; // Unified queue for all active power-ups
  bullets: Bullet[];
  difficulty: number;
  difficultyLevel: DifficultyLevel;
  highScore: number;
  coins: number;
  hearts: number;
  isRecovering: boolean;
  recoveryEndTime: number;
  slotMachine: SlotMachineState;
  destroyedObstacleCount: number;
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
