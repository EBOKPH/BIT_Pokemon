# 🚨 DEPLOYMENT SECURITY SCAN - HARDCODED URLs & CONFIGURATION ISSUES

**Generated:** March 24, 2026  
**Status:** ⛔ CRITICAL - Multiple hardcoded URLs found  
**Action Required:** Fix before production deployment

---

## SUMMARY

Found **8+ files** with hardcoded `localhost:4000` URLs and local redirect URLs that MUST be changed before deploying to production.

---

## CRITICAL ISSUES

### 1. ⛔ Backend .env File - HARDCODED LOCALHOST

**File:** `pokemonBackend/.env` (Lines 7-8)

```env
CLIENT_URL=http://localhost:4000
CLIENT_URL_REDIRECT=http://127.0.0.1:5500
```

**Issue:**

- `CLIENT_URL` is hardcoded to development localhost
- `CLIENT_URL_REDIRECT` is hardcoded to local port 5500 (Live Server)
- These need to be environment variables for production

**Fix:** Update to production URLs before deployment

---

### 2. ⛔ Main API Configuration - HARDCODED EXPORT

**File:** `api.js` (Line 4)

```javascript
export const API_BASE_URL = "http://localhost:4000"; // change if deployed
```

**Issue:**

- Default API endpoint is hardcoded to localhost
- Comment indicates awareness but not implemented
- All API calls depend on this value

**Impact:** All frontend API requests will fail in production

**Fix:** Make this environment-aware:

```javascript
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.VUE_APP_API_URL ||
  window.API_BASE_URL ||
  "http://localhost:4000";
```

---

### 3. ⛔ Transaction Page - HARDCODED LOCALHOST (4 instances)

**File:** `pages/transaction.html`

**Lines with hardcoded URLs:**

- Line 167: `fetch("http://localhost:4000/users/wallet", ...)`
- Line 234: `fetch("http://localhost:4000/users/me", ...)`
- Line 270: `fetch('http://localhost:4000/users/me?user_id=${user_id}', ...)`
- Line 299: `fetch('http://localhost:4000/users/me-nonjwt?user_id=${user_id}', ...)`

**Issue:** Direct hardcoded URLs instead of using API_BASE_URL variable

**Fix:** Replace all with variable reference:

```javascript
const API_BASE_URL = window.API_BASE_URL || "http://localhost:4000"; // At top
fetch(`${API_BASE_URL}/users/wallet`, ...) // In code
```

---

### 4. ⛔ FirstPokemon Page - HARDCODED FALLBACK

**File:** `pages/firstpokemon.html` (Line 469)

```javascript
let API_BASE_URL = "http://localhost:4000";
```

**Issue:** Hardcoded fallback even if api.js import fails

**Fix:** Make it configurable:

```javascript
let API_BASE_URL =
  window.API_BASE_URL || process.env.API_BASE_URL || "http://localhost:4000";
```

---

### 5. ⛔ Pip Interface Page - HARDCODED FALLBACK

**File:** `pages/pip_interface.html` (Line 1379)

```javascript
const API_BASE_URL = window.API_BASE_URL || "http://localhost:4000";
```

**Issue:** Hardcoded localhost fallback

**Fix:** Same as above - needs environment variable support

---

### 6. ⛔ Bit Pokemon Landing Page - HARDCODED FALLBACK

**File:** `pages/bit_pokemon_landing.html` (Line 686)

```javascript
const API_BASE_URL = window.API_BASE_URL || "http://localhost:4000";
```

**Issue:** Hardcoded localhost fallback

**Fix:** Environment-aware URL resolution

---

### 7. ⚠️ Shop Page - HARDCODED INVENTORY DATA

**File:** `pages/shop.html` (Line 1139)

```html
<div class="section-badge">HARDCODED INVENTORY</div>
```

**Issue:** Comment indicates hardcoded inventory data (likely test/development data)

**Fix:** Verify real data is being fetched from API, not hardcoded

---

### 8. 📋 Index.html - API_BASE_URL Import

**File:** `index.html` (Lines 1690, 2064)

```javascript
import { API_BASE_URL } from "./api.js";
fetch(`${API_BASE_URL}/users/login`, ...)
```

**Status:** ✅ Properly using import (depends on fixing api.js)

---

## ADDITIONAL FILES WITH LOCALHOST REFERENCES

### Development Files (Not Critical for Production)

These are in `/oldcodes/` and `/TRASH/` folders but should still be aware:

- `oldcodes/indexold.html` - Old index file with hardcoded API
- `oldcodes/indexold2.html` - Old index file with hardcoded API
- `oldcodes/indexup2.html` - Old index file with hardcoded API
- `assets/js/TRASH/backpack-api.js` - Trash file
- `assets/js/TRASH/shop-api.js` - Trash file

