// Placeholder for Supabase/Backend API for user_pokemon
// This file will be used to add and get user_pokemon for the dashboard and firstpokemon logic

import { API_BASE_URL } from "../../api.js";

export async function getUserPokemon(user_id, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${user_id}/pokemon`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.error("Fetching user_pokemon failed:", err);
    return {
      success: false,
      data: [],
      message: "Failed to fetch user_pokemon",
    };
  }
}

export async function addUserPokemon(user_id, pokemon, token, backpack_items) {
  try {
    const body = { pokemon };
    if (backpack_items) body.backpack_items = backpack_items;
    const res = await fetch(`${API_BASE_URL}/users/${user_id}/pokemon`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error("Adding user_pokemon failed:", err);
    return { success: false, message: "Failed to add user_pokemon" };
  }
}
