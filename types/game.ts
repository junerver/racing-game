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
export type PowerUpType = 'speed_boost' | 'invincibility' | 'magnet' | 'score_multiplier';

export interface PowerUp extends Rectangle {
  type: PowerUpType;
  duration: number;
  active: boolean;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  startTime: number;
}

// Game state
export type GameStatus = 'idle' | 'playing' | 'paused' | 'game_over';

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
  difficulty: number;
  highScore: number;
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

export interface GameSave {
  highScore: number;
  totalDistance: number;
  gamesPlayed: number;
  selectedVehicle: SavedVehicle | null;
}
