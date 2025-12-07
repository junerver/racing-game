// Game engine core - manages game loop and state

import {
  GameState,
  GameStatus,
  Vehicle,
  Obstacle,
  ObstacleType,
  PowerUp,
  VehicleConfig,
  InputState,
  ActivePowerUp,
} from '@/types/game';
import {
  GAME_CONFIG,
  VEHICLE_WIDTH,
  VEHICLE_HEIGHT,
  OBSTACLE_DIMENSIONS,
  OBSTACLE_COLORS,
  SPEED,
  getLanePositions,
  calculateVehicleStats,
  DIFFICULTY,
  COLLISION_RECOVERY_TIME,
  COLLISION_KNOCKBACK,
} from './constants';
import {
  checkVehicleObstacleCollision,
  checkVehiclePowerUpCollision,
  isOffScreen,
} from './collision';
import { calculateDifficulty, calculateGameSpeed, getObstacleCount } from './difficulty';
import {
  createPowerUp,
  activatePowerUp,
  updateActivePowerUps,
  updatePowerUpPosition,
  getSpeedMultiplier,
  getScoreMultiplier,
  isInvincible,
  activateShopPowerUp,
  updateActiveShopPowerUps,
  isShopPowerUpActive,
} from './powerups';
import { getHighScore, getCoins, addCoins, spendCoins, addLeaderboardEntry } from '@/lib/utils/storage';

export class GameEngine {
  private state: GameState;
  private inputState: InputState;
  private lastObstacleSpawn: number;
  private lastPowerUpSpawn: number;
  private animationFrameId: number | null;
  private lastFrameTime: number;
  private onStateChange: ((state: GameState) => void) | null;

  constructor() {
    this.state = this.createInitialState();
    this.inputState = { left: false, right: false };
    this.lastObstacleSpawn = 0;
    this.lastPowerUpSpawn = 0;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.onStateChange = null;
  }

  private createInitialState(): GameState {
    return {
      status: 'idle',
      distance: 0,
      score: 0,
      currentSpeed: SPEED.initial,
      maxSpeed: SPEED.max,
      vehicle: null,
      obstacles: [],
      powerUps: [],
      activePowerUps: [],
      activeShopPowerUps: [],
      bullets: [],
      difficulty: 1,
      highScore: 0,
      coins: 0,
      hearts: 3,
      isRecovering: false,
      recoveryEndTime: 0,
    };
  }

  // Initialize vehicle with config
  initVehicle(config: VehicleConfig): void {
    const lanes = getLanePositions();
    const middleLane = Math.floor(lanes.length / 2);
    const stats = calculateVehicleStats(config);

    this.state.vehicle = {
      x: lanes[middleLane] - VEHICLE_WIDTH / 2,
      y: GAME_CONFIG.canvasHeight - VEHICLE_HEIGHT - 50,
      width: VEHICLE_WIDTH,
      height: VEHICLE_HEIGHT,
      config,
      stats,
      currentSpeed: 0,
      lane: middleLane,
    };

    this.state.maxSpeed = stats.maxSpeed;
    this.state.highScore = getHighScore();
    this.notifyStateChange();
  }

  // Set state change callback
  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  // Start the game
  start(): void {
    if (!this.state.vehicle) return;

    this.state.status = 'playing';
    this.state.distance = 0;
    this.state.score = 0;
    this.state.obstacles = [];
    this.state.powerUps = [];
    this.state.activePowerUps = [];
    this.state.activeShopPowerUps = [];
    this.state.bullets = [];
    this.state.currentSpeed = SPEED.initial;
    this.state.coins = getCoins();
    this.state.hearts = 3;
    this.state.isRecovering = false;
    this.state.recoveryEndTime = 0;
    this.lastFrameTime = performance.now();
    this.lastObstacleSpawn = this.lastFrameTime;
    this.lastPowerUpSpawn = this.lastFrameTime;

    this.notifyStateChange();
    this.gameLoop();
  }

