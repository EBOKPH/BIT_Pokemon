// ══════════════════════════════════════════════════════
//  BIT-POKEMON — BATTLE ENGINE
// ══════════════════════════════════════════════════════

// ── SOUND ENGINE (same pattern as game.html) ──────────
const SFX = (() => {
  let _ctx = null;
  function ctx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  }
  function osc(freq, type, dur, vol, freqEnd) {
    const c = ctx(),
      o = c.createOscillator(),
      g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (freqEnd)
      o.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.start();
    o.stop(c.currentTime + dur);
  }
  function noise(dur = 0.06, vol = 0.04) {
    const c = ctx(),
      buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(),
      g = c.createGain();
    src.buffer = buf;
    src.connect(g);
    g.connect(c.destination);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.start();
    src.stop(c.currentTime + dur);
  }
  return {
    hit() {
      osc(220, "sawtooth", 0.08, 0.12);
      setTimeout(() => osc(180, "square", 0.06, 0.08), 60);
    },
    crit() {
      osc(660, "sine", 0.05, 0.1);
      setTimeout(() => osc(880, "sine", 0.1, 0.12), 60);
      setTimeout(() => osc(1100, "sine", 0.15, 0.1), 130);
    },
    victory() {
      [440, 550, 660, 880].forEach((f, i) =>
        setTimeout(() => osc(f, "sine", 0.18, 0.09), i * 120),
      );
    },
    defeat() {
      [440, 330, 220, 180].forEach((f, i) =>
        setTimeout(() => osc(f, "square", 0.2, 0.07), i * 130),
      );
    },
    select() {
      osc(600, "square", 0.04, 0.06);
      setTimeout(() => osc(800, "square", 0.06, 0.06), 40);
    },
    run() {
      osc(400, "sine", 0.06, 0.07, 200);
      setTimeout(() => osc(300, "sine", 0.1, 0.05, 150), 80);
    },
    catch_() {
      noise(0.08, 0.05);
      setTimeout(() => osc(440, "sine", 0.2, 0.07, 660), 100);
    },
    levelup() {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => osc(f, "sine", 0.15, 0.1), i * 100),
      );
    },
  };
})();

// ── TYPE COLOR MAP ──────────────────────────────────────
const TYPE_COLORS = {
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
const TYPE_RGB = {
  normal: "168,168,120",
  fire: "240,128,48",
  water: "104,144,240",
  grass: "120,200,80",
  electric: "248,208,48",
  ice: "152,216,216",
  fighting: "192,48,40",
  poison: "160,64,160",
  ground: "224,192,104",
  flying: "168,144,240",
  psychic: "248,88,136",
  bug: "168,184,32",
  rock: "184,160,56",
  ghost: "112,88,152",
  dragon: "112,56,248",
  dark: "112,88,72",
  steel: "184,184,208",
  fairy: "238,153,172",
};

// ── BATTLE STATE ────────────────────────────────────────
let playerPokemon = null; // { name, sprite, types, level, hp, maxHp, moves, exp }
let enemyPokemon = null; // { name, sprite, types, level, hp, maxHp, moves }
let playerTurn = true;
let battleOver = false;
let inventory = { pokeball: 0, greatball: 0, ultraball: 0 };

// ── LOG ─────────────────────────────────────────────────
function log(msg, cls = "info") {
  const el = document.getElementById("battleLog");
  const div = document.createElement("div");
  div.className = `log-entry ${cls}`;
  div.textContent = msg;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

// ── HP BAR UPDATE ────────────────────────────────────────
function updateHpBar(who, hp, maxHp) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const fill = document.getElementById(`${who}HpFill`);
  const num = document.getElementById(`${who}HpNum`);
  fill.style.width = pct + "%";
  fill.className =
    "hp-fill" + (pct <= 20 ? " red" : pct <= 50 ? " yellow" : "");
  num.textContent = `${Math.max(0, hp)} / ${maxHp}`;
}

// ── PARTICLES ────────────────────────────────────────────
function burst(x, y, color = "#4aff6a", count = 12) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const angle = (i / count) * Math.PI * 2;
    const dist = 30 + Math.random() * 60;
    p.style.cssText = `left:${x}px;top:${y}px;background:${color};--px:${Math.cos(angle) * dist}px;--py:${Math.sin(angle) * dist}px;animation-duration:${0.4 + Math.random() * 0.3}s`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

// ── SCREEN SHAKE ────────────────────────────────────────
function shake() {
  const el = document.getElementById("arenaEl");
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 400);
}

