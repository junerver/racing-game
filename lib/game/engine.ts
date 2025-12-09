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
  DIFFICULTY_MULTIPLIERS,
  COLLISION_RECOVERY_TIME,
  COLLISION_KNOCKBACK,
  POWERUP_SIZE,
} from './constants';
import {
  checkVehicleObstacleCollision,
  checkVehiclePowerUpCollision,
  isOffScreen,
} from './collision';
import { calculateDifficulty, calculateGameSpeed, getObstacleCount } from './difficulty';
import { createPowerUp, updatePowerUpPosition } from './powerups';
import { getHighScore, getCoins, addCoins, spendCoins, addLeaderboardEntry } from '@/lib/utils/storage';
import { createSlotMachineState, addCoinToSlotMachine, spinSlotMachine, calculateSlotMachineReward, completeSlotMachineSpin } from './slotmachine';
import { checkComboMatch, activateComboPowerUp, updateActivePowerUps, isPowerUpActive } from './combo';
import { MACHINE_GUN_COIN_REWARD, POWERUP_CONFIG } from './constants';

export class GameEngine {
  private state: GameState;
  private inputState: InputState;
  private lastObstacleSpawn: number;
  private lastPowerUpSpawn: number;
  private lastShopPowerUpSpawn: number;
  private lastHeartPowerUpSpawn: number;
  private animationFrameId: number | null;
  private lastFrameTime: number;
  private onStateChange: ((state: GameState) => void) | null;

