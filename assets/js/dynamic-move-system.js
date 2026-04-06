// ══════════════════════════════════════════════════════
//  DYNAMIC MOVE SYSTEM — PokéAPI Integration
//  Fetches moves from PokéAPI based on pokemon & level
// ══════════════════════════════════════════════════════

const MOVE_CACHE = new Map(); // Cache pokemon moves to avoid repeated API calls
const MOVE_DETAIL_CACHE = new Map(); // Cache move details (power, type, category, pp)

// ── MOVE SELECTION CONFIG ──────────────────────────
const MOVE_SELECTION_CONFIG = {
  maxMoves: 4, // Pokemon can know up to 4 moves
  prioritizeTypes: true, // Prefer moves matching pokemon's types
  includeUtilityMoves: false, // Include status/non-attacking moves (future feature)
  levelLearningThreshold: 2, // How many levels before using latest available move
};

// Type colors for move display (used in battle UI)
const MOVE_TYPE_COLORS = {
  normal: "#a8a878",
  fire: "#f08030",
  water: "#6890f0",
  grass: "#78c850",
  electric: "#f8d030",
  ice: "#98d8d8",
  fighting: "#c03028",
  poison: "#a040a0",
  ground: "#e0c068",
  flying: "#a890f0",
  psychic: "#f85888",
  bug: "#a8b820",
  rock: "#b8a038",
  ghost: "#705898",
  dragon: "#7038f8",
  dark: "#705848",
  steel: "#b8b8d0",
  fairy: "#ee99ac",
};

/**
 * Fetch available moves for a pokemon from PokéAPI
 * Caches results to minimize API calls
 * @param {string} pokemonNameOrId - Pokemon name or pokedex ID
 * @returns {Promise<Array>} Array of move objects with level learned
 */
async function getPokemonMoves(pokemonNameOrId) {
  try {
    const cacheKey = pokemonNameOrId.toString().toLowerCase();

    // Return from cache if available
    if (MOVE_CACHE.has(cacheKey)) {
      return MOVE_CACHE.get(cacheKey);
    }

    // Fetch pokemon data from PokéAPI
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${cacheKey}/`,
    );
    if (!response.ok) {
      console.warn(`Failed to fetch pokemon: ${pokemonNameOrId}`);
      return null;
    }

    const pokemonData = await response.json();
    const moves = pokemonData.moves || [];

    // Extract move names and level learned
    const moveList = moves
      .map((moveSlot) => {
        const moveVersionGroup = moveSlot.version_group_details || [];
        const levelLearned = moveVersionGroup.find(
          (v) => v.move_learn_method.name === "level-up",
        )?.level_learned_at;
        return {
          name: moveSlot.move.name,
          moveUrl: moveSlot.move.url,
          levelLearned: levelLearned || 0, // 0 = learned at level 1 or tutor
        };
      })
      .sort((a, b) => (a.levelLearned || 0) - (b.levelLearned || 0));

    // Cache the results
    MOVE_CACHE.set(cacheKey, moveList);
    return moveList;
  } catch (error) {
    console.error(`Error fetching pokemon moves: ${error.message}`);
    return null;
  }
}

/**
 * Fetch detailed move information from PokéAPI
 * Caches move details to minimize API calls
 * @param {string} moveName - Name of the move
 * @returns {Promise<Object>} Move object with power, type, category, pp
 */
async function getMoveDetails(moveName) {
  try {
    const cacheKey = moveName.toLowerCase();

    // Return from cache if available
    if (MOVE_DETAIL_CACHE.has(cacheKey)) {
      return MOVE_DETAIL_CACHE.get(cacheKey);
    }

    // Fetch move data from PokéAPI
    const response = await fetch(`https://pokeapi.co/api/v2/move/${cacheKey}/`);
    if (!response.ok) {
      console.warn(`Failed to fetch move: ${moveName}`);
      return null;
    }

    const moveData = await response.json();
    const moveDetail = {
      name:
        moveData.names?.find((n) => n.language.name === "en")?.name ||
        moveData.name.toUpperCase().replace(/-/g, " "),
      power: moveData.power || 0, // 0 = status move
      type: moveData.type?.name || "normal",
      category: moveData.damage_class?.name || "status", // physical, special, status
      pp: moveData.pp || 15,
      accuracy: moveData.accuracy || 100,
      priority: moveData.priority || 0,
    };

    // Cache the results
    MOVE_DETAIL_CACHE.set(cacheKey, moveDetail);
    return moveDetail;
  } catch (error) {
    console.error(`Error fetching move details: ${error.message}`);
    return null;
  }
}