// ── FLASH ────────────────────────────────────────────────
function flash(color = "white") {
  const f = document.getElementById("attackFlash");
  f.style.background = color;
  f.classList.add("flash");
  setTimeout(() => f.classList.remove("flash"), 120);
}

// ── GENERATE MOVES (from PokeAPI moves or fallback) ──────
function generateMoves(types, level) {
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
  // Pick 2-3 from primary type, 1 normal filler
  const moves = pool.slice(0, 3);
  moves.push({
    name: "QUICK ATTACK",
    type: "normal",
    power: 40,
    pp: 30,
    category: "physical",
  });
  return moves.slice(0, 4).map((m) => ({ ...m, currentPp: m.pp }));
}

// ── DAMAGE CALCULATION (USING BATTLE-LOGIC) ───────────────────
function calcDamage(attacker, defender, move) {
  // Use the expanded formula from battle-logic.js
  if (typeof calculateDamage === "function") {
    return calculateDamage(attacker, defender, move, "expanded");
  } else {
    // Fallback if battle-logic.js not loaded
    const base = (((2 * attacker.level) / 5 + 2) * move.power * 1) / 50 + 2;
    const randomFactor = 0.85 + Math.random() * 0.15;
    return Math.max(1, Math.round(base * randomFactor));
  }
}

// ── ENEMY AI ─────────────────────────────────────────────
function enemyMove() {
  if (battleOver) return;
  const moves = enemyPokemon.moves.filter((m) => m.currentPp > 0);
  if (!moves.length) {
    log("Enemy has no PP left!", "warn");
    endTurn();
    return;
  }
  // AI: prefer high power moves, occasionally random
  const move =
    Math.random() < 0.7
      ? moves.reduce((a, b) => (b.power > a.power ? b : a))
      : moves[Math.floor(Math.random() * moves.length)];

  setTimeout(
    () => {
      move.currentPp--;
      const dmg = calcDamage(enemyPokemon, playerPokemon, move);
      playerPokemon.hp = Math.max(0, playerPokemon.hp - dmg);

      // Animate
      document.getElementById("enemy-sprite").classList.remove("enemy-attack");
      void document.getElementById("enemy-sprite").offsetWidth;
      document.getElementById("enemy-sprite").classList.add("enemy-attack");

      setTimeout(() => {
        flash("rgba(255,68,68,0.4)");
        shake();
        document.getElementById("player-sprite").classList.add("sprite-hit");
        setTimeout(
          () =>
            document
              .getElementById("player-sprite")
              .classList.remove("sprite-hit"),
          400,
        );

        SFX.hit();
        log(`Enemy used ${move.name} — ${dmg} damage`, "dmg");

        // Particle burst on player sprite
        const ps = document.getElementById("player-sprite");
        const r = ps.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, "#ff4444", 10);

        updateHpBar("player", playerPokemon.hp, playerPokemon.maxHp);

        if (playerPokemon.hp <= 0) {
          setTimeout(() => endBattle(false), 600);
        } else {
          setTimeout(() => endTurn(), 400);
        }
      }, 300);
    },
    600 + Math.random() * 400,
  );
}

