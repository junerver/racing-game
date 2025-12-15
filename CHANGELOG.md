# Changelog

## [Unreleased]

### Fixed

- 修复金币异常问题，确保金币不会突破 9999 上限
  - 在 `GameEngine` 类中添加 `addCoinsWithCap()` 辅助方法
  - 统一所有金币奖励逻辑使用该方法，确保金币上限为 9999
- 修复闪电风暴道具对 boss 无效的问题
  - 将 `lastStormLightning` 从局部变量改为类实例变量（第 72 行）
  - 在构造函数和 `start()` 方法中正确初始化该变量（第 87、208 行）
  - 确保闪电风暴每 1 秒触发一次，对 boss 造成 15-25 点随机伤害
  - 大幅提升 Boss 战伤害效果（单次伤害提升 5 倍，触发频率提升 50%）
  - 10 秒持续时间内总伤害从约 24-28 点提升到约 150-250 点（占第 1 个 Boss 血量 15-25%）
- 修复死星射击道具对 boss 无效的问题
  - 添加 `lastDeathStarDamage` 实例变量追踪伤害计时（第 74 行）
  - 在构造函数和 `start()` 方法中初始化该变量（第 89、210 行）
  - 实现高频次低伤害攻击模式：每 100ms 造成 2-3 点伤害
  - 10 秒持续时间内总伤害约 200-300 点（占第 1 个 Boss 血量 25-30%）
  - 使死星射击成为 Boss 战中最强力的持续伤害道具
- 修复 PC 浏览器空格键暂停无效的问题
  - 在键盘事件处理中添加 `preventDefault()` 防止默认行为
  - 添加防抖逻辑，防止快速重复触发暂停/恢复
  - 确保空格键和 ESC 键在游戏进行中正确触发暂停功能

### Technical Details

- `lib/game/engine.ts`:
  - 第 72-73 行：添加 `lastStormLightning` 和 `lastBulletSpawn` 实例变量
  - 第 87-88 行：在构造函数中初始化计时器变量
  - 第 92-97 行：添加 `addCoinsWithCap()` 方法统一处理金币上限
  - 第 208 行：在 `start()` 方法中重置 `lastStormLightning` 计时器
  - 第 988-1009 行：闪电风暴对 boss 的伤害逻辑（触发间隔从 1.5 秒改为 1 秒，单次伤害从 3-5 点提升到 15-25 点）
  - 第 1011-1037 行：死星射击对 boss 的伤害逻辑（每 100ms 造成 2-3 点伤害，10 秒总伤害 200-300 点）
- `app/game/page.tsx`:
  - 第 87-89 行：为游戏控制键添加 `preventDefault()`
  - 第 99-113 行：为空格键和 ESC 键添加防抖逻辑，使用 `lastPauseTimeRef` 和 `pauseMenuShowTimeRef`

## [Previous versions]

...