/**
 * Select up to 4 moves for a pokemon based on level and type.
 * Prioritizes STAB (Same Type Attack Bonus) moves.
 *
 * FIX v2: Low-level starters (e.g. Charmander Lv.1) now always get
 * their type-appropriate STAB moves rather than defaulting entirely
 * to Normal-type fallbacks. Strategy:
 *  1. First try moves learnable at exactly current level (level-up moves).
 *  2. Broaden to all moves learnable so far (up to current level).
 *  3. If still nothing useful, take the first 4 moves of the list (includes
 *     TM / egg moves pre-loaded at level 1).
 *  4. After fetching details, sort: STAB > power > recency.
 *  5. Always ensure at least 1 STAB attacking move — if none found from
 *     the API, inject a guaranteed STAB move from the fallback table
 *     before filling remaining slots with Normal moves.
 *
 * @param {Object} pokemon - { name, types, level }
 * @returns {Promise<Array>} Array of up to 4 move objects
 */
async function selectMovesForLevel(pokemon) {
  try {
    const moves = await getPokemonMoves(pokemon.name || pokemon.id);
    const pokemonTypes = pokemon.types || [];

    if (!moves || !moves.length) {
      console.warn(`No moves found for ${pokemon.name}, using type fallback`);
      return getFallbackMoves(pokemonTypes);
    }

    // ── Step 1: moves learneable at the current level (tight window) ──
    let availableMoves = moves.filter(
      (m) =>
        (m.levelLearned || 0) <= pokemon.level &&
        (m.levelLearned || 0) >= Math.max(1, pokemon.level - 10),
    );

    // ── Step 2: broaden — all moves learnable up to current level ─────
    if (availableMoves.length < 2) {
      availableMoves = moves.filter((m) => (m.levelLearned || 0) <= pokemon.level);
    }

    // ── Step 3: still nothing — take the first 4 entries (TM/egg/lv1) ─
    if (availableMoves.length === 0) {
      availableMoves = moves.slice(0, 8);
    }

    // Fetch move details (cap at 12 candidates to avoid too many API calls)
    const candidates = availableMoves.slice(0, 12);
    const moveDetailsRaw = await Promise.all(
      candidates.map(async (moveSlot) => {
        const detail = await getMoveDetails(moveSlot.name);
        return detail ? { ...detail, levelLearned: moveSlot.levelLearned } : null;
      }),
    );

    // Only keep attacking moves with power > 0
    let attackingMoves = moveDetailsRaw.filter(
      (m) => m !== null && m.power > 0,
    );

    // ── Sort: STAB first → highest power → most recently learned ──────
    attackingMoves.sort((a, b) => {
      const aStab = pokemonTypes.includes(a.type) ? 2 : 0;
      const bStab = pokemonTypes.includes(b.type) ? 2 : 0;
      if (aStab !== bStab) return bStab - aStab;
      if (a.power !== b.power) return (b.power || 0) - (a.power || 0);
      return (b.levelLearned || 0) - (a.levelLearned || 0);
    });

    // ── Guarantee at least 1 STAB move for starters at low level ──────
    const hasStab = attackingMoves.some((m) => pokemonTypes.includes(m.type));
    if (!hasStab && pokemonTypes.length > 0) {
      // Inject the best fallback STAB move as the first move
      const stabFallbacks = getFallbackMoves(pokemonTypes);
      const stabMove = stabFallbacks.find((m) => pokemonTypes.includes(m.type));
      if (stabMove) {
        attackingMoves.unshift({
          name:         stabMove.name,
          type:         stabMove.type,
          power:        stabMove.power,
          pp:           stabMove.pp,
          category:     stabMove.category,
          currentPp:    stabMove.pp,
          accuracy:     100,
          priority:     0,
          levelLearned: 1,
        });
      }
    }

    // ── Pick top 4 ────────────────────────────────────────────────────
    const finalMoves = attackingMoves.slice(0, 4).map((m) => ({
      name:      m.name.toUpperCase().replace(/-/g, " "),
      type:      m.type,
      power:     m.power,
      pp:        m.pp,
      category:  m.category,
      currentPp: m.pp,
      accuracy:  m.accuracy  || 100,
      priority:  m.priority  || 0,
      stab:      pokemonTypes.includes(m.type),
    }));

    // Pad with fallback if fewer than 2 moves found
    if (finalMoves.length < 2) {
      const padMoves = getFallbackMoves(pokemonTypes)
        .filter((fb) => !finalMoves.some((f) => f.name === fb.name));
      finalMoves.push(...padMoves.slice(0, 4 - finalMoves.length));
    }

    return finalMoves;
  } catch (error) {
    console.error(`Error selecting moves: ${error.message}`);
    return getFallbackMoves(pokemon.types || []);
  }
}