// ── PLAYER USES MOVE ─────────────────────────────────────
window.useMove = function (idx) {
  if (!playerTurn || battleOver) return;
  const move = playerPokemon.moves[idx];
  if (!move || move.currentPp <= 0) {
    log("No PP remaining for this move.", "warn");
    return;
  }

  SFX.select();
  setTurn(false);
  move.currentPp--;

  const dmg = calcDamage(playerPokemon, enemyPokemon, move);
  enemyPokemon.hp = Math.max(0, enemyPokemon.hp - dmg);

  // Player attack animation
  const pSpr = document.getElementById("player-sprite");
  pSpr.classList.remove("sprite-attack");
  void pSpr.offsetWidth;
  pSpr.classList.add("sprite-attack");

  setTimeout(() => {
    flash("rgba(74,255,106,0.25)");
    shake();
    const eSpr = document.getElementById("enemy-sprite");
    eSpr.classList.add("sprite-hit");
    setTimeout(() => eSpr.classList.remove("sprite-hit"), 400);

    // Particles on enemy
    const r = eSpr.getBoundingClientRect();
    burst(
      r.left + r.width / 2,
      r.top + r.height / 2,
      TYPE_COLORS[move.type] || "#4aff6a",
      14,
    );

    SFX.hit();
    log(`Used ${move.name} — ${dmg} damage`, "info");

    updateHpBar("enemy", enemyPokemon.hp, enemyPokemon.maxHp);
    renderMoves(); // update PP

    if (enemyPokemon.hp <= 0) {
      setTimeout(() => endBattle(true), 600);
    } else {
      // Enemy turn
      document.getElementById("turnIndicator").textContent = "ENEMY TURN";
      document.getElementById("turnIndicator").classList.add("enemy-turn");
      log(`${enemyPokemon.name.toUpperCase()} is thinking...`, "sys");
      enemyMove();
    }
  }, 280);
};

function endTurn() {
  if (battleOver) return;
  setTurn(true);
}

function setTurn(isPlayer) {
  playerTurn = isPlayer;
  const ind = document.getElementById("turnIndicator");
  const btns = document.querySelectorAll(".move-btn");
  if (isPlayer) {
    ind.textContent = "YOUR TURN";
    ind.classList.remove("enemy-turn");
    btns.forEach((b) => (b.disabled = false));
  } else {
    ind.textContent = "ENEMY TURN";
    ind.classList.add("enemy-turn");
    btns.forEach((b) => (b.disabled = true));
  }
}

// ── END BATTLE ───────────────────────────────────────────
function endBattle(won) {
  battleOver = true;
  const overlay = document.getElementById("endOverlay");
  const title = document.getElementById("endTitle");
  const sub = document.getElementById("endSub");
  const xpEl = document.getElementById("endXp");
  const catchBtn = overlay.querySelector(".end-btn.secondary");

  if (won) {
    SFX.victory();
    title.textContent = "VICTORY";
    title.className = "end-title victory";
    sub.textContent = `${enemyPokemon.name.toUpperCase()} WAS DEFEATED`;
    const xpGained = Math.round((enemyPokemon.exp * enemyPokemon.level) / 7);
    xpEl.textContent = `+ ${xpGained} EXP GAINED`;
    log(`${enemyPokemon.name.toUpperCase()} fainted!`, "good");
    log(`You gained ${xpGained} EXP!`, "good");
    // show catch button only on win
    catchBtn.style.display = "inline-block";
    SFX.levelup();
  } else {
    SFX.defeat();
    title.textContent = "DEFEATED";
    title.className = "end-title defeat";
    sub.textContent = `${playerPokemon.name.toUpperCase()} FAINTED`;
    xpEl.textContent = "";
    log(`${playerPokemon.name.toUpperCase()} fainted...`, "dmg");
    catchBtn.style.display = "none";
  }

  setTimeout(() => overlay.classList.add("show"), 800);
}

// ── RUN ──────────────────────────────────────────────────
window.tryRun = function () {
  if (battleOver) return;
  const chance = Math.random();
  if (chance < 0.5) {
    SFX.run();
    log("Got away safely!", "good");
    setTimeout(() => goBack(), 800);
  } else {
    log("Couldn't escape!", "warn");
    if (playerTurn) {
      setTurn(false);
      document.getElementById("turnIndicator").textContent = "ENEMY TURN";
      document.getElementById("turnIndicator").classList.add("enemy-turn");
      enemyMove();
    }
  }
};

