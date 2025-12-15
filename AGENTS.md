# AGENTS.md - 项目规则

本文件为 AI 编程助手（Claude、Kilo Code 等）提供项目规则和开发指南。

## 项目概述

这是一个使用现代 Web 技术构建的 H5 赛车游戏：React、Next.js 16、TypeScript 和 Tailwind CSS 4。游戏挑战玩家在避开障碍物的同时达到最大行驶距离。

## 技术栈

- **框架**: Next.js 16.0.7 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x，启用严格模式
- **样式**: Tailwind CSS 4 (基于 PostCSS)
- **代码检查**: ESLint with Next.js config
- **包管理器**: npm

## 开发命令

```bash
# 启动开发服务器 (http://localhost:3389)
npm run dev

# 生产环境构建
npm run build

# 启动生产服务器
npm start

# 运行代码检查
npm run lint
```

## TypeScript 配置

- **导入别名**: `@/*` 映射到根目录
- **目标**: ES2017
- **严格模式**: 启用
- **JSX**: react-jsx (自动运行时)
- **模块解析**: bundler

## 项目结构

```
app/
├── page.tsx                    # 首页，包含"开始游戏"按钮
├── game/
│   ├── page.tsx               # 主游戏画布/容器
│   └── components/
│       ├── GameCanvas.tsx     # 画布渲染组件
│       ├── GameHUD.tsx        # 距离计数器和 UI 覆盖层
│       ├── GameStatus.tsx     # 游戏状态显示
│       ├── ShopUI.tsx         # 商店道具 UI
│       └── Leaderboard.tsx    # 排行榜组件
├── vehicle-select/
│   └── page.tsx               # 车辆自定义界面
└── leaderboard/
    └── page.tsx               # 排行榜页面

lib/
├── game/
│   ├── engine.ts              # 游戏循环和物理引擎
│   ├── collision.ts           # 碰撞检测
│   ├── powerups.ts            # 道具效果和逻辑
│   ├── difficulty.ts          # 难度缩放和进度逻辑
│   ├── boss.ts                # Boss 战斗系统
│   ├── combo.ts               # 连击系统
│   ├── slotmachine.ts         # 老虎机系统
│   └── constants.ts           # 游戏常量（速度、尺寸、难度曲线）
└── utils/
    └── storage.ts             # 本地存储（高分、金币、排行榜）

types/
└── game.ts                    # 游戏实体的 TypeScript 接口

public/
└── assets/
    ├── vehicles/              # 车辆精灵图
    ├── obstacles/             # 障碍物精灵图
    ├── powerups/              # 道具图标
    └── effects/               # 视觉效果
```

## 开发规范

### 代码规范

1. **TypeScript 严格使用** - 避免使用 `any` 类型
2. **遵循 Next.js App Router 约定** (服务端/客户端组件)
3. **使用 Tailwind 实用类** 进行样式设计
4. **保持游戏逻辑与 React 组件分离**
5. **为游戏崩溃实现适当的错误边界**
6. **为资源加载添加加载状态**
7. **实现本地存储** 用于高分和车辆解锁

### 文档规范

#### README.md

- **目的**: 面向玩家的游戏说明文档
- **内容**: 游戏玩法、控制方式、道具说明、难度设置等
- **更新规则**: 每次添加新的游戏功能时，必须在 README.md 中添加相应说明
- **语言风格**: 使用玩家友好的语言，避免技术术语

#### CHANGELOG.md

- **目的**: 记录开发者对游戏的修改变更
- **内容**: 新增功能、优化改进、Bug 修复、游戏平衡调整等
- **更新规则**: 每次修改代码后，必须在 CHANGELOG.md 中记录变更内容
- **格式**: 遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范

## 核心文件路径

### 游戏核心逻辑

- [`lib/game/engine.ts`](lib/game/engine.ts) - 游戏引擎核心，管理游戏循环、状态更新、道具生成
- [`lib/game/constants.ts`](lib/game/constants.ts) - 游戏常量配置（速度、尺寸、道具配置等）
- [`lib/game/powerups.ts`](lib/game/powerups.ts) - 道具系统（生成、激活、效果）
- [`lib/game/collision.ts`](lib/game/collision.ts) - 碰撞检测逻辑
- [`lib/game/difficulty.ts`](lib/game/difficulty.ts) - 难度系统和进度计算
- [`lib/game/boss.ts`](lib/game/boss.ts) - Boss 战斗系统
- [`lib/game/combo.ts`](lib/game/combo.ts) - 连击系统
- [`lib/game/slotmachine.ts`](lib/game/slotmachine.ts) - 老虎机系统

### 类型定义

- [`types/game.ts`](types/game.ts) - 游戏实体类型定义（Vehicle, Obstacle, PowerUp 等）

### 游戏页面和组件

- [`app/game/page.tsx`](app/game/page.tsx) - 游戏主页面
- [`app/vehicle-select/page.tsx`](app/vehicle-select/page.tsx) - 车辆选择页面
- [`app/components/GameCanvas.tsx`](app/components/GameCanvas.tsx) - 游戏画布渲染
- [`app/components/GameHUD.tsx`](app/components/GameHUD.tsx) - 游戏 HUD 显示（距离、分数、耐久度）
- [`app/components/ShopUI.tsx`](app/components/ShopUI.tsx) - 商店道具 UI
- [`app/components/GameStatus.tsx`](app/components/GameStatus.tsx) - 游戏状态显示
- [`app/components/Leaderboard.tsx`](app/components/Leaderboard.tsx) - 排行榜组件

### 工具函数

- [`lib/utils/storage.ts`](lib/utils/storage.ts) - 本地存储（高分、金币、排行榜）

## 游戏设计要点

### 渐进难度系统

- 实现速度递增：从初始速度逐渐增加到最大速度
- 使用基于距离或时间的进度曲线
- 根据当前速度调整障碍物生成率
- 根据难度等级调整障碍物模式和车道变化
- 考虑添加难度等级（简单 → 中等 → 困难 → 极限）

### 道具系统

- **基础道具**（每 2 秒生成一次）：速度提升、无敌、磁铁、分数倍增、金币
- **商店道具**（每 30 秒生成一次）：商店无敌、机关枪、火箭燃料、氮气加速
- **爱心道具**（❤）：恢复 1 点生命值（最多 3 点），仅在生命值 ≤1 时生成

### 性能优化

- 使用精灵图进行动画
- 为障碍物/道具实现对象池
- 使用空间分区优化碰撞检测
- 在游戏开始前预加载所有精灵图以防止卡顿

## 技术考虑

1. **画布渲染**: 使用 HTML5 Canvas API 或考虑库如：

   - `react-konva` 用于 React 友好的画布
   - `pixi.js` 用于高性能 2D 渲染
   - 原生 Canvas API 用于轻量级实现

2. **游戏循环**: 实现 `requestAnimationFrame` 以实现流畅的 60fps 渲染

3. **状态管理**:

   - React Context 或 Zustand 用于游戏状态
   - 跟踪：车辆统计、当前距离、激活的道具、分数、当前速度

4. **响应式设计**: 确保游戏在移动设备上工作（触摸控制）

5. **资源加载**: 在游戏开始前预加载所有精灵图以防止延迟
