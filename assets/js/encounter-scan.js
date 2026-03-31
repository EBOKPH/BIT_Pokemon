// ══════════════════════════════════════════════════════════════════════
// encounter-scan.js — BIT-POKEMON Fragment Scan Probability Engine
// Handles: scan chance, signal build, dead zones, time modifiers,
//          per-map rarity weights, scan cooldowns, and outcome logic
// ══════════════════════════════════════════════════════════════════════

// ── PER-HABITAT SCAN PROFILE ──────────────────────────────────────────
// base_rate     : signal gained per scan press (out of 100 threshold)
// density       : how dense the habitat is — affects dead zone frequency
// dead_zone     : probability per tick that signal collapses (nothing there)
// cooldown_min  : minimum scans between encounters
// cooldown_max  : maximum scans between encounters
// rare_chance   : chance the found pokemon is from the rare_pool instead of common
// weather_boost : signal multiplier in bad/stormy conditions (lore: wasteland storms flush out feral pokemon)

export const HABITAT_PROFILES = {
  grass: {
    label: "Corolla Ruins — dense undergrowth",
    base_rate: 22,
    density: "high",
    dead_zone: 0.18,
    cooldown_min: 5,
    cooldown_max: 9,
    rare_chance: 0.12,
    weather_boost: 1.2,
    scan_flavor: [
      "// vegetation interference — signal unclear",
      "// fragment residue detected in root system",
      "// bio-electric trace — moving through undergrowth",
      "// green zone scan — signal fragmented by canopy",
      "// no contact — target may be dormant",
    ],
  },
  water: {
    label: "Submerged Zone — signal distortion high",
    base_rate: 16,
    density: "medium",
    dead_zone: 0.25,
    cooldown_min: 6,
    cooldown_max: 11,
    rare_chance: 0.15,
    weather_boost: 1.35,
    scan_flavor: [
      "// aquatic interference — neural trace weak",
      "// sub-surface fragment detected — depth unknown",
      "// sonar bounce — inconclusive",
      "// moisture disrupting PIP beam diffraction",
      "// no contact — target below surface",
    ],
  },
  fire: {
    label: "Scorched Corridor — heat distortion",
    base_rate: 20,
    density: "medium",
    dead_zone: 0.2,
    cooldown_min: 5,
    cooldown_max: 8,
    rare_chance: 0.18,
    weather_boost: 0.85, // heat storms actually suppress signal
    scan_flavor: [
      "// thermal interference — beam refracting",
      "// heat signature detected — identity unclear",
      "// fragment chip temperature critical",
      "// neural trace scorched — partial read",
      "// no contact — heat bloom masking signal",
    ],
  },
  rock: {
    label: "Fractured Ridge Valley — mineral scatter",
    base_rate: 18,
    density: "low",
    dead_zone: 0.28,
    cooldown_min: 7,
    cooldown_max: 12,
    rare_chance: 0.2,
    weather_boost: 1.1,
    scan_flavor: [
      "// mineral deposits scattering beam",
      "// fragment trace buried — depth scan initiated",
      "// geological interference — signal patchy",
      "// echo location: possible fossil fragment",
      "// no contact — target concealed in rock face",
    ],
  },
  ghost: {
    label: "Shrouded Necropolis — signal anomalies",
    base_rate: 25,
    density: "high",
    dead_zone: 0.3, // ghost zone goes completely silent frequently
    cooldown_min: 3,
    cooldown_max: 7,
    rare_chance: 0.3, // highest rare rate — ghost zone is volatile
    weather_boost: 1.6, // night/storm massively boosts ghost encounters
    scan_flavor: [
      "// psychic static — proximity unknown",
      "// fragment resonance detected — unstable",
      "// anomalous reading — signal phasing in and out",
      "// null zone — scanner temporarily blinded",
      "// nothing detected — or nothing willing to be detected",
    ],
  },
  ice: {
    label: "Frozen Tundra — signal preserved in cold",
    base_rate: 14,
    density: "low",
    dead_zone: 0.22,
    cooldown_min: 8,
    cooldown_max: 14,
    rare_chance: 0.16,
    weather_boost: 0.9,
    scan_flavor: [
      "// low-temperature signal preservation — trace old",
      "// fragment chip hibernation detected",
      "// cryo-static interference — beam diffracted",
      "// ice shelf dampening neural echo",
      "// no contact — target in thermal dormancy",
    ],
  },
  electric: {
    label: "Surging Grid — high interference",
    base_rate: 24,
    density: "high",
    dead_zone: 0.15, // electric zone rarely goes quiet
    cooldown_min: 4,
    cooldown_max: 7,
    rare_chance: 0.22,
    weather_boost: 1.8, // storm weather = electric encounter explosion
    scan_flavor: [
      "// voltage spike — scanner temporarily disrupted",
      "// EM pulse — fragment signal amplified",
      "// neural trace: 40,000V residue detected",
      "// static discharge from nearby fragment",
      "// no contact — ionosphere blocking trace",
    ],
  },
  dragon: {
    label: "Dragon's Den — extreme danger zone",
    base_rate: 12,
    density: "very_low",
    dead_zone: 0.35, // dragons hide well
    cooldown_min: 10,
    cooldown_max: 18,
    rare_chance: 0.55, // most encounters here are rare/legendary tier
    weather_boost: 1.4,
    scan_flavor: [
      "// draconic interference — PIP beam partially absorbed",
      "// scale-resonance detected — target is massive",
      "// fragment signal: ancient — pre-Fracture encoding",
      "// seismic activity masking neural trace",
      "// nothing — the silence here is deliberate",
    ],
  },
  bug: {
    label: "Bug Hollow — swarm activity",
    base_rate: 26, // highest base rate — bugs are everywhere
    density: "very_high",
    dead_zone: 0.1,
    cooldown_min: 3,
    cooldown_max: 6,
    rare_chance: 0.08,
    weather_boost: 1.1,
    scan_flavor: [
      "// colony signal — multiple fragments in proximity",
      "// chitinous scatter — PIP beam fragmented",
      "// hive resonance detected",
      "// bio-electric swarm signature",
      "// no contact — colony may have moved",
    ],
  },
  psychic: {
    label: "Kinetic Rift — cognitohazard zone",
    base_rate: 20,
    density: "medium",
    dead_zone: 0.25,
    cooldown_min: 5,
    cooldown_max: 10,
    rare_chance: 0.35,
    weather_boost: 1.3,
    scan_flavor: [
      "// psychic residue — scanner is being read",
      "// neural echo: fragment is aware of the scan",
      "// mind-space distortion — coordinates uncertain",
      "// premonition: contact imminent or not at all",
      "// no contact — target may be cloaking cognitively",
    ],
  },
  poison: {
    label: "Bio Plains — corrosive interference",
    base_rate: 21,
    density: "medium",
    dead_zone: 0.22,
    cooldown_min: 5,
    cooldown_max: 9,
    rare_chance: 0.14,
    weather_boost: 1.15,
    scan_flavor: [
      "// chemical scatter — PIP emitter contaminated",
      "// toxin residue corrupting fragment signal",
      "// sludge layer blocking neural trace",
      "// acidic atmosphere degrading beam coherence",
      "// no contact — target may be submerged in waste",
    ],
  },
  fighting: {
    label: "Dojo Outpost — controlled territory",
    base_rate: 19,
    density: "medium",
    dead_zone: 0.2,
    cooldown_min: 5,
    cooldown_max: 8,
    rare_chance: 0.12,
    weather_boost: 1.0,
    scan_flavor: [
      "// combat residue — recent fragment battle trace",
      "// kinetic energy signature — target is active",
      "// impact crater: fragment recently engaged",
      "// territorial signal — approach with caution",
      "// no contact — target relocated after last engagement",
    ],
  },
  flying: {
    label: "Updraft Island — airborne signal chase",
    base_rate: 17,
    density: "low",
    dead_zone: 0.28,
    cooldown_min: 6,
    cooldown_max: 11,
    rare_chance: 0.18,
    weather_boost: 0.75, // wind disrupts signal badly
    scan_flavor: [
      "// updraft interference — beam deflected",
      "// altitude scatter — target above optimal range",
      "// wind shear disrupting neural trace",
      "// fragment at elevation — signal degrading with height",
      "// no contact — target may have left the corridor",
    ],
  },
  ground: {
    label: "Terra Wastelands — wide open, low density",
    base_rate: 13,
    density: "very_low",
    dead_zone: 0.32,
    cooldown_min: 8,
    cooldown_max: 15,
    rare_chance: 0.15,
    weather_boost: 1.05,
    scan_flavor: [
      "// dust cloud absorbing beam energy",
      "// seismic trace — fragment burrowed",
      "// sand-static corrupting neural read",
      "// wide-area scan: nothing in immediate range",
      "// no contact — Dust Flats are sparse hunting grounds",
    ],
  },
  normal: {
    label: "Poke City — light fragment activity",
    base_rate: 15,
    density: "low",
    dead_zone: 0.24,
    cooldown_min: 6,
    cooldown_max: 10,
    rare_chance: 0.1,
    weather_boost: 1.0,
    scan_flavor: [
      "// urban scatter — civilian interference",
      "// fragment signal faint — last known position: alley sector",
      "// population density masking neural trace",
      "// routine scan — no anomalous readings",
      "// no contact — area has been picked clean recently",
    ],
  },
};