// ── BAG / CATCH ──────────────────────────────────────────
window.useBall = function (ballType) {
  if (!playerTurn || battleOver) return;
  if (inventory[ballType] <= 0) {
    log(`No ${ballType}s left!`, "warn");
    return;
  }
  inventory[ballType]--;
  updateInventoryUI();

  // Catch rate: lower enemy HP = higher chance; ultraball > greatball > pokeball
  const hpRatio = enemyPokemon.hp / enemyPokemon.maxHp;
  const ballBonus =
    ballType === "ultraball" ? 2 : ballType === "greatball" ? 1.5 : 1;
  const catchRate = Math.max(
    0.05,
    Math.min(0.95, (1 - hpRatio) * ballBonus * 0.6 + 0.2),
  );

  SFX.catch_();
  setTurn(false);
  log(`Threw a ${ballType.toUpperCase()}...`, "info");

  setTimeout(() => {
    if (Math.random() < catchRate) {
      log(`${enemyPokemon.name.toUpperCase()} was caught!`, "good");
      saveToBackend();
      setTimeout(() => endBattle(true), 400);
    } else {
      log(`${enemyPokemon.name.toUpperCase()} broke free!`, "warn");
      enemyMove();
    }
  }, 1200);
};

function updateInventoryUI() {
  document.getElementById("cnt-pokeball").textContent =
    `×${inventory.pokeball}`;
  document.getElementById("cnt-greatball").textContent =
    `×${inventory.greatball}`;
  document.getElementById("cnt-ultraball").textContent =
    `×${inventory.ultraball}`;
}

// ── TAB SWITCHING ────────────────────────────────────────
window.switchTab = function (tab) {
  document.getElementById("fightPanel").style.display =
    tab === "fight" ? "grid" : "none";
  document.getElementById("bagPanel").className =
    "other-panel" + (tab === "bag" ? " active" : "");
  document.getElementById("pokemonPanel").className =
    "other-panel" + (tab === "pokemon" ? " active" : "");
  document.getElementById("tabFight").className =
    "menu-tab" + (tab === "fight" ? " active" : "");
  document.getElementById("tabBag").className =
    "menu-tab" + (tab === "bag" ? " active" : "");
  document.getElementById("tabPoke").className =
    "menu-tab" + (tab === "pokemon" ? " active" : "");
};

// ── RENDER MOVES ─────────────────────────────────────────
function renderMoves() {
  const grid = document.getElementById("fightPanel");
  grid.innerHTML = "";
  (playerPokemon?.moves || []).forEach((move, i) => {
    const color = TYPE_COLORS[move.type] || "#4aff6a";
    const rgb = TYPE_RGB[move.type] || "74,255,106";
    const outPp = move.currentPp <= 0;
    grid.innerHTML += `
      <button class="move-btn" onclick="useMove(${i})" ${outPp ? "disabled" : ""}>
        <div class="move-inner" style="--move-color:${color};--move-rgb:${rgb}">
          <span class="move-name">${move.name}</span>
          <div class="move-meta">
            <span class="move-type">${move.type}</span>
            <span class="move-power">PWR ${move.power}</span>
            <span class="move-pp">${move.currentPp}/${move.pp} PP</span>
          </div>
        </div>
      </button>`;
  });
}

// ── SAVE CAUGHT POKEMON ──────────────────────────────────
async function saveToBackend() {
  const user_id = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");
  if (!user_id || !token || !enemyPokemon) return;
  try {
    const { API_BASE_URL } = await import("../../api.js");
    await fetch(`${API_BASE_URL}/users/${user_id}/pokemon`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pokemon_id: enemyPokemon.id,
        name: enemyPokemon.name,
        sprite: enemyPokemon.sprite,
        types: enemyPokemon.types,
        level: enemyPokemon.level,
        pokedex_no: enemyPokemon.id,
      }),
    });
    log("Fragment chip encoded — saved to storage!", "good");
  } catch (e) {
    log("Could not save to backend — local only", "warn");
  }
}

// ── NAV ──────────────────────────────────────────────────
window.goBack = function () {
  window.location.href = "game.html";
};
window.catchAfterWin = function () {
  const wild = localStorage.getItem("caughtPokemon");
  if (!wild) {
    goBack();
    return;
  }
  saveToBackend().then(() => goBack());
};

