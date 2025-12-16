# Changelog

## [Unreleased]

### Added

- **车辆差异化系统** - 四种车辆类型各具特色，增加游戏策略深度

  - **🏎️ Sports Car（跑车）- 速度型**
    - 极速最高（+2），加速最快（+0.2）
    - 耐久度较低（2 ❤️）
    - 特殊能力：速度类道具持续时间 +20%
    - 操控灵敏但稳定性较低
  - **🚗 Sedan（轿车）- 均衡型**
    - 各项属性均衡
    - 标准耐久度（3 ❤️）
    - 特殊能力：收集金币时额外获得 15% 金币
  - **🚙 SUV（越野车）- 火力型**
    - 极速略低（-1），操控更稳定
    - 标准耐久度（3 ❤️）
    - 特殊能力：机枪等武器道具持续时间 +25%
  - **🛻 Pickup（皮卡）- 坦克型**
    - 极速最低（-2），加速较慢（-0.1）
    - 最高耐久度（4 ❤️）
    - 特殊能力：碰撞恢复时间 -20%
    - 操控最稳定

- **车辆美化绘制系统** - 四种车辆拥有独特的视觉外观

  - Sports Car：流线型车身、低矮驾驶舱、赛车条纹、尾翼
  - Sedan：经典三厢造型、金币装饰标识
  - SUV：高大方正车身、车顶行李架、机枪装饰标识
  - Pickup：驾驶舱+货箱设计、爱心装饰标识

- **车辆选择页面增强** - 展示车辆特性和能力说明

  - 显示车辆图标和特色标签
  - 显示特殊能力详细说明
  - 显示耐久度、道具加成等属性
  - 支持引擎和轮胎等级自定义

- **道具效果策略模式架构** - 重构道具系统以提升扩展性和可维护性

  - 新增 `types/powerup-effects.ts` - 道具效果类型定义
    - `PowerUpEffect` 接口定义道具效果的标准结构
    - `CollisionResult` 类型定义碰撞处理结果
    - `SpeedModifier` 类型定义速度修改器
    - 辅助函数：`createInvincibleCollisionResult()`, `createDestroyCollisionResult()`
  - 新增 `lib/game/powerup-effects.ts` - 道具效果处理器模块
    - 使用策略模式实现所有道具效果
    - 速度类道具：`speed_boost`, `hyper_speed`, `nitro_boost`, `rocket_fuel`, `turbo_overload`, `supernova_burst`
    - 无敌类道具：`invincibility`, `time_dilation`, `rotating_shield_gun`
    - 碰撞摧毁类道具：`iron_body`, `invincible_fire_wheel`
    - 特殊道具：`golden_bell`, `machine_gun`, `death_star_beam`, `storm_lightning`
    - 辅助函数：`calculateSpeedModifier()`, `handleObstacleCollision()`, `executeOnUpdate()`, `executeOnExpire()`
    - 状态检查函数：`hasAnyInvincibility()`, `hasAnyCollisionDestroy()`

- **道具生成权重配置系统** - 配置化的道具生成概率
  - 新增 `BASIC_POWERUP_SPAWN_WEIGHTS` - 基础道具生成权重配置
  - 新增 `SHOP_POWERUP_SPAWN_WEIGHTS` - 商店道具生成权重配置
  - 新增 `COIN_VALUE_WEIGHTS` - 按难度等级的金币面额权重配置
  - 新增 `selectByWeight()` - 通用权重选择辅助函数
  - 重构 `createPowerUp()` 使用权重配置替代硬编码数组

### Changed

- **重构 engine.ts 速度计算逻辑** - 使用策略模式

  - 移除多个 `isPowerUpActive()` 检查的 if-else 链
  - 使用 `calculateSpeedModifier()` 统一计算速度修改
  - 代码从 ~35 行减少到 ~15 行，提升可读性

- **重构 engine.ts 碰撞处理逻辑** - 使用策略模式

  - 移除分散的无敌状态检查
  - 使用 `handleObstacleCollision()` 统一处理碰撞结果
  - 支持碰撞结果的合并（多个道具效果叠加）
  - 代码从 ~90 行减少到 ~70 行，逻辑更清晰

