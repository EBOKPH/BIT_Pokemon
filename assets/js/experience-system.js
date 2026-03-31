/**
 * POKEMON EXPERIENCE SYSTEM
 * Handles experience gain, leveling up, and stat calculations
 */

import { API_BASE_URL } from "../../api.js";

// ══════════════════════════════════════════════════════════════════
// EXPERIENCE CONFIGURATION
// ══════════════════════════════════════════════════════════════════

export const EXP_CONFIG = {
  // Base experience yields per battle
  baseExpWin: 150, // Exp gained for winning
  baseExpLoss: 50, // Exp gained for losing
  baseExpCatch: 100, // Exp gained for catching (bonus)

  // Exp required to level up (cumulative)
  // Each level requires more exp than the previous one
  expToLevelUp: (level) => {
    // Quadratic growth: starts at 100 exp for level 2, increases by ~25 per level
    return 100 * level + 50 * level * level;
  },

  // Stat growth per level
  statGrowth: {
    hp: 5,
    attack: 2,
    defense: 2,
    spAtk: 2,
    spDef: 2,
    speed: 1,
  },

  // Maximum level
  maxLevel: 100,

  // Rarity experience multipliers
  rarityExpMult: {
    COMMON: 1.0,
    UNCOMMON: 1.2,
    RARE: 1.5,
    EPIC: 2.0,
    LEGENDARY: 3.0,
  },
};

// ══════════════════════════════════════════════════════════════════
// EXPERIENCE SYSTEM CLASS
// ══════════════════════════════════════════════════════════════════

export class ExperienceSystem {
  constructor(pokemon) {
    this.pokemon = { ...pokemon };
    this.leveledUp = false;
    this.previousLevel = pokemon.level;
  }

  /**
   * Calculate total cumulative exp needed to reach a given level
   */
  getTotalExpForLevel(level) {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += EXP_CONFIG.expToLevelUp(i);
    }
    return total;
  }

  /**
   * Add experience to pokemon and handle level ups
   * @param {number} amount - Experience points to add
   * @param {string} rarity - Pokemon rarity for multiplier
   */
  addExperience(amount, rarity = "COMMON") {
    const multiplier = EXP_CONFIG.rarityExpMult[rarity] || 1.0;
    const actualAmount = Math.floor(amount * multiplier);

    // Initialize experience if not set
    if (!this.pokemon.experience) {
      this.pokemon.experience = 0;
    }

    this.pokemon.experience += actualAmount;

    // Check for level ups
    this._checkLevelUp();

    return {
      expGained: actualAmount,
      totalExp: this.pokemon.experience,
      leveledUp: this.leveledUp,
      previousLevel: this.previousLevel,
      currentLevel: this.pokemon.level,
    };
  }

  /**
   * Check if pokemon should level up and apply stat increases
   */
  _checkLevelUp() {
    while (
      this.pokemon.level < EXP_CONFIG.maxLevel &&
      this.pokemon.experience >=
        this.getTotalExpForLevel(this.pokemon.level + 1)
    ) {
      this._applyLevelUp();
    }
  }

  /**
   * Apply single level up — recalculates stats via Gen 3 formula
   * so they stay in sync with what buildPokemon produces.
   */
  _applyLevelUp() {
    this.pokemon.level += 1;
    this.leveledUp = true;
    const lv = this.pokemon.level;
    const iv = 20; // player pokemon IVs (matches battle.js buildPokemon)
    const ev = 63;
    const calcHp   = (b) => Math.floor(((2 * b + iv + Math.floor(ev / 4)) * lv) / 100) + lv + 10;
    const calcStat = (b) => Math.floor(((2 * b + iv + Math.floor(ev / 4)) * lv) / 100) + 5;

    if (this.pokemon.baseHP) {
      const oldMaxHP = this.pokemon.maxHp;
      const hpRatio  = this.pokemon.currentHP / oldMaxHP;

      this.pokemon.maxHp        = calcHp(this.pokemon.baseHP);
      this.pokemon.baseAttack   = this.pokemon.baseAttack;   // base stats don't change
      this.pokemon.baseDefense  = this.pokemon.baseDefense;
      // Recalculate battle stats
      this.pokemon.attack  = calcStat(this.pokemon.baseAttack);
      this.pokemon.defense = calcStat(this.pokemon.baseDefense);
      this.pokemon.spAtk   = calcStat(this.pokemon.baseSpAtk);
      this.pokemon.spDef   = calcStat(this.pokemon.baseSpDef);
      this.pokemon.speed   = calcStat(this.pokemon.baseSpeed);
      // Keep HP ratio so you don't instantly full-heal on level up
      this.pokemon.currentHP = Math.min(
        this.pokemon.maxHp,
        Math.floor(this.pokemon.maxHp * hpRatio),
      );
    }
  }

  /**
   * Get pokemon data with updated stats
   */
  getPokemon() {
    return { ...this.pokemon };
  }

  /**
   * Get level up details
   */
  getLevelUpDetails() {
    return {
      level: this.pokemon.level,
      hp: this.pokemon.baseHP,
      attack: this.pokemon.baseAttack,
      defense: this.pokemon.baseDefense,
      spAtk: this.pokemon.baseSpAtk,
      spDef: this.pokemon.baseSpDef,
      speed: this.pokemon.baseSpeed,
    };
  }
}

