# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an H5 racing game built with modern web technologies: React, Next.js 16, TypeScript, and Tailwind CSS 4. The game challenges players to achieve the maximum driving distance while avoiding obstacles.

## Tech Stack

- **Framework**: Next.js 16.0.7 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x with strict mode enabled
- **Styling**: Tailwind CSS 4 (PostCSS-based)
- **Linting**: ESLint with Next.js config
- **Package Manager**: npm

## Development Commands

```bash
# Start development server (http://localhost:3389)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Project Structure

```
ai_demo/
├── app/                    # Next.js App Router directory
│   ├── layout.tsx         # Root layout with fonts and metadata
│   ├── page.tsx           # Homepage (entry point)
│   ├── globals.css        # Global styles with Tailwind directives
│   └── favicon.ico        # Site favicon
├── public/                # Static assets (images, SVGs)
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── postcss.config.mjs     # PostCSS config for Tailwind
└── eslint.config.mjs      # ESLint configuration
```

## TypeScript Configuration

- **Import Alias**: `@/*` maps to the root directory
- **Target**: ES2017
- **Strict Mode**: Enabled
- **JSX**: react-jsx (automatic runtime)
- **Module Resolution**: bundler

## Game Design Requirements

### Core Gameplay
- **Genre**: Endless runner racing game
- **Objective**: Achieve maximum driving distance (displayed in km)
- **Controls**: Left/Right arrow keys to move the vehicle laterally
- **Obstacles**: Slow-moving vehicles that must be avoided
- **Game Over**: Collision with obstacles ends the game
- **Progressive Difficulty**: Vehicle speed gradually increases to maximum speed as the game progresses, with difficulty scaling accordingly:
  - Obstacle density increases with speed
  - Obstacle patterns become more complex
  - Reaction time windows decrease
  - Creates natural difficulty curve for engaging gameplay

### Game Flow
1. **Homepage**: Display a "Start Game" button
2. **Vehicle Selection**: Choose vehicle appearance and customize:
   - Multiple vehicle sprite options
   - Engine configuration (affects acceleration)
   - Tire configuration (affects top speed and turning performance)
3. **Gameplay**: Navigate through traffic, collect power-ups, maximize distance

### Vehicle System
- **Appearance**: Multiple vehicle sprites/models to choose from
- **Engine**: Affects acceleration rate
- **Tires**: Affects maximum speed and lateral movement responsiveness
- **Stats**: Each configuration impacts vehicle performance metrics

### Power-ups & Items
The game includes various collectible items with different effects:
- **Speed Boost**: Temporary acceleration increase
- **Invincibility**: Ignore collisions for a duration
- **Flight Mode**: Ability to fly over obstacles
- **Treasure Chests**: Contain random power-ups

### Visual Assets Needed
- Vehicle sprites (multiple designs)
- Road/track textures
- Obstacle vehicle sprites
- Power-up icons and effects
- UI elements (buttons, distance counter, etc.)
- Particle effects for power-ups

## Architecture Recommendations

### Suggested Directory Structure
```
app/
├── page.tsx                    # Homepage with "Start Game" button
├── game/
│   ├── page.tsx               # Main game canvas/container
│   └── components/
│       ├── GameCanvas.tsx     # Canvas rendering component
│       ├── Vehicle.tsx        # Player vehicle component
│       ├── Obstacle.tsx       # Obstacle vehicle component
│       ├── PowerUp.tsx        # Power-up item component
│       └── HUD.tsx            # Distance counter and UI overlay
├── vehicle-select/
│   └── page.tsx               # Vehicle customization screen
└── components/
    └── ui/                    # Reusable UI components

lib/
├── game/
│   ├── engine.ts              # Game loop and physics
│   ├── collision.ts           # Collision detection
│   ├── vehicle.ts             # Vehicle class and stats
│   ├── powerups.ts            # Power-up effects and logic
│   ├── difficulty.ts          # Difficulty scaling and progression logic
│   └── constants.ts           # Game constants (speeds, dimensions, difficulty curves)
└── utils/
    └── storage.ts             # LocalStorage for high scores

types/
└── game.ts                    # TypeScript interfaces for game entities

public/
└── assets/
    ├── vehicles/              # Vehicle sprites
    ├── obstacles/             # Obstacle sprites
    ├── powerups/              # Power-up icons
    └── effects/               # Visual effects
```

### Key Technical Considerations

1. **Canvas Rendering**: Use HTML5 Canvas API or consider libraries like:
   - `react-konva` for React-friendly canvas
   - `pixi.js` for high-performance 2D rendering
   - Native Canvas API for lightweight implementation

2. **Game Loop**: Implement `requestAnimationFrame` for smooth 60fps rendering

3. **Progressive Difficulty System**:
   - Implement speed ramping: gradually increase vehicle speed from initial to maximum
   - Use distance-based or time-based progression curve (e.g., `speed = minSpeed + (maxSpeed - minSpeed) * (1 - e^(-distance/scaleFactor))`)
   - Scale obstacle spawn rate with current speed
   - Adjust obstacle patterns and lane changes based on difficulty level
   - Consider adding difficulty tiers (Easy → Medium → Hard → Extreme)

4. **State Management**:
   - React Context or Zustand for game state
   - Track: vehicle stats, current distance, active power-ups, score, current speed

5. **Responsive Design**: Ensure game works on mobile devices (touch controls)

6. **Asset Loading**: Preload all sprites before game starts to prevent lag

7. **Performance**:
   - Use sprite sheets for animations
   - Implement object pooling for obstacles/power-ups
   - Optimize collision detection with spatial partitioning

## Development Guidelines

- Use TypeScript strictly - avoid `any` types
- Follow Next.js App Router conventions (Server/Client Components)
- Use Tailwind utility classes for styling
- Keep game logic separate from React components
- Implement proper error boundaries for game crashes
- Add loading states for asset loading
- Consider adding sound effects and background music
- Implement local storage for high scores and vehicle unlocks

## Next Steps for Implementation

1. Create game canvas component with basic rendering
2. Implement vehicle movement with keyboard controls
3. Add obstacle generation and scrolling
4. Implement collision detection
5. Build vehicle selection screen with stat system
6. Add power-up system with effects
7. Create UI/HUD for distance tracking
8. Add visual polish (animations, particles, effects)
9. Implement scoring and persistence
10. Optimize performance and add mobile support

## Documentation Guidelines

### README.md
- **目的**：面向玩家的游戏说明文档
- **内容**：游戏玩法、控制方式、道具说明、难度设置等
- **更新规则**：每次添加新的游戏功能时，必须在 README.md 中添加相应说明
- **语言风格**：使用玩家友好的语言，避免技术术语

### CHANGELOG.md
- **目的**：记录开发者对游戏的修改变更
- **内容**：新增功能、优化改进、Bug修复、游戏平衡调整等
- **更新规则**：每次修改代码后，必须在 CHANGELOG.md 中记录变更内容
- **格式**：遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范