- **重构道具过期处理** - 使用策略模式

  - 移除硬编码的金钟罩过期逻辑
  - 使用 `executeOnExpire()` 统一执行道具过期回调
  - 新增道具只需在效果定义中添加 `onExpire` 回调

- **重构 powerups.ts** - 使用权重配置
  - `createPowerUp()` 使用 `selectByWeight()` 选择道具类型
  - 金币面额使用 `COIN_VALUE_WEIGHTS` 按难度配置
  - 新增 `getSpawnablePowerUpTypes()` 辅助函数

### Technical Details

新增文件：

- `types/powerup-effects.ts` - 道具效果类型定义（~150 行）
- `lib/game/powerup-effects.ts` - 道具效果处理器（~420 行）

修改文件：

- `lib/game/constants.ts`:

  - 第 67-120 行：新增权重配置接口和常量
  - 新增 `PowerUpSpawnWeight` 接口
  - 新增 `BASIC_POWERUP_SPAWN_WEIGHTS`, `SHOP_POWERUP_SPAWN_WEIGHTS`, `COIN_VALUE_WEIGHTS`
  - 新增 `selectByWeight()` 辅助函数

- `lib/game/powerups.ts`:

  - 第 1-50 行：重构 `createPowerUp()` 使用权重配置
  - 新增 `getSpawnablePowerUpTypes()` 函数

- `lib/game/engine.ts`:
  - 第 54-62 行：导入道具效果系统函数
  - 第 376-402 行：重构速度计算逻辑
  - 第 489-497 行：重构道具过期处理
  - 第 528-537 行：添加 `executeOnUpdate()` 调用
  - 第 793-860 行：重构碰撞处理逻辑
  - 第 1216-1230 行：重命名 `handleDeathStarBeam` 为 `handleDeathStarBeamBossDamage`

### 架构改进

**扩展性提升**：

- 新增道具只需在 `POWERUP_EFFECTS` 注册表中添加效果定义
- 无需修改 engine.ts 中的多处 if-else 逻辑
- 道具效果与游戏引擎解耦

**可维护性提升**：

- 每个道具的效果逻辑集中在一处
- 类型安全的效果定义
- 清晰的接口契约

**可测试性提升**：

- 道具效果可独立单元测试
- 辅助函数可独立验证

- 新增 ❓ 神秘宝箱道具
  - 从 4 种商店道具（无敌、机枪、火箭燃料、氮气加速）中随机抽取一个生效
  - 出现率与其他商店道具一致（每 30 秒生成一次，20%概率）
  - 在统计中单独计数，不与抽取到的道具混淆
  - 支持道具合成系统
  - 使用青色（#00d4ff）作为背景色，提高辨识度

### Fixed

- **修复商店道具重复购买问题** - 防止强力合成道具过于简单地被合成

  - 问题：玩家可以在商店道具生效期间重复购买同一道具，导致强力合成道具（如死星射击=机枪+机枪）过于容易获得
  - 解决方案：
    - 在 `ActivePowerUp` 类型中添加 `source` 字段标记道具来源（`road`/`shop`/`boss`/`combo`/`mystery_box`）
    - 在 `purchaseShopPowerUp()` 中检查是否已有来自商店的同类型**原始道具**
    - **重要**：如果道具已被合成为高级道具，则允许再次购买（例如：护盾(道路)+护盾(商店)=钢铁之躯后，可再次购买护盾）
    - 更新商店 UI 显示不同状态：
      - 绿色：已从商店购买，原始道具生效中（禁用购买）
      - 黄色：道具生效中（来自路上），可购买进行合成
      - 蓝色：可购买
      - 灰色：金币不足
  - 影响文件：`types/game.ts`, `lib/game/engine.ts`, `app/components/ShopUI.tsx`

