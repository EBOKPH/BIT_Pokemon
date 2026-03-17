// Fallback logic for move power and HP
export function getDefaultMovePower(moveName) {
  // Simple logic: strong moves get 50, weak get 10, else 20
  const name = moveName.toLowerCase();
  if (name.includes("hyper") || name.includes("blast") || name.includes("beam"))
    return 50;
  if (
    name.includes("tackle") ||
    name.includes("scratch") ||
    name.includes("growl")
  )
    return 10;
  return 20;
}

export function getDefaultHP(pokemonName) {
  // Simple logic: legendary 200, rare 150, else 100
  const name = pokemonName.toLowerCase();
  if (
    name.includes("mewtwo") ||
    name.includes("rayquaza") ||
    name.includes("lugia")
  )
    return 200;
  if (name.includes("dragonite") || name.includes("tyranitar")) return 150;
  return 100;
}

// Expose to window for battle.html
if (typeof window !== "undefined") {
  window.getDefaultMovePower = getDefaultMovePower;
  window.getDefaultHP = getDefaultHP;
}
// Main entry: show ball selection UI and handle catch logic
export function showBallSelection() {
  // Get ball counts from localStorage or default
  let ballArr = [];
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    ballArr = user && user.backpack_items ? user.backpack_items : [];
  } catch {}
  const ballCounts = parseBallCounts(ballArr);
  // Get wild Pokémon and its rarity
  let wild = null;
  try {
    wild = JSON.parse(localStorage.getItem("caughtPokemon"));
  } catch {}
  const rarity = wild && wild.rarity ? wild.rarity : "common";
  showBallButtons(ballCounts, (ballKey, idx) => {
    // Hide buttons after selection
    hideBallButtons();
    // Play animation, then resolve catch
    playCatchAnimation(ballKey, () => {
      const chance = getCatchChance(rarity, ballKey);
      const success = Math.random() < chance;
      const log = document.getElementById("battle-log");
      if (success) {
        log.innerHTML += `<p style='color:#4caf50;font-weight:bold;'>You caught the wild ${wild ? wild.name : "Pokémon"}!</p>`;
        // TODO: Add to userPokemon, update backend, decrement ball count
      } else {
        log.innerHTML += `<p style='color:#e53935;font-weight:bold;'>Oh no! The wild ${wild ? wild.name : "Pokémon"} broke free!</p>`;
      }
      log.scrollTop = log.scrollHeight;
    });
  });
}
// assets/js/gamemaster.js
// Handles encounter actions, catch logic, ball selection, and animation

export function showBallButtons(ballCounts, onSelect) {
  const container = document.getElementById("ball-buttons");
  container.innerHTML = "";
  const balls = [
    { name: "Pokéball", key: "pokeball", color: "#e53935" },
    { name: "Great Ball", key: "greatball", color: "#1976d2" },
    { name: "Ultra Ball", key: "ultraball", color: "#ffd700" },
    { name: "Master Ball", key: "masterball", color: "#8e24aa" },
  ];
  balls.forEach((ball, i) => {
    const count = ballCounts[i] || 0;
    const btn = document.createElement("button");
    btn.textContent = `${ball.name} x${count}`;
    btn.style.background = ball.color;
    btn.style.color = "#fff";
    btn.style.margin = "0 8px";
    btn.style.padding = "10px 18px";
    btn.style.borderRadius = "8px";
    btn.style.border = "none";
    btn.style.fontWeight = "bold";
    btn.style.cursor = count > 0 ? "pointer" : "not-allowed";
    btn.disabled = count <= 0;
    btn.onclick = () => onSelect(ball.key, i);
    container.appendChild(btn);
  });
  container.style.display = "flex";
}

export function hideBallButtons() {
  const container = document.getElementById("ball-buttons");
  container.style.display = "none";
  container.innerHTML = "";
}

export function playCatchAnimation(ballKey, callback) {
  // Simple animation: shake enemy sprite, show ball image
  const enemySprite = document.getElementById("player2-sprite");
  const ballImg = document.createElement("img");
  ballImg.src = getBallSprite(ballKey);
  ballImg.style.position = "absolute";
  ballImg.style.left = "50%";
  ballImg.style.top = "60%";
  ballImg.style.width = "48px";
  ballImg.style.height = "48px";
  ballImg.style.transform = "translate(-50%, -50%)";
  ballImg.style.zIndex = 10;
  enemySprite.parentElement.appendChild(ballImg);
  enemySprite.style.animation = "shake 0.7s 2 alternate";
  setTimeout(() => {
    ballImg.remove();
    enemySprite.style.animation = "";
    callback();
  }, 1400);
}

function getBallSprite(ballKey) {
  if (ballKey === "greatball")
    return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png";
  if (ballKey === "ultraball")
    return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png";
  if (ballKey === "masterball")
    return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png";
  return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
}

export function getCatchChance(rarity, ballKey) {
  // rarity: 'common', 'rare', 'legendary'
  // ballKey: 'pokeball', 'greatball', 'ultraball', 'masterball'
  const base =
    {
      common: 0.5,
      rare: 0.15,
      legendary: 0.03,
    }[rarity] || 0.1;
  let bonus = 0;
  if (ballKey === "greatball") bonus = 0.15;
  if (ballKey === "ultraball") bonus = 0.3;
  if (ballKey === "masterball") return 1.0;
  return Math.min(base + bonus, 1.0);
}

export function parseBallCounts(arr) {
  // arr: [pokeball, greatball, ultraball, masterball] or []
  if (!Array.isArray(arr) || arr.length !== 4) return [0, 0, 0, 0];
  return arr.map((x) => parseInt(x, 10) || 0);
}