// ══════════════════════════════════════════════════════════════════
// BACKEND API CALLS
// ══════════════════════════════════════════════════════════════════

/**
 * Save battle result and experience gained to backend
 * @param {number} userId - User ID
 * @param {number} pokemonId - User Pokemon ID
 * @param {boolean} won - Whether the battle was won
 * @param {object} expResult - Result from addExperience()
 * @param {string} token - Auth token
 */
export async function saveBattleResult(
  userId,
  pokemonId,
  won,
  expResult,
  token,
) {
  try {
    const res = await fetch(`${API_BASE_URL}/battles/record`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        user_pokemon_id: pokemonId,
        won: won,
        exp_gained: expResult.expGained,
        new_level: expResult.currentLevel,
        total_exp: expResult.totalExp,
        leveled_up: expResult.leveledUp,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to save battle result:", err);
    return { success: false, message: "Failed to save battle result" };
  }
}

/**
 * Update user stats after battle (battles_won, total_battles, world_level)
 * @param {number} userId - User ID
 * @param {boolean} won - Whether the battle was won
 * @param {string} token - Auth token
 */
export async function updateUserBattleStats(userId, won, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/battle-stats`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        battle_won: won,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to update user battle stats:", err);
    return { success: false, message: "Failed to update user battle stats" };
  }
}

/**
 * Update pokemon in database with new level and experience
 * @param {number} userId - User ID
 * @param {number} pokemonId - User Pokemon ID (user_pokemon_id)
 * @param {number} newLevel - New level
 * @param {number} totalExp - Total experience
 * @param {string} token - Auth token
 */
export async function updatePokemonStats(
  userId,
  pokemonId,
  newLevel,
  totalExp,
  token,
) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/users/${userId}/pokemon/${pokemonId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          level: newLevel,
          experience: totalExp,
        }),
      },
    );

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to update pokemon stats:", err);
    return { success: false, message: "Failed to update pokemon stats" };
  }
}

/**
 * Calculate experience gained based on battle conditions
 * @param {boolean} won - Whether player won
 * @param {number} opponentLevel - Enemy pokemon level
 * @param {number} playerLevel - Player pokemon level
 * @param {string} rarity - Enemy pokemon rarity
 */
export function calculateBattleExp(won, opponentLevel, playerLevel, rarity) {
  let baseExp = won ? EXP_CONFIG.baseExpWin : EXP_CONFIG.baseExpLoss;

  // Bonus for fighting higher level opponents
  const levelDiff = opponentLevel - playerLevel;
  if (levelDiff > 0) {
    // Gain more exp for fighting high level opponents
    baseExp += levelDiff * 10;
  }

  return baseExp;
}