// ── RARITY TIERS ─────────────────────────────────────────────────────
// Applied per-encounter after habitat rare_chance roll
export const RARITY = {
  COMMON: { label: "COMMON", weight: 0.6, color: "var(--green)", xpMult: 1.0 },
  UNCOMMON: { label: "UNCOMMON", weight: 0.25, color: "#80e8b0", xpMult: 1.3 },
  RARE: { label: "RARE", weight: 0.1, color: "var(--blue)", xpMult: 1.8 },
  EPIC: { label: "EPIC", weight: 0.04, color: "var(--purple)", xpMult: 2.5 },
  LEGENDARY: {
    label: "LEGENDARY",
    weight: 0.01,
    color: "var(--amber)",
    xpMult: 5.0,
  },
};

// ── TIME-BASED MODIFIER ───────────────────────────────────────────────
// Based on real browser time — certain hours affect scan rates
export function getTimeModifier() {
  const h = new Date().getHours();
  // 00:00–05:59 — dead of night: ghost/psychic spike, overall slower
  if (h >= 0 && h < 6)
    return { mult: 0.8, label: "DEAD OF NIGHT", ghostBoost: 2.0 };
  // 06:00–09:59 — dawn: slightly boosted
  if (h >= 6 && h < 10)
    return { mult: 1.1, label: "DAWN SCAN", ghostBoost: 1.0 };
  // 10:00–16:59 — daylight: normal
  if (h >= 10 && h < 17)
    return { mult: 1.0, label: "DAYLIGHT", ghostBoost: 0.6 };
  // 17:00–20:59 — dusk: hot zone, best scan window
  if (h >= 17 && h < 21)
    return { mult: 1.3, label: "DUSK WINDOW", ghostBoost: 1.4 };
  // 21:00–23:59 — night: ghost/psychic surge, others slow
  return { mult: 0.9, label: "NIGHT STATIC", ghostBoost: 1.8 };
}

