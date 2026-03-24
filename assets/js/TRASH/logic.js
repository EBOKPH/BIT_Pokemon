// assets/js/logic.js
// All Pokémon battle logic: HP, EXP, attack list, and battle actions

export const state = {
  player1: {
    name: "",
    level: 1,
    exp: 0,
    expToNext: 10,
    maxHP: 100,
    hp: 100,
    moves: [],
    sprite: "",
  },
  player2: {
    name: "",
    maxHP: 100,
    hp: 100,
    moves: [],
    sprite: "",
  },
  battleStarted: false,
};

export function updatePlayer1UI() {
  document.getElementById("player1-name").textContent = state.player1.name;
  document.getElementById("player1-hp").textContent = `HP: ${state.player1.hp}`;
  document.getElementById("player1-level-exp").textContent =
    `Lv. ${state.player1.level} | EXP: ${state.player1.exp}/${state.player1.expToNext}`;
  document.getElementById("player1-sprite").src = state.player1.sprite;
  document.getElementById("player1-moves").innerHTML = state.player1.moves
    .length
    ? state.player1.moves
        .map((m) => `<div>${m.name}${m.power ? ` (${m.power})` : ""}</div>`)
        .join("")
    : '<span style="color:#aaa">No moves</span>';
}

export function updatePlayer2UI() {
  document.getElementById("player2-name").textContent = state.player2.name;
  document.getElementById("player2-hp").textContent = `HP: ${state.player2.hp}`;
  document.getElementById("player2-sprite").src = state.player2.sprite;
  document.getElementById("player2-moves").innerHTML = state.player2.moves
    .length
    ? state.player2.moves
        .map((m) => `<div>${m.name}${m.power ? ` (${m.power})` : ""}</div>`)
        .join("")
    : '<span style="color:#aaa">No moves</span>';
}

export function showMoveButtons() {
  const attackButtons = document.getElementById("attack-buttons");
  attackButtons.innerHTML = "";
  attackButtons.style.display = "flex";
  state.player1.moves.forEach((move) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-attack";
    btn.textContent = move.name + (move.power ? ` (${move.power})` : "");
    btn.onclick = () => attackWithMove(move);
    attackButtons.appendChild(btn);
  });
}

export function hideMoveButtons() {
  document.getElementById("attack-buttons").style.display = "none";
}

export function startBattle() {
  document.getElementById("encounter-actions").style.display = "none";
  document.getElementById("battle-log").style.display = "block";
  showMoveButtons();
  state.battleStarted = true;
}

export function endBattle() {
  hideMoveButtons();
  state.battleStarted = false;
}

export function gainExp(expGain) {
  state.player1.exp += expGain;
  document.getElementById("battle-log").innerHTML +=
    `<p>${state.player1.name} gained ${expGain} EXP!</p>`;
  while (state.player1.exp >= state.player1.expToNext) {
    state.player1.exp -= state.player1.expToNext;
    state.player1.level++;
    state.player1.expToNext = 10 * state.player1.level;
    state.player1.maxHP += 5;
    state.player1.hp = state.player1.maxHP;
    document.getElementById("battle-log").innerHTML +=
      `<p>${state.player1.name} leveled up! Now Lv. ${state.player1.level}!</p>`;
  }
  updatePlayer1UI();
}

export function checkWinner() {
  if (state.player1.hp <= 0) {
    document.getElementById("battle-log").innerHTML +=
      `<p>${state.player2.name} wins!</p>`;
    endBattle();
  } else if (state.player2.hp <= 0) {
    document.getElementById("battle-log").innerHTML += `<p>You win!</p>`;
    endBattle();
    let expGain = Math.round(10 + state.player2.maxHP / 10);
    gainExp(expGain);
  }
}

export async function attackWithMove(move) {
  if (!state.battleStarted) return;
  const dmg = move.power || 10;
  state.player2.hp -= dmg;
  if (state.player2.hp < 0) state.player2.hp = 0;
  updatePlayer2UI();
  document.getElementById("battle-log").innerHTML +=
    `<p>${state.player1.name} used ${move.name}! It dealt ${dmg} damage to ${state.player2.name}.</p>`;
  document.getElementById("battle-log").scrollTop =
    document.getElementById("battle-log").scrollHeight;
  checkWinner();
  if (state.player2.hp > 0 && state.player2.moves.length > 0) {
    setTimeout(() => {
      const enemyMove =
        state.player2.moves[
          Math.floor(Math.random() * state.player2.moves.length)
        ];
      const enemyDmg = enemyMove.power || 10;
      state.player1.hp -= enemyDmg;
      if (state.player1.hp < 0) state.player1.hp = 0;
      updatePlayer1UI();
      document.getElementById("battle-log").innerHTML +=
        `<p>${state.player2.name} used ${enemyMove.name}! It dealt ${enemyDmg} damage to ${state.player1.name}.</p>`;
      document.getElementById("battle-log").scrollTop =
        document.getElementById("battle-log").scrollHeight;
      checkWinner();
    }, 900);
  }
}
