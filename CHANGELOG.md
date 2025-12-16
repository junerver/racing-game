# Changelog

## [Unreleased]

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
