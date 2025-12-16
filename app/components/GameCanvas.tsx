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
  onDrag?: (targetX: number | undefined, isDragging: boolean) => void;
}

export default function GameCanvas({ gameState, onTouchLeft, onTouchRight, onTouchCenter, onDrag }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roadOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const centerClickedRef = useRef(false);

  // 辅助函数：调整颜色亮度
  const adjustBrightness = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // 🏎️ Sports Car - 流线型跑车（高速、灵敏）
  const drawSportsCar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    // 轮子 - 在车身外侧
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - 4, y + height * 0.12, 8, height * 0.12);
    ctx.fillRect(x + width - 4, y + height * 0.12, 8, height * 0.12);
    ctx.fillRect(x - 4, y + height * 0.76, 8, height * 0.12);
    ctx.fillRect(x + width - 4, y + height * 0.76, 8, height * 0.12);

    // 车身渐变
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, adjustBrightness(color, -20));
    gradient.addColorStop(0.5, adjustBrightness(color, 30));
    gradient.addColorStop(1, adjustBrightness(color, -20));

    // 主车身 - 流线型
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.2, y + height * 0.05);
    ctx.lineTo(x + width * 0.8, y + height * 0.05);
    ctx.quadraticCurveTo(x + width, y + height * 0.1, x + width, y + height * 0.3);
    ctx.lineTo(x + width, y + height * 0.7);
    ctx.quadraticCurveTo(x + width, y + height * 0.9, x + width * 0.8, y + height * 0.95);
    ctx.lineTo(x + width * 0.2, y + height * 0.95);
    ctx.quadraticCurveTo(x, y + height * 0.9, x, y + height * 0.7);
    ctx.lineTo(x, y + height * 0.3);
    ctx.quadraticCurveTo(x, y + height * 0.1, x + width * 0.2, y + height * 0.05);
    ctx.closePath();
    ctx.fill();

    // 车顶/驾驶舱
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.28, width * 0.7, height * 0.38, 5);
    ctx.fill();

    // 挡风玻璃
    ctx.fillStyle = '#38bdf8';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(x + width * 0.2, y + height * 0.30, width * 0.6, height * 0.14, 3);
    ctx.fill();
    // 后窗
    ctx.beginPath();
    ctx.roundRect(x + width * 0.2, y + height * 0.50, width * 0.6, height * 0.12, 3);
    ctx.fill();
    ctx.globalAlpha = 1;

    // LED大灯
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fef08a';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.07, width * 0.25, height * 0.04, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + width * 0.6, y + height * 0.07, width * 0.25, height * 0.04, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 尾灯
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.88, width * 0.2, height * 0.04, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + width * 0.65, y + height * 0.88, width * 0.2, height * 0.04, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 赛车条纹
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.42, y + height * 0.08);
    ctx.lineTo(x + width * 0.42, y + height * 0.92);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.58, y + height * 0.08);
    ctx.lineTo(x + width * 0.58, y + height * 0.92);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 速度标志
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', x + width * 0.5, y + height * 0.75);
  }, []);

  // 🚗 Sedan - 经典轿车（均衡、金币加成）
  const drawSedan = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    // 轮子
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - 4, y + height * 0.12, 8, height * 0.12);
    ctx.fillRect(x + width - 4, y + height * 0.12, 8, height * 0.12);
    ctx.fillRect(x - 4, y + height * 0.76, 8, height * 0.12);
    ctx.fillRect(x + width - 4, y + height * 0.76, 8, height * 0.12);

    // 车身渐变
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, adjustBrightness(color, 20));
    gradient.addColorStop(1, adjustBrightness(color, -20));

    // 主车身
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y + height * 0.08, width, height * 0.84, 6);
    ctx.fill();

    // 车顶
    ctx.fillStyle = '#1e3a5f';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.1, y + height * 0.22, width * 0.8, height * 0.45, 5);
    ctx.fill();

    // 挡风玻璃
    ctx.fillStyle = '#60a5fa';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.25, width * 0.7, height * 0.15, 3);
    ctx.fill();
    // 侧窗
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.42, width * 0.3, height * 0.12, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + width * 0.55, y + height * 0.42, width * 0.3, height * 0.12, 2);
    ctx.fill();
    // 后窗
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.56, width * 0.7, height * 0.08, 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 大灯
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#fef08a';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.1, y + height * 0.10, width * 0.25, height * 0.05, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + width * 0.65, y + height * 0.10, width * 0.25, height * 0.05, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 尾灯
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.1, y + height * 0.85, width * 0.2, height * 0.04, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + width * 0.7, y + height * 0.85, width * 0.2, height * 0.04, 2);
    ctx.fill();

    // 金币装饰（Sedan特色 - 金币加成）
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y + height * 0.75, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x + width * 0.5, y + height * 0.75);
  }, []);

  // 🚙 SUV - 越野车（机枪加成、稳定）
  const drawSUV = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    // 大轮子
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - 5, y + height * 0.10, 10, height * 0.14);
    ctx.fillRect(x + width - 5, y + height * 0.10, 10, height * 0.14);
    ctx.fillRect(x - 5, y + height * 0.76, 10, height * 0.14);
    ctx.fillRect(x + width - 5, y + height * 0.76, 10, height * 0.14);

    // 车身渐变
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, adjustBrightness(color, 15));
    gradient.addColorStop(1, adjustBrightness(color, -15));

    // 主车身 - 高大方正
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y + height * 0.05, width, height * 0.90, 5);
    ctx.fill();

    // 车顶
    ctx.fillStyle = '#1e3a5f';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.08, y + height * 0.15, width * 0.84, height * 0.52, 4);
    ctx.fill();

    // 挡风玻璃
    ctx.fillStyle = '#60a5fa';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(x + width * 0.12, y + height * 0.18, width * 0.76, height * 0.18, 3);
    ctx.fill();
    // 侧窗
    ctx.beginPath();
    ctx.roundRect(x + width * 0.12, y + height * 0.38, width * 0.35, height * 0.15, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + width * 0.53, y + height * 0.38, width * 0.35, height * 0.15, 2);
    ctx.fill();
    // 后窗
    ctx.beginPath();
    ctx.roundRect(x + width * 0.12, y + height * 0.55, width * 0.76, height * 0.08, 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 大灯
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#fef08a';
    ctx.fillRect(x + width * 0.08, y + height * 0.07, width * 0.2, height * 0.05);
    ctx.fillRect(x + width * 0.72, y + height * 0.07, width * 0.2, height * 0.05);
    ctx.shadowBlur = 0;

    // 尾灯
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + width * 0.08, y + height * 0.88, width * 0.18, height * 0.04);
    ctx.fillRect(x + width * 0.74, y + height * 0.88, width * 0.18, height * 0.04);

    // 车顶行李架
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(x + width * 0.2, y + height * 0.12, width * 0.6, height * 0.02);

    // 机枪装饰（SUV特色 - 机枪加成）
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(x + width * 0.45, y + height * 0.70, width * 0.1, height * 0.12);
    ctx.fillStyle = '#374151';
    ctx.fillRect(x + width * 0.43, y + height * 0.68, width * 0.14, height * 0.04);
    ctx.fillStyle = '#ef4444';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔫', x + width * 0.5, y + height * 0.85);
  }, []);

  // 🛻 Pickup - 皮卡（高耐久、低速）
  const drawPickup = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    // 大轮子
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - 5, y + height * 0.08, 10, height * 0.14);
    ctx.fillRect(x + width - 5, y + height * 0.08, 10, height * 0.14);
    ctx.fillRect(x - 5, y + height * 0.78, 10, height * 0.14);
    ctx.fillRect(x + width - 5, y + height * 0.78, 10, height * 0.14);

    // 车身渐变
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, adjustBrightness(color, 10));
    gradient.addColorStop(1, adjustBrightness(color, -20));

    // 驾驶舱
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y + height * 0.05, width, height * 0.45, 5);
    ctx.fill();

    // 货箱
    ctx.fillStyle = adjustBrightness(color, -15);
    ctx.beginPath();
    ctx.roundRect(x, y + height * 0.52, width, height * 0.43, 4);
    ctx.fill();

    // 货箱内部
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.08, y + height * 0.56, width * 0.84, height * 0.35, 3);
    ctx.fill();

    // 车顶
    ctx.fillStyle = '#1e3a5f';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.08, y + height * 0.12, width * 0.84, height * 0.32, 4);
    ctx.fill();

    // 挡风玻璃
    ctx.fillStyle = '#60a5fa';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(x + width * 0.12, y + height * 0.15, width * 0.76, height * 0.12, 3);
    ctx.fill();
    // 侧窗
    ctx.beginPath();
    ctx.roundRect(x + width * 0.12, y + height * 0.29, width * 0.76, height * 0.12, 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 大灯
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#fef08a';
    ctx.fillRect(x + width * 0.08, y + height * 0.06, width * 0.2, height * 0.04);
    ctx.fillRect(x + width * 0.72, y + height * 0.06, width * 0.2, height * 0.04);
    ctx.shadowBlur = 0;

    // 尾灯
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + width * 0.08, y + height * 0.90, width * 0.18, height * 0.04);
    ctx.fillRect(x + width * 0.74, y + height * 0.90, width * 0.18, height * 0.04);

    // 保险杠
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(x + width * 0.1, y + height * 0.02, width * 0.8, height * 0.025);

    // 爱心装饰（Pickup特色 - 高耐久）
    ctx.fillStyle = '#ef4444';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', x + width * 0.5, y + height * 0.72);
  }, []);

  // Draw a vehicle based on type
  const drawVehicle = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    isPlayer: boolean,
    vehicleType?: import('@/types/game').VehicleType
  ) => {
    if (isPlayer && vehicleType) {
      switch (vehicleType) {
        case 'sports':
          drawSportsCar(ctx, x, y, width, height, color);
          return;
        case 'sedan':
          drawSedan(ctx, x, y, width, height, color);
          return;
        case 'suv':
          drawSUV(ctx, x, y, width, height, color);
          return;
        case 'pickup':
          drawPickup(ctx, x, y, width, height, color);
          return;
      }
    }

    // 默认车辆绘制（障碍物）- 简化版
    // 轮子
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - 3, y + height * 0.15, 6, height * 0.1);
    ctx.fillRect(x + width - 3, y + height * 0.15, 6, height * 0.1);
    ctx.fillRect(x - 3, y + height * 0.75, 6, height * 0.1);
    ctx.fillRect(x + width - 3, y + height * 0.75, 6, height * 0.1);

    // 车身
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y + height * 0.1, width, height * 0.8, 5);
    ctx.fill();

    // 车顶
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.roundRect(x + width * 0.1, y + height * 0.22, width * 0.8, height * 0.4, 3);
    ctx.fill();

    // 车窗
    ctx.fillStyle = '#60a5fa';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.25, width * 0.7, height * 0.15, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + width * 0.15, y + height * 0.45, width * 0.7, height * 0.12, 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 尾灯
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + width * 0.25, y + height * 0.85, 4, 0, Math.PI * 2);
    ctx.arc(x + width * 0.75, y + height * 0.85, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [drawSportsCar, drawSedan, drawSUV, drawPickup]);

  // Draw boss with different shapes based on boss.shape property
  const drawBoss = useCallback((
    ctx: CanvasRenderingContext2D,
    boss: import('@/types/game').Boss
  ) => {
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

    switch (boss.shape) {
      case 'diamond': {
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

      case 'hexagon': {
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

      case 'star': {
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

      case 'triangle': {
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

      case 'cross': {
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
      const hasHyperSpeed = gameState.activePowerUps.some(p => p.type === 'hyper_speed');
      const hasSuperMagnet = gameState.activePowerUps.some(p => p.type === 'super_magnet');
      const hasTimeDilation = gameState.activePowerUps.some(p => p.type === 'time_dilation');
      const hasSupernovaBurst = gameState.activePowerUps.some(p => p.type === 'supernova_burst');

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

      // Draw golden bell shield (or invincibility shield if broken)
      if (hasGoldenBell) {
        const time = Date.now();

        // 如果金钟罩已破盾，显示无敌护盾效果
        if (gameState.goldenBellShieldBroken) {
          const rotation = (time / 1000) % (Math.PI * 2);

          ctx.strokeStyle = '#8b5cf6';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#8b5cf6';

          // Rotating shield effect (same as invincibility)
          for (let i = 0; i < 6; i++) {
            const angle = rotation + (i * Math.PI / 3);
            const x = vehicle.x + vehicle.width / 2 + Math.cos(angle) * 50;
            const y = vehicle.y + vehicle.height / 2 + Math.sin(angle) * 50;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        } else {
          // 未破盾时显示金钟罩效果
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

      // Draw hyper speed (极速狂飙) - golden trail effect
      if (hasHyperSpeed) {
        const time = Date.now();
        const trailLength = 8;

        for (let i = 0; i < trailLength; i++) {
          const alpha = (1 - i / trailLength) * 0.6;
          const offset = i * 8;

          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#fbbf24';
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.strokeRect(
            vehicle.x - 2,
            vehicle.y + vehicle.height + offset,
            vehicle.width + 4,
            2
          );
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Draw super magnet (超级磁铁) - full screen attraction field
      if (hasSuperMagnet) {
        const time = Date.now();
        const pulse = Math.sin(time / 150) * 0.2 + 0.8;

        // Draw expanding circles
        for (let i = 0; i < 3; i++) {
          const radius = 80 + i * 40 + (time / 20) % 40;
          const alpha = (1 - (radius - 80) / 120) * 0.4;

          ctx.strokeStyle = `rgba(236, 72, 153, ${alpha * pulse})`;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#ec4899';
          ctx.beginPath();
          ctx.arc(
            vehicle.x + vehicle.width / 2,
            vehicle.y + vehicle.height / 2,
            radius,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // Draw time dilation (时间膨胀) - enhanced invincibility with time distortion
      if (hasTimeDilation) {
        const time = Date.now();
        const rotation = (time / 1500) % (Math.PI * 2);

        // Double ring effect
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8b5cf6';

        // Outer ring
        for (let i = 0; i < 8; i++) {
          const angle = rotation + (i * Math.PI / 4);
          const x = vehicle.x + vehicle.width / 2 + Math.cos(angle) * 60;
          const y = vehicle.y + vehicle.height / 2 + Math.sin(angle) * 60;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inner ring (counter-rotating)
        for (let i = 0; i < 6; i++) {
          const angle = -rotation + (i * Math.PI / 3);
          const x = vehicle.x + vehicle.width / 2 + Math.cos(angle) * 40;
          const y = vehicle.y + vehicle.height / 2 + Math.sin(angle) * 40;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Draw supernova burst (超新星爆发) - flame trail destroying obstacles
      if (hasSupernovaBurst) {
        const time = Date.now();
        const trailLength = 12;

        for (let i = 0; i < trailLength; i++) {
          const alpha = (1 - i / trailLength) * 0.8;
          const offset = i * 10;
          const width = vehicle.width + i * 3;
          const xOffset = (vehicle.width - width) / 2;

          // Flame gradient
          const gradient = ctx.createLinearGradient(
            vehicle.x + vehicle.width / 2,
            vehicle.y + vehicle.height + offset,
            vehicle.x + vehicle.width / 2,
            vehicle.y + vehicle.height + offset + 15
          );
          gradient.addColorStop(0, `rgba(255, 107, 53, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(251, 191, 36, ${alpha * 0.7})`);
          gradient.addColorStop(1, `rgba(239, 68, 68, ${alpha * 0.3})`);

          ctx.fillStyle = gradient;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#ff6b35';
          ctx.fillRect(
            vehicle.x + xOffset,
            vehicle.y + vehicle.height + offset,
            width,
            15
          );
        }
        ctx.shadowBlur = 0;
      }

      // Flashing effect when recovering
      const shouldDraw = !showRecoveryEffect || Math.floor(Date.now() / 100) % 2 === 0;
      if (shouldDraw) {
        // Semi-transparent for turbo overload
        if (hasTurboOverload) {
          ctx.globalAlpha = 0.6;
        }
        drawVehicle(ctx, vehicle.x, vehicle.y, vehicle.width, vehicle.height, vehicle.config.color, true, vehicle.config.type);
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
  }, [gameState, drawVehicle, drawBoss]);

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

  // Handle touch/click controls with drag support
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
      // Mark that center was clicked to prevent pointerUp from triggering
      centerClickedRef.current = true;
      return; // Don't trigger pause here, wait for pointerUp
    }

    // Define outer boundary (类似汉字"回"的外框)
    // 外框区域：距离中心区域各留出20px的空白
    const outerBoundary = centerAreaSize / 2 + 20;
    const isInOuterArea =
      Math.abs(x - centerX) > outerBoundary ||
      Math.abs(y - centerY) > outerBoundary;

    // Only trigger controls outside the "回" shape
    if (isInOuterArea) {
      // 开始拖动跟随
      isDraggingRef.current = true;
      pointerIdRef.current = e.pointerId;
      canvas.setPointerCapture(e.pointerId);

      // 将画布坐标转换为游戏世界坐标
      const scaleX = GAME_CONFIG.canvasWidth / rect.width;
      const gameX = x * scaleX;

      // 限制在道路范围内
      const minX = GAME_CONFIG.roadOffset;
      const maxX = GAME_CONFIG.roadOffset + GAME_CONFIG.roadWidth;
      const clampedX = Math.max(minX, Math.min(maxX, gameX));

      onDrag?.(clampedX, true);

      // 保留旧的左右控制作为桌面端备用
      if (!onDrag) {
        if (x < centerX) {
          onTouchLeft?.(true);
        } else {
          onTouchRight?.(true);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // 将画布坐标转换为游戏世界坐标
    const scaleX = GAME_CONFIG.canvasWidth / rect.width;
    const gameX = x * scaleX;

    // 限制在道路范围内
    const minX = GAME_CONFIG.roadOffset;
    const maxX = GAME_CONFIG.roadOffset + GAME_CONFIG.roadWidth;
    const clampedX = Math.max(minX, Math.min(maxX, gameX));

    onDrag?.(clampedX, true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behavior

    // Check if this is a center area click (pointer down and up both in center)
    if (centerClickedRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) {
        centerClickedRef.current = false;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = GAME_CONFIG.canvasWidth / 2;
      const centerY = GAME_CONFIG.canvasHeight / 2;

      const centerAreaSize = 60;
      const centerAreaLeft = centerX - centerAreaSize / 2;
      const centerAreaRight = centerX + centerAreaSize / 2;
      const centerAreaTop = centerY - centerAreaSize / 2;
      const centerAreaBottom = centerY + centerAreaSize / 2;

      // Only trigger pause if pointerUp is also in center area (complete click)
      if (
        x >= centerAreaLeft &&
        x <= centerAreaRight &&
        y >= centerAreaTop &&
        y <= centerAreaBottom
      ) {
        onTouchCenter?.();
      }

      centerClickedRef.current = false;
      return;
    }

    if (isDraggingRef.current && pointerIdRef.current === e.pointerId) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }
      isDraggingRef.current = false;
      pointerIdRef.current = null;
      onDrag?.(undefined, false);
    }

    // 保留旧的左右控制作为桌面端备用
    if (!onDrag) {
      onTouchLeft?.(false);
      onTouchRight?.(false);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Reset center click flag on cancel
    centerClickedRef.current = false;
    handlePointerUp(e);
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.canvasWidth}
      height={GAME_CONFIG.canvasHeight}
      className="border-0 md:border-4 border-gray-700 md:rounded-lg shadow-2xl touch-none select-none w-full h-full md:w-auto md:h-auto"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none', objectFit: 'contain' }}
    />
  );
}
