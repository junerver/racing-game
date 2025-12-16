# 数据库系统文档

本文档详细说明了赛车游戏的数据库系统架构、使用方法和最佳实践。

## 📚 目录

- [系统架构](#系统架构)
- [数据库表结构](#数据库表结构)
- [API 使用指南](#api-使用指南)
- [数据访问层 (DAO)](#数据访问层-dao)
- [数据库迁移](#数据库迁移)
- [最佳实践](#最佳实践)

## 系统架构

### 技术选型

- **数据库**: SQLite 3
- **驱动**: better-sqlite3 (同步 API，高性能)
- **ORM**: 无 (使用原生 SQL + DAO 模式)
- **类型系统**: TypeScript (完整类型定义)

### 架构层次

```
┌─────────────────────────────────────┐
│     API Routes (Next.js)            │  ← RESTful API 接口
├─────────────────────────────────────┤
│     DAO Layer (Data Access Object)  │  ← 业务逻辑和数据访问
├─────────────────────────────────────┤
│     Database Connection Manager     │  ← 连接池和事务管理
├─────────────────────────────────────┤
│     SQLite Database (better-sqlite3)│  ← 数据持久化
└─────────────────────────────────────┘
```

## 数据库表结构

### 核心表

#### 1. players (玩家表)

```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,              -- UUID
  username TEXT NOT NULL UNIQUE,    -- 用户名
  total_coins INTEGER DEFAULT 0,    -- 总金币
  total_distance INTEGER DEFAULT 0, -- 总距离
  games_played INTEGER DEFAULT 0,   -- 游戏次数
  high_score INTEGER DEFAULT 0,     -- 最高分
  created_at INTEGER NOT NULL,      -- 创建时间
  updated_at INTEGER NOT NULL       -- 更新时间
);
```

#### 2. game_records (游戏记录表)

```sql
CREATE TABLE game_records (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,          -- 玩家 ID (外键)
  vehicle_id TEXT NOT NULL,         -- 车辆 ID (外键)
  distance INTEGER NOT NULL,        -- 行驶距离
  score INTEGER NOT NULL,           -- 分数
  coins_collected INTEGER DEFAULT 0,-- 收集金币
  hearts_remaining INTEGER DEFAULT 3,-- 剩余生命
  max_speed_reached REAL NOT NULL,  -- 最高速度
  obstacles_destroyed INTEGER DEFAULT 0, -- 摧毁障碍物
  game_duration INTEGER NOT NULL,   -- 游戏时长
  difficulty_level TEXT NOT NULL,   -- 难度等级
  boss_defeated BOOLEAN DEFAULT 0,  -- 是否击败 Boss
  created_at INTEGER NOT NULL,      -- 游戏时间
  FOREIGN KEY (player_id) REFERENCES players(id)
);
```

#### 3. leaderboard (排行榜表)

```sql
CREATE TABLE leaderboard (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  game_record_id TEXT NOT NULL,
  distance INTEGER NOT NULL,        -- 距离排名
  score INTEGER NOT NULL,           -- 分数排名
  coins INTEGER NOT NULL,           -- 金币数
  vehicle_config TEXT NOT NULL,     -- 车辆配置 (JSON)
  statistics TEXT NOT NULL,         -- 统计数据 (JSON)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (game_record_id) REFERENCES game_records(id)
);
```

### 索引优化

```sql
-- 玩家表索引
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_high_score ON players(high_score DESC);

-- 游戏记录表索引
CREATE INDEX idx_game_records_player_id ON game_records(player_id);
CREATE INDEX idx_game_records_distance ON game_records(distance DESC);
CREATE INDEX idx_game_records_score ON game_records(score DESC);

-- 排行榜索引
CREATE INDEX idx_leaderboard_distance ON leaderboard(distance DESC);
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
```

## API 使用指南

### 1. 保存游戏记录

**Endpoint**: `POST /api/game/save`

**请求示例**:

```typescript
const response = await fetch("/api/game/save", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "player123",
    vehicleConfig: {
      id: "vehicle_1",
      name: "闪电",
      color: "#FF0000",
      engineLevel: 3,
      tireLevel: 2,
    },
    distance: 1500,
    score: 7500,
    coins: 800,
    hearts: 1,
    maxSpeed: 250,
    obstaclesDestroyed: 50,
    gameDuration: 120000,
    difficultyLevel: "medium",
    bossDefeated: true,
    statistics: {
      powerUpStats: [{ type: "speed_boost", collected: 5, comboCrafted: 0 }],
      totalCoinsCollected: 800,
      totalDistanceTraveled: 1500,
      totalObstaclesDestroyed: 50,
      bossRecords: [
        {
          bossNumber: 1,
          distance: 1000,
          defeated: true,
          elapsedTime: 30000,
          powerUpsUsed: ["machine_gun"],
          timestamp: Date.now(),
        },
      ],
    },
  }),
});

const result = await response.json();
// { success: true, data: { gameRecordId, playerId, vehicleId } }
```

### 2. 查询排行榜

**Endpoint**: `GET /api/leaderboard?type={type}&limit={limit}`

**参数**:

- `type`: 'distance' | 'score' (默认: 'distance')
- `limit`: 1-100 (默认: 100)

**请求示例**:

```typescript
// 查询距离前 10 名
const response = await fetch('/api/leaderboard?type=distance&limit=10');
const result = await response.json();

// 响应结构
{
  "success": true,
  "data": {
    "type": "distance",
    "entries": [
      {
        "id": "uuid",
        "distance": 2000,
        "score": 10000,
        "coins": 1500,
        "vehicleName": "闪电",
        "vehicleConfig": { /* 车辆配置 */ },
        "statistics": { /* 游戏统计 */ },
        "timestamp": 1234567890000
      }
    ],
    "total": 10
  }
}
```

### 3. 查询玩家信息

**Endpoint**: `GET /api/player/[username]`

**请求示例**:

```typescript
const response = await fetch("/api/player/player123");
const result = await response.json();

// 响应包含玩家信息、车辆列表、游戏历史
```

## 数据访问层 (DAO)

### 使用示例

```typescript
import {
  PlayerDAO,
  VehicleDAO,
  GameRecordDAO,
  LeaderboardDAO,
  transaction,
} from "@/lib/db";

// 1. 创建玩家
const player = PlayerDAO.create("newPlayer");

// 2. 查询玩家
const player = PlayerDAO.findByUsername("player123");

// 3. 更新玩家统计
PlayerDAO.updateStats(player.id, {
  coins: 100, // 增加 100 金币
  distance: 500, // 增加 500 距离
  gamesPlayed: 1, // 游戏次数 +1
  highScore: 5000, // 更新最高分（如果更高）
});

// 4. 创建游戏记录
const gameRecordId = GameRecordDAO.create({
  playerId: player.id,
  vehicleId: vehicle.id,
  distance: 1000,
  score: 5000,
  coinsCollected: 300,
  heartsRemaining: 2,
  maxSpeedReached: 200,
  obstaclesDestroyed: 30,
  gameDuration: 60000,
  difficultyLevel: "medium",
  bossDefeated: false,
});

// 5. 使用事务
transaction(() => {
  const player = PlayerDAO.create("player456");
  const vehicle = VehicleDAO.create(player.id, vehicleConfig);
  VehicleDAO.setSelected(player.id, vehicle.id);
});
```

## 数据库迁移

### 迁移系统概述

数据库使用版本化迁移系统，每个版本包含 `up` 和 `down` 方法：

```typescript
const migration_v2: Migration = {
  version: 2,
  description: "添加新功能表",

  up: (db: Database) => {
    db.exec(`
      CREATE TABLE new_feature (
        id TEXT PRIMARY KEY,
        ...
      );
    `);
  },

  down: (db: Database) => {
    db.exec(`DROP TABLE IF EXISTS new_feature;`);
  },
};
```

### 运行迁移

```typescript
import { runMigrations, getCurrentVersion } from "@/lib/db";

// 自动迁移到最新版本
runMigrations(db);

// 迁移到特定版本
runMigrations(db, 2);

// 查询当前版本
const version = getCurrentVersion(db);
```

### 创建新迁移

1. 在 `lib/db/migrations.ts` 中定义新迁移
2. 添加到 `MIGRATIONS` 数组
3. 更新 `DB_CONFIG.CURRENT_VERSION`
4. 重启应用自动执行迁移

## 最佳实践

### 1. 数据库连接

```typescript
// ✅ 推荐：使用单例模式
import { getDatabase } from "@/lib/db";
const db = getDatabase();

// ❌ 避免：重复创建连接
import Database from "better-sqlite3";
const db = new Database("game.db"); // 不要这样做
```

### 2. 事务使用

```typescript
// ✅ 推荐：使用事务包装多个操作
import { transaction } from "@/lib/db";

transaction(() => {
  PlayerDAO.create("player");
  VehicleDAO.create(playerId, config);
  GameRecordDAO.create(data);
});

// ❌ 避免：不使用事务导致部分失败
PlayerDAO.create("player");
VehicleDAO.create(playerId, config); // 如果失败，玩家已创建
```

### 3. 错误处理

```typescript
// ✅ 推荐：捕获并处理错误
try {
  const player = PlayerDAO.findByUsername(username);
  if (!player) {
    return { error: "玩家不存在" };
  }
} catch (error) {
  console.error("数据库错误:", error);
  return { error: "系统错误" };
}
```

### 4. 性能优化

```typescript
// ✅ 推荐：批量操作
PowerUpStatsDAO.createBatch(gameRecordId, allStats);

// ❌ 避免：循环单条插入
for (const stat of stats) {
  // 不要在循环中执行单条插入
}
```

### 5. 数据验证

```typescript
// ✅ 推荐：验证输入数据
if (!username || username.length < 3) {
  return { error: "用户名至少 3 个字符" };
}

if (!isValidUUID(playerId)) {
  return { error: "无效的玩家 ID" };
}
```

## 维护和监控

### 数据库健康检查

```typescript
import { healthCheck } from "@/lib/db";

const health = healthCheck();
console.log("数据库状态:", health);
// { connected: true, version: 1, path: '/path/to/db' }
```

### 数据库统计

```typescript
import { getDatabaseStats, formatBytes } from "@/lib/db";

const stats = getDatabaseStats();
console.log("数据库大小:", formatBytes(stats.totalSize));
console.log("表行数:", stats.tables);
```

### 数据库备份

```typescript
import { backupDatabase } from "@/lib/db";

// 创建备份
backupDatabase("./backup/racing_game_backup.db");
```

### 数据库优化

```typescript
import { optimizeDatabase } from "@/lib/db";

// 定期优化（建议每周执行一次）
optimizeDatabase(); // 执行 VACUUM 和 ANALYZE
```

### 数据清理

```typescript
import { cleanupDatabase } from "@/lib/db";

// 删除 30 天前的旧记录并压缩数据库
const result = cleanupDatabase({
  deleteOldRecords: true,
  daysToKeep: 30,
  vacuum: true,
});

console.log(`删除 ${result.deletedRecords} 条记录`);
console.log(`释放 ${formatBytes(result.freedSpace)} 空间`);
```

## 测试

### 运行数据库功能测试

项目包含完整的数据库功能测试脚本，用于验证所有功能是否正常工作。

**运行测试**:

```bash
npm run test:db
```

**测试内容**:

1. ✅ 数据库初始化
2. ✅ 创建测试玩家
3. ✅ 创建测试车辆
4. ✅ 创建游戏记录
5. ✅ 添加道具统计
6. ✅ 添加到排行榜
7. ✅ 查询排行榜
8. ✅ 查询玩家信息
9. ✅ 数据库统计信息

**示例输出**:

```
🚀 开始数据库功能测试...

1️⃣ 初始化数据库
✅ 数据库初始化成功

2️⃣ 创建测试玩家
✅ 玩家创建成功: test_player_1234567890
   玩家 ID: uuid-here

...

🎉 所有测试通过！
数据库系统工作正常，所有功能已验证。
```

**测试脚本位置**: [`scripts/test-database.ts`](../scripts/test-database.ts)

## 故障排除

### 常见问题

1. **数据库锁定**

   - 原因：多个进程同时访问数据库
   - 解决：使用 WAL 模式 (已启用)

2. **性能下降**

   - 原因：数据库未优化
   - 解决：定期运行 `optimizeDatabase()`

3. **磁盘空间不足**

   - 原因：旧数据积累
   - 解决：定期运行 `cleanupDatabase()`

4. **迁移失败**
   - 原因：SQL 语法错误或版本冲突
   - 解决：检查迁移脚本，必要时回滚

## 相关文档

- [项目主文档](../README.md)
- [变更日志](../CHANGELOG.md)
- [开发规范](../AGENTS.md)
