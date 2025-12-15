// 渲染优化器 - 减少不必要的渲染调用

import { GameState } from '@/types/game';

export class RenderOptimizer {
    private lastRenderState: {
        obstacleCount: number;
        powerUpCount: number;
        bulletCount: number;
        bossActive: boolean;
        vehicleX: number;
        vehicleY: number;
    } | null = null;

    // 检查是否需要完整重绘
    shouldFullRedraw(gameState: GameState): boolean {
        if (!this.lastRenderState) {
            this.updateRenderState(gameState);
            return true;
        }

        const current = {
            obstacleCount: gameState.obstacles.length,
            powerUpCount: gameState.powerUps.length,
            bulletCount: gameState.bullets.length,
            bossActive: gameState.bossBattle.active,
            vehicleX: gameState.vehicle?.x || 0,
            vehicleY: gameState.vehicle?.y || 0,
        };

        // 如果对象数量变化或Boss状态变化，需要完整重绘
        const needsRedraw =
            current.obstacleCount !== this.lastRenderState.obstacleCount ||
            current.powerUpCount !== this.lastRenderState.powerUpCount ||
            current.bulletCount !== this.lastRenderState.bulletCount ||
            current.bossActive !== this.lastRenderState.bossActive ||
            Math.abs(current.vehicleX - this.lastRenderState.vehicleX) > 1 ||
            Math.abs(current.vehicleY - this.lastRenderState.vehicleY) > 1;

        if (needsRedraw) {
            this.lastRenderState = current;
        }

        return needsRedraw;
    }

    private updateRenderState(gameState: GameState): void {
        this.lastRenderState = {
            obstacleCount: gameState.obstacles.length,
            powerUpCount: gameState.powerUps.length,
            bulletCount: gameState.bullets.length,
            bossActive: gameState.bossBattle.active,
            vehicleX: gameState.vehicle?.x || 0,
            vehicleY: gameState.vehicle?.y || 0,
        };
    }

    reset(): void {
        this.lastRenderState = null;
    }
}

// 可见性剔除 - 只渲染屏幕内的对象
export function isOnScreen(
    y: number,
    height: number,
    canvasHeight: number,
    margin: number = 50
): boolean {
    return y + height >= -margin && y <= canvasHeight + margin;
}

// 简化渲染选项 - 根据性能动态调整
export interface RenderQuality {
    shadowBlur: boolean;
    glowEffects: boolean;
    particleEffects: boolean;
}

export function getAdaptiveRenderQuality(fps: number): RenderQuality {
    if (fps < 30) {
        // 低性能模式：禁用所有特效
        return {
            shadowBlur: false,
            glowEffects: false,
            particleEffects: false,
        };
    } else if (fps < 45) {
        // 中性能模式：只保留基本特效
        return {
            shadowBlur: false,
            glowEffects: true,
            particleEffects: false,
        };
    } else {
        // 高性能模式：所有特效开启
        return {
            shadowBlur: true,
            glowEffects: true,
            particleEffects: true,
        };
    }
}