  // Pause the game
  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.notifyStateChange();
    }
  }

  // Resume the game
  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing';
      this.lastFrameTime = performance.now();
      this.notifyStateChange();
      this.gameLoop();
    }
  }

  // End the game
  private gameOver(): void {
    this.state.status = 'game_over';
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Save leaderboard entry
    if (this.state.vehicle) {
      addLeaderboardEntry({
        distance: Math.floor(this.state.distance / 100),
        coins: this.state.coins,
        score: this.state.score,
        timestamp: Date.now(),
        vehicleName: this.state.vehicle.config.name,
      });
    }

    this.notifyStateChange();
  }

  // Reset game to initial state
  reset(): void {
    const vehicleConfig = this.state.vehicle?.config;
    this.state = this.createInitialState();
    if (vehicleConfig) {
      this.initVehicle(vehicleConfig);
    }
    this.notifyStateChange();
  }

  // Handle input
  setInput(input: Partial<InputState>): void {
    this.inputState = { ...this.inputState, ...input };
  }

  // Get current state
  getState(): GameState {
    return { ...this.state };
  }

  // Main game loop
  private gameLoop = (): void => {
    if (this.state.status !== 'playing') return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.update(deltaTime, currentTime);
    this.notifyStateChange();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  // Update game state
  private update(deltaTime: number, currentTime: number): void {
    if (!this.state.vehicle) return;

    // Update speed based on distance (skip if recovering from collision)
    if (!this.state.isRecovering) {
      const speedMultiplier = getSpeedMultiplier(this.state.activePowerUps);
      this.state.currentSpeed = calculateGameSpeed(this.state.distance, this.state.maxSpeed) * speedMultiplier;
    } else {
      // Gradually recover speed
      this.state.currentSpeed = Math.min(
        this.state.currentSpeed + this.state.vehicle.stats.acceleration,
        calculateGameSpeed(this.state.distance, this.state.maxSpeed)
      );
    }

    // Update distance
    this.state.distance += this.state.currentSpeed;

    // Update score
    const scoreMultiplier = getScoreMultiplier(this.state.activePowerUps);
    this.state.score += Math.floor(this.state.currentSpeed * scoreMultiplier);

    // Update difficulty
    const difficulty = calculateDifficulty(this.state.distance);
    this.state.difficulty = difficulty.level;

    // Update vehicle position based on input
    this.updateVehicle();

    // Spawn obstacles
    if (currentTime - this.lastObstacleSpawn > difficulty.obstacleSpawnRate) {
      this.spawnObstacle();
      this.lastObstacleSpawn = currentTime;
    }

    // Spawn power-ups
    if (currentTime - this.lastPowerUpSpawn > difficulty.powerUpSpawnRate) {
      this.spawnPowerUp();
      this.lastPowerUpSpawn = currentTime;
    }

    // Update obstacles
    this.updateObstacles();

    // Update power-ups
    this.updatePowerUps();

    // Update active power-ups timer
    this.state.activePowerUps = updateActivePowerUps(this.state.activePowerUps, deltaTime);

    // Update active shop power-ups timer
    this.state.activeShopPowerUps = updateActiveShopPowerUps(this.state.activeShopPowerUps, deltaTime);

    // Update bullets
    this.updateBullets();

    // Spawn bullets if machine gun is active
    if (isShopPowerUpActive(this.state.activeShopPowerUps, 'machine_gun')) {
      this.spawnBullet();
    }

    // Check collisions
    this.checkCollisions();

    // Handle recovery from collision
    if (this.state.isRecovering) {
      const nitroActive = isShopPowerUpActive(this.state.activeShopPowerUps, 'nitro_boost');
      if (nitroActive) {
        this.state.currentSpeed = this.state.maxSpeed;
        this.state.isRecovering = false;
        this.state.recoveryEndTime = 0;
      } else if (currentTime >= this.state.recoveryEndTime) {
        // Recovery period ended, restore normal state
        this.state.isRecovering = false;
        this.state.recoveryEndTime = 0;
      }
    }
  }

  // Update vehicle position
  private updateVehicle(): void {
    if (!this.state.vehicle) return;

    const handling = this.state.vehicle.stats.handling;
    const minX = GAME_CONFIG.roadOffset;
    const maxX = GAME_CONFIG.roadOffset + GAME_CONFIG.roadWidth - VEHICLE_WIDTH;

    if (this.inputState.left) {
      this.state.vehicle.x = Math.max(minX, this.state.vehicle.x - handling);
    }
    if (this.inputState.right) {
      this.state.vehicle.x = Math.min(maxX, this.state.vehicle.x + handling);
    }
  }

  // Spawn new obstacle
  private spawnObstacle(): void {
    const lanes = getLanePositions();
    const difficulty = calculateDifficulty(this.state.distance);
    const count = getObstacleCount(difficulty);

    const usedLanes = new Set<number>();

    for (let i = 0; i < count; i++) {
      let laneIndex: number;
      do {
        laneIndex = Math.floor(Math.random() * lanes.length);
      } while (usedLanes.has(laneIndex) && usedLanes.size < lanes.length);

      usedLanes.add(laneIndex);

      const types: ObstacleType[] = ['car', 'car', 'car', 'truck', 'bus'];
      const type = types[Math.floor(Math.random() * types.length)];
      const colors = OBSTACLE_COLORS[type];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const dimensions = OBSTACLE_DIMENSIONS[type];

      const obstacle: Obstacle = {
        x: lanes[laneIndex] - dimensions.width / 2,
        y: -dimensions.height,
        width: dimensions.width,
        height: dimensions.height,
        type,
        speed: SPEED.obstacle[type],
        lane: laneIndex,
        color,
      };

      this.state.obstacles.push(obstacle);
    }
  }

  // Spawn power-up
  private spawnPowerUp(): void {
    if (Math.random() > 0.5) return; // 50% chance to spawn

    const powerUp = createPowerUp();

    // Check if position overlaps with obstacles
    const overlaps = this.state.obstacles.some(
      (obs) => Math.abs(obs.y - powerUp.y) < 100 && Math.abs(obs.x - powerUp.x) < 50
    );

    if (!overlaps) {
      this.state.powerUps.push(powerUp);
    }
  }

  // Update obstacle positions
  private updateObstacles(): void {
    this.state.obstacles = this.state.obstacles
      .map((obstacle) => ({
        ...obstacle,
        y: obstacle.y + this.state.currentSpeed - obstacle.speed,
      }))
      .filter((obstacle) => !isOffScreen(obstacle, GAME_CONFIG.canvasHeight));
  }

  // Update power-up positions
  private updatePowerUps(): void {
    this.state.powerUps = this.state.powerUps
      .map((powerUp) => updatePowerUpPosition(powerUp, this.state.currentSpeed))
      .filter((powerUp) => !isOffScreen(powerUp, GAME_CONFIG.canvasHeight) && powerUp.active);
  }

  // Check all collisions
  private checkCollisions(): void {
    if (!this.state.vehicle) return;

    // Check obstacle collisions
    const invincible = isInvincible(this.state.activePowerUps) || isShopPowerUpActive(this.state.activeShopPowerUps, 'shop_invincibility');
    if (!invincible && !this.state.isRecovering) {
      for (let i = 0; i < this.state.obstacles.length; i++) {
        const obstacle = this.state.obstacles[i];
        if (checkVehicleObstacleCollision(this.state.vehicle, obstacle)) {
          // Collision penalty: reduce hearts, reset speed, lose all coins
          this.state.hearts--;
          this.state.currentSpeed = 0;
          this.state.coins = 0;

          // Set recovery time (invincibility period)
          this.state.isRecovering = true;
          this.state.recoveryEndTime = performance.now() + COLLISION_RECOVERY_TIME;

          // Knockback effect: move vehicle back
          this.state.vehicle.y = Math.min(
            this.state.vehicle.y + COLLISION_KNOCKBACK,
            GAME_CONFIG.canvasHeight - VEHICLE_HEIGHT - 50
          );

          // Remove the collided obstacle to prevent repeated collision
          this.state.obstacles.splice(i, 1);

          // Save coins to storage
          const { getCoins } = require('@/lib/utils/storage');
          const currentCoins = getCoins();
          if (currentCoins > 0) {
            require('@/lib/utils/storage').spendCoins(currentCoins);
          }

          // Check if game over (hearts == 0)
          if (this.state.hearts <= 0) {
            this.gameOver();
            return;
          }
          break;
        }
      }
    }

    // Check bullet-obstacle collisions
    for (const bullet of this.state.bullets) {
      if (!bullet.active) continue;
      for (const obstacle of this.state.obstacles) {
        if (this.checkBulletObstacleCollision(bullet, obstacle)) {
          bullet.active = false;
          this.state.obstacles = this.state.obstacles.filter(o => o !== obstacle);
          break;
        }
      }
    }

    // Check power-up collisions
    for (const powerUp of this.state.powerUps) {
      if (powerUp.active && checkVehiclePowerUpCollision(this.state.vehicle, powerUp)) {
        powerUp.active = false;

        if (powerUp.type === 'coin') {
          this.state.coins += 100;
          addCoins(100);
        } else {
          const activePowerUp = activatePowerUp(powerUp, performance.now());
          this.state.activePowerUps = this.state.activePowerUps.filter(
            (p) => p.type !== powerUp.type
          );
          this.state.activePowerUps.push(activePowerUp);
        }
      }
    }
  }

  // Purchase shop power-up
  purchaseShopPowerUp(type: import('@/types/game').ShopPowerUpType): boolean {
    const { SHOP_POWERUP_CONFIG } = require('./constants');
    const config = SHOP_POWERUP_CONFIG[type];

    if (spendCoins(config.price)) {
      this.state.coins = getCoins();
      const activeShopPowerUp = activateShopPowerUp(type, performance.now());
      this.state.activeShopPowerUps = this.state.activeShopPowerUps.filter(
        (p) => p.type !== type
      );
      this.state.activeShopPowerUps.push(activeShopPowerUp);
      this.notifyStateChange();
      return true;
    }
    return false;
  }

  // Spawn bullet
  private lastBulletSpawn = 0;
  private spawnBullet(): void {
    if (!this.state.vehicle) return;
    const now = performance.now();
    if (now - this.lastBulletSpawn < 200) return; // Fire rate limit

    this.lastBulletSpawn = now;
    const bullet: import('@/types/game').Bullet = {
      x: this.state.vehicle.x + this.state.vehicle.width / 2 - 2,
      y: this.state.vehicle.y - 10,
      width: 4,
      height: 10,
      speed: 15,
      active: true,
    };
    this.state.bullets.push(bullet);
  }

  // Update bullets
  private updateBullets(): void {
    this.state.bullets = this.state.bullets
      .map((bullet) => ({
        ...bullet,
        y: bullet.y - bullet.speed,
      }))
      .filter((bullet) => bullet.active && bullet.y > -bullet.height);
  }

  // Check bullet-obstacle collision
  private checkBulletObstacleCollision(bullet: import('@/types/game').Bullet, obstacle: Obstacle): boolean {
    return (
      bullet.x < obstacle.x + obstacle.width &&
      bullet.x + bullet.width > obstacle.x &&
      bullet.y < obstacle.y + obstacle.height &&
      bullet.y + bullet.height > obstacle.y
    );
  }

  // Cleanup
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// Singleton instance
let gameEngineInstance: GameEngine | null = null;

export const getGameEngine = (): GameEngine => {
  if (!gameEngineInstance) {
    gameEngineInstance = new GameEngine();
  }
  return gameEngineInstance;
};

export const resetGameEngine = (): void => {
  if (gameEngineInstance) {
    gameEngineInstance.destroy();
  }
  gameEngineInstance = null;
};
