/**
 * pity.js — BIT-POKEMON Pity & Gacha System
 * Genshin Impact-inspired pity for Fragment Pulls
 *
 * ── PULL RULES ──────────────────────────────────────────
 *
 * Standard Banner (Neural Archive):
 *   - Soft pity starts at pull 60 (rate climbs sharply)
 *   - Hard pity at pull 75 (guaranteed Legendary Fragment)
 *   - Guaranteed Epic every 10 pulls
 *
 * Premium Banner (Voss Protocol — Event):
 *   - Soft pity at pull 45
 *   - Hard pity at pull 60
 *   - Guaranteed Epic every 10 pulls
 *   - 50/50 rule: first Legendary = 50% featured;
 *     if lost, next Legendary is guaranteed featured
 *
 * ── RARITY WEIGHTS (base, before soft pity) ─────────────
 *   5★ Legendary:  0.6%
 *   4★ Epic:       5.1%
 *   3★ Rare:      94.3%
 *
 * Soft pity boost: +6% per pull above soft pity threshold
 *
 * ── CURRENCY ────────────────────────────────────────────
 *   FRG (Fragment Residue) — earned in the field
 *   WPC (Wasteland Processor Credits) — premium currency
 *
 * ── LORE NOTE ────────────────────────────────────────────
 *   Pokéballs do not exist in this world. Pokémon were
 *   encoded into Fragment Chips by Dr. Voss before the
 *   Fracture. Hunters use Capture Devices — PIP-mounted
 *   beam emitters — to materialise and re-encode Fragments.
 *   There are no wild Pokémon. There are only signals.
 */

const STORAGE_KEY = 'bit_pity_data';

// ── Default pity state ────────────────────────────────────
function defaultState() {
  return {
    standard: {
      pullCount:    0,   // total pulls on this banner
      pity5:        0,   // pulls since last 5★
      pity4:        0,   // pulls since last 4★
      guaranteed5:  false,
      totalPulls:   0,
    },
    premium: {
      pullCount:    0,
      pity5:        0,
      pity4:        0,
      guaranteed5:  false,  // lost 50/50 last time → guarantee next
      totalPulls:   0,
    },
    history: [],           // newest-first, capped at 50
  };
}

// ── Persistence ───────────────────────────────────────────
export function loadPity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const def  = defaultState();
      return {
        standard: { ...def.standard, ...data.standard },
        premium:  { ...def.premium,  ...data.premium  },
        history:  data.history || [],
      };
    }
  } catch {}
  return defaultState();
}

