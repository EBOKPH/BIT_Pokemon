/**
 * POKEMON EXPERIENCE SYSTEM — BIT-POKEMON
 * ════════════════════════════════════════
 * CHANGES v2:
 *  - Pokemon gains EXP on LOSS (reduced amount)  ← was broken before
 *  - USER (player) also gains EXP + level via player_level in users table
 *  - Evolution logic: pokemon evolves at correct level thresholds
 *  - User EXP → player_level controls world progression
 */

import { API_BASE_URL } from "../../api.js";

// ══════════════════════════════════════════════════════════════════
// EXPERIENCE CONFIGURATION
// ══════════════════════════════════════════════════════════════════

export const EXP_CONFIG = {
  // Pokemon battle exp
  baseExpWin:  150,
  baseExpLoss:  40,   // ← Pokemon still gains exp on loss (reduced)

  // User (player) exp per battle — separate from pokemon exp
  userExpWin:  120,
  userExpLoss:  30,

  // Exp required for pokemon to reach next level (cumulative formula)
  expToLevelUp: (level) => 100 * level + 50 * level * level,

  // Exp required for player_level to increase (simpler curve)
  userExpToLevelUp: (level) => 200 * level,

  maxLevel: 100,
  maxPlayerLevel: 100,

  rarityExpMult: {
    COMMON:    1.0,
    UNCOMMON:  1.2,
    RARE:      1.5,
    EPIC:      2.0,
    LEGENDARY: 3.0,
  },
};

// ══════════════════════════════════════════════════════════════════
// EVOLUTION TABLE
// Each entry: { from: pokedex_no, to: pokedex_no, level: N }
// Add more as needed — this covers all starters + common ones.
// ══════════════════════════════════════════════════════════════════

