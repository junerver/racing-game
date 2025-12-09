# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2024-12-09

### Added

- **金币老虎机系统**
  - 收集3个金币后自动填充卡片，集满后可启动老虎机
  - 5种滚轮结果：❌、谢谢、100、200、500
  - 奖励机制：
    - 三个相同数字：100=1.5倍、200=2倍、500=3倍奖池金额
    - 三个谢谢：奖励10金币
    - 三个❌：惩罚，扣除奖池金额
    - 其他组合：无效果
  - 按 S 键启动老虎机

- **道具合成系统**（5种组合）
  - 🌀🔫 **旋转弹幕射击**：无敌护盾+机枪 → 旋转的无敌护盾发射机枪子弹（持续10秒）
  - 🔫🔫 **四弹道机枪**：2x分数+机枪 → 射击弹幕从2弹道扩展为4弹道（持续10秒）
  - ⚡🌩️ **风暴闪电**：机枪+氮气加速 → 每2秒全屏攻击清除所有障碍（持续10秒）
  - ❤❤ **双倍爱心**：2x分数+爱心 → 获得两个爱心补充两点耐久（即时效果）
  - 💰💰 **双倍金币**：2x分数+金币 → 金币面额两倍（即时效果）
  - 合成需要按顺序获得道具（先获得A再获得B才能合成）
  - 合成后原始道具效果立即结束，显示新的合成道具图标

- **机枪金币奖励**
  - 机枪摧毁障碍车辆时奖励10金币
  - 风暴闪电清除的障碍车辆也享有此奖励
  - 实时显示摧毁车辆数量统计

### Improved

- 合成道具在HUD中以紫色渐变边框显示，区别于普通道具
- 老虎机UI显示在屏幕底部，实时显示卡片状态和奖池金额
- 游戏引擎优化，支持多种道具效果同时激活

### Documentation

- 更新 README.md 添加老虎机和道具合成系统说明
- 更新控制说明，添加 S 键启动老虎机

## [Unreleased] - 2024-12-09

### Added

- Heart power-up system for health recovery
  - Appears when health ≤ 1, stops when health ≥ 3
  - Restores 1 health point (max 3)
  - Spawn rate adjusted by difficulty (Easy 80%, Medium 65%, Hard 50%)
- Dynamic difficulty balancing for all power-ups
  - Basic power-ups: Easy 120%, Medium 100%, Hard 80% spawn chance
  - Shop power-ups: Easy 120%, Medium 100%, Hard 80% spawn chance
- Coin denomination restrictions by difficulty
  - Hard mode: Only 100 coins
  - Medium mode: 100 and 200 coins
  - Easy mode: 100, 200, and 500 coins

### Improved

- All power-ups now scale with difficulty level
- Power-up spawn rates dynamically adjust based on game difficulty

### Documentation

- Added "Key File Paths" section to CLAUDE.md for quick file navigation
- Updated README.md with dynamic balancing mechanics
- Updated README.md with heart power-up documentation

## [2024-12-08]

### Added

- Difficulty selection system (Easy/Medium/Hard)
- Shop power-ups now appear on the road (every 30 seconds)
- Multi-denomination coin system (100/200/500)
- Machine gun upgraded to dual bullet streams

### Improved

- Power-up spawn frequency optimized (basic: 2s, shop: 30s)
- Power-up duration extended to 8 seconds
- Power-up movement speed reduced to 70% of game speed
- Magnet power-up now has global attraction (no distance limit)
- Safe distance between power-ups and obstacles increased to 250 pixels
- Bullet visual effects enhanced (red glow effect added)
- Coin icon changed from emoji to $ symbol

### Fixed

- Fixed coin retention bug when restarting game
- Fixed POWERUP_SIZE undefined error
- Fixed shop power-ups not activating correctly when collected

### Balance Changes

- Removed coin deduction penalty on collision
- Adjusted power-up spawn probability, coin appearance rate increased to 60%
- Optimized power-up spawn logic to avoid overlapping with obstacles

### Documentation

- Updated CLAUDE.md port information (3000 to 3389)
- Created README.md game documentation
- Created CHANGELOG.md change log

---

## Version Format

Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

### Change Types

- Added - New features
- Improved - Improvements to existing features
- Fixed - Bug fixes
- Balance Changes - Game balance adjustments
- Documentation - Documentation updates
- Performance - Performance optimizations
- Breaking Changes - Incompatible API changes
