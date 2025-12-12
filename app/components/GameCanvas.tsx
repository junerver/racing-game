'use client';

import { useRef, useEffect, useCallback } from 'react';
import { GameState } from '@/types/game';
import {
  GAME_CONFIG,
  ROAD_COLORS,
  POWERUP_CONFIG,
  COLLISION_RECOVERY_TIME,
  COLLISION_RECOVERY_VISUAL_TIME,
  getLanePositions,
} from '@/lib/game/constants';

interface GameCanvasProps {
  gameState: GameState;
  onTouchLeft?: (pressed: boolean) => void;
  onTouchRight?: (pressed: boolean) => void;
  onTouchCenter?: () => void;
}

export default function GameCanvas({ gameState, onTouchLeft, onTouchRight, onTouchCenter }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roadOffsetRef = useRef(0);

  // Draw a vehicle (car shape)
  const drawVehicle = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    isPlayer: boolean
  ) => {
    // Main body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y + height * 0.15, width, height * 0.7, 5);
    ctx.fill();

    // Top (cabin)
    ctx.fillStyle = isPlayer ? '#1e3a5f' : '#374151';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.1, y + height * 0.25, width * 0.8, height * 0.35, 3);
    ctx.fill();

    // Windows
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.28, width * 0.7, height * 0.15, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.45, width * 0.7, height * 0.12, 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1f2937';
    const wheelWidth = width * 0.2;
    const wheelHeight = height * 0.15;
    // Front wheels
    ctx.fillRect(x - 3, y + height * 0.2, wheelWidth, wheelHeight);
    ctx.fillRect(x + width - wheelWidth + 3, y + height * 0.2, wheelWidth, wheelHeight);
    // Rear wheels
    ctx.fillRect(x - 3, y + height * 0.65, wheelWidth, wheelHeight);
    ctx.fillRect(x + width - wheelWidth + 3, y + height * 0.65, wheelWidth, wheelHeight);

    // Headlights (only for player going up)
    if (isPlayer) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x + width * 0.25, y + height * 0.1, 5, 0, Math.PI * 2);
      ctx.arc(x + width * 0.75, y + height * 0.1, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Taillights for obstacles
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x + width * 0.25, y + height * 0.9, 4, 0, Math.PI * 2);
      ctx.arc(x + width * 0.75, y + height * 0.9, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Draw boss with different shapes based on boss level
  const drawBoss = useCallback((
    ctx: CanvasRenderingContext2D,
    boss: import('@/types/game').Boss
  ) => {
    // Determine boss shape based on level (cycle through 5 different shapes)
    const shapeIndex = Math.floor((boss.maxHealth - 1000) / 500) % 5;
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    // Create gradient
    const bossGradient = ctx.createLinearGradient(boss.x, boss.y, boss.x, boss.y + boss.height);
    bossGradient.addColorStop(0, boss.color);
    bossGradient.addColorStop(0.5, boss.color);
    bossGradient.addColorStop(1, '#000000');

    // Set shadow for glow effect
    ctx.shadowBlur = 25;
    ctx.shadowColor = boss.color;

    switch (shapeIndex) {
      case 0: {
        // Diamond/Rhombus Boss - 菱形战机
        ctx.fillStyle = bossGradient;
        ctx.beginPath();
        ctx.moveTo(centerX, boss.y); // Top point
        ctx.lineTo(boss.x + boss.width, centerY); // Right point
        ctx.lineTo(centerX, boss.y + boss.height); // Bottom point
        ctx.lineTo(boss.x, centerY); // Left point
        ctx.closePath();
        ctx.fill();

        // Inner accent lines
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f5ff';
        ctx.beginPath();
        ctx.moveTo(centerX, boss.y + 10);
        ctx.lineTo(boss.x + boss.width - 10, centerY);
        ctx.lineTo(centerX, boss.y + boss.height - 10);
        ctx.lineTo(boss.x + 10, centerY);
        ctx.closePath();
        ctx.stroke();

        // Energy core at center
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.5, boss.color);
        coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 1: {
        // Hexagon Boss - 六边形重装甲
        ctx.fillStyle = bossGradient;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x = centerX + Math.cos(angle) * boss.width / 2;
          const y = centerY + Math.sin(angle) * boss.height / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Hex grid pattern
        ctx.strokeStyle = '#ffbe0b';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffbe0b';
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x = centerX + Math.cos(angle) * (boss.width / 2 - 8);
          const y = centerY + Math.sin(angle) * (boss.height / 2 - 8);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Corner reinforcements
        ctx.fillStyle = boss.color;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x = centerX + Math.cos(angle) * boss.width / 2;
          const y = centerY + Math.sin(angle) * boss.height / 2;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 2: {
        // Star Boss - 五角星突击型
        ctx.fillStyle = bossGradient;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const radius = (i % 2 === 0) ? boss.width / 2 : boss.width / 4;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius * 0.8; // Slightly compressed vertically
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Inner star
        ctx.strokeStyle = '#8338ec';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#8338ec';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const radius = (i % 2 === 0) ? boss.width / 2 - 12 : boss.width / 4 - 5;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius * 0.8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Pulsing center
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 3: {
        // Triangle/Arrow Boss - 三角箭头型
        ctx.fillStyle = bossGradient;
        ctx.beginPath();
        ctx.moveTo(centerX, boss.y); // Top point
        ctx.lineTo(boss.x + boss.width, boss.y + boss.height); // Bottom right
        ctx.lineTo(boss.x, boss.y + boss.height); // Bottom left
        ctx.closePath();
        ctx.fill();

        // Wing details
        ctx.strokeStyle = '#06ffa5';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06ffa5';
        // Left wing line
        ctx.beginPath();
        ctx.moveTo(centerX, boss.y + 15);
        ctx.lineTo(boss.x + 15, boss.y + boss.height - 15);
        ctx.stroke();
        // Right wing line
        ctx.beginPath();
        ctx.moveTo(centerX, boss.y + 15);
        ctx.lineTo(boss.x + boss.width - 15, boss.y + boss.height - 15);
        ctx.stroke();

        // Cockpit window
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.moveTo(centerX, boss.y + 20);
        ctx.lineTo(centerX - 15, boss.y + 40);
        ctx.lineTo(centerX + 15, boss.y + 40);
        ctx.closePath();
        ctx.fill();

        // Engine exhausts
        for (let i = 0; i < 3; i++) {
          const x = boss.x + 20 + i * 30;
          const exhaustGradient = ctx.createLinearGradient(x, boss.y + boss.height - 10, x, boss.y + boss.height);
          exhaustGradient.addColorStop(0, boss.color);
          exhaustGradient.addColorStop(1, '#ff6b35');
          ctx.fillStyle = exhaustGradient;
          ctx.fillRect(x, boss.y + boss.height - 10, 8, 10);
        }
        break;
      }

      case 4: {
        // Cross/Plus Boss - 十字重炮型
        const armWidth = boss.width * 0.25;
        const armHeight = boss.height * 0.25;

        ctx.fillStyle = bossGradient;
        ctx.beginPath();
        // Horizontal bar
        ctx.rect(boss.x, centerY - armHeight / 2, boss.width, armHeight);
        // Vertical bar
        ctx.rect(centerX - armWidth / 2, boss.y, armWidth, boss.height);
        ctx.fill();

        // Weapon pods at ends
        const podRadius = 12;
        ctx.fillStyle = '#ff006e';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff006e';
        // Top pod
        ctx.beginPath();
        ctx.arc(centerX, boss.y, podRadius, 0, Math.PI * 2);
        ctx.fill();
        // Bottom pod
        ctx.beginPath();
        ctx.arc(centerX, boss.y + boss.height, podRadius, 0, Math.PI * 2);
        ctx.fill();
        // Left pod
        ctx.beginPath();
        ctx.arc(boss.x, centerY, podRadius, 0, Math.PI * 2);
        ctx.fill();
        // Right pod
        ctx.beginPath();
        ctx.arc(boss.x + boss.width, centerY, podRadius, 0, Math.PI * 2);
        ctx.fill();

        // Central reactor
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f5ff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
        ctx.stroke();

        const reactorGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 18);
        reactorGradient.addColorStop(0, '#ffffff');
        reactorGradient.addColorStop(0.6, boss.color);
        reactorGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = reactorGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.shadowBlur = 0;

    // Boss name tag
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(boss.x, boss.y - 30, boss.width, 25);
    ctx.fillStyle = boss.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 10;
    ctx.shadowColor = boss.color;
    ctx.fillText(boss.name, boss.x + boss.width / 2, boss.y - 17);
    ctx.shadowBlur = 0;

    // Boss health bar
    const healthBarWidth = boss.width;
    const healthBarHeight = 8;
    const healthPercent = boss.health / boss.maxHealth;

    // Health bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(boss.x, boss.y - 8, healthBarWidth, healthBarHeight);

    // Health bar fill (color changes based on health)
    let healthColor = '#10b981'; // Green
    if (healthPercent < 0.5) healthColor = '#f59e0b'; // Orange
    if (healthPercent < 0.2) healthColor = '#ef4444'; // Red

    ctx.fillStyle = healthColor;
    ctx.fillRect(boss.x, boss.y - 8, healthBarWidth * healthPercent, healthBarHeight);

    // Health bar border with glow
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 5;
    ctx.shadowColor = healthColor;
    ctx.strokeRect(boss.x, boss.y - 8, healthBarWidth, healthBarHeight);
    ctx.shadowBlur = 0;
  }, []);

  // Draw the game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { canvasWidth, canvasHeight, roadOffset, roadWidth } = GAME_CONFIG;

    // Clear canvas
    ctx.fillStyle = ROAD_COLORS.grass;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw road
    ctx.fillStyle = ROAD_COLORS.road;
    ctx.fillRect(roadOffset, 0, roadWidth, canvasHeight);

    // Draw road edges
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(roadOffset - 5, 0, 5, canvasHeight);
    ctx.fillRect(roadOffset + roadWidth, 0, 5, canvasHeight);

    // Draw moving lane lines - use a constant speed for visual consistency
    // This keeps road animation speed constant regardless of game speed
    const roadAnimationSpeed = 3; // Fixed speed matching initial game speed
    roadOffsetRef.current = (roadOffsetRef.current + roadAnimationSpeed) % 40;

    const lanes = getLanePositions();
    ctx.setLineDash([20, 20]);
    ctx.strokeStyle = ROAD_COLORS.line;
    ctx.lineWidth = 3;

    for (let i = 1; i < lanes.length; i++) {
      const x = roadOffset + (i * roadWidth) / lanes.length;
      ctx.beginPath();
      ctx.moveTo(x, -40 + roadOffsetRef.current);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Boss (if boss battle is active)
    if (gameState.bossBattle.active && gameState.bossBattle.boss) {
      drawBoss(ctx, gameState.bossBattle.boss);
    }

    // Draw boss attacks
    if (gameState.bossBattle.active) {
      for (const attack of gameState.bossBattle.attacks) {
        if (!attack.active) continue;

        if (attack.type === 'bullet') {
          // Boss bullet (different color from player)
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ff006e';
          ctx.fillStyle = '#ff006e';
          ctx.fillRect(attack.x - 2, attack.y, attack.width + 4, attack.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(attack.x, attack.y, attack.width, attack.height);
          ctx.shadowBlur = 0;
        } else if (attack.type === 'laser') {
          // Laser beam
          const gradient = ctx.createLinearGradient(attack.x, attack.y, attack.x + attack.width, attack.y);
          gradient.addColorStop(0, 'rgba(255, 0, 110, 0.3)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 110, 0.8)');
          gradient.addColorStop(1, 'rgba(255, 0, 110, 0.3)');

          ctx.fillStyle = gradient;
          ctx.fillRect(attack.x, attack.y, attack.width, attack.height);

          // Laser edges
          ctx.strokeStyle = '#ff006e';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff006e';
          ctx.strokeRect(attack.x, attack.y, attack.width, attack.height);
          ctx.shadowBlur = 0;
        } else if (attack.type === 'obstacle') {
          // Thrown obstacle
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#8338ec';
          ctx.fillStyle = '#8338ec';
          ctx.beginPath();
          ctx.roundRect(attack.x, attack.y, attack.width, attack.height, 5);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Warning stripes
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const y = attack.y + (i + 1) * (attack.height / 4);
            ctx.beginPath();
            ctx.moveTo(attack.x, y);
            ctx.lineTo(attack.x + attack.width, y);
            ctx.stroke();
          }
        }
      }
    }

    // Draw obstacles
    for (const obstacle of gameState.obstacles) {
      drawVehicle(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.color, false);
    }

    // Draw power-ups
    const magnetActive = gameState.activePowerUps.some(p => p.type === 'magnet');
    const vehicle = gameState.vehicle;

    for (const powerUp of gameState.powerUps) {
      if (powerUp.active) {
        const config = POWERUP_CONFIG[powerUp.type];
        const centerX = powerUp.x + powerUp.width / 2;
        const centerY = powerUp.y + powerUp.height / 2;

        // Magnet attraction visual effect
        if (magnetActive && vehicle) {
          const dx = vehicle.x + vehicle.width / 2 - centerX;
          const dy = vehicle.y + vehicle.height / 2 - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 * (1 - distance / 200);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(vehicle.x + vehicle.width / 2, vehicle.y + vehicle.height / 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // Pulsing glow effect
        const time = Date.now();
        const pulse = 1 + Math.sin(time / 200) * 0.2;
        const radius = powerUp.width / 2 * pulse;

        // Outer glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.color;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner circle
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, powerUp.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw icon
        if (powerUp.type === 'coin') {
          ctx.fillStyle = '#065f46';
          ctx.font = 'bold 24px sans-serif';
        } else {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 16px sans-serif';
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.icon, centerX, centerY);
      }
    }

    // Draw bullets
    for (const bullet of gameState.bullets) {
      if (bullet.active) {
        // Outer glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bullet.x - 2, bullet.y, bullet.width + 4, bullet.height);

        // Inner bright core
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
      }
    }

    // Draw player vehicle
    if (gameState.vehicle) {
      const { vehicle } = gameState;
      const isInvincible = gameState.activePowerUps.some(p => p.type === 'invincibility');
      const isRecovering = gameState.isRecovering;
      const remainingRecoveryTime = gameState.recoveryEndTime - performance.now();
      const showRecoveryEffect = isRecovering && remainingRecoveryTime > (COLLISION_RECOVERY_TIME - COLLISION_RECOVERY_VISUAL_TIME);
      const hasTurboOverload = gameState.activePowerUps.some(p => p.type === 'turbo_overload');
      const hasIronBody = gameState.activePowerUps.some(p => p.type === 'iron_body');
      const hasGoldenBell = gameState.activePowerUps.some(p => p.type === 'golden_bell');
      const hasInvincibleFireWheel = gameState.activePowerUps.some(p => p.type === 'invincible_fire_wheel');

      // Draw recovery shield (collision invincibility)
      if (showRecoveryEffect) {
        const time = Date.now();
        const pulseScale = 1 + Math.sin(time / 100) * 0.1;

        // Outer shield glow
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        ctx.beginPath();
        ctx.arc(
          vehicle.x + vehicle.width / 2,
          vehicle.y + vehicle.height / 2,
          Math.max(vehicle.width, vehicle.height) / 2 + 18 * pulseScale,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw invincibility shield
      if (isInvincible) {
        const time = Date.now();
        const rotation = (time / 1000) % (Math.PI * 2);

        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#8b5cf6';

        // Rotating shield effect
        for (let i = 0; i < 6; i++) {
          const angle = rotation + (i * Math.PI / 3);
          const x = vehicle.x + vehicle.width / 2 + Math.cos(angle) * 50;
          const y = vehicle.y + vehicle.height / 2 + Math.sin(angle) * 50;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Draw iron body or invincible fire wheel (triangle shield)
      if (hasIronBody || hasInvincibleFireWheel) {
        const time = Date.now();
        const rotation = (time / 800) % (Math.PI * 2);
        const centerX = vehicle.x + vehicle.width / 2;
        const centerY = vehicle.y + vehicle.height / 2;
        const radius = 55;

        ctx.strokeStyle = hasInvincibleFireWheel ? '#ef4444' : '#64748b';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = hasInvincibleFireWheel ? '#ef4444' : '#64748b';

        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const angle = rotation + (i * Math.PI * 2 / 3);
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw golden bell shield
      if (hasGoldenBell) {
        const time = Date.now();
        const pulse = 1 + Math.sin(time / 150) * 0.15;

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fbbf24';
        ctx.beginPath();
        ctx.arc(
          vehicle.x + vehicle.width / 2,
          vehicle.y + vehicle.height / 2,
          50 * pulse,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw turbo overload glow
      if (hasTurboOverload) {
        const time = Date.now();
        const pulse = Math.sin(time / 100) * 0.3 + 0.7;

        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff6b35';
        ctx.strokeStyle = `rgba(255, 107, 53, ${pulse})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(
          vehicle.x + vehicle.width / 2,
          vehicle.y + vehicle.height / 2,
          Math.max(vehicle.width, vehicle.height) / 2 + 20,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Flashing effect when recovering
      const shouldDraw = !showRecoveryEffect || Math.floor(Date.now() / 100) % 2 === 0;
      if (shouldDraw) {
        // Semi-transparent for turbo overload
        if (hasTurboOverload) {
          ctx.globalAlpha = 0.6;
        }
        drawVehicle(ctx, vehicle.x, vehicle.y, vehicle.width, vehicle.height, vehicle.config.color, true);
        ctx.globalAlpha = 1;
      }
    }

    // Death star beam effect
    const hasDeathStarBeam = gameState.activePowerUps.some(p => p.type === 'death_star_beam');
    if (hasDeathStarBeam && gameState.vehicle) {
      const vehicle = gameState.vehicle;
      const beamWidth = 60;
      const time = Date.now();

      // Main white beam
      const gradient = ctx.createLinearGradient(
        vehicle.x + vehicle.width / 2,
        vehicle.y,
        vehicle.x + vehicle.width / 2,
        0
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');

      ctx.fillStyle = gradient;
      ctx.fillRect(
        vehicle.x + vehicle.width / 2 - beamWidth / 2,
        0,
        beamWidth,
        vehicle.y
      );

      // Purple lightning stripes
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#8b5cf6';

      for (let i = 0; i < 5; i++) {
        const offset = (time / 50 + i * 100) % vehicle.y;
        ctx.beginPath();
        ctx.moveTo(vehicle.x + vehicle.width / 2 - beamWidth / 2, vehicle.y - offset);
        ctx.lineTo(vehicle.x + vehicle.width / 2 + beamWidth / 2, vehicle.y - offset - 20);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Purple glow on sides
      const pulse = Math.sin(time / 100) * 0.3 + 0.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#8b5cf6';
      ctx.strokeStyle = `rgba(139, 92, 246, ${pulse})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(vehicle.x + vehicle.width / 2 - beamWidth / 2, 0);
      ctx.lineTo(vehicle.x + vehicle.width / 2 - beamWidth / 2, vehicle.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vehicle.x + vehicle.width / 2 + beamWidth / 2, 0);
      ctx.lineTo(vehicle.x + vehicle.width / 2 + beamWidth / 2, vehicle.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Storm lightning effects
    const hasStormLightning = gameState.activePowerUps.some(p => p.type === 'storm_lightning');
    if (hasStormLightning) {
      const timeSinceStrike = performance.now() - gameState.lastLightningStrike;

      // White flash overlay during strike
      if (timeSinceStrike < 100) {
        const flashOpacity = 0.15 * (1 - timeSinceStrike / 100);
        ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Border glow effect
      const isStriking = timeSinceStrike < 300;
      if (isStriking) {
        const flashIntensity = 1 - (timeSinceStrike / 300);
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.8 * flashIntensity})`;
        ctx.lineWidth = 15;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#a855f7';
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
        ctx.shadowBlur = 0;
      } else {
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.4;
        ctx.strokeStyle = `rgba(168, 85, 247, ${pulse})`;
        ctx.lineWidth = 6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#a855f7';
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
        ctx.shadowBlur = 0;
      }
    }
  }, [gameState, drawVehicle]);

  // Animation loop for rendering
  useEffect(() => {
    let frameId: number;

    const animate = () => {
      draw();
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [draw]);

  // Handle touch/click controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behavior
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = GAME_CONFIG.canvasWidth / 2;
    const centerY = GAME_CONFIG.canvasHeight / 2;

    // Define center pause area (类似汉字"回"的中心"口"区域)
    // 中心区域：宽度60px，高度60px
    const centerAreaSize = 60;
    const centerAreaLeft = centerX - centerAreaSize / 2;
    const centerAreaRight = centerX + centerAreaSize / 2;
    const centerAreaTop = centerY - centerAreaSize / 2;
    const centerAreaBottom = centerY + centerAreaSize / 2;

    // Check if click is in center pause area
    if (
      x >= centerAreaLeft &&
      x <= centerAreaRight &&
      y >= centerAreaTop &&
      y <= centerAreaBottom
    ) {
      // Trigger pause/resume and stop event propagation
      e.stopPropagation();
      onTouchCenter?.();
      return;
    }

    // Define outer boundary (类似汉字"回"的外框)
    // 外框区域：距离中心区域各留出20px的空白
    const outerBoundary = centerAreaSize / 2 + 20;
    const isInOuterArea =
      Math.abs(x - centerX) > outerBoundary ||
      Math.abs(y - centerY) > outerBoundary;

    // Only trigger left/right controls outside the "回" shape
    if (isInOuterArea) {
      if (x < centerX) {
        onTouchLeft?.(true);
      } else {
        onTouchRight?.(true);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behavior
    onTouchLeft?.(false);
    onTouchRight?.(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.canvasWidth}
      height={GAME_CONFIG.canvasHeight}
      className="border-0 md:border-4 border-gray-700 md:rounded-lg shadow-2xl touch-none select-none w-full h-full md:w-auto md:h-auto"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none', objectFit: 'contain' }}
    />
  );
}
