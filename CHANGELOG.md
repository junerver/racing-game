# 更新日志

## [修复] 2024-12-15

### 问题修复

1. **金币异常突破 9999 上限**

   - 问题：游戏中金币可能超过 9999 的上限
   - 修复：在 `lib/game/engine.ts` 中添加了 `addCoinsWithCap()` 辅助方法
   - 影响范围：所有添加金币的地方都已更新使用此方法，确保金币永远不会超过 9999
   - 修复位置：
     - 金钟罩双倍返还
     - 机枪摧毁障碍物奖励
     - 子弹击毁障碍物奖励
     - 金币道具收集
     - 双倍金币组合
     - 闪电风暴清屏奖励
     - 死星射线摧毁奖励
     - Boss 战胜利奖励
     - 老虎机奖励

2. **闪电风暴道具对 Boss 无效**

   - 问题：闪电风暴（storm_lightning）作为强力道具，在 Boss 战中无法对 Boss 造成伤害
   - 修复：在 `handleStormLightning()` 方法中添加了对 Boss 的伤害逻辑
   - 效果：每次闪电清屏攻击对 Boss 造成 3-5 点随机伤害
   - 位置：`lib/game/engine.ts` 第 1005-1010 行

3. **PC 浏览器空格键暂停无效**
   - 问题：在 PC 浏览器操作时，空格键只能开始游戏，无法暂停/继续游戏
   - 修复：在 `app/game/page.tsx` 的键盘事件处理中添加了空格键暂停/继续逻辑
   - 效果：
     - 游戏进行中按空格键：暂停游戏
     - 游戏暂停时按空格键：继续游戏
     - 游戏结束或未开始时按空格键：开始新游戏
   - 位置：`app/game/page.tsx` 第 92-101 行

### 技术细节

#### 金币上限实现

```typescript
private addCoinsWithCap(amount: number): void {
  const currentCoins = this.state.coins;
  const newAmount = Math.min(currentCoins + amount, 9999);
  this.state.coins = newAmount;
  addCoins(amount); // storage.ts中的函数已有上限保护
}
```

#### 闪电风暴对 Boss 伤害

```typescript
// Damage boss if in boss battle (3-5 damage per strike)
if (this.state.bossBattle.active && this.state.bossBattle.boss) {
  const bossDamage = 3 + Math.floor(Math.random() * 3); // 3-5 damage
  this.state.bossBattle.boss = damageBoss(
    this.state.bossBattle.boss,
    bossDamage
  );
}
```

#### 空格键暂停逻辑

```typescript
else if (e.key === ' ' || e.key === 'Enter') {
  e.preventDefault(); // 防止页面滚动
  const state = engine.getState();
  if (state.status === 'idle' || state.status === 'game_over') {
    engine.reset();
    engine.start();
    incrementGamesPlayed();
  } else if (state.status === 'playing') {
    engine.pause(); // 新增：游戏中按空格暂停
  } else if (state.status === 'paused') {
    engine.resume();
  }
}
```

### 测试建议

1. **金币上限测试**

   - 收集大量金币，验证不会超过 9999
   - 使用老虎机大奖，验证上限保护
   - Boss 战胜利奖励，验证上限保护

2. **闪电风暴 Boss 伤害测试**

   - 在 Boss 战中激活闪电风暴道具
   - 观察 Boss 血量是否每 1.5 秒减少 3-5 点
   - 验证闪电风暴可以有效辅助击败 Boss

3. **空格键暂停测试**
   - 游戏进行中按空格键，验证游戏暂停
   - 暂停状态按空格键，验证游戏继续
   - 验证 ESC 键暂停功能仍然正常工作

### 兼容性

- ✅ 所有修改向后兼容
- ✅ 不影响现有游戏存档
- ✅ 不影响其他游戏功能

### 相关文件

- `lib/game/engine.ts` - 游戏引擎核心逻辑
- `app/game/page.tsx` - 游戏页面和键盘控制
- `lib/utils/storage.ts` - 存储工具（已有金币上限保护）