  constructor() {
    this.state = this.createInitialState();
    this.inputState = { left: false, right: false };
    this.lastObstacleSpawn = 0;
    this.lastPowerUpSpawn = 0;
    this.lastShopPowerUpSpawn = 0;
    this.lastHeartPowerUpSpawn = 0;
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
      bullets: [],
      difficulty: 1,
      difficultyLevel: 'medium',
      highScore: 0,
      coins: 0,
      hearts: 3,
      isRecovering: false,
      recoveryEndTime: 0,
      slotMachine: createSlotMachineState(),
      destroyedObstacleCount: 0,
      lastLightningStrike: 0,
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

  // Set difficulty level
  setDifficultyLevel(level: import('@/types/game').DifficultyLevel): void {
    this.state.difficultyLevel = level;
    this.notifyStateChange();
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
    this.state.bullets = [];
    this.state.currentSpeed = SPEED.initial;
    this.state.coins = 0;
    this.state.hearts = 3;
    this.state.isRecovering = false;
    this.state.recoveryEndTime = 0;
    this.state.slotMachine = createSlotMachineState();
    this.state.destroyedObstacleCount = 0;
    this.lastFrameTime = performance.now();
    this.lastObstacleSpawn = this.lastFrameTime;
    this.lastPowerUpSpawn = this.lastFrameTime;
    this.lastShopPowerUpSpawn = this.lastFrameTime;
    this.lastHeartPowerUpSpawn = this.lastFrameTime;

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
        vehicleConfig: this.state.vehicle.config,
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

    // Update speed based on distance
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[this.state.difficultyLevel];
    const rocketFuelActive = isPowerUpActive(this.state.activePowerUps, 'rocket_fuel');
    const nitroBoostActive = isPowerUpActive(this.state.activePowerUps, 'nitro_boost');
    const speedBoostActive = isPowerUpActive(this.state.activePowerUps, 'speed_boost');

    if (!this.state.isRecovering) {
      const speedMultiplier = speedBoostActive ? 1.5 : 1;
      let targetSpeed = calculateGameSpeed(this.state.distance, this.state.maxSpeed) * speedMultiplier * difficultyMultiplier;

      if (rocketFuelActive) {
        targetSpeed = this.state.maxSpeed * 2 * difficultyMultiplier;
      } else if (nitroBoostActive) {
        targetSpeed = this.state.maxSpeed * difficultyMultiplier;
      }

      this.state.currentSpeed = targetSpeed;
    } else {
      if (nitroBoostActive) {
        this.state.currentSpeed = this.state.maxSpeed * difficultyMultiplier;
      } else {
        let targetSpeed = calculateGameSpeed(this.state.distance, this.state.maxSpeed) * difficultyMultiplier;
        this.state.currentSpeed = Math.min(
          this.state.currentSpeed + this.state.vehicle.stats.acceleration,
          targetSpeed
        );
      }
    }

    // Update distance
    this.state.distance += this.state.currentSpeed;

    // Update score
    const scoreMultiplier = isPowerUpActive(this.state.activePowerUps, 'score_multiplier') ? 2 : 1;
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

    // Spawn basic power-ups (every 2 seconds)
    if (currentTime - this.lastPowerUpSpawn > 2000) {
      const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[this.state.difficultyLevel];
      const spawnChance = difficultyMultiplier === 0.7 ? 1.2 : difficultyMultiplier === 1.2 ? 0.8 : 1.0;
      if (Math.random() < spawnChance) {
        this.spawnPowerUp();
      }
      this.lastPowerUpSpawn = currentTime;
    }

    // Spawn shop power-ups (every 30 seconds)
    if (currentTime - this.lastShopPowerUpSpawn > 30000) {
      const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[this.state.difficultyLevel];
      const spawnChance = difficultyMultiplier === 0.7 ? 1.2 : difficultyMultiplier === 1.2 ? 0.8 : 1.0;
      if (Math.random() < spawnChance) {
        this.spawnShopPowerUp();
      }
      this.lastShopPowerUpSpawn = currentTime;
    }

    // Spawn heart power-ups when hearts <= 1 and hearts < 3
    if (this.state.hearts <= 1 && currentTime - this.lastHeartPowerUpSpawn > 30000) {
      const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[this.state.difficultyLevel];
      const spawnChance = difficultyMultiplier === 0.7 ? 0.8 : difficultyMultiplier === 1.2 ? 0.5 : 0.65;
      if (Math.random() < spawnChance) {
        this.spawnHeartPowerUp();
      }
      this.lastHeartPowerUpSpawn = currentTime;
    }

    // Update obstacles
    this.updateObstacles();

    // Update power-ups
    this.updatePowerUps();

    // Update active power-ups timer
    const previousPowerUpsCount = this.state.activePowerUps.length;
    this.state.activePowerUps = updateActivePowerUps(this.state.activePowerUps, deltaTime);

    // Trigger recovery when shop power-ups expire
    if (previousPowerUpsCount > this.state.activePowerUps.length) {
      const expiredShopPowerUp = previousPowerUpsCount > 0 &&
        ['machine_gun', 'rocket_fuel', 'nitro_boost'].some(type =>
          !isPowerUpActive(this.state.activePowerUps, type as any)
        );
      if (expiredShopPowerUp) {
        this.state.isRecovering = true;
        this.state.recoveryEndTime = currentTime + COLLISION_RECOVERY_TIME;
      }
    }

    // Update bullets
    this.updateBullets();

    // Spawn bullets if machine gun or combo machine gun is active
    const hasQuadMachineGun = isPowerUpActive(this.state.activePowerUps, 'quad_machine_gun');
    const hasRotatingShieldGun = isPowerUpActive(this.state.activePowerUps, 'rotating_shield_gun');
    const hasMachineGun = isPowerUpActive(this.state.activePowerUps, 'machine_gun');

    if (hasMachineGun || hasQuadMachineGun || hasRotatingShieldGun) {
      this.spawnBullet(hasQuadMachineGun, hasRotatingShieldGun);
    }

    // Storm lightning effect - clear all obstacles every 2 seconds
    if (isPowerUpActive(this.state.activePowerUps, 'storm_lightning')) {
      this.handleStormLightning(currentTime);
    }

    // Check collisions
    this.checkCollisions(currentTime);

    // Handle recovery from collision
    if (this.state.isRecovering && currentTime >= this.state.recoveryEndTime) {
      this.state.isRecovering = false;
      this.state.recoveryEndTime = 0;
    }

    // Check coin limit and convert to health
    if (this.state.coins >= 9999) {
      if (this.state.hearts < 3) {
        this.state.hearts++;
        this.state.coins = 0;
      } else {
        this.state.coins = 9999;
      }
    }
  }

  // Update vehicle position
  private updateVehicle(): void {
    if (!this.state.vehicle) return;

    const handling = this.state.vehicle.stats.handling;
    const stability = this.state.vehicle.stats.handlingStability;
    const minX = GAME_CONFIG.roadOffset;
    const maxX = GAME_CONFIG.roadOffset + GAME_CONFIG.roadWidth - VEHICLE_WIDTH;

    // 平衡机制：稳定性越低，转向越灵敏但更难控制
    // 高等级轮胎会有"过度转向"效果
    const effectiveHandling = handling / stability;

    if (this.inputState.left) {
      this.state.vehicle.x = Math.max(minX, this.state.vehicle.x - effectiveHandling);
    }
    if (this.inputState.right) {
      this.state.vehicle.x = Math.min(maxX, this.state.vehicle.x + effectiveHandling);
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

  // Spawn basic power-up
  private spawnPowerUp(): void {
    const powerUp = createPowerUp(this.state.difficultyLevel);

    // Check if position has safe distance from obstacles
    const hasSafeDistance = !this.state.obstacles.some(
      (obs) => Math.abs(obs.y - powerUp.y) < 250 && Math.abs(obs.x - powerUp.x) < 60
    );

    if (hasSafeDistance) {
      this.state.powerUps.push(powerUp);
    }
  }

  // Spawn shop power-up
  private spawnShopPowerUp(): void {
    const lanes = getLanePositions();
    const laneIndex = Math.floor(Math.random() * lanes.length);
    const shopTypes: ('invincibility' | 'machine_gun' | 'rocket_fuel' | 'nitro_boost')[] = ['invincibility', 'machine_gun', 'rocket_fuel', 'nitro_boost'];
    const type = shopTypes[Math.floor(Math.random() * shopTypes.length)];

    const powerUp: PowerUp = {
      x: lanes[laneIndex] - POWERUP_SIZE / 2,
      y: -POWERUP_SIZE,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      type,
      duration: POWERUP_CONFIG[type].duration,
      active: true,
    };

    // Check if position has safe distance from obstacles
    const hasSafeDistance = !this.state.obstacles.some(
      (obs) => Math.abs(obs.y - powerUp.y) < 250 && Math.abs(obs.x - powerUp.x) < 60
    );

    if (hasSafeDistance) {
      this.state.powerUps.push(powerUp);
    }
  }

  // Spawn heart power-up
  private spawnHeartPowerUp(): void {
    const lanes = getLanePositions();
    const laneIndex = Math.floor(Math.random() * lanes.length);

    const powerUp: PowerUp = {
      x: lanes[laneIndex] - POWERUP_SIZE / 2,
      y: -POWERUP_SIZE,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      type: 'heart',
      duration: 0,
      active: true,
    };

    const hasSafeDistance = !this.state.obstacles.some(
      (obs) => Math.abs(obs.y - powerUp.y) < 250 && Math.abs(obs.x - powerUp.x) < 60
    );

    if (hasSafeDistance) {
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
    const magnetActive = this.state.activePowerUps.some(p => p.type === 'magnet');
    const vehicleX = this.state.vehicle ? this.state.vehicle.x + this.state.vehicle.width / 2 : undefined;
    const vehicleY = this.state.vehicle ? this.state.vehicle.y + this.state.vehicle.height / 2 : undefined;

    this.state.powerUps = this.state.powerUps
      .map((powerUp) => updatePowerUpPosition(powerUp, this.state.currentSpeed * 0.7, vehicleX, vehicleY, magnetActive))
      .filter((powerUp) => !isOffScreen(powerUp, GAME_CONFIG.canvasHeight) && powerUp.active);
  }

  // Check all collisions
  private checkCollisions(currentTime: number): void {
    if (!this.state.vehicle) return;

    // Check obstacle collisions
    const invincible = isPowerUpActive(this.state.activePowerUps, 'invincibility') ||
      isPowerUpActive(this.state.activePowerUps, 'rotating_shield_gun');
    if (!invincible && !this.state.isRecovering) {
      for (let i = 0; i < this.state.obstacles.length; i++) {
        const obstacle = this.state.obstacles[i];
        if (checkVehicleObstacleCollision(this.state.vehicle, obstacle)) {
          // Collision penalty: reduce hearts, reset speed
          this.state.hearts--;
          this.state.currentSpeed = 0;

          // Set recovery time (invincibility period)
          this.state.isRecovering = true;
          this.state.recoveryEndTime = currentTime + COLLISION_RECOVERY_TIME;

          // Knockback effect: move vehicle back
          this.state.vehicle.y = Math.min(
            this.state.vehicle.y + COLLISION_KNOCKBACK,
            GAME_CONFIG.canvasHeight - VEHICLE_HEIGHT - 50
          );

          // Remove the collided obstacle to prevent repeated collision
          this.state.obstacles.splice(i, 1);

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
          this.state.destroyedObstacleCount++;

          // Award coins for destroyed obstacles
          const coinReward = MACHINE_GUN_COIN_REWARD;
          this.state.coins += coinReward;
          addCoins(coinReward);

          break;
        }
      }
    }

    // Check power-up collisions
    for (const powerUp of this.state.powerUps) {
      if (powerUp.active && checkVehiclePowerUpCollision(this.state.vehicle, powerUp)) {
        powerUp.active = false;

        if (powerUp.type === 'coin') {
          const coinValue = powerUp.value || 100;
          const comboType = checkComboMatch(powerUp.type, this.state.activePowerUps);

          if (comboType === 'double_coin') {
            this.state.coins += coinValue * 2;
            addCoins(coinValue * 2);
            this.state.activePowerUps.pop(); // Remove score_multiplier
          } else {
            this.state.coins += coinValue;
            addCoins(coinValue);
          }
          this.state.slotMachine = addCoinToSlotMachine(this.state.slotMachine, coinValue);
        } else if (powerUp.type === 'heart') {
          const comboType = checkComboMatch(powerUp.type, this.state.activePowerUps);
          if (comboType === 'double_heart') {
            this.state.hearts = Math.min(this.state.hearts + 2, 3);
            this.state.activePowerUps.pop(); // Remove last power-up
          } else {
            this.state.hearts = Math.min(this.state.hearts + 1, 3);
          }
        } else {
          const comboType = checkComboMatch(powerUp.type, this.state.activePowerUps);
          if (comboType) {
            const activeComboPowerUp = activateComboPowerUp(comboType, performance.now());
            this.state.activePowerUps.pop(); // Remove last power-up
            this.state.activePowerUps.push(activeComboPowerUp);
          } else {
            const config = POWERUP_CONFIG[powerUp.type];
            const durationMultiplier = this.state.vehicle?.stats.powerUpDurationMultiplier ?? 1.0;
            const existingPowerUp = this.state.activePowerUps.find((p) => p.type === powerUp.type);

            if (existingPowerUp) {
              existingPowerUp.remainingTime += config.duration * durationMultiplier;
              existingPowerUp.totalDuration = existingPowerUp.remainingTime;
            } else {
              this.state.activePowerUps.push({
                type: powerUp.type,
                remainingTime: config.duration * durationMultiplier,
                startTime: performance.now(),
                totalDuration: config.duration * durationMultiplier,
              });
            }
          }
        }
      }
    }
  }

  // Purchase shop power-up
  purchaseShopPowerUp(type: import('@/types/game').PowerUpType): boolean {
    const config = POWERUP_CONFIG[type];
    if (!config.isSellable || !config.price) return false;

    if (spendCoins(config.price)) {
      this.state.coins = getCoins();

      const comboType = checkComboMatch(type, this.state.activePowerUps);
      if (comboType) {
        const activeComboPowerUp = activateComboPowerUp(comboType, performance.now());
        this.state.activePowerUps.pop();
        this.state.activePowerUps.push(activeComboPowerUp);
      } else {
        const existingPowerUp = this.state.activePowerUps.find((p) => p.type === type);
        if (existingPowerUp) {
          existingPowerUp.remainingTime += config.duration;
          existingPowerUp.totalDuration = existingPowerUp.remainingTime;
        } else {
          this.state.activePowerUps.push({
            type,
            remainingTime: config.duration,
            startTime: performance.now(),
            totalDuration: config.duration,
          });
        }
      }

      this.notifyStateChange();
      return true;
    }
    return false;
  }

  // Spawn bullet
  private lastBulletSpawn = 0;
  private spawnBullet(isQuadGun: boolean = false, isRotatingGun: boolean = false): void {
    if (!this.state.vehicle) return;
    const now = performance.now();
    if (now - this.lastBulletSpawn < 200) return; // Fire rate limit

    this.lastBulletSpawn = now;

    if (isQuadGun) {
      // Four-lane machine gun
      const bullets: import('@/types/game').Bullet[] = [
        {
          x: this.state.vehicle.x + this.state.vehicle.width * 0.15 - 2,
          y: this.state.vehicle.y - 10,
          width: 4,
          height: 10,
          speed: 15,
          active: true,
        },
        {
          x: this.state.vehicle.x + this.state.vehicle.width * 0.35 - 2,
          y: this.state.vehicle.y - 10,
          width: 4,
          height: 10,
          speed: 15,
          active: true,
        },
        {
          x: this.state.vehicle.x + this.state.vehicle.width * 0.65 - 2,
          y: this.state.vehicle.y - 10,
          width: 4,
          height: 10,
          speed: 15,
          active: true,
        },
        {
          x: this.state.vehicle.x + this.state.vehicle.width * 0.85 - 2,
          y: this.state.vehicle.y - 10,
          width: 4,
          height: 10,
          speed: 15,
          active: true,
        },
      ];
      this.state.bullets.push(...bullets);
    } else if (isRotatingGun) {
      // Rotating shield gun - circular pattern
      const centerX = this.state.vehicle.x + this.state.vehicle.width / 2;
      const centerY = this.state.vehicle.y + this.state.vehicle.height / 2;
      const radius = 40;
      const angleOffset = (now / 100) % (Math.PI * 2); // Rotate over time

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8 + angleOffset;
        this.state.bullets.push({
          x: centerX + Math.cos(angle) * radius - 2,
          y: centerY + Math.sin(angle) * radius - 5,
          width: 4,
          height: 10,
          speed: 15,
          active: true,
        });
      }
    } else {
      // Standard two-lane machine gun
      const leftBullet: import('@/types/game').Bullet = {
        x: this.state.vehicle.x + this.state.vehicle.width * 0.25 - 2,
        y: this.state.vehicle.y - 10,
        width: 4,
        height: 10,
        speed: 15,
        active: true,
      };
      const rightBullet: import('@/types/game').Bullet = {
        x: this.state.vehicle.x + this.state.vehicle.width * 0.75 - 2,
        y: this.state.vehicle.y - 10,
        width: 4,
        height: 10,
        speed: 15,
        active: true,
      };
      this.state.bullets.push(leftBullet, rightBullet);
    }
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

  // Storm lightning effect handler
  private lastStormLightning = 0;
  private handleStormLightning(currentTime: number): void {
    if (currentTime - this.lastStormLightning < 1500) return; // Every 1.5 seconds

    this.lastStormLightning = currentTime;
    this.state.lastLightningStrike = currentTime;

    // Clear all obstacles and award coins
    const obstacleCount = this.state.obstacles.length;
    this.state.obstacles = [];
    this.state.destroyedObstacleCount += obstacleCount;

    const coinReward = MACHINE_GUN_COIN_REWARD * obstacleCount;
    this.state.coins += coinReward;
    addCoins(coinReward);
  }

  // Trigger slot machine spin
  triggerSlotMachine(): void {
    if (this.state.slotMachine.isActive && !this.state.slotMachine.isSpinning) {
      this.state.slotMachine = spinSlotMachine(this.state.slotMachine);
      this.notifyStateChange();

      // Simulate spin completion after delay
      setTimeout(() => {
        let reward = calculateSlotMachineReward(
          this.state.slotMachine.results,
          this.state.slotMachine.poolAmount
        );

        // Check for double coin power-up
        const doubleCoinIndex = this.state.activePowerUps.findIndex(p => p.type === 'double_coin');
        if (doubleCoinIndex !== -1 && reward > 0) {
          reward *= 2;
          this.state.activePowerUps.splice(doubleCoinIndex, 1);
        }

        if (reward > 0) {
          this.state.coins += reward;
          addCoins(reward);
        } else if (reward < 0) {
          this.state.coins = Math.max(0, this.state.coins + reward);
          spendCoins(-reward);
        }

        this.state.slotMachine = completeSlotMachineSpin(this.state.slotMachine);
        this.notifyStateChange();
      }, 2500); // Spin duration + delay
    }
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