- **修复 Boss 激光束持续时间过长问题** - 激光束现在会在 0.8 秒后正确消失

  - 问题：Boss 发射的激光束没有设置持续时间，导致激光永远不会消失
  - 解决方案：
    - 在 `BossAttack` 类型中添加 `createdAt` 可选属性记录创建时间
    - 在创建激光攻击时记录 `Date.now()` 时间戳
    - 在 `updateBossAttacks()` 中检查激光存在时间，超过 800ms 后设置 `active = false`
  - 影响文件：`lib/game/boss.ts`, `types/game.ts`

- **修复车辆类型保存问题** - 确保车辆类型正确保存和加载

  - 修复 `saveSelectedVehicle()` 函数未保存 `type` 字段的问题
  - 添加数据迁移逻辑，旧数据自动根据车辆 ID 推断类型
  - 确保游戏中车辆绘制和耐久度与选择的车辆类型一致

- 修复磁铁道具吸附问题
  - 增强吸引力（从 0.15 提升到 0.25）
  - 近距离时额外增加吸引力
  - 非常近时（30px 内）直接吸附到车辆中心，确保碰撞触发
  - 修复道具被吸到车辆下方无法生效的问题

## [Previous]

### Added

- **服务端数据库系统** - 实现基于 SQLite 的服务端游戏数据存储
  - 使用 `better-sqlite3` 提供高性能的同步数据库访问
  - 完整的数据库架构设计，支持玩家、车辆、游戏记录、排行榜等数据
  - 版本化迁移系统，支持数据库架构的升级和降级
  - 类型安全的 DAO（数据访问对象）层，封装所有数据库操作
  - RESTful API 接口，支持游戏记录保存、排行榜查询、玩家统计等功能

#### 数据库架构

- **8 个核心数据表**：

  - `db_version` - 数据库版本管理
  - `players` - 玩家基本信息
  - `vehicles` - 车辆配置
  - `game_records` - 游戏记录
  - `power_up_stats` - 道具统计
  - `boss_records` - Boss 战斗记录
  - `leaderboard` - 排行榜
  - `slot_machine_records` - 老虎机记录

- **完善的索引设计** - 优化查询性能
- **外键约束** - 保证数据完整性
- **事务支持** - 确保数据一致性

#### 数据库迁移系统

- 版本化迁移，支持 up/down 操作
- 自动迁移检测和执行
- 数据库重置和备份功能
- 迁移历史追踪

#### API 接口

- `POST /api/game/save` - 保存游戏记录
- `GET /api/leaderboard` - 查询排行榜（支持按距离/分数排序）
- `GET /api/player/[username]` - 查询玩家信息和游戏历史
- `GET /api/db/health` - 数据库健康检查

#### 工具函数

- 数据库统计信息查询
- 分页查询辅助
- 批量数据导入/导出
- 数据库清理和优化
- JSON 安全解析
- UUID 验证

#### 玩家身份管理

- **自动玩家名称生成** - 首次游戏时自动生成唯一玩家名称
- **本地持久化** - 玩家名称保存在本地存储中
- **游戏记录自动保存** - 游戏结束时自动将记录保存到服务端数据库
- **非阻塞保存** - 游戏记录保存不影响游戏流程

#### 全球排行榜

- **服务端排行榜** - 排行榜数据从服务端数据库实时加载
- **显示玩家名称** - 每条排行榜记录显示对应的玩家用户名
- **多维度排序** - 支持按距离或分数排序
- **实时更新** - 游戏结束后自动更新排行榜

### Technical Details

新增文件：

- `lib/db/schema.ts` - 数据库表结构定义和类型
- `lib/db/migrations.ts` - 数据库迁移系统
- `lib/db/connection.ts` - 数据库连接管理器
- `lib/db/init.ts` - 数据库自动初始化模块
- `lib/db/dao.ts` - 数据访问对象（PlayerDAO, VehicleDAO, GameRecordDAO 等）
- `lib/db/utils.ts` - 数据库工具函数
- `lib/db/index.ts` - 统一导出接口
- `lib/utils/player.ts` - 玩家身份管理工具
- `app/api/game/save/route.ts` - 游戏记录保存 API
- `app/api/leaderboard/route.ts` - 排行榜查询 API（支持玩家名称）
- `app/api/player/[username]/route.ts` - 玩家信息查询 API
- `app/api/db/health/route.ts` - 数据库健康检查 API
- `scripts/test-database.ts` - 数据库功能测试脚本
- `docs/DATABASE.md` - 完整数据库系统文档

