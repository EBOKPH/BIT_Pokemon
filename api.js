// api.js
// Frontend API wrapper — talks only to your backend
// Uses window.API_BASE_URL set from .env CLIENT_URL in deployment
// export const API_BASE_URL = window.API_BASE_URL || "http://localhost:4000";

export const API_BASE_URL =
  window.API_BASE_URL || "https://bit-pokemon-backend.onrender.com";

// ========================
// PAGE BASE URL — Handles both local and GitHub Pages deployment
// ========================
// Strategy:
//   1. If on localhost / 127.0.0.1 → no base prefix needed
//   2. If on GitHub Pages (*.github.io) with a project repo → first path segment is the repo name
//   3. If on a custom domain / user Pages (ebokph.github.io served at root) → no prefix needed
export const PAGE_BASE_URL = (() => {
  const { hostname, pathname } = window.location;

  // Local development — no prefix
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "";
  }

  // GitHub Pages project site: username.github.io/REPO_NAME/...
  // The first path segment will be the repo name (non-empty, not "pages", not a .html file)
  if (hostname.endsWith("github.io")) {
    const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
    // If the first segment looks like a repo name (not a page file), use it as base
    if (firstSegment && !firstSegment.includes(".")) {
      return "/" + firstSegment;
    }
  }

  // Custom domain or user Pages root (e.g. ebokph.github.io served at /)
  return "";
})();

// Helper function to generate correct page links
export function getPageLink(pagePath) {
  // Remove leading slash if present
  const cleanPath = pagePath.startsWith("/") ? pagePath.slice(1) : pagePath;
  return `${PAGE_BASE_URL}/${cleanPath}`;
}

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
      { method: "GET" },
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
      { method: "GET" },
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
    const res = await fetch(
      `${API_BASE_URL}/users/verify?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
      },
    );
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
