# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- 金钟罩破盾效果：金钟罩持续时间内发生碰撞后，车辆特效显示会从金钟罩效果切换到无敌护盾效果，使碰撞状态更加明显

## [关键 Bug 修复] - 2025-12-15

### Fixed

- **金币显示和存储不同步问题** ([`lib/game/engine.ts`](lib/game/engine.ts:466), [`lib/utils/storage.ts`](lib/utils/storage.ts:146))
  - 修复金币显示 9999 但实际购买道具不扣金币，游戏结束后显示真实金币数量的严重 bug
  - **根本原因**：游戏引擎每帧强制将 `state.coins` 设置为 9999，导致游戏显示与本地存储不同步
  - **修复方案**：
    1. 移除 `engine.ts` 中 `update()` 方法里的金币上限检查逻辑
    2. 将金币上限检查移至 `storage.ts` 的 `addCoins()` 函数中
    3. 确保金币上限在数据持久化时统一控制
  - **影响范围**：
    - 游戏内金币显示现在与本地存储完全同步
    - 购买道具时正确扣除金币并实时更新显示
    - 游戏结束统计显示正确的金币数量
    - 金币上限 9999 在收集时正确生效

### Technical Details

- **问题表现**：

  1. 游戏中收集 7600 金币时，显示 9999
  2. 购买道具后显示仍为 9999（实际本地存储已扣除）
  3. 游戏结束显示 7600（本地存储的真实值）

- **修复前的错误逻辑**：

  - engine.ts update() 方法中每帧强制覆盖 state.coins 为 9999
  - 导致 purchaseShopPowerUp() 中的 getCoins() 同步失效

- **修复后的正确逻辑**：
  - 在 storage.ts 的 addCoins() 函数中统一控制上限
  - 使用 Math.min(current.coins + amount, 9999) 确保不超过上限
  - 游戏状态和持久化存储保持一致

## [Bug 修复] - 2025-12-15

### Fixed

- **中心暂停区域点击问题修复** ([`app/components/GameCanvas.tsx`](app/components/GameCanvas.tsx:798), [`app/game/page.tsx`](app/game/page.tsx:54))
  - 修复点击中心暂停区域后抬手时可能立即触发"继续游戏"或"重新开始"的问题
  - 添加 `centerClickedRef` 标记跟踪中心区域点击状态
  - 实现完整的点击检测：只有在按下和抬起都在中心区域内才触发暂停
  - **新增 300ms 冷却时间机制**：暂停菜单显示后 300ms 内禁止点击操作
  - 防止快速闪现导致的误操作，提升暂停功能的稳定性

### Technical Details

- **GameCanvas 点击事件处理流程优化**：
  1. `handlePointerDown`：检测到中心区域点击时设置标记，不立即触发暂停
  2. `handlePointerUp`：检查标记和当前位置，确认完整点击后才触发 `onTouchCenter()`
  3. `handlePointerCancel`：重置标记防止状态污染
- **GamePage 防抖机制增强**：
  1. 新增 `pauseMenuShowTimeRef` 记录暂停菜单显示时间
  2. `handleTouchCenter`：暂停时记录时间，恢复时检查是否超过 300ms
  3. `handleResume` 和 `handleRestart`：检查冷却时间，防止误触发
  4. 所有暂停相关操作都更新 `lastPauseTimeRef` 保持一致性

## [性能优化] - 2025-12-15

### Performance 🚀

- **渲染性能优化模块** ([`lib/game/performance.ts`](lib/game/performance.ts))

  - 实现对象池（ObjectPool）减少垃圾回收压力
  - 添加性能监控器（PerformanceMonitor）实时监控 FPS 和帧时间
  - 实现渲染批处理器（RenderBatcher）减少重复的渲染状态设置

- **渲染优化器** ([`lib/game/renderOptimizer.ts`](lib/game/renderOptimizer.ts))

  - 智能渲染判断，避免不必要的完整重绘
  - 可见性剔除，只渲染屏幕内的对象
  - 自适应渲染质量，根据 FPS 动态调整特效（FPS<30 禁用所有特效，30-45 中等效果，>45 全特效）

- **性能配置项**
  - 可配置的阴影和发光效果开关
  - 限制最大粒子数量（默认 50）
  - 优化碰撞检测半径（只检测车辆附近 200px）
  - 单帧最多更新 3 次，防止卡顿时的死亡螺旋

### 预期效果

- 后期游戏帧率提升 20-40%
- 减少视觉疲劳和丢帧感
- 降低内存占用和 GC 暂停时间
- 提供更流畅的 60FPS 游戏体验

## [Unreleased] - 2024-12-13

### Added

- **Boss 战模式**

  - 新增 Boss 战斗系统，每行驶 100 公里触发一次 Boss 战
  - Boss 拥有多种攻击模式：机枪扫射、激光炮、投掷障碍车
  - Boss 战期间暂停普通障碍物生成
  - 击败 Boss 获得大量金币奖励和分数加成
  - Boss 战统计数据记录（击败次数、最高连胜等）

