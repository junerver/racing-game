'use client';

import { useRef, useEffect, useCallback } from 'react';
import { GameState } from '@/types/game';
import {
  GAME_CONFIG,
  ROAD_COLORS,
  POWERUP_CONFIG,
  SHOP_POWERUP_CONFIG,
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
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.icon, centerX, centerY);
      }
    }

    // Draw bullets
    for (const bullet of gameState.bullets) {
      if (bullet.active) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }
    }

    // Draw player vehicle
    if (gameState.vehicle) {
      const { vehicle } = gameState;
      const isInvincible = gameState.activePowerUps.some(p => p.type === 'invincibility') ||
                           gameState.activeShopPowerUps.some(p => p.type === 'shop_invincibility');
      const isRecovering = gameState.isRecovering;

      // Draw recovery shield (collision invincibility)
      if (isRecovering) {
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
          Math.max(vehicle.width, vehicle.height) / 2 + 12 * pulseScale,
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
          const x = vehicle.x + vehicle.width / 2 + Math.cos(angle) * 35;
          const y = vehicle.y + vehicle.height / 2 + Math.sin(angle) * 35;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Flashing effect when recovering
      const shouldDraw = !isRecovering || Math.floor(Date.now() / 100) % 2 === 0;
      if (shouldDraw) {
        drawVehicle(ctx, vehicle.x, vehicle.y, vehicle.width, vehicle.height, vehicle.config.color, true);
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