export function savePity(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function resetPity() {
  savePity(defaultState());
  return defaultState();
}

// ── Rarity calculator ─────────────────────────────────────
function calcRarity(pity5, bannerType) {
  const softStart = bannerType === 'premium' ? 45 : 60;
  const hardPity  = bannerType === 'premium' ? 60 : 75;

  let base5 = 0.006; // 0.6% base
  if (pity5 >= hardPity - 1) {
    base5 = 1.0;     // hard pity — guaranteed
  } else if (pity5 >= softStart) {
    base5 = Math.min(0.006 + (pity5 - softStart + 1) * 0.06, 1.0);
  }

  const base4 = 0.051;
  const roll  = Math.random();
  if (roll < base5)          return 5;
  if (roll < base5 + base4)  return 4;
  return 3;
}

// ── Fragment pools ────────────────────────────────────────
// Each fragment is a Pokémon's neural essence encoded into
// a crystal chip by Voss Institute scientists before the
// Fracture. Rarity reflects signal integrity and power class.

export const FRAGMENTS = {

  // ── 5★ LEGENDARY ──────────────────────────────────────
  // Apex-class signal integrity. Ironclad-restricted or
  // Echo Syndicate-classified. Summoning one draws attention.
  5: [
    {
      id: 150, name: 'Mewtwo',
      type: 'Psychic',
      color: '#ff80c0',
      label: 'LEGENDARY',
      signal: 'PSY-APEX-150',
      lore: 'Engineered by the old world. Its neural pattern is so dense it corrupts unshielded PIPs.',
    },
    {
      id: 144, name: 'Articuno',
      type: 'Ice / Flying',
      color: '#a0e8ff',
      label: 'LEGENDARY',
      signal: 'ICE-APEX-144',
      lore: 'Last confirmed signal ping: Year 0 of the Fracture, northern glacier sector.',
    },
    {
      id: 145, name: 'Zapdos',
      type: 'Electric / Flying',
      color: '#ffe040',
      label: 'LEGENDARY',
      signal: 'ELC-APEX-145',
      lore: 'Its Fragment chip permanently overloads standard-grade PIP readers on contact.',
    },
    {
      id: 146, name: 'Moltres',
      type: 'Fire / Flying',
      color: '#ff6030',
      label: 'LEGENDARY',
      signal: 'FIR-APEX-146',
      lore: 'The Hollow considers it a symbol of the world burning. Ironclad considers it a weapon.',
    },
    {
      id: 149, name: 'Dragonite',
      type: 'Dragon / Flying',
      color: '#6060ff',
      label: 'LEGENDARY',
      signal: 'DRG-APEX-149',
      lore: 'Fragment value: incalculable. Last wild sighting predates the Fracture by one week.',
    },
    {
      id: 151, name: 'Mew',
      type: 'Psychic',
      color: '#ffaad4',
      label: 'MYTHIC',
      signal: 'MYT-NULL-151',
      lore: 'The Echo Syndicate believes Mew\'s chip contains a seed of Project Genesis. Unverified.',
    },
  ],

  // ── 4★ EPIC ───────────────────────────────────────────
  // High-integrity fragments. Faction-contested. Each one
  // has documented field use in major wasteland conflicts.
  4: [
    {
      id: 6,   name: 'Charizard',
      type: 'Fire / Flying',
      color: '#ff6030',
      label: 'EPIC',
      signal: 'FIR-EPIC-006',
      lore: 'Ironclad\'s frontline terror. Its beam radius can level a city block.',
    },
    {
      id: 9,   name: 'Blastoise',
      type: 'Water',
      color: '#4ab8ff',
      label: 'EPIC',
      signal: 'WAT-EPIC-009',
      lore: 'Echo Syndicate uses Blastoise chips for water reclamation in dead zones.',
    },
    {
      id: 3,   name: 'Venusaur',
      type: 'Grass / Poison',
      color: '#4aff6a',
      label: 'EPIC',
      signal: 'GRS-EPIC-003',
      lore: 'Rare green signal in a grey world. Spore emissions neutralise corrupted Fragment residue.',
    },
    {
      id: 65,  name: 'Alakazam',
      type: 'Psychic',
      color: '#ff80c0',
      label: 'EPIC',
      signal: 'PSY-EPIC-065',
      lore: 'Its psychic field can detect Hollow infiltrators within a 2km radius.',
    },
    {
      id: 94,  name: 'Gengar',
      type: 'Ghost / Poison',
      color: '#b86aff',
      label: 'EPIC',
      signal: 'GHT-EPIC-094',
      lore: 'The Hollow weaponises corrupted Gengar chips. Uncorrupted ones are devastatingly rare.',
    },
    {
      id: 130, name: 'Gyarados',
      type: 'Water / Flying',
      color: '#4ab8ff',
      label: 'EPIC',
      signal: 'WAT-EPIC-130',
      lore: 'Flood Zone hunters swear by it. Gyarados chips have a 100% field operation survival rate.',
    },
    {
      id: 59,  name: 'Arcanine',
      type: 'Fire',
      color: '#ff8040',
      label: 'EPIC',
      signal: 'FIR-EPIC-059',
      lore: 'Scouts and couriers. Arcanine chips are the most traded EPIC-class fragments in the field.',
    },
    {
      id: 131, name: 'Lapras',
      type: 'Water / Ice',
      color: '#a0e8ff',
      label: 'EPIC',
      signal: 'WAT-EPIC-131',
      lore: 'Before the Fracture, Lapras ferried trainers across open water. Now it ferries hunters across ruins.',
    },
    {
      id: 143, name: 'Snorlax',
      type: 'Normal',
      color: '#d0d0d0',
      label: 'EPIC',
      signal: 'NRM-EPIC-143',
      lore: 'Its mass creates a localised gravity field. Ironclad uses it as a mobile forward base.',
    },
    {
      id: 68,  name: 'Machamp',
      type: 'Fighting',
      color: '#c04020',
      label: 'EPIC',
      signal: 'FGT-EPIC-068',
      lore: '"Four arms. Zero hesitation." — Ironclad Commander\'s Field Manual, pg. 1.',
    },
  ],

  // ── 3★ RARE ───────────────────────────────────────────
  // Functional fragments. Mid-tier signal integrity.
  // The backbone of most hunters' active slot rotations.
  3: [
    { id: 5,   name: 'Charmeleon',  type: 'Fire',     color: '#ff6030', label: 'RARE', signal: 'FIR-RARE-005' },
    { id: 8,   name: 'Wartortle',   type: 'Water',    color: '#4ab8ff', label: 'RARE', signal: 'WAT-RARE-008' },
    { id: 2,   name: 'Ivysaur',     type: 'Grass',    color: '#4aff6a', label: 'RARE', signal: 'GRS-RARE-002' },
    { id: 25,  name: 'Pikachu',     type: 'Electric', color: '#ffe040', label: 'RARE', signal: 'ELC-RARE-025' },
    { id: 26,  name: 'Raichu',      type: 'Electric', color: '#ffe040', label: 'RARE', signal: 'ELC-RARE-026' },
    { id: 45,  name: 'Vileplume',   type: 'Grass',    color: '#80c840', label: 'RARE', signal: 'GRS-RARE-045' },
    { id: 62,  name: 'Poliwrath',   type: 'Water',    color: '#4ab8ff', label: 'RARE', signal: 'WAT-RARE-062' },
    { id: 91,  name: 'Cloyster',    type: 'Water',    color: '#a0e8ff', label: 'RARE', signal: 'WAT-RARE-091' },
    { id: 93,  name: 'Haunter',     type: 'Ghost',    color: '#b86aff', label: 'RARE', signal: 'GHT-RARE-093' },
    { id: 76,  name: 'Golem',       type: 'Rock',     color: '#c8a060', label: 'RARE', signal: 'RCK-RARE-076' },
    { id: 103, name: 'Exeggutor',   type: 'Grass',    color: '#a0e060', label: 'RARE', signal: 'GRS-RARE-103' },
    { id: 112, name: 'Rhydon',      type: 'Ground',   color: '#e0a040', label: 'RARE', signal: 'GRD-RARE-112' },
    { id: 115, name: 'Kangaskhan',  type: 'Normal',   color: '#d0d0d0', label: 'RARE', signal: 'NRM-RARE-115' },
    { id: 121, name: 'Starmie',     type: 'Water',    color: '#4ab8ff', label: 'RARE', signal: 'WAT-RARE-121' },
    { id: 134, name: 'Vaporeon',    type: 'Water',    color: '#4ab8ff', label: 'RARE', signal: 'WAT-RARE-134' },
    { id: 135, name: 'Jolteon',     type: 'Electric', color: '#ffe040', label: 'RARE', signal: 'ELC-RARE-135' },
    { id: 136, name: 'Flareon',     type: 'Fire',     color: '#ff6030', label: 'RARE', signal: 'FIR-RARE-136' },
    { id: 82,  name: 'Magneton',    type: 'Electric', color: '#ffe040', label: 'RARE', signal: 'ELC-RARE-082' },
    { id: 110, name: 'Weezing',     type: 'Poison',   color: '#a040c0', label: 'RARE', signal: 'PSN-RARE-110' },
    { id: 89,  name: 'Muk',         type: 'Poison',   color: '#a040c0', label: 'RARE', signal: 'PSN-RARE-089' },
  ],
};

// ── Featured banner pools (Voss Protocol event) ───────────
// The Echo Syndicate curates these — featuring chips they
// consider critical to Project Genesis research.
export const FEATURED_5 = [
  {
    id: 150, name: 'Mewtwo',
    type: 'Psychic',
    color: '#ff80c0',
    label: 'FEATURED ★',
    signal: 'PSY-APEX-150',
    lore: 'The Echo Syndicate believes Mewtwo\'s chip holds the first key to Project Genesis.',
  },
];

export const FEATURED_4 = [
  {
    id: 6,  name: 'Charizard',
    type: 'Fire / Flying',
    color: '#ff6030',
    label: 'FEATURED',
    signal: 'FIR-EPIC-006',
  },
  {
    id: 94, name: 'Gengar',
    type: 'Ghost / Poison',
    color: '#b86aff',
    label: 'FEATURED',
    signal: 'GHT-EPIC-094',
  },
];

function pickFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Core pull function ────────────────────────────────────
export function doPull(bannerType, count, state) {
  const banner  = state[bannerType];
  const results = [];

  for (let i = 0; i < count; i++) {
    banner.pity5++;
    banner.pity4++;
    banner.totalPulls++;
    banner.pullCount++;

    const rarity = calcRarity(banner.pity5, bannerType);
    let fragment;

    if (rarity === 5) {
      if (bannerType === 'premium') {
        if (banner.guaranteed5 || Math.random() < 0.5) {
          fragment = { ...FEATURED_5[0], rarity: 5, featured: true };
          banner.guaranteed5 = false;
        } else {
          fragment = { ...pickFrom(FRAGMENTS[5]), rarity: 5, featured: false };
          banner.guaranteed5 = true; // lost 50/50 — guarantee next
        }
      } else {
        fragment = { ...pickFrom(FRAGMENTS[5]), rarity: 5, featured: false };
      }
      banner.pity5 = 0;
      banner.pity4 = 0;

    } else if (rarity === 4) {
      if (bannerType === 'premium' && Math.random() < 0.5) {
        fragment = { ...pickFrom(FEATURED_4), rarity: 4, featured: true };
      } else {
        fragment = { ...pickFrom(FRAGMENTS[4]), rarity: 4, featured: false };
      }
      banner.pity4 = 0;

    } else {
      // 3★ — but override with 4★ if pity4 hits threshold
      if (banner.pity4 >= 9) {
        if (bannerType === 'premium' && Math.random() < 0.5) {
          fragment = { ...pickFrom(FEATURED_4), rarity: 4, featured: true };
        } else {
          fragment = { ...pickFrom(FRAGMENTS[4]), rarity: 4, featured: false };
        }
        banner.pity4 = 0;
      } else {
        fragment = { ...pickFrom(FRAGMENTS[3]), rarity: 3, featured: false };
      }
    }

    results.push(fragment);
  }

  // History — newest first, capped at 50
  state.history = [...results, ...state.history].slice(0, 50);

  savePity(state);
  return { results, state };
}

// ── Pity info (for UI display) ────────────────────────────
export function getPityInfo(bannerType, state) {
  const banner    = state[bannerType];
  const softStart = bannerType === 'premium' ? 45 : 60;
  const hardPity  = bannerType === 'premium' ? 60 : 75;
  return {
    pity5:             banner.pity5,
    pity4:             banner.pity4,
    softStart,
    hardPity,
    guaranteed5:       banner.guaranteed5,
    totalPulls:        banner.totalPulls,
    nextGuaranteed4:   10 - (banner.pity4 % 10),
    pullsToSoftPity:   Math.max(0, softStart - banner.pity5),
    pullsToHardPity:   Math.max(0, hardPity  - banner.pity5),
  };
}

// ── Pull costs ────────────────────────────────────────────
// FRG = Fragment Residue  (grind currency — earned in the field)
// WPC = Wasteland Processor Credits (premium — purchased or looted)
export const PULL_COSTS = {
  standard: { single: 160,  ten: 1500  }, // FRG
  premium:  { single: 280,  ten: 2600  }, // WPC
};

// ── FRG earn rates (reference) ────────────────────────────
// Per encounter / re-encode:  5–15 FRG
// Per battle win:            20–40 FRG
// Daily login bonus:         50 FRG
// So 1 standard pull ≈ 10–32 encounters — grindy but earnable
// 10-pull ≈ 38–300 encounters — premium currency speeds this up significantly

// ── Shop catalogue ────────────────────────────────────────
// These are the purchasable field consumables and PIP upgrades.
// NO Pokéballs. NO Pokémon catching mechanic.
// Hunters ENCODE fragments. Not catch Pokémon.

export const SHOP_ITEMS = {

  // ── CAPTURE DEVICES ───────────────────────────────────
  // PIP-mounted beam emitters used to materialise a Fragment
  // signal and encode it back into a crystal chip.
  // Tier determines the signal strength the beam can handle.
  capture_devices: [
    {
      id:   'capture_mk1',
      name: 'Capture Device Mk.I',
      sku:  'CAPTURE-MK1',
      cost: 80,
      currency: 'FRG',
      type: 'capture_device',
      tier: 1,
      desc: 'Standard-issue field beam emitter. Handles stable, low-power Fragment signals only.',
      effect: 'Re-encode common-tier Fragments. Base success rate.',
      color: '#4aff6a',
    },
    {
      id:   'capture_mk2',
      name: 'Capture Device Mk.II',
      sku:  'CAPTURE-MK2',
      cost: 200,
      currency: 'FRG',
      type: 'capture_device',
      tier: 2,
      desc: 'Reinforced emitter coil. Handles mid-tier Fragment interference without signal bleed.',
      effect: 'Re-encode rare-tier Fragments. +15% success rate.',
      color: '#44aaff',
    },
    {
      id:   'capture_mk3',
      name: 'Capture Device Mk.III',
      sku:  'CAPTURE-MK3',
      cost: 500,
      currency: 'FRG',
      type: 'capture_device',
      tier: 3,
      desc: 'Military-spec beam array. Ironclad-adjacent tech. Required for unstable signal classes.',
      effect: 'Re-encode epic-tier Fragments. +30% success rate.',
      color: '#b450ff',
    },
    {
      id:   'capture_apex',
      name: 'Capture Device — APEX',
      sku:  'CAPTURE-APEX',
      cost: 5000,
      currency: 'WPC',
      type: 'capture_device',
      tier: 4,
      desc: 'Voss-prototype full-spectrum emitter. Classified tech. 100% signal lock on any Fragment.',
      effect: 'Guaranteed re-encode on any Fragment tier. No signal loss.',
      color: '#ffb830',
      restricted: true, // Ironclad-monitored item
    },
  ],

  // ── FIELD BOOSTERS ────────────────────────────────────
  // Consumable augments that modify field scan behaviour,
  // FRG yield, and encounter frequency. Single-use unless
  // noted. Sourced from black-market traders and Echo caches.
  boosters: [
    {
      id:   'neural_boost',
      name: 'Neural Boost',
      sku:  'BOOST-NEURAL',
      cost: 300,
      currency: 'FRG',
      type: 'booster',
      icon: '⚡',
      duration: '30 min',
      desc: 'Overclocks your PIP\'s passive scanner. Fragment signal density spikes for 30 minutes.',
      effect: '2× encounter rate. More signals, more chances to re-encode.',
      color: '#ffe040',
    },
    {
      id:   'xp_boost',
      name: 'XP Amplifier',
      sku:  'BOOST-XP',
      cost: 400,
      currency: 'FRG',
      type: 'booster',
      icon: '📡',
      duration: '1 hr',
      desc: 'Tunes your PIP\'s reward matrix to extract more residue from field operations.',
      effect: '1.5× FRG yield for 1 hour of active field operations.',
      color: '#4aff6a',
    },
    {
      id:   'signal_lock',
      name: 'Signal Lock',
      sku:  'BOOST-SIGLOCK',
      cost: 600,
      currency: 'FRG',
      type: 'booster',
      icon: '🔒',
      duration: 'One use',
      desc: 'Pins a Fragment signal in place. Prevents it from decaying mid-encounter.',
      effect: 'Prevents Fragment signal loss on failed re-encode attempt. One use.',
      color: '#44aaff',
    },
    {
      id:   'corruption_ward',
      name: 'Corruption Ward',
      sku:  'BOOST-WARD',
      cost: 750,
      currency: 'FRG',
      type: 'booster',
      icon: '🛡',
      duration: '1 hr',
      desc: 'Filters Hollow corruption from your PIP\'s incoming signal stream.',
      effect: 'Blocks corrupted Fragment signals for 1 hour. Safe zone scanning.',
      color: '#b86aff',
    },
  ],

  // ── PIP UPGRADES ──────────────────────────────────────
  // Permanent hardware modifications to your PIP device.
  // Irreversible. Sourced from the Voss Institute black market
  // or salvaged from decommissioned Ironclad field units.
  pip_upgrades: [
    {
      id:   'slot_expand',
      name: 'Slot Chip +1',
      sku:  'UPGRADE-SLOT',
      cost: 2000,
      currency: 'WPC',
      type: 'pip_upgrade',
      icon: '🔧',
      permanent: true,
      desc: 'Installs an additional Fragment reader slot into your PIP chassis.',
      effect: 'Permanently expands active Fragment slots from 5 to 6.',
      color: '#ffb830',
    },
    {
      id:   'beam_stabiliser',
      name: 'Beam Stabiliser',
      sku:  'UPGRADE-BEAM',
      cost: 1500,
      currency: 'WPC',
      type: 'pip_upgrade',
      icon: '📻',
      permanent: true,
      desc: 'Dampens beam oscillation on your Capture Device mount.',
      effect: 'Permanently reduces Capture Device Mk.I and Mk.II failure rate by 10%.',
      color: '#44aaff',
    },
    {
      id:   'memory_core',
      name: 'Memory Core Upgrade',
      sku:  'UPGRADE-MEM',
      cost: 3000,
      currency: 'WPC',
      type: 'pip_upgrade',
      icon: '💾',
      permanent: true,
      desc: 'Expands your PIP\'s fragment registry storage capacity.',
      effect: 'Increases Fragment Vault capacity from 50 to 100 chips.',
      color: '#4aff6a',
    },
  ],

  // ── UTILITIES ─────────────────────────────────────────
  // Operational tools. Timer resets, signal scramblers,
  // and black-market access tokens.
  utilities: [
    {
      id:   'daily_reset',
      name: 'Reset Timer',
      sku:  'UTIL-RESET',
      cost: 800,
      currency: 'WPC',
      type: 'utility',
      icon: '🔄',
      desc: 'Bypasses the cooldown lock on your daily Fragment pull allowance.',
      effect: 'Instantly resets your daily pull timer. One use.',
      color: '#ff8040',
    },
    {
      id:   'signal_scrambler',
      name: 'Signal Scrambler',
      sku:  'UTIL-SCRAMBLE',
      cost: 500,
      currency: 'FRG',
      type: 'utility',
      icon: '📶',
      desc: 'Masks your PIP\'s broadcast signature from Ironclad and Hollow detection arrays.',
      effect: 'Stealth mode for 2 hours. Reduced faction aggro in contested zones.',
      color: '#c8c8c8',
    },
  ],
};