export const EVOLUTION_TABLE = [
  // Gen 1 Starters
  { from:   1, to:   2, level: 16 }, // Bulbasaur → Ivysaur
  { from:   2, to:   3, level: 32 }, // Ivysaur   → Venusaur
  { from:   4, to:   5, level: 16 }, // Charmander → Charmeleon
  { from:   5, to:   6, level: 36 }, // Charmeleon → Charizard
  { from:   7, to:   8, level: 16 }, // Squirtle  → Wartortle
  { from:   8, to:   9, level: 36 }, // Wartortle → Blastoise
  // Pikachu line
  { from:  25, to:  26, level: 30 }, // Pikachu   → Raichu (thunder stone but use level here)
  // Common Gen 1
  { from:  10, to:  11, level: 7  }, // Caterpie  → Metapod
  { from:  11, to:  12, level: 10 }, // Metapod   → Butterfree
  { from:  13, to:  14, level: 7  }, // Weedle    → Kakuna
  { from:  14, to:  15, level: 10 }, // Kakuna    → Beedrill
  { from:  16, to:  17, level: 18 }, // Pidgey    → Pidgeotto
  { from:  17, to:  18, level: 36 }, // Pidgeotto → Pidgeot
  { from:  19, to:  20, level: 20 }, // Rattata   → Raticate
  { from:  21, to:  22, level: 20 }, // Spearow   → Fearow
  { from:  23, to:  24, level: 22 }, // Ekans     → Arbok
  { from:  27, to:  28, level: 22 }, // Sandshrew → Sandslash
  { from:  29, to:  30, level: 16 }, // Nidoran♀  → Nidorina
  { from:  32, to:  33, level: 16 }, // Nidoran♂  → Nidorino
  { from:  35, to:  36, level: 36 }, // Clefairy  → Clefable
  { from:  37, to:  38, level: 30 }, // Vulpix    → Ninetales
  { from:  39, to:  40, level: 36 }, // Jigglypuff → Wigglytuff
  { from:  41, to:  42, level: 22 }, // Zubat     → Golbat
  { from:  43, to:  44, level: 21 }, // Oddish    → Gloom
  { from:  44, to:  45, level: 36 }, // Gloom     → Vileplume
  { from:  46, to:  47, level: 24 }, // Paras     → Parasect
  { from:  48, to:  49, level: 31 }, // Venonat   → Venomoth
  { from:  50, to:  51, level: 26 }, // Diglett   → Dugtrio
  { from:  52, to:  53, level: 28 }, // Meowth    → Persian
  { from:  54, to:  55, level: 33 }, // Psyduck   → Golduck
  { from:  56, to:  57, level: 28 }, // Mankey    → Primeape
  { from:  58, to:  59, level: 36 }, // Growlithe → Arcanine (stone but level here)
  { from:  60, to:  61, level: 25 }, // Poliwag   → Poliwhirl
  { from:  63, to:  64, level: 16 }, // Abra      → Kadabra
  { from:  64, to:  65, level: 36 }, // Kadabra   → Alakazam
  { from:  66, to:  67, level: 28 }, // Machop    → Machoke
  { from:  67, to:  68, level: 36 }, // Machoke   → Machamp
  { from:  69, to:  70, level: 21 }, // Bellsprout → Weepinbell
  { from:  72, to:  73, level: 30 }, // Tentacool → Tentacruel
  { from:  74, to:  75, level: 25 }, // Geodude   → Graveler
  { from:  75, to:  76, level: 36 }, // Graveler  → Golem
  { from:  77, to:  78, level: 40 }, // Ponyta    → Rapidash
  { from:  79, to:  80, level: 37 }, // Slowpoke  → Slowbro
  { from:  81, to:  82, level: 30 }, // Magnemite → Magneton
  { from:  84, to:  85, level: 31 }, // Doduo     → Dodrio
  { from:  86, to:  87, level: 34 }, // Seel      → Dewgong
  { from:  88, to:  89, level: 38 }, // Grimer    → Muk
  { from:  90, to:  91, level: 40 }, // Shellder  → Cloyster (stone but level here)
  { from:  92, to:  93, level: 25 }, // Gastly    → Haunter
  { from:  93, to:  94, level: 36 }, // Haunter   → Gengar
  { from:  96, to:  97, level: 26 }, // Drowzee   → Hypno
  { from:  98, to:  99, level: 28 }, // Krabby    → Kingler
  { from: 100, to: 101, level: 30 }, // Voltorb   → Electrode
  { from: 102, to: 103, level: 36 }, // Exeggcute → Exeggutor
  { from: 104, to: 105, level: 28 }, // Cubone    → Marowak
  { from: 108, to: 108, level: 99 }, // Lickitung → no evo in Gen 1
  { from: 109, to: 110, level: 35 }, // Koffing   → Weezing
  { from: 111, to: 112, level: 42 }, // Rhyhorn   → Rhydon
  { from: 113, to: 113, level: 99 }, // Chansey   → (no evo in Gen 1)
  { from: 116, to: 117, level: 32 }, // Horsea    → Seadra
  { from: 118, to: 119, level: 33 }, // Goldeen   → Seaking
  { from: 120, to: 121, level: 40 }, // Staryu    → Starmie (stone but level)
  { from: 129, to: 130, level: 20 }, // Magikarp  → Gyarados (iconic!)
  { from: 133, to: 134, level: 36 }, // Eevee     → Vaporeon (stone; use level)
  { from: 137, to: 137, level: 99 }, // Porygon   → no evo in Gen 1
  { from: 138, to: 139, level: 40 }, // Omanyte   → Omastar
  { from: 140, to: 141, level: 40 }, // Kabuto    → Kabutops
  // Gen 2 Starters
  { from: 152, to: 153, level: 16 }, // Chikorita  → Bayleef
  { from: 153, to: 154, level: 32 }, // Bayleef    → Meganium
  { from: 155, to: 156, level: 14 }, // Cyndaquil  → Quilava
  { from: 156, to: 157, level: 36 }, // Quilava    → Typhlosion
  { from: 158, to: 159, level: 18 }, // Totodile   → Croconaw
  { from: 159, to: 160, level: 30 }, // Croconaw   → Feraligatr
  // Gen 3 Starters
  { from: 252, to: 253, level: 16 }, // Treecko    → Grovyle
  { from: 253, to: 254, level: 36 }, // Grovyle    → Sceptile
  { from: 255, to: 256, level: 16 }, // Torchic    → Combusken
  { from: 256, to: 257, level: 36 }, // Combusken  → Blaziken
  { from: 258, to: 259, level: 16 }, // Mudkip     → Marshtomp
  { from: 259, to: 260, level: 36 }, // Marshtomp  → Swampert
];

/**
 * Check if a pokemon should evolve at the given level.
 * Returns the target pokedex_no if evolution triggers, else null.
 * @param {number} pokedexNo  - current pokemon pokedex_no
 * @param {number} level      - level just reached
 * @returns {number|null}
 */
