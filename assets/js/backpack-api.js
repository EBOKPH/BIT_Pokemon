import { API_BASE_URL } from "../../api.js";

// Fetch new pokeball columns from profiles table
export async function getUserBallCounts(user_id, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${user_id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (result.success && result.data) {
      // Return only the relevant columns
      return {
        pokeball: result.data.pokeball ?? 0,
        greatball: result.data.greatball ?? 0,
        ultraball: result.data.ultraball ?? 0,
        masterball: result.data.masterball ?? 0,
      };
    }
    return { pokeball: 0, greatball: 0, ultraball: 0, masterball: 0 };
  } catch (err) {
    console.error("Fetching ball counts failed:", err);
    return { pokeball: 0, greatball: 0, ultraball: 0, masterball: 0 };
  }
}