// ── ROLL RARITY ───────────────────────────────────────────────────────
export function rollRarity(habitatRareChance) {
  const r = Math.random();
  // Habitat rare_chance boosts the upper tiers
  const boost = habitatRareChance;

  if (r < 0.01 + boost * 0.3) return RARITY.LEGENDARY;
  else if (r < 0.05 + boost * 0.5) return RARITY.EPIC;
  else if (r < 0.15 + boost) return RARITY.RARE;
  else if (r < 0.4 + boost * 0.5) return RARITY.UNCOMMON;
  else return RARITY.COMMON;
}

// ── SCAN ENGINE ───────────────────────────────────────────────────────
// The core state machine. Call ScanEngine.press() each time the
// player presses SCAN or moves. Returns a ScanResult object.

export class ScanEngine {
  constructor(habitat) {
    this.profile = HABITAT_PROFILES[habitat] || HABITAT_PROFILES.normal;
    this.habitat = habitat;
    this.signal = 0; // 0–100 current signal
    this.cooldown = 0; // scans remaining before next encounter allowed
    this.pressCount = 0; // total presses this session
    this.lastResult = null;
    this._resetCooldown();
  }

  _resetCooldown() {
    const p = this.profile;
    this.cooldown =
      p.cooldown_min +
      Math.floor(Math.random() * (p.cooldown_max - p.cooldown_min + 1));
  }