- **完全恢复道具（大还丹）**

  - 补满全部耐久值并提供 10 秒无敌时间
  - 仅在生命值 ≤1 时在商店中显示
  - 售价：9999 金币

- **拖动移动控制**

  - 新增触摸拖动控制方式，支持移动端操作
  - 可通过拖动屏幕控制车辆左右移动
  - 与键盘控制方式并存，提升操作体验

- **游戏统计系统**
  - 详细的游戏数据统计页面
  - 记录总游戏次数、总行驶距离、总游戏时长
  - 道具使用统计（各类道具使用次数）
  - Boss 战统计（击败次数、最高连胜、总伤害等）
  - 排行榜增强，显示 Boss 战相关数据

### Improved

- Boss 形态视觉效果优化

  - 不同攻击模式下的视觉反馈
  - 激光扫射、导弹、冲撞等攻击特效
  - Boss 血条和状态显示

- 游戏统计页面重构
  - 更清晰的数据展示布局
  - 分类统计（基础数据、道具统计、Boss 战统计）
  - 实时数据更新

### Fixed

- 修复 Boss 重复创建的 bug
- 修复统计页面道具显示问题
- 修复统计页面数据显示异常

### Balance Changes

- **老虎机奖池减半**

  - 奖池金额从原来的全额改为 1/2，避免金币快速膨胀
  - 例如：投入 100、200、200 金币，奖池从 500 改为 250
  - 中奖奖励相应减半（如 200 三连从奖励 500 改为 250）
  - 惩罚（三个 ❌）也减半

- Boss 战平衡调整
  - 优化 Boss 血量和攻击频率
  - 调整 Boss 战奖励机制

### Documentation

- 更新 CHANGELOG.md 记录 Boss 战和新功能
- 需要更新 README.md 添加 Boss 战和新功能说明

## [Unreleased] - 2024-12-10

### Added

- **新增 5 个合成配方**
  - 🚀⚡ **涡轮过载**：火箭燃料+氮气加速 → 3 倍速度，半透明车身，围绕车辆闪烁光晕，无视碰撞（持续 10 秒）
  - 🛡️🔺 **钢铁之躯**：无敌护盾+无敌护盾 → 三角形光环包围车辆，碰撞摧毁障碍奖励 10 金币（持续 10 秒）
  - 🛡️💰 **金钟罩**：无敌护盾+金币 → 无敌效果，无碰撞则双倍返还金币面额（持续 12 秒）
  - 🔫⚡ **死星射击**：机枪+机枪 → 白色射线柱（带紫色闪电条纹）摧毁障碍奖励 10 金币（持续 10 秒）
  - 🔥🛡️ **无敌风火轮**：钢铁之躯+无敌护盾 → 碰撞摧毁障碍并延长持续时间 0.25 秒（持续 10 秒+）

### Improved

- 涡轮过载视觉效果：半透明车身 + 橙色光晕脉冲
- 钢铁之躯/无敌风火轮视觉效果：旋转三角形光环（灰色/红色）
- 金钟罩视觉效果：金色脉冲护盾
- 死星射击视觉效果：白色渐变射线柱 + 紫色闪电条纹 + 紫色侧边光晕
- 金钟罩特殊机制：合成时金币不计入余额和老虎机，作为素材消耗

### Documentation

- 更新 README.md 添加 5 个新合成配方说明
- 更新 CHANGELOG.md 记录新增合成配方

## [0.2.0] - 2024-12-09

### Added

- **金币老虎机系统**

  - 收集 3 个金币后自动填充卡片，集满后可启动老虎机
  - 5 种滚轮结果：❌、谢谢、100、200、500
  - 奖励机制：
    - 三个相同数字：100=1.5 倍、200=2 倍、500=3 倍奖池金额
    - 三个谢谢：奖励 10 金币
    - 三个 ❌：惩罚，扣除奖池金额
    - 其他组合：无效果
  - 按 S 键启动老虎机

- **道具合成系统**（5 种组合）

  - 🌀🔫 **旋转弹幕射击**：无敌护盾+机枪 → 旋转的无敌护盾发射机枪子弹（持续 10 秒）
  - 🔫🔫 **四弹道机枪**：2x 分数+机枪 → 射击弹幕从 2 弹道扩展为 4 弹道（持续 10 秒）
  - ⚡🌩️ **风暴闪电**：机枪+氮气加速 → 每 2 秒全屏攻击清除所有障碍（持续 10 秒）
  - ❤❤ **双倍爱心**：2x 分数+爱心 → 获得两个爱心补充两点耐久（即时效果）
  - 💰💰 **双倍金币**：2x 分数+金币 → 金币面额两倍（即时效果）
  - 合成需要按顺序获得道具（先获得 A 再获得 B 才能合成）
  - 合成后原始道具效果立即结束，显示新的合成道具图标

- **机枪金币奖励**
  - 机枪摧毁障碍车辆时奖励 10 金币
  - 风暴闪电清除的障碍车辆也享有此奖励
  - 实时显示摧毁车辆数量统计

### Improved

- 合成道具在 HUD 中以紫色渐变边框显示，区别于普通道具
- 老虎机 UI 显示在屏幕底部，实时显示卡片状态和奖池金额
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
