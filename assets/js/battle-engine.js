// Pokemon Battle Engine - Strict Spec Implementation
// See: POKEMON BATTLE LOGIC SPECIFICATION

export class Pokemon {
  constructor({
    name,
    level,
    base_stats,
    types,
    moves,
    base_experience,
    exp = 0,
    current_hp = null,
  }) {
    this.name = name;
    this.level = level;
    this.base_stats = base_stats; // {hp, attack, defense, special_attack, special_defense, speed}
    this.types = types; // [type1, type2?]
    this.moves = moves; // [{name, power, type, damage_class}]
    this.base_experience = base_experience;
    this.exp = exp;
    this.max_hp = this.calcStat("hp");
    this.attack = this.calcStat("attack");
    this.defense = this.calcStat("defense");
    this.special_attack = this.calcStat("special_attack");
    this.special_defense = this.calcStat("special_defense");
    this.speed = this.calcStat("speed");
    this.current_hp = current_hp === null ? this.max_hp : current_hp;
  }

  calcStat(stat) {
    if (stat === "hp") {
      return Math.floor(
        (2 * this.base_stats.hp * this.level) / 100 + this.level + 10,
      );
    }
    return Math.floor((2 * this.base_stats[stat] * this.level) / 100 + 5);
  }

  isFainted() {
    return this.current_hp <= 0;
  }
}

export class Battle {
  constructor(pokemonA, pokemonB, trainer_battle = false) {
    this.pokemonA = pokemonA;
    this.pokemonB = pokemonB;
    this.trainer_battle = trainer_battle;
    this.turn = 0;
    this.log = [];
  }

