# Chess Powers - Game Logic & Rules

## Overview

Chess Powers is a tactical action game based on chess. Each piece has health points (HP) and unique special powers. The goal is to defeat the enemy King by reducing their HP to zero.

---

## Core Mechanics

### Turn System
- White moves first
- Players alternate turns
- On your turn, you can either:
  1. **Move** a piece (standard chess move)
  2. **Use a power** (ends your turn)

### Health Points (HP)
Unlike traditional chess where pieces are captured instantly, pieces have HP and take damage:

| Piece  | HP |
|--------|-----|
| Pawn   | 2   |
| Knight | 3   |
| Bishop | 3   |
| Rook   | 4   |
| Queen  | 5   |
| King   | 6   |

### Combat
- **Capturing**: When you move onto an enemy piece, you deal damage equal to your piece's **max HP**
- **Powers**: Deal specific damage amounts as described below
- **Death**: When a piece's HP reaches 0, it is removed from the board
- **Victory**: The game ends when a King's HP reaches 0

### Status Effects

| Effect   | Icon | Duration | Description |
|----------|------|----------|-------------|
| Immune   | 🛡️   | 1 turn   | Completely invincible - blocks ALL damage AND prevents capture |
| Stunned  | 💫   | 2 turns  | Cannot move or use powers |

