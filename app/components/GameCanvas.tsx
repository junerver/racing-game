'use client';

import { useRef, useEffect, useCallback } from 'react';
import { GameState } from '@/types/game';
import {
  GAME_CONFIG,
  ROAD_COLORS,
  POWERUP_CONFIG,
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
    for (const powerUp of gameState.powerUps) {
      if (powerUp.active) {
        const config = POWERUP_CONFIG[powerUp.type];
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Draw icon
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          config.icon,
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2
        );
      }
    }

    // Draw player vehicle
    if (gameState.vehicle) {
      const { vehicle } = gameState;
      const isInvincible = gameState.activePowerUps.some(p => p.type === 'invincibility');

      // Draw invincibility shield
      if (isInvincible) {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          vehicle.x + vehicle.width / 2,
          vehicle.y + vehicle.height / 2,
          Math.max(vehicle.width, vehicle.height) / 2 + 10,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      drawVehicle(ctx, vehicle.x, vehicle.y, vehicle.width, vehicle.height, vehicle.config.color, true);
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