export function checkEvolution(pokedexNo, level) {
  const entry = EVOLUTION_TABLE.find(
    (e) => e.from === pokedexNo && level >= e.level
  );
  return entry ? entry.to : null;
}

// ══════════════════════════════════════════════════════════════════
// POKEMON EXPERIENCE SYSTEM
// ══════════════════════════════════════════════════════════════════

export class ExperienceSystem {
  constructor(pokemon) {
    this.pokemon = { ...pokemon };
    this.leveledUp    = false;
    this.previousLevel = pokemon.level;
    this.evolvesInto   = null; // pokedex_no of evolution if triggered
  }

  getTotalExpForLevel(level) {
    let total = 0;
    for (let i = 1; i < level; i++) total += EXP_CONFIG.expToLevelUp(i);
    return total;
  }

  /**
   * Add experience to pokemon and handle level-ups + evolutions.
   * Works for both WIN and LOSS — caller passes correct amount.
   */
  addExperience(amount, rarity = "COMMON") {
    const multiplier = EXP_CONFIG.rarityExpMult[rarity] || 1.0;
    const actualAmount = Math.floor(amount * multiplier);

    if (!this.pokemon.experience) this.pokemon.experience = 0;
    this.pokemon.experience += actualAmount;

    this._checkLevelUp();

    return {
      expGained:     actualAmount,
      totalExp:      this.pokemon.experience,
      leveledUp:     this.leveledUp,
      previousLevel: this.previousLevel,
      currentLevel:  this.pokemon.level,
      evolvesInto:   this.evolvesInto,
    };
  }

  _checkLevelUp() {
    while (
      this.pokemon.level < EXP_CONFIG.maxLevel &&
      this.pokemon.experience >= this.getTotalExpForLevel(this.pokemon.level + 1)
    ) {
      this._applyLevelUp();
    }
  }

  _applyLevelUp() {
    this.pokemon.level += 1;
    this.leveledUp = true;
    const lv = this.pokemon.level;
    const iv = 20;
    const ev = 63;
    const calcHp   = (b) => Math.floor(((2 * b + iv + Math.floor(ev / 4)) * lv) / 100) + lv + 10;
    const calcStat = (b) => Math.floor(((2 * b + iv + Math.floor(ev / 4)) * lv) / 100) + 5;

    if (this.pokemon.baseHP) {
      const hpRatio = this.pokemon.currentHP / this.pokemon.maxHp;
      this.pokemon.maxHp    = calcHp(this.pokemon.baseHP);
      this.pokemon.attack   = calcStat(this.pokemon.baseAttack);
      this.pokemon.defense  = calcStat(this.pokemon.baseDefense);
      this.pokemon.spAtk    = calcStat(this.pokemon.baseSpAtk);
      this.pokemon.spDef    = calcStat(this.pokemon.baseSpDef);
      this.pokemon.speed    = calcStat(this.pokemon.baseSpeed);
      this.pokemon.currentHP = Math.min(
        this.pokemon.maxHp,
        Math.floor(this.pokemon.maxHp * hpRatio)
      );
    }

    // Check evolution — keep track of highest-priority evo triggered
    if (this.pokemon.pokedex_no || this.pokemon.pokemon_id) {
      const pdex = this.pokemon.pokedex_no || this.pokemon.pokemon_id;
      const evo = checkEvolution(pdex, this.pokemon.level);
      if (evo && evo !== pdex) {
        this.evolvesInto = evo;
      }
    }
  }

  getPokemon() { return { ...this.pokemon }; }

  getLevelUpDetails() {
    return {
      level:   this.pokemon.level,
      maxHp:   this.pokemon.maxHp,
      hp:      this.pokemon.baseHP,
      attack:  this.pokemon.attack,
      defense: this.pokemon.defense,
      spAtk:   this.pokemon.spAtk,
      spDef:   this.pokemon.spDef,
      speed:   this.pokemon.speed,
    };
  }
}

// ══════════════════════════════════════════════════════════════════
// AUTO LEVEL-UP SYSTEM
// ══════════════════════════════════════════════════════════════════
// Call checkAndAutoLevelUp anywhere you have a pokemon object
// (from DB or in-memory). It runs the EXP→level logic, returns
// the updated pokemon, and optionally persists to the backend.
//
// Usage:
//   const result = await checkAndAutoLevelUp(pokemonObj, token, userId);
//   if (result.leveledUp) {
//     // update your UI, show animation, etc.
//     console.log(`Leveled up to ${result.pokemon.level}!`);
//   }
// ══════════════════════════════════════════════════════════════════

