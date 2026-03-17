// api.js
// Frontend API wrapper — talks only to your backend

export const API_BASE_URL = "http://localhost:4000"; // change if deployed

// ========================
// USERS
// ========================

// Register a new user
export async function registerUser({
  ign,
  email,
  password,
  birthDate,
  pronouns,
  firstName,
  lastName,
  phone,
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ign,
        email,
        password,
        birthDate,
        pronouns,
        firstName,
        lastName,
        phone,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Registration failed:", err);
    return { success: false, message: "Registration failed" };
  }
}

// Check if IGN is already taken (real-time)
// Your backend should expose: GET /users/check-ign?ign=<value>
// Response: { taken: true | false }
export async function checkIGN(ign) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/users/check-ign?ign=${encodeURIComponent(ign)}`,
      { method: "GET" }
    );
    return await res.json();
  } catch (err) {
    console.error("IGN check failed:", err);
    return { taken: false }; // fail open so user can still attempt register
  }
}

// Check if email is already registered (real-time)
// Your backend should expose: GET /users/check-email?email=<value>
// Response: { taken: true | false }
export async function checkEmail(email) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/users/check-email?email=${encodeURIComponent(email)}`,
      { method: "GET" }
    );
    return await res.json();
  } catch (err) {
    console.error("Email check failed:", err);
    return { taken: false }; // fail open
  }
}

// Verify email
export async function verifyEmail(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/verify/${token}`, {
      method: "GET",
    });
    return await res.json();
  } catch (err) {
    console.error("Email verification failed:", err);
    return { success: false, message: "Verification failed" };
  }
}

// Login user
export async function loginUser({ email, password }) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err) {
    console.error("Login failed:", err);
    return { success: false, message: "Login failed" };
  }
}
