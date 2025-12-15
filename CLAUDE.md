# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供项目规则指引。

## 📋 完整项目规则

请参阅 [AGENTS.md](./AGENTS.md) 获取完整的项目规则、技术栈、开发规范和文件结构说明。

## 🚀 快速命令参考

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

## 📁 核心文件快速索引

### 游戏核心逻辑

- `lib/game/engine.ts` - 游戏引擎核心，管理游戏循环、状态更新、道具生成
- `lib/game/constants.ts` - 游戏常量配置（速度、尺寸、道具配置等）
- `lib/game/powerups.ts` - 道具系统（生成、激活、效果）
- `lib/game/collision.ts` - 碰撞检测逻辑
- `lib/game/difficulty.ts` - 难度系统和进度计算
- `lib/game/boss.ts` - Boss 战斗系统
- `lib/game/combo.ts` - 连击系统
- `lib/game/slotmachine.ts` - 老虎机系统

### 类型定义

- `types/game.ts` - 游戏实体类型定义（Vehicle, Obstacle, PowerUp 等）

### 游戏页面和组件

- `app/game/page.tsx` - 游戏主页面
- `app/vehicle-select/page.tsx` - 车辆选择页面
- `app/components/GameCanvas.tsx` - 游戏画布渲染
- `app/components/GameHUD.tsx` - 游戏 HUD 显示（距离、分数、耐久度）
- `app/components/ShopUI.tsx` - 商店道具 UI
- `app/components/GameStatus.tsx` - 游戏状态显示
- `app/components/Leaderboard.tsx` - 排行榜组件

### 工具函数

- `lib/utils/storage.ts` - 本地存储（高分、金币、排行榜）

## 📝 文档更新要求

### README.md

- **目的**：面向玩家的游戏说明文档
- **内容**：游戏玩法、控制方式、道具说明、难度设置等
- **更新规则**：每次添加新的游戏功能时，必须在 README.md 中添加相应说明
- **语言风格**：使用玩家友好的语言，避免技术术语

### CHANGELOG.md

- **目的**：记录开发者对游戏的修改变更
- **内容**：新增功能、优化改进、Bug 修复、游戏平衡调整等
- **更新规则**：每次修改代码后，必须在 CHANGELOG.md 中记录变更内容
- **格式**：遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范

---

**注意**: 本文件仅包含快速参考信息。完整的项目规则、技术栈详情、开发规范和游戏设计要点请查看 [AGENTS.md](./AGENTS.md)。
