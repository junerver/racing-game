// 性能优化配置和工具函数

// 渲染优化配置
export const PERFORMANCE_CONFIG = {
    // 减少不必要的特效渲染
    enableShadowEffects: true, // 可以设为 false 提升性能
    enableGlowEffects: true,   // 可以设为 false 提升性能
    maxParticles: 50,          // 限制粒子数量

    // 碰撞检测优化
    collisionCheckRadius: 200, // 只检测车辆附近200px的对象

    // 更新优化
    maxUpdatesPerFrame: 3,     // 单帧最多更新次数
    accumulatorResetThreshold: 33.34, // 累积器重置阈值(2帧)
};

// 对象池类 - 减少GC压力
export class ObjectPool<T> {
    private pool: T[] = [];
    private createFn: () => T;
    private resetFn: (obj: T) => void;

    constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;

        // 预分配对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.createFn();
    }

    release(obj: T): void {
        this.resetFn(obj);
        this.pool.push(obj);
    }

    clear(): void {
        this.pool = [];
    }
}

// 性能监控
export class PerformanceMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 60;
    private frameTime = 16.67;

    update(): void {
        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameTime = elapsed / this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    getFPS(): number {
        return this.fps;
    }

    getFrameTime(): number {
        return this.frameTime;
    }

    isPerformanceLow(): boolean {
        return this.fps < 45 || this.frameTime > 22;
    }
}

// 渲染批处理 - 减少绘制调用
export class RenderBatcher {
    private shadowBlurCache = new Map<string, boolean>();

    // 批量设置阴影效果
    setShadow(ctx: CanvasRenderingContext2D, blur: number, color: string, enabled: boolean = PERFORMANCE_CONFIG.enableShadowEffects): void {
        if (!enabled) {
            ctx.shadowBlur = 0;
            return;
        }

        const key = `${blur}-${color}`;
        if (!this.shadowBlurCache.has(key) || this.shadowBlurCache.get(key) !== enabled) {
            ctx.shadowBlur = blur;
            ctx.shadowColor = color;
            this.shadowBlurCache.set(key, enabled);
        }
    }

    // 清除阴影
    clearShadow(ctx: CanvasRenderingContext2D): void {
        if (ctx.shadowBlur !== 0) {
            ctx.shadowBlur = 0;
        }
    }
}