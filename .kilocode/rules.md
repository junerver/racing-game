# Kilo Code 项目规则

本文件为 Kilo Code AI 编程助手提供项目规则和开发指南。

## 📋 完整项目规则

请参阅 [AGENTS.md](../AGENTS.md) 获取完整的项目规则、技术栈、开发规范和文件结构说明。

## 🚀 快速命令参考

```bash
# 开发服务器 (端口: 3389)
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint
```

## 🎯 Kilo Code 特定规范

### 文件链接格式

- 所有代码引用必须使用可点击的 Markdown 链接格式
- 格式：[`filename OR language.declaration()`](relative/file/path.ext:line)
- 示例：[`GameEngine.update()`](lib/game/engine.ts:45)

### 代码修改规范

- 优先使用 `apply_diff` 进行精确的代码修改
- 使用 `write_to_file` 仅用于创建新文件或完全重写
- 每次工具使用后等待用户确认再继续

### 响应风格

- 直接、技术性的回复
- 避免使用 "Great"、"Certainly"、"Okay"、"Sure" 等开场白
- 使用简体中文进行交流

## 📁 核心文件快速索引

### 游戏引擎

- [`lib/game/engine.ts`](../lib/game/engine.ts) - 游戏主循环
- [`lib/game/constants.ts`](../lib/game/constants.ts) - 游戏常量
- [`lib/game/powerups.ts`](../lib/game/powerups.ts) - 道具系统

### 类型定义

- [`types/game.ts`](../types/game.ts) - 游戏类型

### UI 组件

- [`app/components/GameCanvas.tsx`](../app/components/GameCanvas.tsx) - 游戏画布
- [`app/components/GameHUD.tsx`](../app/components/GameHUD.tsx) - 游戏 HUD

## 📝 文档更新要求

- 新功能 → 更新 [`README.md`](../README.md)（玩家说明）
- 代码修改 → 更新 [`CHANGELOG.md`](../CHANGELOG.md)（开发日志）

---

**注意**: 本文件仅包含 Kilo Code 特定的规范。完整的项目规则、技术栈详情和开发指南请查看 [AGENTS.md](../AGENTS.md)。
