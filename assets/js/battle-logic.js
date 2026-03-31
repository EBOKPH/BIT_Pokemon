/**
 * POKEMON BATTLE SYSTEM LOGIC
 * Implements world level system, stat scaling, damage calculation, and battle flow
 */

// ========================================
// 1. WORLD LEVEL SYSTEM (WILD POKEMON LEVEL)
// ========================================

const BATTLE_CONFIG = {
  worldLevelVariance: 3, // Range: WL ± this value
  areaOffsets: {
    grass: 0,
    water: 1,
    cave: 2,
    fire: 3,
    electric: 2,
    rock: 2,
    normal: 0,
    city: 0,
  },
  // Rarity level bonuses (matches encounter-scan.js rarity tiers)
  rarityBonuses: {
    COMMON: 0,
    UNCOMMON: 1,
    RARE: 3,
    EPIC: 5,
    LEGENDARY: 8,
  },
  damageVariation: { min: 0.85, max: 1.0 },
  criticalChance: 0.0625, // 6.25% base crit rate
  criticalMultiplier: 1.5,
};

/**
 * Generate enemy pokemon level based on world level
 * @param {number} worldLevel - Player's world level
 * @param {string} areaHabitat - Area habitat (grass, water, cave, etc.)
 * @param {string} rarity - Pokemon rarity (common, rare, elite)
 * @returns {number} Enemy pokemon level
 */
function generateEnemyLevel(
  worldLevel,
  areaHabitat = "normal",
  rarity = "common",
) {
  const variance = BATTLE_CONFIG.worldLevelVariance;
  const areaOffset = BATTLE_CONFIG.areaOffsets[areaHabitat] || 0;
  const rarityBonus = BATTLE_CONFIG.rarityBonuses[rarity] || 0;

  // Base level with area offset
  const baseLevelMin = Math.max(1, worldLevel + areaOffset - variance);
  const baseLevelMax = worldLevel + areaOffset + variance;
  let enemyLevel =
    Math.floor(Math.random() * (baseLevelMax - baseLevelMin + 1)) +
    baseLevelMin;

  // Apply rarity bonus
  enemyLevel += rarityBonus;

  return Math.max(1, enemyLevel);
}

// ========================================
// 2. POKEMON STAT SCALING
// ========================================

/**
 * Calculate scaled pokemon stats based on level (Gen 3 formula)
 * HP:    floor((2*base + 15 + 15) * level / 100) + level + 10
 * Other: floor((2*base + 15 + 15) * level / 100) + 5
 * IVs=15, EVs=63 for wild pokemon — keeps HP & damage proportional.
 * @param {object} basePokemon - Pokemon with base stats
 * @param {number} level - Pokemon's current level
 * @returns {object} Pokemon with scaled stats
 */
