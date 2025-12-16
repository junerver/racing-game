// Game entity types and interfaces

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export type Rectangle = Position & Dimensions;

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
  // Special shop power-ups
  | 'full_recovery'
  // Combo power-ups
  | 'rotating_shield_gun' | 'quad_machine_gun' | 'storm_lightning' | 'double_heart' | 'double_coin'
  | 'turbo_overload' | 'iron_body' | 'golden_bell' | 'death_star_beam' | 'invincible_fire_wheel';

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
  failureCount: number; // 失败次数（用于保底机制）
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
  lastLightningStrike: number;
  goldenBellCoinValue: number;
  goldenBellCollided: boolean;
  goldenBellShieldBroken: boolean; // 金钟罩是否已破盾
  // Boss battle
  bossBattle: BossBattleState;
  // Statistics
  statistics: GameStatistics;
}

// Input state
export interface InputState {
  left: boolean;
  right: boolean;
  targetX?: number; // 目标 x 位置（用于拖动跟随）
  isDragging?: boolean; // 是否正在拖动
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

// Boss battle types
export type BossPhase = 1 | 2 | 3;
export type BossShape = 'diamond' | 'hexagon' | 'star' | 'triangle' | 'cross';

export interface Boss extends Rectangle {
  health: number;
  maxHealth: number;
  phase: BossPhase;
  lastAttackTime: number;
  attackPattern: 'machine_gun' | 'laser' | 'throw_obstacle';
  color: string;
  name: string;
  velocityX: number; // Horizontal movement speed
  direction: 1 | -1; // Movement direction (1 = right, -1 = left)
  shape: BossShape; // Boss形态
}

export interface BossAttack extends Rectangle {
  type: 'bullet' | 'laser' | 'obstacle';
  speed: number;
  active: boolean;
  damage: number;
}

export interface BossBattleState {
  active: boolean;
  boss: Boss | null;
  attacks: BossAttack[];
  startTime: number;
  elapsedTime: number;
  powerUpSpawnTimer: number;
  bossDefeated: boolean;
}

// Storage types
export type SavedVehicle = VehicleConfig;

export interface PowerUpStats {
  type: PowerUpType;
  collected: number;
  comboCrafted: number;
}

export interface BossRecord {
  bossNumber: number;
  distance: number;
  defeated: boolean;
  elapsedTime: number;
  powerUpsUsed: PowerUpType[];
  timestamp: number;
  bossShape?: BossShape; // Boss形态，用于显示剪影（可选，向后兼容）
  bossColor?: string; // Boss颜色（可选，向后兼容）
  bossName?: string; // Boss名称（可选，向后兼容）
}

export interface GameStatistics {
  powerUpStats: PowerUpStats[];
  totalCoinsCollected: number;
  totalDistanceTraveled: number;
  totalObstaclesDestroyed: number;
  bossRecords: BossRecord[];
}

export interface LeaderboardEntry {
  id: string;
  distance: number;
  coins: number;
  score: number;
  timestamp: number;
  vehicleName: string;
  vehicleConfig: VehicleConfig;
  statistics?: GameStatistics; // 添加详细统计
}

export interface GameSave {
  highScore: number;
  totalDistance: number;
  gamesPlayed: number;
  selectedVehicle: SavedVehicle | null;
  coins: number;
  leaderboard: LeaderboardEntry[];
  slotMachineFailureCount: number;
}