// ── BUILD POKEMON FROM DATA ──────────────────────────────
function buildPokemon(apiData, level, isPlayer = false) {
  const types = apiData.types.map((t) => t.type.name);
  const baseHpStat =
    apiData.stats.find((s) => s.stat.name === "hp")?.base_stat || 45;
  const baseAttackStat =
    apiData.stats.find((s) => s.stat.name === "attack")?.base_stat || 49;
  const baseDefenseStat =
    apiData.stats.find((s) => s.stat.name === "defense")?.base_stat || 49;
  const baseSpAtkStat =
    apiData.stats.find((s) => s.stat.name === "sp. atk")?.base_stat || 65;
  const baseSpDefStat =
    apiData.stats.find((s) => s.stat.name === "sp. def")?.base_stat || 65;
  const baseSpeedStat =
    apiData.stats.find((s) => s.stat.name === "speed")?.base_stat || 45;

  const maxHp = ((baseHpStat * 2 + 31 + 63 / 4) * level) / 100 + level + 5;
  const moves = generateMoves(types, level);

  return {
    id: apiData.id,
    name: apiData.name,
    sprite: isPlayer
      ? apiData.sprites.back_default || apiData.sprites.front_default
      : apiData.sprites.front_default,
    types,
    level,
    hp: maxHp,
    maxHp,
    moves,
    exp: apiData.base_experience || 50,
    // Base stats for battle-logic calculations
    baseHP: baseHpStat,
    baseAttack: baseAttackStat,
    baseDefense: baseDefenseStat,
    baseSpAtk: baseSpAtkStat,
    baseSpDef: baseSpDefStat,
    baseSpeed: baseSpeedStat,
    // Scaled stats
    attack: baseAttackStat + level * 2,
    defense: baseDefenseStat + level * 2,
    spAtk: baseSpAtkStat + level * 2,
    spDef: baseSpDefStat + level * 2,
    speed: baseSpeedStat + level * 1,
  };
}

// ── POKEMON SELECTION ────────────────────────────────
async function showPokemonSelection() {
  const user_id = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");

  if (!user_id || !token) {
    log("Not logged in — cannot load pokemon party", "dmg");
    await startBattleWithPokemon(1); // fallback
    return;
  }

  try {
    const { getUserPokemon } = await import("./pokemon-api.js");
    const result = await getUserPokemon(user_id, token);

    if (!result.success || !result.data || result.data.length === 0) {
      log("No pokemon in your party — starting with default", "warn");
      await startBattleWithPokemon(1); // fallback: bulbasaur
      return;
    }

    const userParty = result.data;
    const modal = document.getElementById("pokemonSelectionModal");
    const list = document.getElementById("pokemonSelectionList");
    const status = document.getElementById("selectionStatus");

    list.innerHTML = "";
    status.style.display = "none";

    // Display each pokemon as a selectable button
    userParty.forEach((pokemon, idx) => {
      const pokemonCard = document.createElement("div");
      pokemonCard.className = "other-btn";
      pokemonCard.style.cursor = "pointer";
      pokemonCard.style.marginBottom = "8px";
      pokemonCard.style.display = "flex";
      pokemonCard.style.justifyContent = "space-between";
      pokemonCard.style.alignItems = "center";

      const name = pokemon.name || "Unknown";
      const level = pokemon.level || 1;
      const hp = pokemon.current_hp || 0;
      const maxHp = pokemon.max_hp || level * 2 + 10;

      pokemonCard.innerHTML = `
        <div>
          <div style="font-weight:bold;">${name.toUpperCase()}</div>
          <div style="font-size:11px; color:var(--text-dim);">Lv.${level} | HP: ${hp}/${maxHp}</div>
        </div>
        <div style="color:var(--green);">→</div>
      `;

      pokemonCard.onclick = () =>
        startBattleWithPokemon(
          pokemon.pokemon_id || pokemon.pokedex_no || pokemon.id,
          pokemon,
        );
      list.appendChild(pokemonCard);
    });

    modal.classList.add("open");
  } catch (err) {
    console.error("Failed to load pokemon party:", err);
    log("Failed to load your party — starting with default", "warn");
    await startBattleWithPokemon(1); // fallback
  }
}