  // Returns { outcome, signal, rarity, flavor, label }
  press() {
    this.pressCount++;
    const p = this.profile;
    const time = getTimeModifier();

    // ── Cooldown: scanner went quiet after last encounter ──
    if (this.cooldown > 0) {
      this.cooldown--;
      this.signal = 0;
      const flavor = this._randomFlavor();
      return this._result("SILENT", 0, null, flavor, time.label);
    }

    // ── Dead zone roll: random silence, nothing here ──
    let deadChance = p.dead_zone;
    // Ghost/psychic boost at night
    if (
      (this.habitat === "ghost" || this.habitat === "psychic") &&
      time.ghostBoost > 1
    ) {
      deadChance *= 1 / time.ghostBoost; // less dead zone when boosted
    }
    if (Math.random() < deadChance) {
      this.signal = Math.max(0, this.signal - 20);
      const flavor = this._randomFlavor();
      return this._result("DEAD_ZONE", this.signal, null, flavor, time.label);
    }

    // ── Build signal ──
    let gainMult = time.mult;
    if (this.habitat === "ghost" || this.habitat === "psychic") {
      gainMult *= time.ghostBoost;
    }
    const gain = (p.base_rate + (Math.random() * 10 - 5)) * gainMult;
    this.signal = Math.min(100, this.signal + gain);

    // ── Signal states before threshold ──
    if (this.signal < 40)
      return this._result(
        "WEAK",
        this.signal,
        null,
        this._randomFlavor(),
        time.label,
      );
    if (this.signal < 70)
      return this._result(
        "BUILDING",
        this.signal,
        null,
        this._randomFlavor(),
        time.label,
      );
    if (this.signal < 90)
      return this._result(
        "STRONG",
        this.signal,
        null,
        this._randomFlavor(),
        time.label,
      );

    // ── ENCOUNTER triggered at 90+ ──
    const rarity = rollRarity(p.rare_chance);
    this.signal = 0;
    this._resetCooldown();
    return this._result("ENCOUNTER", 100, rarity, null, time.label);
  }

  _randomFlavor() {
    const arr = this.profile.scan_flavor;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _result(outcome, signal, rarity, flavor, timeLabel) {
    this.lastResult = { outcome, signal, rarity, flavor, timeLabel };
    return this.lastResult;
  }

  // Forcefully reset after encounter resolved (flee/catch/battle)
  resolveEncounter() {
    this.signal = 0;
    this._resetCooldown();
  }

  // Signal bar string for PIP screen
  signalBar(length = 10) {
    const filled = Math.round((this.signal / 100) * length);
    return "█".repeat(filled) + "░".repeat(length - filled);
  }
}

// ── SINGLETON FACTORY ─────────────────────────────────────────────────
// game.html creates one instance and keeps it alive
let _engine = null;
export function getEngine(habitat) {
  if (!_engine || _engine.habitat !== habitat) {
    _engine = new ScanEngine(habitat);
  }
  return _engine;
}
export function resetEngine(habitat) {
  _engine = new ScanEngine(habitat);
  return _engine;
}

// ── AUTO SCANNER ──────────────────────────────────────────────────────
export class AutoScanner {
  constructor(engine, opts = {}) {
    this.engine = engine;
    this.interval = opts.interval || 2400;
    this.onResult = opts.onResult || (() => {});
    this.onEncounter = opts.onEncounter || (() => {});
    this.onStop = opts.onStop || (() => {});
    this._timer = null;
    this._active = false;
    this._startedAt = null;
    this._elapsed = 0;
    this._elapsedTimer = null;
  }

  get active() {
    return this._active;
  }

  get elapsedStr() {
    const s = this._elapsed;
    return `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  start() {
    if (this._active) return;
    this._active = true;
    this._startedAt = Date.now();
    this._elapsed = 0;
    this._elapsedTimer = setInterval(() => {
      this._elapsed = Math.floor((Date.now() - this._startedAt) / 1000);
    }, 1000);
    this._runTick();
  }

  _runTick() {
    this._timer = setInterval(() => {
      if (!this._active) return;
      const result = this.engine.press();
      this.onResult(result, this.elapsedStr);
      if (result.outcome === "ENCOUNTER") {
        this.pause();
        this.onEncounter(result);
      }
    }, this.interval);
  }

  pause() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    // _active stays true — scanner is paused not stopped
  }

  resume() {
    if (!this._active) return;
    if (this._timer) return;
    this._runTick();
  }

  stop() {
    this._active = false;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    if (this._elapsedTimer) {
      clearInterval(this._elapsedTimer);
      this._elapsedTimer = null;
    }
    this._elapsed = 0;
    this._startedAt = null;
    this.onStop();
  }

  toggle() {
    if (this._active) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
}