/**
 * Check if a pokemon's current experience should trigger a level-up.
 * Updates stats in memory, optionally persists to backend.
 *
 * @param {object}  pokemon  - pokemon object with { level, experience, baseHP, baseAttack, ... }
 * @param {string}  token    - JWT for backend calls (optional — skip persist if null)
 * @param {string|number} userId - user ID for backend call (optional)
 * @returns {{ pokemon, leveledUp, previousLevel, newLevel, evolvesInto }}
 */
export async function checkAndAutoLevelUp(pokemon, token = null, userId = null) {
  const sys = new ExperienceSystem({
    ...pokemon,
    // Normalise field names — DB uses experience, in-memory may use either
    experience:  pokemon.experience  || pokemon.exp_total || 0,
    currentHP:   pokemon.current_hp  || pokemon.currentHP || pokemon.hp || 0,
    maxHp:       pokemon.max_hp      || pokemon.maxHp     || 50,
  });

  const previousLevel = sys.pokemon.level;

  // Run level-up check without adding any new EXP (amount = 0)
  sys._checkLevelUp();

  const leveledUp    = sys.pokemon.level > previousLevel;
  const evolvesInto  = sys.evolvesInto;
  const updated      = sys.getPokemon();

  // Persist if we have credentials and a level actually changed
  if (leveledUp && token && userId && pokemon.user_pokemon_id) {
    try {
      await updatePokemonStats(
        userId,
        pokemon.user_pokemon_id,
        updated.level,
        updated.experience,
        token,
      );
    } catch (err) {
      console.warn("[autoLevelUp] Could not persist level-up to backend:", err);
    }
  }

  return {
    pokemon:       updated,
    leveledUp,
    previousLevel,
    newLevel:      updated.level,
    evolvesInto,
  };
}

/**
 * Add EXP to a pokemon and immediately level it up if threshold is met.
 * Wrapper around ExperienceSystem.addExperience + checkAndAutoLevelUp.
 *
 * @param {object}  pokemon   - pokemon from DB or in-memory
 * @param {number}  expAmount - EXP to add
 * @param {string}  rarity    - encounter rarity for multiplier
 * @param {string}  token     - JWT (optional, for backend persist)
 * @param {string|number} userId
 * @returns {{ pokemon, leveledUp, previousLevel, newLevel, expGained, evolvesInto }}
 */
export async function addExpAndLevelUp(pokemon, expAmount, rarity = "COMMON", token = null, userId = null) {
  const sys = new ExperienceSystem({
    ...pokemon,
    experience: pokemon.experience || pokemon.exp_total || 0,
    currentHP:  pokemon.current_hp  || pokemon.currentHP || pokemon.hp || 0,
    maxHp:      pokemon.max_hp      || pokemon.maxHp     || 50,
  });

  const result = sys.addExperience(expAmount, rarity);
  const updated = sys.getPokemon();

  // Persist to backend if credentials provided
  if (result.leveledUp && token && userId && pokemon.user_pokemon_id) {
    try {
      await updatePokemonStats(
        userId,
        pokemon.user_pokemon_id,
        updated.level,
        updated.experience,
        token,
      );
    } catch (err) {
      console.warn("[addExpAndLevelUp] Could not persist to backend:", err);
    }
  }

  return {
    pokemon:       updated,
    leveledUp:     result.leveledUp,
    previousLevel: result.previousLevel,
    newLevel:      updated.level,
    expGained:     result.expGained,
    evolvesInto:   result.evolvesInto,
  };
}

// ══════════════════════════════════════════════════════════════════
// USER EXPERIENCE SYSTEM
// Tracks player_level and experience in the users table separately
// from the pokemon's own level.
// ══════════════════════════════════════════════════════════════════

export class UserExperienceSystem {
  constructor(playerLevel, userExp) {
    this.playerLevel   = playerLevel  || 1;
    this.userExp       = userExp      || 0;
    this.leveledUp     = false;
    this.previousLevel = this.playerLevel;
  }

