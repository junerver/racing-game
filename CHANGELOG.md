# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2024-12-08

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