/**
 * Get a move by name (from cache or API)
 * @param {string} moveName - The move name
 * @returns {Promise<Object>} Full move object
 */
async function getMove(moveName) {
  return await getMoveDetails(moveName);
}

/**
 * Get a quick moveset fallback if API is unavailable
 * Used as a last resort
 * @param {Array} types - Pokemon types
 * @returns {Array} Fallback moves
 */
function getFallbackMoves(types) {
  const typeMoves = {
    fire: [
      { name: "EMBER", type: "fire", power: 40, pp: 25, category: "special" },
      {
        name: "FLAMETHROWER",
        type: "fire",
        power: 90,
        pp: 15,
        category: "special",
      },
      {
        name: "FIRE BLAST",
        type: "fire",
        power: 110,
        pp: 5,
        category: "special",
      },
    ],
    water: [
      {
        name: "WATER GUN",
        type: "water",
        power: 40,
        pp: 25,
        category: "special",
      },
      { name: "SURF", type: "water", power: 90, pp: 15, category: "special" },
      {
        name: "HYDRO PUMP",
        type: "water",
        power: 110,
        pp: 5,
        category: "special",
      },
    ],
    grass: [
      {
        name: "VINE WHIP",
        type: "grass",
        power: 45,
        pp: 25,
        category: "physical",
      },
      {
        name: "RAZOR LEAF",
        type: "grass",
        power: 55,
        pp: 25,
        category: "physical",
      },
      {
        name: "SOLAR BEAM",
        type: "grass",
        power: 120,
        pp: 10,
        category: "special",
      },
    ],
    electric: [
      {
        name: "THUNDER SHOCK",
        type: "electric",
        power: 40,
        pp: 30,
        category: "special",
      },
      {
        name: "THUNDERBOLT",
        type: "electric",
        power: 90,
        pp: 15,
        category: "special",
      },
      {
        name: "THUNDER",
        type: "electric",
        power: 110,
        pp: 10,
        category: "special",
      },
    ],
    psychic: [
      {
        name: "CONFUSION",
        type: "psychic",
        power: 50,
        pp: 25,
        category: "special",
      },
      {
        name: "PSYBEAM",
        type: "psychic",
        power: 65,
        pp: 20,
        category: "special",
      },
      {
        name: "PSYCHIC",
        type: "psychic",
        power: 90,
        pp: 10,
        category: "special",
      },
    ],
    normal: [
      {
        name: "TACKLE",
        type: "normal",
        power: 40,
        pp: 35,
        category: "physical",
      },
      {
        name: "BODY SLAM",
        type: "normal",
        power: 85,
        pp: 15,
        category: "physical",
      },
      {
        name: "HYPER BEAM",
        type: "normal",
        power: 150,
        pp: 5,
        category: "special",
      },
    ],
    fighting: [
      {
        name: "LOW KICK",
        type: "fighting",
        power: 50,
        pp: 20,
        category: "physical",
      },
      {
        name: "BRICK BREAK",
        type: "fighting",
        power: 75,
        pp: 15,
        category: "physical",
      },
      {
        name: "CLOSE COMBAT",
        type: "fighting",
        power: 120,
        pp: 5,
        category: "physical",
      },
    ],
    poison: [
      {
        name: "POISON STING",
        type: "poison",
        power: 15,
        pp: 35,
        category: "physical",
      },
      {
        name: "SLUDGE BOMB",
        type: "poison",
        power: 90,
        pp: 10,
        category: "special",
      },
      {
        name: "GUNK SHOT",
        type: "poison",
        power: 120,
        pp: 5,
        category: "physical",
      },
    ],
    ghost: [
      { name: "LICK", type: "ghost", power: 30, pp: 30, category: "physical" },
      {
        name: "SHADOW BALL",
        type: "ghost",
        power: 80,
        pp: 15,
        category: "special",
      },
      {
        name: "SHADOW FORCE",
        type: "ghost",
        power: 120,
        pp: 5,
        category: "physical",
      },
    ],
    dragon: [
      {
        name: "DRAGON RAGE",
        type: "dragon",
        power: 60,
        pp: 10,
        category: "special",
      },
      {
        name: "DRAGON PULSE",
        type: "dragon",
        power: 85,
        pp: 10,
        category: "special",
      },
      {
        name: "DRACO METEOR",
        type: "dragon",
        power: 130,
        pp: 5,
        category: "special",
      },
    ],
    ice: [
      {
        name: "ICE SHARD",
        type: "ice",
        power: 40,
        pp: 30,
        category: "physical",
      },
      { name: "ICE BEAM", type: "ice", power: 90, pp: 10, category: "special" },
      { name: "BLIZZARD", type: "ice", power: 110, pp: 5, category: "special" },
    ],
    bug: [
      {
        name: "BUG BITE",
        type: "bug",
        power: 60,
        pp: 20,
        category: "physical",
      },
      {
        name: "SIGNAL BEAM",
        type: "bug",
        power: 75,
        pp: 15,
        category: "special",
      },
      { name: "BUG BUZZ", type: "bug", power: 90, pp: 10, category: "special" },
    ],
    rock: [
      {
        name: "ROCK THROW",
        type: "rock",
        power: 50,
        pp: 15,
        category: "physical",
      },
      {
        name: "ROCK SLIDE",
        type: "rock",
        power: 75,
        pp: 10,
        category: "physical",
      },
      {
        name: "STONE EDGE",
        type: "rock",
        power: 100,
        pp: 5,
        category: "physical",
      },
    ],
    ground: [
      {
        name: "MUD SHOT",
        type: "ground",
        power: 55,
        pp: 15,
        category: "special",
      },
      {
        name: "EARTHQUAKE",
        type: "ground",
        power: 100,
        pp: 10,
        category: "physical",
      },
      {
        name: "FISSURE",
        type: "ground",
        power: 150,
        pp: 5,
        category: "physical",
      },
    ],
    flying: [
      { name: "GUST", type: "flying", power: 40, pp: 35, category: "special" },
      {
        name: "AIR SLASH",
        type: "flying",
        power: 75,
        pp: 15,
        category: "physical",
      },
      {
        name: "HURRICANE",
        type: "flying",
        power: 110,
        pp: 10,
        category: "special",
      },
    ],
    dark: [
      { name: "BITE", type: "dark", power: 60, pp: 25, category: "physical" },
      { name: "CRUNCH", type: "dark", power: 80, pp: 15, category: "physical" },
      {
        name: "DARK PULSE",
        type: "dark",
        power: 80,
        pp: 15,
        category: "special",
      },
    ],
    steel: [
      {
        name: "METAL CLAW",
        type: "steel",
        power: 50,
        pp: 35,
        category: "physical",
      },
      {
        name: "IRON HEAD",
        type: "steel",
        power: 80,
        pp: 15,
        category: "physical",
      },
      {
        name: "FLASH CANNON",
        type: "steel",
        power: 80,
        pp: 10,
        category: "special",
      },
    ],
    fairy: [
      {
        name: "FAIRY WIND",
        type: "fairy",
        power: 40,
        pp: 30,
        category: "special",
      },
      {
        name: "MOONBLAST",
        type: "fairy",
        power: 95,
        pp: 15,
        category: "special",
      },
      {
        name: "DAZZLING GLEAM",
        type: "fairy",
        power: 80,
        pp: 10,
        category: "special",
      },
    ],
  };

  const primary = types[0] || "normal";
  const pool = typeMoves[primary] || typeMoves.normal;
  const moves = pool.slice(0, 3);
  moves.push({
    name: "QUICK ATTACK",
    type: "normal",
    power: 40,
    pp: 30,
    category: "physical",
  });
  return moves.slice(0, 4).map((m) => ({
    ...m,
    currentPp: m.pp,
    stab: types.includes(m.type),
  }));
}

// ── EXPORTS ────────────────────────────────────────────
export {
  getPokemonMoves,
  getMoveDetails,
  selectMovesForLevel,
  getMove,
  getFallbackMoves,
  MOVE_TYPE_COLORS,
  MOVE_CACHE,
  MOVE_DETAIL_CACHE,
};