  getUserExpToLevel(level) {
    let total = 0;
    for (let i = 1; i < level; i++) total += EXP_CONFIG.userExpToLevelUp(i);
    return total;
  }

  addExperience(amount) {
    const actualAmount = Math.max(0, Math.floor(amount));
    this.userExp += actualAmount;
    this._checkLevelUp();
    return {
      expGained:     actualAmount,
      totalExp:      this.userExp,
      leveledUp:     this.leveledUp,
      previousLevel: this.previousLevel,
      currentLevel:  this.playerLevel,
    };
  }

  _checkLevelUp() {
    while (
      this.playerLevel < EXP_CONFIG.maxPlayerLevel &&
      this.userExp >= this.getUserExpToLevel(this.playerLevel + 1)
    ) {
      this.playerLevel += 1;
      this.leveledUp = true;
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// HELPER — calculate battle exp for pokemon and user
// ══════════════════════════════════════════════════════════════════

/**
 * Calculate pokemon EXP gained from a battle.
 * @param {boolean} won
 * @param {number}  opponentLevel
 * @param {number}  playerLevel
 * @param {string}  rarity
 */
export function calculateBattleExp(won, opponentLevel, playerLevel, rarity) {
  let baseExp = won ? EXP_CONFIG.baseExpWin : EXP_CONFIG.baseExpLoss;
  const levelDiff = opponentLevel - playerLevel;
  if (levelDiff > 0) baseExp += levelDiff * 10;
  return baseExp;
}

/**
 * Calculate user (player) EXP gained from a battle.
 * @param {boolean} won
 * @param {number}  opponentLevel
 */
export function calculateUserBattleExp(won, opponentLevel = 1) {
  let base = won ? EXP_CONFIG.userExpWin : EXP_CONFIG.userExpLoss;
  // Small bonus for fighting higher-level enemies
  base += Math.max(0, opponentLevel - 5) * 2;
  return Math.floor(base);
}

// ══════════════════════════════════════════════════════════════════
// BACKEND API CALLS
// ══════════════════════════════════════════════════════════════════

/** Save battle result to battles table */
export async function saveBattleResult(userId, pokemonId, won, expResult, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/battles/record`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id:         userId,
        user_pokemon_id: pokemonId,
        won,
        exp_gained:   expResult?.expGained  || 0,
        new_level:    expResult?.currentLevel || 1,
        total_exp:    expResult?.totalExp    || 0,
        leveled_up:   expResult?.leveledUp   || false,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to save battle result:", err);
    return { success: false, message: "Failed to save battle result" };
  }
}

/** Update user battle stats (total_battles, battles_won) */
export async function updateUserBattleStats(userId, won, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/battle-stats`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ battle_won: won }),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to update user battle stats:", err);
    return { success: false };
  }
}

/** Update pokemon level + experience in user_pokemons table */
export async function updatePokemonStats(userId, pokemonId, newLevel, totalExp, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/pokemon/${pokemonId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ level: newLevel, experience: totalExp }),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to update pokemon stats:", err);
    return { success: false };
  }
}

/**
 * Update user player_level and experience in users table.
 * Calls PUT /users/:user_id with { player_level, experience }
 */
export async function updateUserExp(userId, newPlayerLevel, totalUserExp, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        player_level: newPlayerLevel,
        experience:   totalUserExp,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to update user exp:", err);
    return { success: false };
  }
}

/**
 * Apply evolution to a pokemon in the database.
 * Updates the pokemon_id / pokedex_no so the sprite & name change.
 * @param {number} userId
 * @param {number} userPokemonId
 * @param {number} newPokedexNo    - the evolved-form pokedex_no
 * @param {string} token
 */
export async function applyEvolution(userId, userPokemonId, newPokedexNo, token) {
  try {
    // 1. Fetch the new pokemon's data from our backend pokemons table
    const pkRes = await fetch(`${API_BASE_URL}/pokemons/${newPokedexNo}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pkData = await pkRes.json();

    const updateBody = {
      pokemon_id: newPokedexNo,
      pokedex_no: newPokedexNo,
    };
    // Carry over name and sprite if returned
    if (pkData?.name)   updateBody.name   = pkData.name;
    if (pkData?.sprite) updateBody.sprite = pkData.sprite;

    const res = await fetch(`${API_BASE_URL}/users/${userId}/pokemon/${userPokemonId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateBody),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to apply evolution:", err);
    return { success: false };
  }
}
