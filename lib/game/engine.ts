// Game engine core - manages game loop and state

import {
  GameState,
  Vehicle,
  Obstacle,
  ObstacleType,
  PowerUp,
  VehicleConfig,
  InputState,
  PowerUpType,
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
import { getHighScore, getCoins, addCoins, spendCoins, addLeaderboardEntry, getSlotMachineFailureCount } from '@/lib/utils/storage';
import { getPlayerUsername } from '@/lib/utils/player';
import { createSlotMachineState, addCoinToSlotMachine, spinSlotMachine, calculateSlotMachineReward, completeSlotMachineSpin } from './slotmachine';
import { checkComboMatch, activateComboPowerUp, updateActivePowerUps, isPowerUpActive } from './combo';
import { MACHINE_GUN_COIN_REWARD, POWERUP_CONFIG } from './constants';
import {
  createBossBattleState,
  shouldTriggerBossBattle,
  createBoss,
  updateBossPhase,
  getPhaseConfig,
  selectBossAttackPattern,
  createBossAttack,
  updateBossAttacks,
  damageBoss,
  isBossDefeated,
  BOSS_POWERUP_TYPES,
  getBossNumber,
  updateBossPosition,
} from './boss';

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
  private accumulator: number;
  private readonly fixedTimeStep: number = 16.67; // Fixed 60 FPS
  private lastBossDistance: number = -1; // Track last boss spawn distance to prevent duplicates
  private lastStormLightning: number = 0; // Track storm lightning timing
  private lastBulletSpawn: number = 0; // Track bullet spawn timing
  private lastDeathStarDamage: number = 0; // Track death star beam damage timing
  private gameStartTime: number = 0; // Track game start time for duration calculation

  constructor() {
    this.state = this.createInitialState();
    this.inputState = { left: false, right: false, targetX: undefined, isDragging: false };
    this.lastObstacleSpawn = 0;
    this.lastPowerUpSpawn = 0;
    this.lastShopPowerUpSpawn = 0;
    this.lastHeartPowerUpSpawn = 0;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.onStateChange = null;
    this.accumulator = 0;
    this.lastBossDistance = -1;
    this.lastStormLightning = 0;
    this.lastBulletSpawn = 0;
    this.lastDeathStarDamage = 0;
    this.gameStartTime = 0;
  }

  // Helper function to safely add coins with cap
  private addCoinsWithCap(amount: number): void {
    const currentCoins = this.state.coins;
    const newAmount = Math.min(currentCoins + amount, 9999);
    this.state.coins = newAmount;
    addCoins(amount); // This function already has the cap
  }

  private createInitialState(): GameState {
    const slotMachine = createSlotMachineState();
    slotMachine.failureCount = getSlotMachineFailureCount();

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
      slotMachine,
      destroyedObstacleCount: 0,
      lastLightningStrike: 0,
      goldenBellCoinValue: 0,
      goldenBellCollided: false,
      goldenBellShieldBroken: false,
      bossBattle: createBossBattleState(),
      statistics: {
        powerUpStats: [],
        totalCoinsCollected: 0,
        totalDistanceTraveled: 0,
        totalObstaclesDestroyed: 0,
        bossRecords: [],
      },
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

    const slotMachine = createSlotMachineState();
    slotMachine.failureCount = getSlotMachineFailureCount();

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
    this.state.slotMachine = slotMachine;
    this.state.destroyedObstacleCount = 0;
    this.lastFrameTime = performance.now();
    this.gameStartTime = Date.now(); // Record game start time
    this.lastObstacleSpawn = this.lastFrameTime;
    this.lastPowerUpSpawn = this.lastFrameTime;
    this.lastShopPowerUpSpawn = this.lastFrameTime;
    this.lastHeartPowerUpSpawn = this.lastFrameTime;
    this.accumulator = 0;
    this.lastBossDistance = -1; // Reset boss tracking
    this.lastStormLightning = 0; // Reset storm lightning timer
    this.lastBulletSpawn = 0; // Reset bullet spawn timer
    this.lastDeathStarDamage = 0; // Reset death star damage timer

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
      this.accumulator = 0;
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

    // Update final statistics
    this.state.statistics.totalObstaclesDestroyed = this.state.destroyedObstacleCount;

    // Save leaderboard entry with statistics (local storage)
    if (this.state.vehicle) {
      addLeaderboardEntry({
        distance: Math.floor(this.state.distance / 1000), // Convert to km
        coins: this.state.coins,
        score: this.state.score,
        timestamp: Date.now(),
        vehicleName: this.state.vehicle.config.name,
        vehicleConfig: this.state.vehicle.config,
        statistics: this.state.statistics,
      });

      // Save to database via API (non-blocking)
      this.saveGameRecord();
    }

    this.notifyStateChange();
  }

  // Save game record to database
  private async saveGameRecord(): Promise<void> {
    if (!this.state.vehicle) return;

    try {
      const username = getPlayerUsername();
      // Calculate game duration from recorded start time
      const gameDuration = Math.max(1000, Date.now() - this.gameStartTime); // At least 1 second

      const response = await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          vehicleConfig: this.state.vehicle.config,
          distance: Math.floor(this.state.distance / 1000),
          score: this.state.score,
          coins: this.state.coins,
          hearts: this.state.hearts,
          maxSpeed: Math.floor(this.state.currentSpeed),
          obstaclesDestroyed: this.state.destroyedObstacleCount,
          gameDuration: Math.floor(gameDuration / 1000), // Convert to seconds
          difficultyLevel: this.state.difficultyLevel,
          bossDefeated: this.state.statistics.bossRecords.some(r => r.defeated),
          statistics: this.state.statistics,
        }),
      });

      if (!response.ok) {
        console.error('保存游戏记录失败:', await response.text());
      } else {
        const result = await response.json();
        console.log('✅ 游戏记录已保存到数据库:', result);
      }
    } catch (error) {
      console.error('❌ 保存游戏记录时出错:', error);
    }
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

  // Main game loop with fixed timestep
  private gameLoop = (): void => {
    if (this.state.status !== 'playing') return;

    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Clamp deltaTime to prevent spiral of death
    if (deltaTime > 250) deltaTime = 250;

    // Add to accumulator
    this.accumulator += deltaTime;

    // Update game logic at fixed timestep (60 FPS)
    while (this.accumulator >= this.fixedTimeStep) {
      this.update(this.fixedTimeStep, currentTime);
      this.accumulator -= this.fixedTimeStep;
    }

    this.notifyStateChange();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  // Update game state
  private update(deltaTime: number, currentTime: number): void {
    if (!this.state.vehicle) return;

    // Always use 1.0 as timeScale since we cap deltaTime at 16.67ms in gameLoop
    // This effectively locks the game to 60 FPS speed regardless of display refresh rate
    const timeScale = 1.0;

    // Update speed based on distance
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[this.state.difficultyLevel];
    const rocketFuelActive = isPowerUpActive(this.state.activePowerUps, 'rocket_fuel');
    const nitroBoostActive = isPowerUpActive(this.state.activePowerUps, 'nitro_boost');
    const speedBoostActive = isPowerUpActive(this.state.activePowerUps, 'speed_boost');
    const turboOverloadActive = isPowerUpActive(this.state.activePowerUps, 'turbo_overload');
    const hyperSpeedActive = isPowerUpActive(this.state.activePowerUps, 'hyper_speed');
    const supernovaActive = isPowerUpActive(this.state.activePowerUps, 'supernova_burst');

    if (!this.state.isRecovering) {
      const speedMultiplier = speedBoostActive ? 1.5 : (hyperSpeedActive ? 3 : 1);
      let targetSpeed = calculateGameSpeed(this.state.distance, this.state.maxSpeed) * speedMultiplier * difficultyMultiplier;

      if (supernovaActive) {
        targetSpeed = this.state.maxSpeed * 4 * difficultyMultiplier;
      } else if (turboOverloadActive) {
        targetSpeed = this.state.maxSpeed * 3 * difficultyMultiplier;
      } else if (rocketFuelActive) {
        targetSpeed = this.state.maxSpeed * 2 * difficultyMultiplier;
      } else if (nitroBoostActive) {
        targetSpeed = this.state.maxSpeed * difficultyMultiplier;
      }

      this.state.currentSpeed = targetSpeed;
    } else {
      if (nitroBoostActive) {
        this.state.currentSpeed = this.state.maxSpeed * difficultyMultiplier;
      } else {
        const targetSpeed = calculateGameSpeed(this.state.distance, this.state.maxSpeed) * difficultyMultiplier;
        this.state.currentSpeed = Math.min(
          this.state.currentSpeed + this.state.vehicle.stats.acceleration,
          targetSpeed
        );
      }
    }

    // Update distance (scaled by time) - but pause during boss battle
    if (!this.state.bossBattle.active) {
      this.state.distance += this.state.currentSpeed * timeScale;
    }
    this.state.statistics.totalDistanceTraveled = Math.floor(this.state.distance / 1000); // Convert to km

    // Update score (scaled by time)
    const scoreMultiplier = isPowerUpActive(this.state.activePowerUps, 'score_multiplier') ? 2 : 1;
    this.state.score += Math.floor(this.state.currentSpeed * scoreMultiplier * timeScale);

    // Check if should trigger boss battle
    const currentBossDistance = Math.floor(this.state.distance / 100000) * 100000;
    if (shouldTriggerBossBattle(this.state.distance) &&
      !this.state.bossBattle.active &&
      currentBossDistance !== this.lastBossDistance) {
      this.lastBossDistance = currentBossDistance;
      this.startBossBattle();
    }

    // Update difficulty
    const difficulty = calculateDifficulty(this.state.distance);
    this.state.difficulty = difficulty.level;

    // Update vehicle position based on input
    this.updateVehicle();

    // Boss battle logic
    if (this.state.bossBattle.active) {
      this.updateBossBattle(currentTime, deltaTime, timeScale);
    } else {
      // Normal game mode - spawn obstacles
      if (currentTime - this.lastObstacleSpawn > difficulty.obstacleSpawnRate) {
        this.spawnObstacle();
        this.lastObstacleSpawn = currentTime;
      }
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
    this.updateObstacles(timeScale);

    // Update power-ups
    this.updatePowerUps(timeScale);

    // Update active power-ups timer
    const previousPowerUps = [...this.state.activePowerUps];
    this.state.activePowerUps = updateActivePowerUps(this.state.activePowerUps, deltaTime);

    // Check if golden_bell expired without collision
    const goldenBellExpired = previousPowerUps.some(p => p.type === 'golden_bell') &&
      !this.state.activePowerUps.some(p => p.type === 'golden_bell');
    if (goldenBellExpired && !this.state.goldenBellCollided && this.state.goldenBellCoinValue > 0) {
      const reward = this.state.goldenBellCoinValue * 2;
      this.addCoinsWithCap(reward);
      this.state.goldenBellCoinValue = 0;
    }
    if (goldenBellExpired) {
      this.state.goldenBellCollided = false;
      this.state.goldenBellShieldBroken = false;
      this.state.goldenBellCoinValue = 0;
    }

    // Trigger recovery when shop power-ups expire
    if (previousPowerUps.length > this.state.activePowerUps.length) {
      const expiredShopPowerUp = previousPowerUps.length > 0 &&
        (['machine_gun', 'rocket_fuel', 'nitro_boost'] as const).some(type =>
          !isPowerUpActive(this.state.activePowerUps, type)
        );
      if (expiredShopPowerUp) {
        this.state.isRecovering = true;
        this.state.recoveryEndTime = currentTime + COLLISION_RECOVERY_TIME;
      }
    }

    // Update bullets
    this.updateBullets(timeScale);

    // Spawn bullets if machine gun or combo machine gun is active
    const hasQuadMachineGun = isPowerUpActive(this.state.activePowerUps, 'quad_machine_gun');
    const hasRotatingShieldGun = isPowerUpActive(this.state.activePowerUps, 'rotating_shield_gun');
    const hasMachineGun = isPowerUpActive(this.state.activePowerUps, 'machine_gun');
    const hasDeathStarBeam = isPowerUpActive(this.state.activePowerUps, 'death_star_beam');

    if (hasMachineGun || hasQuadMachineGun || hasRotatingShieldGun) {
      this.spawnBullet(hasQuadMachineGun, hasRotatingShieldGun);
    }

    // Death star beam - continuous beam effect
    if (hasDeathStarBeam && this.state.vehicle) {
      this.handleDeathStarBeam(currentTime);
    }

    // Storm lightning effect - clear all obstacles every 1.5 seconds
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

    // Note: Coin limit is now enforced in addCoins() function
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

    // 优先使用拖动跟随模式
    if (this.inputState.isDragging && this.inputState.targetX !== undefined) {
      // 拖动跟随：车辆平滑移动到目标位置
      // 目标位置是触摸点的 x 坐标，需要转换为车辆中心
      const targetVehicleX = this.inputState.targetX - VEHICLE_WIDTH / 2;
      const currentX = this.state.vehicle.x;
      const deltaX = targetVehicleX - currentX;

      // 使用车辆的 handling 属性限制移动速度
      // 这样车辆不会瞬移，而是以受限的速度跟随
      const maxMoveDistance = effectiveHandling;

      if (Math.abs(deltaX) > 0.5) {
        // 计算移动方向和距离
        const moveDistance = Math.min(Math.abs(deltaX), maxMoveDistance);
        const direction = deltaX > 0 ? 1 : -1;

        // 应用移动
        this.state.vehicle.x = Math.max(minX, Math.min(maxX, currentX + direction * moveDistance));
      }
    } else {
      // 传统的左右按键控制（桌面端或备用）
      if (this.inputState.left) {
        this.state.vehicle.x = Math.max(minX, this.state.vehicle.x - effectiveHandling);
      }
      if (this.inputState.right) {
        this.state.vehicle.x = Math.min(maxX, this.state.vehicle.x + effectiveHandling);
      }
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

    // Check if shield-based combo is active
    const hasShieldCombo = this.state.activePowerUps.some(p =>
      ['rotating_shield_gun', 'iron_body', 'golden_bell', 'invincible_fire_wheel'].includes(p.type)
    );

    // Include mystery_box in the spawn pool with equal probability
    const shopTypes: ('invincibility' | 'machine_gun' | 'rocket_fuel' | 'nitro_boost' | 'mystery_box')[] =
      hasShieldCombo
        ? ['machine_gun', 'rocket_fuel', 'nitro_boost', 'mystery_box']
        : ['invincibility', 'machine_gun', 'rocket_fuel', 'nitro_boost', 'mystery_box'];
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
  private updateObstacles(timeScale: number): void {
    this.state.obstacles = this.state.obstacles
      .map((obstacle) => ({
        ...obstacle,
        y: obstacle.y + (this.state.currentSpeed - obstacle.speed) * timeScale,
      }))
      .filter((obstacle) => !isOffScreen(obstacle, GAME_CONFIG.canvasHeight));
  }

  // Update power-up positions
  private updatePowerUps(timeScale: number): void {
    const magnetActive = this.state.activePowerUps.some(p => p.type === 'magnet');
    const superMagnetActive = isPowerUpActive(this.state.activePowerUps, 'super_magnet');
    const vehicleX = this.state.vehicle ? this.state.vehicle.x + this.state.vehicle.width / 2 : undefined;
    const vehicleY = this.state.vehicle ? this.state.vehicle.y + this.state.vehicle.height / 2 : undefined;

    this.state.powerUps = this.state.powerUps
      .map((powerUp) => updatePowerUpPosition(powerUp, this.state.currentSpeed * 0.7 * timeScale, vehicleX, vehicleY, magnetActive || superMagnetActive, superMagnetActive))
      .filter((powerUp) => !isOffScreen(powerUp, GAME_CONFIG.canvasHeight) && powerUp.active);
  }

  // Check all collisions
  private checkCollisions(currentTime: number): void {
    if (!this.state.vehicle) return;

    // Check obstacle collisions
    const invincible = isPowerUpActive(this.state.activePowerUps, 'invincibility') ||
      isPowerUpActive(this.state.activePowerUps, 'rotating_shield_gun') ||
      isPowerUpActive(this.state.activePowerUps, 'turbo_overload') ||
      isPowerUpActive(this.state.activePowerUps, 'golden_bell') ||
      isPowerUpActive(this.state.activePowerUps, 'time_dilation');
    const ironBody = isPowerUpActive(this.state.activePowerUps, 'iron_body');
    const invincibleFireWheel = isPowerUpActive(this.state.activePowerUps, 'invincible_fire_wheel');
    const supernovaActive = isPowerUpActive(this.state.activePowerUps, 'supernova_burst');

    // Supernova burst: destroy obstacles behind the vehicle (fire trail effect)
    if (supernovaActive && this.state.vehicle) {
      for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
        const obstacle = this.state.obstacles[i];
        // Destroy obstacles that are behind the vehicle (fire trail)
        if (obstacle.y > this.state.vehicle.y + this.state.vehicle.height) {
          this.state.obstacles.splice(i, 1);
          this.state.destroyedObstacleCount++;
          this.state.statistics.totalObstaclesDestroyed = this.state.destroyedObstacleCount;
          this.addCoinsWithCap(MACHINE_GUN_COIN_REWARD);
          this.state.statistics.totalCoinsCollected += MACHINE_GUN_COIN_REWARD;
        }
      }
    }

    if (!invincible && !ironBody && !invincibleFireWheel && !supernovaActive && !this.state.isRecovering) {
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
    } else if ((ironBody || invincibleFireWheel) && !this.state.isRecovering) {
      // Iron body or invincible fire wheel: destroy obstacles on collision
      for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
        const obstacle = this.state.obstacles[i];
        if (checkVehicleObstacleCollision(this.state.vehicle, obstacle)) {
          this.state.obstacles.splice(i, 1);
          this.state.destroyedObstacleCount++;
          this.state.statistics.totalObstaclesDestroyed = this.state.destroyedObstacleCount;
          this.state.coins += MACHINE_GUN_COIN_REWARD;
          this.state.statistics.totalCoinsCollected += MACHINE_GUN_COIN_REWARD;
          addCoins(MACHINE_GUN_COIN_REWARD);

          // Invincible fire wheel: extend duration by 0.25s
          if (invincibleFireWheel) {
            const fireWheelPowerUp = this.state.activePowerUps.find(p => p.type === 'invincible_fire_wheel');
            if (fireWheelPowerUp) {
              fireWheelPowerUp.remainingTime += 250;
              fireWheelPowerUp.totalDuration += 250;
            }
          }
        }
      }
    } else if (isPowerUpActive(this.state.activePowerUps, 'golden_bell') && !this.state.isRecovering) {
      // Golden bell: mark collision and break shield
      for (const obstacle of this.state.obstacles) {
        if (checkVehicleObstacleCollision(this.state.vehicle, obstacle)) {
          this.state.goldenBellCollided = true;
          this.state.goldenBellShieldBroken = true; // 破盾效果
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
          this.state.statistics.totalObstaclesDestroyed = this.state.destroyedObstacleCount;

          // Award coins for destroyed obstacles
          const coinReward = MACHINE_GUN_COIN_REWARD;
          this.addCoinsWithCap(coinReward);
          this.state.statistics.totalCoinsCollected += coinReward;

          break;
        }
      }
    }

    // Check power-up collisions
    for (const powerUp of this.state.powerUps) {
      if (powerUp.active && checkVehiclePowerUpCollision(this.state.vehicle, powerUp)) {
        powerUp.active = false;

        if (powerUp.type === 'mystery_box') {
          // Mystery box: randomly select one of the 4 shop power-ups
          const hasShieldCombo = this.state.activePowerUps.some(p =>
            ['rotating_shield_gun', 'iron_body', 'golden_bell', 'invincible_fire_wheel'].includes(p.type)
          );

          const shopPowerUps: ('invincibility' | 'machine_gun' | 'rocket_fuel' | 'nitro_boost')[] =
            hasShieldCombo
              ? ['machine_gun', 'rocket_fuel', 'nitro_boost']
              : ['invincibility', 'machine_gun', 'rocket_fuel', 'nitro_boost'];

          const selectedType = shopPowerUps[Math.floor(Math.random() * shopPowerUps.length)];

          // Track mystery_box collection separately
          this.trackPowerUpCollection('mystery_box', false);

          // Apply the selected power-up
          const comboType = checkComboMatch(selectedType, this.state.activePowerUps);
          if (comboType) {
            const activeComboPowerUp = activateComboPowerUp(comboType, performance.now());
            this.state.activePowerUps.pop();
            this.state.activePowerUps.push(activeComboPowerUp);
            this.trackPowerUpCollection(comboType, true);
          } else {
            const config = POWERUP_CONFIG[selectedType];
            const durationMultiplier = this.state.vehicle?.stats.powerUpDurationMultiplier ?? 1.0;
            const existingPowerUp = this.state.activePowerUps.find((p) => p.type === selectedType);

            if (existingPowerUp) {
              existingPowerUp.remainingTime += config.duration * durationMultiplier;
              existingPowerUp.totalDuration = existingPowerUp.remainingTime;
            } else {
              this.state.activePowerUps.push({
                type: selectedType,
                remainingTime: config.duration * durationMultiplier,
                startTime: performance.now(),
                totalDuration: config.duration * durationMultiplier,
              });
            }
            this.trackPowerUpCollection(selectedType, false);
          }
        } else if (powerUp.type === 'coin') {
          const coinValue = powerUp.value || 100;
          const comboType = checkComboMatch(powerUp.type, this.state.activePowerUps);

          if (comboType === 'double_coin') {
            this.addCoinsWithCap(coinValue * 2);
            this.state.statistics.totalCoinsCollected += coinValue * 2;
            this.state.activePowerUps.pop();
            this.trackPowerUpCollection(comboType, true);
          } else if (comboType === 'golden_bell') {
            // Golden bell: consume coin, don't add to balance or slot machine
            this.state.goldenBellCoinValue = coinValue;
            this.state.goldenBellCollided = false;
            this.state.activePowerUps.pop();
            const activeComboPowerUp = activateComboPowerUp(comboType, performance.now());
            this.state.activePowerUps.push(activeComboPowerUp);
            this.trackPowerUpCollection(comboType, true);
          } else {
            this.addCoinsWithCap(coinValue);
            this.state.statistics.totalCoinsCollected += coinValue;
            this.state.slotMachine = addCoinToSlotMachine(this.state.slotMachine, coinValue);
            this.trackPowerUpCollection(powerUp.type, false);
          }
        } else if (powerUp.type === 'heart') {
          const comboType = checkComboMatch(powerUp.type, this.state.activePowerUps);
          if (comboType === 'double_heart') {
            this.state.hearts = Math.min(this.state.hearts + 2, 3);
            this.state.activePowerUps.pop();
            this.trackPowerUpCollection(comboType, true);
          } else {
            this.state.hearts = Math.min(this.state.hearts + 1, 3);
            this.trackPowerUpCollection(powerUp.type, false);
          }
        } else {
          const comboType = checkComboMatch(powerUp.type, this.state.activePowerUps);
          if (comboType) {
            const activeComboPowerUp = activateComboPowerUp(comboType, performance.now());
            this.state.activePowerUps.pop();
            this.state.activePowerUps.push(activeComboPowerUp);
            this.trackPowerUpCollection(comboType, true);
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
            this.trackPowerUpCollection(powerUp.type, false);
          }
        }
      }
    }
  }

  // Purchase shop power-up
  purchaseShopPowerUp(type: import('@/types/game').PowerUpType): boolean {
    const config = POWERUP_CONFIG[type];
    if (!config.isSellable || !config.price) return false;

    // Special handling for full_recovery
    if (type === 'full_recovery') {
      // Only available when coins are at 9999 and hearts < 3
      if (this.state.coins < 9999 || this.state.hearts >= 3) return false;

      if (spendCoins(config.price)) {
        this.state.coins = getCoins();
        // Restore all hearts
        this.state.hearts = 3;
        // Grant 10 seconds invincibility
        this.state.isRecovering = true;
        this.state.recoveryEndTime = performance.now() + config.duration;
        this.notifyStateChange();
        return true;
      }
      return false;
    }

    // Prevent purchasing invincibility if shield-based combo is active
    if (type === 'invincibility') {
      const hasShieldCombo = this.state.activePowerUps.some(p =>
        ['rotating_shield_gun', 'iron_body', 'golden_bell', 'invincible_fire_wheel'].includes(p.type)
      );
      if (hasShieldCombo) return false;
    }

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
  private updateBullets(timeScale: number): void {
    this.state.bullets = this.state.bullets
      .map((bullet) => ({
        ...bullet,
        y: bullet.y - bullet.speed * timeScale,
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
  private handleStormLightning(currentTime: number): void {
    if (currentTime - this.lastStormLightning < 1000) return; // Every 1 second

    this.lastStormLightning = currentTime;
    this.state.lastLightningStrike = currentTime;

    // Clear all obstacles and award coins
    const obstacleCount = this.state.obstacles.length;
    this.state.obstacles = [];
    this.state.destroyedObstacleCount += obstacleCount;
    this.state.statistics.totalObstaclesDestroyed = this.state.destroyedObstacleCount;

    const coinReward = MACHINE_GUN_COIN_REWARD * obstacleCount;
    this.addCoinsWithCap(coinReward);
    this.state.statistics.totalCoinsCollected += coinReward;

    // Damage boss if in boss battle (15-25 damage per strike)
    if (this.state.bossBattle.active && this.state.bossBattle.boss) {
      const bossDamage = 15 + Math.floor(Math.random() * 11); // 15-25 damage
      this.state.bossBattle.boss = damageBoss(this.state.bossBattle.boss, bossDamage);
    }
  }

  // Death star beam handler
  private handleDeathStarBeam(currentTime: number): void {
    if (!this.state.vehicle) return;

    // Destroy all obstacles in front of vehicle
    for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.state.obstacles[i];
      if (obstacle.y < this.state.vehicle.y) {
        this.state.obstacles.splice(i, 1);
        this.state.destroyedObstacleCount++;
        this.state.statistics.totalObstaclesDestroyed = this.state.destroyedObstacleCount;
        this.addCoinsWithCap(MACHINE_GUN_COIN_REWARD);
        this.state.statistics.totalCoinsCollected += MACHINE_GUN_COIN_REWARD;
      }
    }

    // Damage boss if in boss battle - high frequency, low damage
    // Target: 25-30% of boss health over 10 seconds
    // For 1000 HP boss: 250-300 damage total
    // Frequency: every 100ms (10 times per second, 100 times in 10 seconds)
    // Damage per hit: 2.5-3 points (average 2.75, total ~275 damage)
    if (this.state.bossBattle.active && this.state.bossBattle.boss) {
      if (currentTime - this.lastDeathStarDamage >= 100) { // Every 100ms
        const bossDamage = 2 + Math.floor(Math.random() * 2); // 2-3 damage per hit
        this.state.bossBattle.boss = damageBoss(this.state.bossBattle.boss, bossDamage);
        this.lastDeathStarDamage = currentTime;
      }
    }
  }

  // Start boss battle
  private startBossBattle(): void {
    const boss = createBoss(this.state.distance);
    this.state.bossBattle = {
      active: true,
      boss,
      attacks: [],
      startTime: performance.now(),
      elapsedTime: 0,
      powerUpSpawnTimer: 0,
      bossDefeated: false,
    };

    // Clear existing obstacles
    this.state.obstacles = [];

    // Record boss encounter
    const bossNumber = getBossNumber(this.state.distance);
    this.state.statistics.bossRecords.push({
      bossNumber,
      distance: Math.floor(this.state.distance / 1000),
      defeated: false,
      elapsedTime: 0,
      powerUpsUsed: [],
      timestamp: Date.now(),
      bossShape: boss.shape,
      bossColor: boss.color,
      bossName: boss.name,
    });
  }

  // Update boss battle
  private updateBossBattle(currentTime: number, deltaTime: number, timeScale: number): void {
    if (!this.state.bossBattle.boss || !this.state.vehicle) return;

    // Update boss position (horizontal movement)
    this.state.bossBattle.boss = updateBossPosition(this.state.bossBattle.boss);

    const boss = this.state.bossBattle.boss;
    this.state.bossBattle.elapsedTime = currentTime - this.state.bossBattle.startTime;

    // Update boss phase
    this.state.bossBattle.boss = updateBossPhase(boss);
    const phaseConfig = getPhaseConfig(this.state.bossBattle.boss.phase);

    // Boss attack logic
    if (currentTime - boss.lastAttackTime > phaseConfig.attackInterval) {
      const attackPattern = selectBossAttackPattern(this.state.bossBattle.boss.phase);
      const newAttacks = createBossAttack(this.state.bossBattle.boss, attackPattern);
      this.state.bossBattle.attacks.push(...newAttacks);
      this.state.bossBattle.boss.lastAttackTime = currentTime;
    }

    // Update boss attacks
    this.state.bossBattle.attacks = updateBossAttacks(this.state.bossBattle.attacks, timeScale);

    // Check bullet-boss collision
    for (const bullet of this.state.bullets) {
      if (!bullet.active) continue;
      if (this.checkBulletBossCollision(bullet, this.state.bossBattle.boss)) {
        bullet.active = false;
        // Damage based on weapon type (machine gun does 5 damage per bullet)
        this.state.bossBattle.boss = damageBoss(this.state.bossBattle.boss, 5);
      }
    }

    // Check boss attack-vehicle collision
    for (const attack of this.state.bossBattle.attacks) {
      if (!attack.active) continue;
      if (this.checkBossAttackVehicleCollision(attack, this.state.vehicle)) {
        attack.active = false;

        // Check if player has invincibility
        const invincible = isPowerUpActive(this.state.activePowerUps, 'invincibility') ||
          isPowerUpActive(this.state.activePowerUps, 'rotating_shield_gun') ||
          isPowerUpActive(this.state.activePowerUps, 'turbo_overload') ||
          isPowerUpActive(this.state.activePowerUps, 'golden_bell') ||
          isPowerUpActive(this.state.activePowerUps, 'iron_body') ||
          isPowerUpActive(this.state.activePowerUps, 'invincible_fire_wheel') ||
          isPowerUpActive(this.state.activePowerUps, 'time_dilation') ||
          isPowerUpActive(this.state.activePowerUps, 'supernova_burst');

        if (!invincible && !this.state.isRecovering) {
          this.state.hearts--;
          this.state.isRecovering = true;
          this.state.recoveryEndTime = currentTime + COLLISION_RECOVERY_TIME;

          if (this.state.hearts <= 0) {
            this.gameOver();
            return;
          }
        } else if (isPowerUpActive(this.state.activePowerUps, 'golden_bell') && !this.state.isRecovering) {
          // Golden bell: mark collision and break shield in boss battle too
          this.state.goldenBellCollided = true;
          this.state.goldenBellShieldBroken = true;
        }
      }
    }

    // Boss power-up spawning
    this.state.bossBattle.powerUpSpawnTimer += deltaTime;
    if (this.state.bossBattle.powerUpSpawnTimer > phaseConfig.powerUpSpawnInterval) {
      if (Math.random() < phaseConfig.powerUpSpawnChance) {
        this.spawnBossPowerUp();
      }
      this.state.bossBattle.powerUpSpawnTimer = 0;
    }

    // Check if boss is defeated
    if (isBossDefeated(this.state.bossBattle.boss)) {
      this.endBossBattle(true);
    }
  }

  // End boss battle
  private endBossBattle(defeated: boolean): void {
    if (!this.state.bossBattle.boss) return;

    this.state.bossBattle.bossDefeated = defeated;

    // Update boss record
    const lastRecord = this.state.statistics.bossRecords[this.state.statistics.bossRecords.length - 1];
    if (lastRecord) {
      lastRecord.defeated = defeated;
      lastRecord.elapsedTime = this.state.bossBattle.elapsedTime;
      lastRecord.powerUpsUsed = this.state.activePowerUps.map(p => p.type);
    }

    // Reward for defeating boss
    if (defeated) {
      const bossNumber = getBossNumber(this.state.distance);
      const coinReward = 500 + bossNumber * 200;
      this.addCoinsWithCap(coinReward);

      // Heal one heart
      this.state.hearts = Math.min(this.state.hearts + 1, 3);

      // Spawn reward power-up wave
      this.spawnBossRewardWave();
    }

    // Reset boss battle state
    this.state.bossBattle = createBossBattleState();
  }

  // Spawn power-up wave as boss battle reward
  private spawnBossRewardWave(): void {
    const lanes = getLanePositions();
    const rewardTypes: PowerUpType[] = [
      'heart',
      'machine_gun',
      'invincibility',
      'score_multiplier',
      'speed_boost',
      'magnet',
      'coin',
      'coin',
    ];

    // Spawn 6-8 power-ups in a wave pattern
    const waveCount = 6 + Math.floor(Math.random() * 3);

    for (let i = 0; i < waveCount; i++) {
      const laneIndex = i % lanes.length;
      const type = rewardTypes[i % rewardTypes.length];
      const yOffset = -100 - (i * 80); // Staggered spawn

      const powerUp: PowerUp = {
        x: lanes[laneIndex] - POWERUP_SIZE / 2,
        y: yOffset,
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
        type,
        duration: POWERUP_CONFIG[type].duration,
        active: true,
        value: type === 'coin' ? 300 : undefined, // Bonus coin value
      };

      this.state.powerUps.push(powerUp);
    }
  }

  // Spawn power-up during boss battle
  private spawnBossPowerUp(): void {
    const lanes = getLanePositions();
    const laneIndex = Math.floor(Math.random() * lanes.length);

    const type = BOSS_POWERUP_TYPES[Math.floor(Math.random() * BOSS_POWERUP_TYPES.length)];

    const powerUp: PowerUp = {
      x: lanes[laneIndex] - POWERUP_SIZE / 2,
      y: -POWERUP_SIZE,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      type,
      duration: POWERUP_CONFIG[type].duration,
      active: true,
      value: type === 'coin' ? 200 : undefined,
    };

    this.state.powerUps.push(powerUp);
  }

  // Check bullet-boss collision
  private checkBulletBossCollision(
    bullet: import('@/types/game').Bullet,
    boss: import('@/types/game').Boss
  ): boolean {
    return (
      bullet.x < boss.x + boss.width &&
      bullet.x + bullet.width > boss.x &&
      bullet.y < boss.y + boss.height &&
      bullet.y + bullet.height > boss.y
    );
  }

  // Check boss attack-vehicle collision
  private checkBossAttackVehicleCollision(
    attack: import('@/types/game').BossAttack,
    vehicle: Vehicle
  ): boolean {
    return (
      attack.x < vehicle.x + vehicle.width &&
      attack.x + attack.width > vehicle.x &&
      attack.y < vehicle.y + vehicle.height &&
      attack.y + attack.height > vehicle.y
    );
  }

  // Track power-up statistics
  private trackPowerUpCollection(type: PowerUpType, isCombo: boolean = false): void {
    let stat = this.state.statistics.powerUpStats.find(s => s.type === type);
    if (!stat) {
      stat = { type, collected: 0, comboCrafted: 0 };
      this.state.statistics.powerUpStats.push(stat);
    }

    if (isCombo) {
      stat.comboCrafted++;
    } else {
      stat.collected++;
    }
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
          this.addCoinsWithCap(reward);
        } else if (reward < 0) {
          const currentCoins = getCoins();
          const newAmount = Math.max(0, currentCoins + reward);
          spendCoins(currentCoins - newAmount);
          this.state.coins = getCoins();
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
