# Battle System Testing Quick Start

## What Changed? (TL;DR)

✅ **Battles are now SLOWER** (good!) - takes a few seconds per turn instead of instant  
✅ **Damage numbers now FLOAT** - shows exactly what happened  
✅ **Moves are DYNAMIC** - fetched from PokéAPI, not hardcoded per type  
✅ **Enemy ATTACKS are VISIBLE** - clear feedback before your next turn  
✅ **Level scaling FIXED** - rarity bonuses now work correctly

---

## Testing: 5-Minute Quickstart

### Step 1: Start a Battle

1. Open game.html
2. Scan an encounter
3. Click "Battle!"
4. Select your Pokémon

### Step 2: Verify Battle Pacing (60 seconds)

Play ONE battle and verify:

**During YOUR attack:**

- [ ] Attack animation plays (0.3s)
- [ ] Damage number FLOATS UP in red (-XX)
- [ ] Enemy HP bar smoothly decreases
- [ ] Wait 600ms for turn delay

**During ENEMY attack:**

- [ ] Message: "Enemy is thinking..." (1 second wait!)
- [ ] Enemy sprite attacks
- [ ] RED damage number floats on YOUR Pokémon
- [ ] YOUR HP bar smoothly decreases
- [ ] Back to your turn

**Total per cycle: ~2-3 seconds**  
✅ Should feel like a REAL Pokémon battle, not instant

### Step 3: Check Move Variety (30 seconds)

1. Battle different Pokémon (Pikachu, Articuno, Blastoise, etc.)
2. Check their moves are DIFFERENT
   - Pikachu: THUNDER SHOCK, THUNDERBOLT, THUNDER, etc.
   - Blastoise: WATER GUN, SURF, HYDRO PUMP, etc.
   - **NOT** all generic moves like before

✅ Each Pokémon should have TYPE-MATCHING moves

### Step 4: Check Damage Numbers (30 seconds)

During battle:

- [ ] Damage numbers appear ABOVE sprites
- [ ] Numbers float up and fade over 1.2 seconds
- [ ] Regular hits: RED numbers (-XX)
- [ ] Critical hits: GOLD numbers (-XX) "CRITICAL HIT!"

### Step 5: Check Console (Optional, 30 seconds)

Press **F12** → Console tab:

```
√ experience-system.js exports: ExperienceSystem, EXP_CONFIG, ...
√ dynamic-move-system.js exports: selectMovesForLevel, ...
✓ Pokémon loaded: Articuno with 4 moves
```

No terrible red error messages = ✅ Good!

---

## What to Expect: Before vs After

### Enemy Attacks

**BEFORE**: Existed but barely visible, wrong timing  
**AFTER**: Clear "Enemy is thinking..." pause, then strong attack with floating damage

### Moves

**BEFORE**: Same 4 moves for any Fire-type, any Water-type, etc.  
**AFTER**: Unique moves for each Pokémon from PokéAPI

### Battle Timing

**BEFORE**: Everything instant (you miss the action)  
**AFTER**: Each turn takes 2-3 seconds (feels like real game)

### Damage Feedback

**BEFORE**: Just text in log  
**AFTER**: Floating numbers + text + sounds

---

## Common Issues & Fixes

### Issue: Moves still look hardcoded

- **Cause**: PokéAPI didn't load in time
- **Check**: Console for errors
- **Fix**: Reload page, wait 2 seconds before starting battle
- **If persists**: PokéAPI might be down (check https://pokeapi.co/api/v2/pokemon/pikachu)

### Issue: Battle still feels instant

- **Cause**: Timing delays not working
- **Check**: Open DevTools → Performance tab, watch timeline
- **Fix**: Make sure battle.js is fully loaded (type="module" script)

### Issue: Damage numbers not floating

- **Cause**: CSS animation might not be applied
- **Check**: DevTools → Elements, search for "floatUp" style
- **Fix**: Hard refresh (Ctrl+Shift+R) to clear cache

### Issue: Enemy doesn't attack

- **Cause**: Battle ending too fast, or HP at 0
- **Check**: Keep your Pokémon alive, take a few turns
- **Fix**: Use weaker moves to extend battle

---

## Full Battle Cycle Example (2:30 seconds)

```
[00:00] You click THUNDERBOLT
[00:20] Pikachu animation attacks (200ms)
[00:30] RED damage number floats up: "-45"
[00:50] Console shows: "Dealt 45 damage!"
[01:10] Turn delay (600ms) - everything freezes
[01:50] Enemy Turn indicator
[02:00] "Charizard is thinking..." (1 second)
[03:00] Charizard sprite attacks
[03:20] RED damage "-32" floats on Pikachu
[03:40] Console shows: "Charizard dealt 32 damage!"
[04:20] Wait for turn delay (600ms)
[05:00] Back to your turn - click next move
```

Each complete turn cycle: ~2-3 seconds
Multiple turns to win: ~15-30 seconds total for average battle

---

## Success Indicators ✅

If you see ALL of these, the system works:

- [ ] First turn takes 2-3 seconds (not instant)
- [ ] Damage numbers float up and fade
- [ ] Enemy "thinking..." pause is noticeable (1 second)
- [ ] Enemy attack happens with damage to YOU
- [ ] Moves are different for different Pokémon
- [ ] No "undefined" or "NaN" in logs
- [ ] Battle completes normally (can catch or flee)
- [ ] Damage numbers are readable and colorful

---

## If Something Breaks

### Check console (F12 → Console):

- Red errors about "import", "undefined", "async"
- Type errors about moves or types

### Common error fixes:

```
❌ "selectMovesForLevel is not defined"
✅ Fix: Make sure dynamic-move-system.js exists

❌ "Cannot read property 'type' of undefined"
✅ Fix: Ensure moves loaded before battle starts

❌ "generateMoves is not a function"
✅ Fix: Check buildPokemon awaits properly
```

---

## Still Have Issues?

**Take a screenshot:**

1. DevTools open with errors visible
2. Battle screen showing the issue
3. Console messages

**Note:**

- What happened (describe the issue)
- What you expected
- Screenshot of error in console

---

## Summary

You should see:

- **Slower battles** (2-3 sec/turn instead of instant)
- **Floating damage** (numbers that float up and fade)
- **Different moves** (unique per Pokémon, from PokéAPI)
- **Enemy attacks** (clear timing, visible damage)
- **Level scaling** (fixed rarity calculation)

If you have all 5 ✅, the system is working!

---

Enjoy testing! The game should feel much more like a real Pokémon battle now. 🎮