function calculateScaledStats(basePokemon, level) {
  const iv = 15;
  const ev = 63;
  const calcHp   = (b) => Math.floor(((2 * b + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  const calcStat = (b) => Math.floor(((2 * b + iv + Math.floor(ev / 4)) * level) / 100) + 5;

  const maxHp = calcHp(basePokemon.baseHP || 45);
  return {
    ...basePokemon,
    level,
    hp:      maxHp,
    currentHP: maxHp,
    attack:  calcStat(basePokemon.baseAttack  || 49),
    defense: calcStat(basePokemon.baseDefense || 49),
    spAtk:   calcStat(basePokemon.baseSpAtk   || 45),
    spDef:   calcStat(basePokemon.baseSpDef   || 45),
    speed:   calcStat(basePokemon.baseSpeed   || 45),
  };
}

// ========================================
// 3. DAMAGE CALCULATION
// ========================================

/**
 * Calculate damage dealt by attacker to defender.
 * Uses the authentic Gen 3 formula so damage stays proportional to HP.
 * At equal levels & stats: weak move (40 pwr) ≈ 10-15% HP per hit.
 * @param {object} attacker - Attacking pokemon
 * @param {object} defender - Defending pokemon
 * @param {object} move - Move object with power, type, category
 * @returns {number} Damage dealt
 */
function calculateDamage(attacker, defender, move) {
  const power = move.power || 40;

  const attackStat  = move.category === "special" ? attacker.spAtk  : attacker.attack;
  const defenseStat = move.category === "special" ? defender.spDef  : defender.defense;

  // Gen 3 core: floor(floor((2*level/5+2) * power * atk/def) / 50) + 2
  const base =
    Math.floor(
      (Math.floor((2 * attacker.level) / 5 + 2) * power * attackStat) /
        Math.max(1, defenseStat) /
        50,
    ) + 2;

  // Random roll 0.85–1.0
  const roll = BATTLE_CONFIG.damageVariation.min +
    Math.random() * (BATTLE_CONFIG.damageVariation.max - BATTLE_CONFIG.damageVariation.min);

  // Type effectiveness
  const typeEff = calculateTypeEffectiveness(move.type, defender.type);

  // Critical hit
  const isCritical = Math.random() < BATTLE_CONFIG.criticalChance;
  const critMult   = isCritical ? BATTLE_CONFIG.criticalMultiplier : 1.0;

  return Math.max(1, Math.floor(base * roll * typeEff * critMult));
}

/**
 * Calculate type effectiveness multiplier
 * @param {string} attackType - Type of move
 * @param {string} defenderType - Type(s) of defender
 * @returns {number} Effectiveness multiplier (0.5, 1.0, or 2.0)
 */
function calculateTypeEffectiveness(attackType, defenderType) {
  // Simple type effectiveness chart (can be expanded)
  const typeChart = {
    fire: {
      weak: ["grass", "ice", "bug", "steel"],
      resist: ["fire", "grass", "ice", "fairy"],
    },
    water: {
      weak: ["fire", "ground", "rock"],
      resist: ["water", "grass", "ice"],
    },
    grass: {
      weak: ["water", "ground", "rock"],
      resist: ["grass", "water", "ground"],
    },
    electric: {
      weak: ["water", "flying"],
      resist: ["electric", "flying", "steel"],
    },
    ice: { weak: ["fire", "fighting", "rock", "steel"], resist: ["ice"] },
    fighting: {
      weak: ["flying", "psychic", "fairy"],
      resist: ["rock", "bug", "dark"],
    },
    poison: {
      weak: ["ground", "psychic"],
      resist: ["fighting", "poison", "bug", "grass", "fairy"],
    },
    ground: { weak: ["water", "grass", "ice"], resist: ["poison", "rock"] },
    flying: {
      weak: ["electric", "ice", "rock"],
      resist: ["fighting", "bug", "grass"],
    },
    psychic: {
      weak: ["bug", "ghost", "dark"],
      resist: ["fighting", "psychic"],
    },
    bug: {
      weak: ["fire", "flying", "rock"],
      resist: ["fighting", "ground", "grass"],
    },
    rock: {
      weak: ["water", "grass", "fighting", "ground", "steel"],
      resist: ["normal", "flying", "poison", "fire"],
    },
    ghost: { weak: ["ghost", "dark"], resist: ["poison", "bug"] },
    dragon: {
      weak: ["ice", "dragon", "fairy"],
      resist: ["fire", "water", "grass", "electric"],
    },
    dark: { weak: ["fighting", "bug", "fairy"], resist: ["ghost", "dark"] },
    steel: {
      weak: ["fire", "fighting", "ground"],
      resist: [
        "normal",
        "flying",
        "rock",
        "bug",
        "steel",
        "grass",
        "psychic",
        "ice",
        "dragon",
        "fairy",
      ],
    },
    fairy: { weak: ["poison", "steel"], resist: ["fighting", "bug", "dark"] },
  };

  const effectiveness = typeChart[attackType];
  if (!effectiveness) return 1.0; // Unknown type, normal effectiveness

  if (Array.isArray(defenderType)) {
    // If defender has multiple types, use the worst matchup
    let multiplier = 1.0;
    for (const type of defenderType) {
      if (effectiveness.weak && effectiveness.weak.includes(type))
        multiplier = 2.0;
      if (effectiveness.resist && effectiveness.resist.includes(type))
        multiplier = 0.5;
    }
    return multiplier;
  } else {
    // Single type defender
    if (effectiveness.weak && effectiveness.weak.includes(defenderType))
      return 2.0;
    if (effectiveness.resist && effectiveness.resist.includes(defenderType))
      return 0.5;
    return 1.0;
  }
}

// ========================================
// 4. BATTLE STATE & FLOW
// ========================================

class BattleState {
  constructor(
    playerPokemon,
    enemyPokemon,
    playerLevel,
    worldLevel,
    areaHabitat = "normal",
  ) {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.playerLevel = playerLevel;
    this.worldLevel = worldLevel;
    this.areaHabitat = areaHabitat;
    this.battleLog = [];
    this.turnCount = 0;
    this.isPlayerTurn = true;
    this.battleOver = false;
    this.winner = null;
  }

  /**
   * Initialize battle with scaled stats
   */
  initializeBattle() {
    // Scale player pokemon
    this.playerPokemon = calculateScaledStats(
      this.playerPokemon,
      this.playerLevel,
    );

    // Generate and scale enemy pokemon
    const enemyLevel = generateEnemyLevel(
      this.worldLevel,
      this.areaHabitat,
      this.enemyPokemon.rarity || "common",
    );
    this.enemyPokemon = calculateScaledStats(this.enemyPokemon, enemyLevel);

    this.log(
      `Battle started! ${this.playerPokemon.name} (Lvl ${this.playerPokemon.level}) vs ${this.enemyPokemon.name} (Lvl ${this.enemyPokemon.level})`,
    );
  }

  /**
   * Player uses a move
   * @param {object} move - Move object with name, power, type, category
   */
  playerAttack(move) {
    if (!this.isPlayerTurn || this.battleOver) return false;

    const damage = calculateDamage(this.playerPokemon, this.enemyPokemon, move);
    this.enemyPokemon.currentHP -= damage;

    this.log(
      `${this.playerPokemon.name} used ${move.name}! Dealt ${damage} damage.`,
    );

    if (this.enemyPokemon.currentHP <= 0) {
      this.enemyPokemon.currentHP = 0;
      this.endBattle("player");
      this.log(
        `${this.enemyPokemon.name} fainted! ${this.playerPokemon.name} wins!`,
      );
      return true;
    }

    this.isPlayerTurn = false;
    this.turnCount++;
    this.enemyTurn();
    return true;
  }

  /**
   * Enemy pokemon attacks
   */
  enemyTurn() {
    if (this.battleOver) return;

    // Simple AI: pick random move
    const moveList = this.enemyPokemon.moves || [
      { name: "Tackle", power: 40, type: "normal", category: "physical" },
    ];
    const move = moveList[Math.floor(Math.random() * moveList.length)];

    const damage = calculateDamage(this.enemyPokemon, this.playerPokemon, move);
    this.playerPokemon.currentHP -= damage;

    this.log(
      `${this.enemyPokemon.name} used ${move.name}! Dealt ${damage} damage.`,
    );

    if (this.playerPokemon.currentHP <= 0) {
      this.playerPokemon.currentHP = 0;
      this.endBattle("enemy");
      this.log(
        `${this.playerPokemon.name} fainted! ${this.enemyPokemon.name} wins!`,
      );
      return;
    }

    this.isPlayerTurn = true;
  }

  /**
   * End battle and determine winner
   * @param {string} winner - "player" or "enemy"
   */
  endBattle(winner) {
    this.battleOver = true;
    this.winner = winner;
  }

  /**
   * Add message to battle log
   * @param {string} message
   */
  log(message) {
    this.battleLog.push(`[Turn ${this.turnCount}] ${message}`);
  }

  /**
   * Get current battle state for UI
   */
  getState() {
    return {
      playerPokemon: {
        name: this.playerPokemon.name,
        level: this.playerPokemon.level,
        currentHP: this.playerPokemon.currentHP,
        maxHP: this.playerPokemon.hp,
        type: this.playerPokemon.type,
      },
      enemyPokemon: {
        name: this.enemyPokemon.name,
        level: this.enemyPokemon.level,
        currentHP: this.enemyPokemon.currentHP,
        maxHP: this.enemyPokemon.hp,
        type: this.enemyPokemon.type,
      },
      turnCount: this.turnCount,
      isPlayerTurn: this.isPlayerTurn,
      battleOver: this.battleOver,
      winner: this.winner,
      battleLog: this.battleLog,
    };
  }
}

// Export for use in battle.html
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BATTLE_CONFIG,
    generateEnemyLevel,
    calculateScaledStats,
    calculateDamage,
    calculateTypeEffectiveness,
    BattleState,
  };
}
