# BIT-POKEMON Experience & Battle Tracking System

## ✅ Implemented Features

### 1. **Experience System Module** (`experience-system.js`)

- **ExperienceSystem Class**: Handles experience gain, level ups, and stat calculations
- **Experience Curves**: Quadratic growth requiring more exp per level
- **Stat Growth**: Automatic stat increases on level up
  - HP: +5 per level
  - ATK: +2 per level
  - DEF: +2 per level
  - SP.ATK: +2 per level
  - SP.DEF: +2 per level
  - SPD: +1 per level
- **Rarity Multipliers**: Different experience gains based on pokemon rarity
  - COMMON: 1.0x
  - UNCOMMON: 1.2x
  - RARE: 1.5x
  - EPIC: 2.0x
  - LEGENDARY: 3.0x
- **Level Scaling**: Maximum level 100

### 2. **Battle Integration**

- Experience awarded after each battle
- Win: 150 base exp + level difference bonuses
- Loss: 50 base exp (reduced penalty)
- Automatic level up detection with notifications
- Battle stats saved to backend (battles_fought, battles_won)

### 3. **Data Flow**

```
game.html
  → passes wildData (with rarity)
  → battle.html selects pokemon (with user_pokemon_id)
  → battle.js initializes battle
  → experience-system.js tracks level progression
  → Backend saves experience and battle results
```

---

## 🔧 Backend API Endpoints Required

### 1. **Save Battle Result**

```
POST /battles/record
Headers: Authorization: Bearer {token}
Body: {
  "user_id": 29,
  "user_pokemon_id": 27,
  "won": true,
  "exp_gained": 180,
  "new_level": 5,
  "total_exp": 450,
  "leveled_up": true
}
Response: { "success": true, "message": "Battle recorded" }
```

### 2. **Update User Battle Stats**

```
PUT /users/{user_id}/battle-stats
Headers: Authorization: Bearer {token}
Body: {
  "battle_won": true
}
Response: { "success": true, "data": { "total_battles": 5, "battles_won": 3 } }
```

### 3. **Update Pokemon Stats**

```
PUT /users/{user_id}/pokemon/{user_pokemon_id}
Headers: Authorization: Bearer {token}
Body: {
  "level": 5,
  "experience": 450
}
Response: { "success": true, "data": { "level": 5, "experience": 450 } }
```

---

## 📊 Database Changes Needed

### Users Table - Add/Ensure Fields

```sql
ALTER TABLE users ADD COLUMN total_battles INT DEFAULT 0;
ALTER TABLE users ADD COLUMN battles_won INT DEFAULT 0;
```

### UserPokemon Table - Ensure Field

```sql
ALTER TABLE user_pokemon ADD COLUMN experience INT DEFAULT 0;
-- level column already exists
```

---

## 🎮 How It Works in Battle

### Experience Calculation

```javascript
// Base exp based on result
baseExp = won ? 150 : 50;

// Level difference bonus (fight higher level = more exp)
levelDiff = opponentLevel - playerLevel;
if (levelDiff > 0) baseExp += levelDiff * 10;

// Rarity multiplier (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
actualExp = baseExp * rarityMultiplier;
```

### Level Up Formula

```javascript
// Experience required to reach each level
exp_needed = 100 * level + 50 * level²

// Example:
// Level 1→2: 150 exp
// Level 2→3: 300 exp
// Level 3→4: 450 exp
// Level 4→5: 600 exp
```

### Stat Growth on Level Up

```javascript
baseHP += 5;
baseAttack += 2;
baseDefense += 2;
baseSpAtk += 2;
baseSpDef += 2;
baseSpeed += 1;

maxHp = baseHP + level * 5; // recalculated
```

---

## 🔄 Data Validation

**Before Battle:**

- ✅ Player's user_pokemon_id is stored in playerPokemon
- ✅ Enemy's rarity is stored in enemyPokemon
- ✅ Player's experience data is loaded

**After Battle:**

- ✅ Experience is awarded based on result
- ✅ Level ups are detected automatically
- ✅ Stats are recalculated
- ✅ Battle is recorded in backend
- ✅ User stats (battles_won, total_battles) are updated
- ✅ Pokemon stats (level, experience) are saved

---

## 📝 Files Modified

1. **experience-system.js** (NEW)
   - Complete experience system implementation
   - Backend API integration

2. **battle.js** (UPDATED)
   - Imported experience system
   - Updated endBattle() to award experience
   - Added saveExperienceToBackend() function
   - Added user_pokemon_id tracking
   - Added level up notifications

3. **battle.html** (UPDATED)
   - Changed battle.js script to module (`type="module"`)

---

## 🚀 Testing Checklist

- [ ] Win a battle → receive experience
- [ ] Experience accumulates toward next level
- [ ] Reach level up threshold → level increases, stats updated
- [ ] Battle result saved to backend
- [ ] User battles_won/total_battles incremented
- [ ] Pokemon level and experience persisted
- [ ] Loss also records battle (no exp gain)
- [ ] Rarity affects experience multiplier

---

## ✨ Features by Game Screenshot

**During Battle:**

- Experience display not shown (use battle log)
- Battle log shows exp gained: `"You gained 180 EXP!"`
- Level up message: `"Articuno leveled up to Lv.4!"`
- Stat gain details: `"Stats: HP+5 ATK+2 DEF+2 SP.ATK+2 SP.DEF+2 SPD+1"`

**Victory Screen:**

- Shows `"+ XXX EXP GAINED"`
- Catch button available
- Return to field saves all progress

**Battle Tracking:**

- Every win/loss increments total_battles
- Only wins increment battles_won
- World level may be calculated from battles or set manually

---

## 🔗 Data Structure Examples

### Player Pokemon (With Experience)

```javascript
{
  id: 144,
  name: "articuno",
  level: 3,
  experience: 0,
  user_pokemon_id: 27,  // NEW - for backend tracking
  maxHp: 45,
  hp: 45,
  baseAttack: 85,
  attack: 91,
  baseDefense: 100,
  defense: 106,
  baseSpAtk: 95,
  spAtk: 101,
  baseSpDef: 125,
  spDef: 131,
  baseSpeed: 115,
  speed: 121,
  types: ["ice", "flying"],
  moves: [...],
  sprite: "...",
  exp: 203
}
```

### Enemy Pokemon (With Rarity)

```javascript
{
  id: 16,
  name: "pidgeot",
  level: 5,
  rarity: "RARE",  // NEW - for exp multiplier
  maxHp: 46,
  hp: 46,
  // ... other stats
  types: ["normal", "flying"],
  moves: [...],
  sprite: "...",
  exp: 159
}
```

---

## 🐛 Debugging

**If experience isn't saving:**

1. Check browser console for API errors
2. Verify backend endpoints are implemented
3. Check localStorage for user_id and token
4. Verify user_pokemon_id is passed through correctly

**If level up doesn't trigger:**

1. Check experience calculation in saveExperienceToBackend()
2. Verify exp_needed formula: `100 * level + 50 * level²`
3. Check browser console for JavaScript errors

**If stats don't update:**

1. Verify ExperienceSystem is initialized
2. Check that playerPokemon has baseHP, baseAttack, etc.
3. Look for errors in \_checkLevelUp() method