修改文件：

- `app/components/Leaderboard.tsx` - 重构为使用服务端 API 加载排行榜，显示玩家名称
- `app/leaderboard/page.tsx` - 排行榜页面重构为使用服务端 API，显示玩家名称

新增依赖：

- `better-sqlite3` - SQLite 数据库驱动
- `@types/better-sqlite3` - TypeScript 类型定义
- `uuid` - UUID 生成器
- `@types/uuid` - TypeScript 类型定义

新增命令：

- `npm run test:db` - 运行数据库功能测试

游戏引擎和排行榜改进：

- `lib/game/engine.ts`:

  - 第 36 行：导入 `getPlayerUsername` 玩家管理工具
  - 第 56 行：添加 `gameStartTime` 实例变量记录游戏开始时间
  - 第 189 行：在 `start()` 方法中记录游戏开始时间
  - 第 233-289 行：重构 `gameOver()` 方法，添加 `saveGameRecord()` 异步保存游戏记录到数据库
  - 第 270-274 行：修复游戏时长计算逻辑，确保正确保存到数据库
  - 自动获取玩家用户名并保存完整游戏数据
  - 非阻塞保存，不影响游戏流程

- `lib/db/dao.ts`:

  - 第 476-503 行：重构 `LeaderboardDAO.getByDistance()` 和 `getByScore()` 方法
  - 使用 JOIN 查询关联玩家表，返回包含玩家用户名的排行榜数据
  - 添加 `mapToEntriesWithUsername()` 方法处理带用户名的数据映射

- `app/components/Leaderboard.tsx`:

  - 完全重构为使用服务端 API 加载排行榜
  - 添加 `useEffect` 钩子从 `/api/leaderboard` 获取数据
  - 显示玩家用户名、车辆名称和游戏时间
  - 添加加载状态和错误处理
  - 标题改为"全球排行榜"突出公共排行榜特性

- `app/leaderboard/page.tsx`:
  - 从本地存储切换到服务端 API（`/api/leaderboard`）
  - 移除本地存储相关的清除记录功能
  - 添加 `useEffect` 钩子异步加载排行榜数据
  - 显示玩家用户名作为主要标识（青色加粗）
  - 添加金币显示列
  - 布局改为 4 列：玩家、分数、金币、车辆配置
  - 添加加载状态、错误处理和重试按钮
  - 标题改为"🏆 全球排行榜"和"所有玩家的最佳成绩"

### Fixed

- **修复游戏时长计算错误导致的数据库保存失败**

  - 问题：`NOT NULL constraint failed: game_records.game_duration` 错误
  - 原因：混用相对时间（`performance.now()`）和绝对时间（`Date.now()`）计算游戏时长
  - 解决方案：
    - 添加 `gameStartTime` 实例变量记录游戏开始的绝对时间戳
    - 在 `start()` 方法中使用 `Date.now()` 记录开始时间
    - 在 `saveGameRecord()` 中直接计算：`Date.now() - this.gameStartTime`
    - 确保游戏时长最小值为 1 秒，并转换为秒单位存储
  - 影响：确保所有游戏记录都能成功保存到数据库

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
  - 第 56 行：添加 `gameStartTime` 实例变量用于记录游戏开始时间
  - 第 72 行：在构造函数中初始化 `gameStartTime = 0`
  - 第 189 行：在 `start()` 方法中设置 `this.gameStartTime = Date.now()`
  - 第 270 行：修复 `saveGameRecord()` 中的游戏时长计算逻辑
    - 使用 `Math.max(1000, Date.now() - this.gameStartTime)` 确保最小 1 秒
    - 使用 `Math.floor(gameDuration / 1000)` 转换为秒并取整
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
...