**Important Immunity Rules:**
- Immune pieces **cannot be captured** by normal moves (the capture option won't appear)
- Immune pieces **cannot be stunned** by Stun Beam
- Immune pieces **still block movement** for sliding pieces (Rook, Bishop, Queen)

---

## Piece Movement (Standard Chess Rules)

### Pawn
- Moves forward 1 square
- Can move forward 2 squares from starting position
- Captures diagonally forward
- **Promotion**: Automatically promotes to Queen upon reaching the opposite end

### Rook
- Moves horizontally or vertically any number of squares
- Cannot jump over pieces

### Knight
- Moves in an "L" shape: 2 squares in one direction + 1 square perpendicular
- **Can jump over** other pieces

### Bishop
- Moves diagonally any number of squares
- Cannot jump over pieces

### Queen
- Combines Rook and Bishop movement
- Moves horizontally, vertically, or diagonally any number of squares
- Cannot jump over pieces

### King
- Moves 1 square in any direction
- **Castling**: Can castle kingside or queenside if:
  - King has not moved
  - Rook has not moved
  - No pieces between King and Rook

---

## Special Powers

### Pawn Powers

#### [1] Shrink 🔮
- **Type**: Instant (no target needed)
- **Effect**: Become immune to all attacks for 1 turn
- **Use Case**: Protect an advanced pawn from counterattack

---

### Rook Powers

#### [1] Jump Smash 💥
- **Type**: Targeted
- **Range**: 1 tile (adjacent)
- **Effect**:
  - Jump to an adjacent tile and land there
  - Deal **2 damage** to the piece on the target tile (kills it)
  - Deal **1 damage** to all pieces in surrounding tiles (8 directions)
- **Landing Restriction**: Can only land on empty tiles OR enemy pieces with **2 HP or less** (the 2 damage must kill the target to land on it)
- **Use Case**: Area damage when enemies are clustered; finish off weakened pieces

#### [2] Heal 💚
- **Type**: Targeted (friendly only)
- **Range**: 2 tiles
- **Effect**: Restore **2 HP** to a nearby friendly piece (cannot exceed max HP)
- **Use Case**: Keep nearby pieces alive; requires positioning the Rook close to allies

---

### Bishop Powers

#### [1] Stun Beam ⚡
- **Type**: Targeted (enemy only)
- **Range**: 3 tiles
- **Effect**: Target enemy becomes **stunned** for **2 turns** (cannot move or use powers)
- **Restriction**: Cannot stun immune pieces (Shrink, Armor, Shield Block)
- **Use Case**: Disable a threatening piece for multiple turns

#### [2] Kick 🦵
- **Type**: Targeted (enemy only)
- **Range**: 1 tile (adjacent)
- **Effect**: Deal **2 damage** to an adjacent enemy piece
- **Use Case**: Finish off weakened pieces without moving

---

### Knight Powers

#### [1] Smash 💢
- **Type**: Instant (no target needed)
- **Range**: 1 tile radius (all 8 adjacent tiles)
- **Effect**: Deal **2 damage** to all enemy pieces within 1 tile
- **Use Case**: Area damage when surrounded by enemies

#### [2] Teleport ✨
- **Type**: Targeted (empty tiles only)
- **Range**: 3 tiles
- **Effect**: Instantly move to any empty tile within range
- **Use Case**: Escape danger or reposition strategically

---

### Queen Powers

#### [1] Shockwave 🌊
- **Type**: Instant (no target needed)
- **Range**: 1 tile radius (all 8 adjacent tiles)
- **Effect**: Deal **2 damage** to all enemy pieces within 1 tile
- **Use Case**: Punish enemies that get too close

#### [2] Electric Beam ⚡
- **Type**: Targeted (line attack)
- **Range**: 3 tiles
- **Effect**: Deal **1 damage** to all enemy pieces in a straight line from the Queen to the target
- **Use Case**: Hit multiple enemies lined up

#### [3] Teleport ✨
- **Type**: Targeted (empty tiles only)
- **Range**: 3 tiles
- **Effect**: Instantly move to any empty tile within range
- **Use Case**: Escape or aggressive repositioning

---

### White King Powers

#### [1] Electric Beam ⚡
- **Type**: Targeted (line attack)
- **Range**: 3 tiles
- **Effect**: Deal **1 damage** to all enemy pieces in a straight line
- **Use Case**: Offensive capability for the King

#### [2] Dash 💨
- **Type**: Targeted (empty tiles only)
- **Range**: 3 tiles
- **Effect**: Move to any empty tile within range
- **Use Case**: Quick escape from danger

#### [3] Armor 🛡️
- **Type**: Instant (no target needed)
- **Effect**: Become **immune** to all attacks for 1 turn
- **Use Case**: Survive when under heavy attack

---

### Black King Powers

#### [1] Shield Throw 🛡️
- **Type**: Targeted (line attack)
- **Range**: 3 tiles
- **Effect**: Deal **1 damage** to all enemy pieces in a straight line
- **Use Case**: Offensive ranged attack

#### [2] Jump 🦘
- **Type**: Targeted (empty tiles only)
- **Range**: 3 tiles
- **Effect**: Move to any empty tile within range
- **Use Case**: Rapid repositioning

#### [3] Shield Block 🔰
- **Type**: Instant (no target needed)
- **Effect**: Become **immune** to all attacks for 1 turn
- **Use Case**: Defensive survival

---

## Controls

### Mouse
- **Click** a piece to select it
- **Click** a highlighted square to move
- **Click** a power button in the side panel to activate

### Keyboard
- **1, 2, 3** - Activate powers (when a piece is selected)
- **Escape** - Cancel power selection

---

## Visual Indicators

| Color | Meaning |
|-------|---------|
| Yellow | Selected piece |
| Green | Valid move destination |
| Red | Capture opportunity |
| Purple | Valid power target |
| Blue overlay | Stunned piece |
| Cyan overlay | Immune piece |

### Health Bar Colors
- **Green**: > 50% HP
- **Yellow**: 25-50% HP
- **Red**: < 25% HP

---

## Strategy Tips

1. **Weaken before capturing**: Use powers to soften enemies before moving in for the kill
2. **Protect your King**: The King has 6 HP but losing it ends the game
3. **Use immunity wisely**: Shrink/Armor/Shield Block make you completely invincible but only for 1 turn
4. **Immunity blocks stun**: Use immunity preemptively to avoid being stunned
5. **Stun is powerful**: Bishop's Stun Beam disables a piece for 2 full turns
6. **Jump Smash finishers**: Rook can only land on pieces it would kill - use it to finish weakened enemies
7. **Rook as support**: Position Rooks near valuable pieces to heal them when needed
8. **Area denial**: Knights and Queens with Smash/Shockwave punish clustering
9. **Beam attacks**: Line up enemies for Electric Beam or Shield Throw
10. **Mobility powers**: Teleport and Dash allow escapes that standard movement can't
