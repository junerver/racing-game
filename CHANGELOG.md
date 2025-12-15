# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2024-12-13

### Added

- **Boss战模式**
  - 新增Boss战斗系统，每行驶100公里触发一次Boss战
  - Boss拥有多种攻击模式：机枪扫射、激光炮、投掷障碍车
  - Boss战期间暂停普通障碍物生成
  - 击败Boss获得大量金币奖励和分数加成
  - Boss战统计数据记录（击败次数、最高连胜等）

- **完全恢复道具（大还丹）**
  - 补满全部耐久值并提供10秒无敌时间
  - 仅在生命值≤1时在商店中显示
  - 售价：9999金币

- **拖动移动控制**
  - 新增触摸拖动控制方式，支持移动端操作
  - 可通过拖动屏幕控制车辆左右移动
  - 与键盘控制方式并存，提升操作体验

- **游戏统计系统**
  - 详细的游戏数据统计页面
  - 记录总游戏次数、总行驶距离、总游戏时长
  - 道具使用统计（各类道具使用次数）
  - Boss战统计（击败次数、最高连胜、总伤害等）
  - 排行榜增强，显示Boss战相关数据

### Improved

- Boss形态视觉效果优化
  - 不同攻击模式下的视觉反馈
  - 激光扫射、导弹、冲撞等攻击特效
  - Boss血条和状态显示

- 游戏统计页面重构
  - 更清晰的数据展示布局
  - 分类统计（基础数据、道具统计、Boss战统计）
  - 实时数据更新

### Fixed

- 修复Boss重复创建的bug
- 修复统计页面道具显示问题
- 修复统计页面数据显示异常

### Balance Changes

- **老虎机奖池减半**
  - 奖池金额从原来的全额改为1/2，避免金币快速膨胀
  - 例如：投入100、200、200金币，奖池从500改为250
  - 中奖奖励相应减半（如200三连从奖励500改为250）
  - 惩罚（三个❌）也减半

- Boss战平衡调整
  - 优化Boss血量和攻击频率
  - 调整Boss战奖励机制

### Documentation

- 更新CHANGELOG.md记录Boss战和新功能
- 需要更新README.md添加Boss战和新功能说明

## [Unreleased] - 2024-12-10

### Added

- **新增5个合成配方**
  - 🚀⚡ **涡轮过载**：火箭燃料+氮气加速 → 3倍速度，半透明车身，围绕车辆闪烁光晕，无视碰撞（持续10秒）
  - 🛡️🔺 **钢铁之躯**：无敌护盾+无敌护盾 → 三角形光环包围车辆，碰撞摧毁障碍奖励10金币（持续10秒）
  - 🛡️💰 **金钟罩**：无敌护盾+金币 → 无敌效果，无碰撞则双倍返还金币面额（持续12秒）
  - 🔫⚡ **死星射击**：机枪+机枪 → 白色射线柱（带紫色闪电条纹）摧毁障碍奖励10金币（持续10秒）
  - 🔥🛡️ **无敌风火轮**：钢铁之躯+无敌护盾 → 碰撞摧毁障碍并延长持续时间0.25秒（持续10秒+）

### Improved

- 涡轮过载视觉效果：半透明车身 + 橙色光晕脉冲
- 钢铁之躯/无敌风火轮视觉效果：旋转三角形光环（灰色/红色）
- 金钟罩视觉效果：金色脉冲护盾
- 死星射击视觉效果：白色渐变射线柱 + 紫色闪电条纹 + 紫色侧边光晕
- 金钟罩特殊机制：合成时金币不计入余额和老虎机，作为素材消耗

### Documentation

- 更新 README.md 添加5个新合成配方说明
- 更新 CHANGELOG.md 记录新增合成配方

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