async function startBattleWithPokemon(playerApiId, playerData) {
  const modal = document.getElementById("pokemonSelectionModal");
  if (modal.classList.contains("open")) {
    modal.classList.remove("open");
  }

  await initBattle(playerApiId, playerData);
}

// ── INIT BATTLE (WITH BATTLE LOGIC INTEGRATION) ──────────
async function initBattle(playerApiId = 1, playerData = null) {
  log("BATTLE PROTOCOL INITIALIZING...", "sys");

  // ── Get wild pokemon from localStorage (set by game.html) ──
  const wildRaw = localStorage.getItem("caughtPokemon");
  let wildData = wildRaw ? JSON.parse(wildRaw) : null;

  // Get user data for world level
  const user_id = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");
  let playerWorldLevel = 1;
  let playerLevel = playerData?.level || 15;

  if (user_id && token) {
    try {
      const { API_BASE_URL } = await import("../../api.js");
      const res = await fetch(`${API_BASE_URL}/users/${user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        playerWorldLevel = data.data.world_level || 1;
        // Load inventory
        inventory.pokeball = data.data.pokeball || 0;
        inventory.greatball = data.data.greatball || 0;
        inventory.ultraball = data.data.ultraball || 0;
        updateInventoryUI();
      }
    } catch (e) {
      console.error("Failed to load user data:", e);
    }
  }

  // Fetch enemy from PokeAPI
  let enemyApiId = wildData?.id || Math.ceil(Math.random() * 151);
  let areaHabitat = wildData?.habitat || "normal";
  let rarity = wildData?.rarity || "common";

  try {
    const [enemyRes] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${enemyApiId}`),
    ]);
    const enemyApi = await enemyRes.json();

    // Use battle-logic to generate enemy level based on world level
    let enemyLevel;
    if (typeof generateEnemyLevel === "function") {
      enemyLevel = generateEnemyLevel(playerWorldLevel, areaHabitat, rarity);
    } else {
      enemyLevel = wildData?.level || 10 + Math.floor(Math.random() * 30);
    }

    enemyPokemon = buildPokemon(enemyApi, enemyLevel, false);

    document.getElementById("enemyName").textContent =
      enemyPokemon.name.toUpperCase();
    document.getElementById("enemyLevel").textContent =
      `Lv.${enemyPokemon.level}`;
    document.getElementById("enemy-sprite").src = enemyPokemon.sprite;
    updateHpBar("enemy", enemyPokemon.hp, enemyPokemon.maxHp);
    log(
      `Wild ${enemyPokemon.name.toUpperCase()} appeared! (Lv.${enemyPokemon.level})`,
      "warn",
    );
  } catch (e) {
    log("Failed to load enemy data", "dmg");
    console.error(e);
  }

  // Fetch player pokemon from PokeAPI (use selected pokemon)
  try {
    const playerRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${playerApiId}`,
    );
    const playerApi = await playerRes.json();
    playerPokemon = buildPokemon(playerApi, playerLevel, true);

    // Use current HP from player data if available
    if (playerData?.current_hp && playerData.current_hp > 0) {
      playerPokemon.hp = Math.min(playerData.current_hp, playerPokemon.maxHp);
    }

    document.getElementById("playerName").textContent =
      playerPokemon.name.toUpperCase();
    document.getElementById("playerLevel").textContent =
      `Lv.${playerPokemon.level}`;
    document.getElementById("player-sprite").src = playerPokemon.sprite;
    updateHpBar("player", playerPokemon.hp, playerPokemon.maxHp);
    renderMoves();
    log(`Go, ${playerPokemon.name.toUpperCase()}!`, "good");
  } catch (e) {
    log("Failed to load player pokemon — using fallback", "warn");
    console.error(e);
  }

  log("BATTLE START — choose your move.", "sys");
  setTurn(true);
}

// Initialize the battle when the page loads - show pokemon selection first
showPokemonSelection();