**Recommendation:** Clean up these files or add to `.gitignore` before deployment

---

## ENVIRONMENT VARIABLES NOT FOUND

The following should be available in production but are missing:

```bash
# Backend (.env needed in production)
SUPABASE_URL=<production-url>
SUPABASE_KEY=<production-key>
CLIENT_URL=<front-end-production-url>
CLIENT_URL_REDIRECT=<front-end-production-redirect>
PORT=<production-port>

# Frontend (need to set these)
REACT_APP_API_URL=<backend-api-url>  # or similar
VUE_APP_API_URL=<backend-api-url>
```

---

## DEPLOYMENT CHECKLIST

- [ ] **Backend:**
  - [ ] Update `pokemonBackend/.env` with production URLs
  - [ ] Set `CLIENT_URL` to your production frontend domain
  - [ ] Set `CLIENT_URL_REDIRECT` to your production frontend domain
  - [ ] Update `SUPABASE_URL` and `SUPABASE_KEY` to production values
  - [ ] Set `PORT` appropriately for your host

- [ ] **Frontend:**
  - [ ] Update `api.js` to use environment-aware API URL resolution
  - [ ] Update `pages/transaction.html` to use API_BASE_URL variable
  - [ ] Update `pages/firstpokemon.html` hardcoded URL
  - [ ] Update `pages/pip_interface.html` hardcoded URL
  - [ ] Update `pages/bit_pokemon_landing.html` hardcoded URL
  - [ ] Clean up `/oldcodes/` files or add to `.gitignore`
  - [ ] Clean up `/assets/js/TRASH/` folder

- [ ] **Verification:**
  - [ ] Test all API endpoints work with production URL
  - [ ] Verify wallet endpoints don't use localhost
  - [ ] Check transaction.html wallet operations
  - [ ] Test user authentication flows
  - [ ] Verify no console errors about localhost

---

## EXTERNAL APIs (Safe - Third Party)

These are external APIs and are safe to keep:

✅ `https://pokeapi.co/api/v2/` - Pokemon API (multiple files)  
✅ `https://cdn.jsdelivr.net/` - CDN for ethers.js  
✅ `https://fonts.googleapis.com/` - Google Fonts (multiple files)  
✅ `https://raw.githubusercontent.com/PokeAPI/` - Pokemon sprites (multiple files)

---

## RECOMMENDED FIXES

### Short Term (Before Deployment)

1. Set environment variables in your deployment platform (Vercel, Render, Azure, etc.)
2. Update api.js to read from environment
3. Replace hardcoded URLs in HTML files

### Long Term (Better Practice)

1. Create a centralized config file for all environment-specific settings
2. Use build-time environment variable substitution
3. Consider using a `.env.production` for seamless deployment
4. Add pre-deployment verification script to catch localhost references

---

## FILES TO UPDATE

| File                             | Issue                       | Lines              | Priority    |
| -------------------------------- | --------------------------- | ------------------ | ----------- |
| `api.js`                         | Hardcoded localhost export  | 4                  | 🔴 CRITICAL |
| `pokemonBackend/.env`            | Hardcoded URLs              | 7-8                | 🔴 CRITICAL |
| `pages/transaction.html`         | 4x hardcoded URLs           | 167, 234, 270, 299 | 🔴 CRITICAL |
| `pages/firstpokemon.html`        | Hardcoded fallback          | 469                | 🟠 HIGH     |
| `pages/pip_interface.html`       | Hardcoded fallback          | 1379               | 🟠 HIGH     |
| `pages/bit_pokemon_landing.html` | Hardcoded fallback          | 686                | 🟠 HIGH     |
| `pages/shop.html`                | Hardcoded inventory comment | 1139               | 🟡 MEDIUM   |

---

## EXAMPLE PRODUCTION SETUP

### For Backend Deployment (e.g., Render, Railway, Azure)

Create `pokemonBackend/.env.production`:

```env
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://your-production-supabase-url.supabase.co
SUPABASE_KEY=your-production-key
CLIENT_URL=https://yourdomain.com
CLIENT_URL_REDIRECT=https://yourdomain.com
EMAIL_USER=your-prod-email@domain.com
EMAIL_PASS=your-app-password
```

### For Frontend Deployment (e.g., Vercel, Netlify)

Create `.env.production.local` or set in deployment dashboard:

```env
REACT_APP_API_URL=https://your-api-subdomain.yourdomain.com
# or
VUE_APP_API_URL=https://your-api-subdomain.yourdomain.com
```

---

**Created:** March 24, 2026  
**Next Action:** Update files and re-scan before deployment
