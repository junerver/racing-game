# Changelog

All notable changes to this project will be documented in this file.

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
