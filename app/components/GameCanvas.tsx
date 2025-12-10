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
}

export default function GameCanvas({ gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roadOffsetRef = useRef(0);

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

    // Draw moving lane lines
    roadOffsetRef.current = (roadOffsetRef.current + gameState.currentSpeed) % 40;

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
  }, [gameState]);

  // Draw a vehicle (car shape)
  const drawVehicle = (
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
  };

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

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.canvasWidth}
      height={GAME_CONFIG.canvasHeight}
      className="border-4 border-gray-700 rounded-lg shadow-2xl"
    />
  );
}
