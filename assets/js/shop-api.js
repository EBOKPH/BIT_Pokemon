// shop-api.js
// Frontend API for shop actions (buy pokeball, buy pokemon, get WPC)
import { API_BASE_URL } from "../../api.js";

export async function buyPokeball(user_id, type, quantity, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${user_id}/buy/pokeball`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, quantity }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Failed to buy pokeball" };
  }
}

export async function buyPokemon(user_id, pokemon, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${user_id}/buy/pokemon`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pokemon }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Failed to buy pokemon" };
  }
}

export async function getWPC(user_id, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${user_id}/wpc`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    return { success: false, wpc: 0 };
  }
}