  // Type chart: {attackingType: {defendingType: multiplier}}
  static typeChart = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: {
      fire: 0.5,
      water: 0.5,
      grass: 2,
      ice: 2,
      bug: 2,
      rock: 0.5,
      dragon: 0.5,
      steel: 2,
    },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: {
      water: 2,
      electric: 0.5,
      grass: 0.5,
      ground: 0,
      flying: 2,
      dragon: 0.5,
    },
    grass: {
      fire: 0.5,
      water: 2,
      grass: 0.5,
      poison: 0.5,
      ground: 2,
      flying: 0.5,
      bug: 0.5,
      rock: 2,
      dragon: 0.5,
      steel: 0.5,
    },
    ice: {
      fire: 0.5,
      water: 0.5,
      grass: 2,
      ice: 0.5,
      ground: 2,
      flying: 2,
      dragon: 2,
      steel: 0.5,
    },
    fighting: {
      normal: 2,
      ice: 2,
      rock: 2,
      dark: 2,
      steel: 2,
      poison: 0.5,
      flying: 0.5,
      psychic: 0.5,
      bug: 0.5,
      ghost: 0,
      fairy: 0.5,
    },
    poison: {
      grass: 2,
      poison: 0.5,
      ground: 0.5,
      rock: 0.5,
      ghost: 0.5,
      steel: 0,
      fairy: 2,
    },
    ground: {
      fire: 2,
      electric: 2,
      grass: 0.5,
      poison: 2,
      flying: 0,
      bug: 0.5,
      rock: 2,
      steel: 2,
    },
    flying: {
      electric: 0.5,
      grass: 2,
      fighting: 2,
      bug: 2,
      rock: 0.5,
      steel: 0.5,
    },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: {
      fire: 0.5,
      grass: 2,
      fighting: 0.5,
      poison: 0.5,
      flying: 0.5,
      psychic: 2,
      ghost: 0.5,
      dark: 2,
      steel: 0.5,
      fairy: 0.5,
    },
    rock: {
      fire: 2,
      ice: 2,
      fighting: 0.5,
      ground: 0.5,
      flying: 2,
      bug: 2,
      steel: 0.5,
    },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: {
      fire: 0.5,
      water: 0.5,
      electric: 0.5,
      ice: 2,
      rock: 2,
      fairy: 2,
      steel: 0.5,
    },
    fairy: {
      fire: 0.5,
      fighting: 2,
      poison: 0.5,
      dragon: 2,
      dark: 2,
      steel: 0.5,
    },
  };

  static getTypeEffectiveness(moveType, defenderTypes) {
    let modifier = 1.0;
    for (const defType of defenderTypes) {
      const chart = Battle.typeChart[moveType] || {};
      if (chart[defType] !== undefined) {
        modifier *= chart[defType];
      } else {
        modifier *= 1.0;
      }
    }
    return modifier;
  }

  static getRandomFactor() {
    return Math.random() * (1.0 - 0.85) + 0.85;
  }

  static calcDamage({ attacker, defender, move, level }) {
    // Select stats
    let atk, def;
    if (move.damage_class === "physical") {
      atk = attacker.attack;
      def = defender.defense;
    } else if (move.damage_class === "special") {
      atk = attacker.special_attack;
      def = defender.special_defense;
    } else {
      return 0;
    }
    // Base damage
    let base_damage =
      (((2 * level) / 5 + 2) * move.power * (atk / def)) / 50 + 2;
    // Modifier
    let modifier = 1.0;
    // STAB
    if (attacker.types.includes(move.type)) {
      modifier *= 1.5;
    }
    // Type effectiveness
    modifier *= Battle.getTypeEffectiveness(move.type, defender.types);
    // Random
    modifier *= Battle.getRandomFactor();
    // Final
    let final_damage = Math.floor(base_damage * modifier);
    if (final_damage < 1 && modifier > 0) final_damage = 1;
    return { final_damage, modifier, base_damage };
  }

  getTurnOrder() {
    if (this.pokemonA.speed > this.pokemonB.speed)
      return [this.pokemonA, this.pokemonB];
    if (this.pokemonB.speed > this.pokemonA.speed)
      return [this.pokemonB, this.pokemonA];
    // Random if tied
    return Math.random() < 0.5
      ? [this.pokemonA, this.pokemonB]
      : [this.pokemonB, this.pokemonA];
  }

  takeTurn(moveA, moveB) {
    // Returns log of turn
    const [first, second] = this.getTurnOrder();
    const moves = first === this.pokemonA ? [moveA, moveB] : [moveB, moveA];
    const turnLog = [];
    for (let i = 0; i < 2; ++i) {
      const user = i === 0 ? first : second;
      const target = i === 0 ? second : first;
      const move = moves[i];
      if (user.isFainted()) {
        turnLog.push(`${user.name} cannot act (fainted).`);
        continue;
      }
      if (!move) {
        turnLog.push(`${user.name} did not select a move.`);
        continue;
      }
      const { final_damage, modifier } = Battle.calcDamage({
        attacker: user,
        defender: target,
        move,
        level: user.level,
      });
      target.current_hp -= final_damage;
      if (target.current_hp < 0) target.current_hp = 0;
      turnLog.push(
        `${user.name} used ${move.name}! It dealt ${final_damage} damage.`,
      );
      if (modifier > 1.0) turnLog.push("It's super effective!");
      if (modifier === 0) turnLog.push("It had no effect.");
      if (modifier > 0 && modifier < 1.0)
        turnLog.push("It's not very effective.");
      if (target.isFainted()) {
        turnLog.push(`${target.name} fainted!`);
      }
    }
    this.log.push(turnLog);
    this.turn++;
    return turnLog;
  }

  isBattleOver() {
    return this.pokemonA.isFainted() || this.pokemonB.isFainted();
  }

  getWinner() {
    if (!this.isBattleOver()) return null;
    if (this.pokemonA.isFainted() && this.pokemonB.isFainted()) return null;
    if (this.pokemonA.isFainted()) return this.pokemonB;
    if (this.pokemonB.isFainted()) return this.pokemonA;
    return null;
  }

  static getExpGain(enemy, trainer_battle = false) {
    let exp = (enemy.base_experience * enemy.level) / 7;
    if (trainer_battle) exp *= 1.5;
    return exp;
  }

  static getRequiredExp(level) {
    return Math.pow(level, 3);
  }

  static tryLevelUp(pokemon) {
    const required = Battle.getRequiredExp(pokemon.level);
    if (pokemon.exp >= required) {
      pokemon.level += 1;
      // Recalculate stats
      pokemon.max_hp = pokemon.calcStat("hp");
      pokemon.attack = pokemon.calcStat("attack");
      pokemon.defense = pokemon.calcStat("defense");
      pokemon.special_attack = pokemon.calcStat("special_attack");
      pokemon.special_defense = pokemon.calcStat("special_defense");
      pokemon.speed = pokemon.calcStat("speed");
      // Optionally restore HP
      // pokemon.current_hp = pokemon.max_hp;
      return true;
    }
    return false;
  }
}
