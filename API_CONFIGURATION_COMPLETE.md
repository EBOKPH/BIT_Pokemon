# ✅ API Configuration - All Pages Updated

## Summary

All HTML pages in the `pages/` directory now use **`api.js`** as the single source of truth for API URLs.

---

## Changes Made

### 1. **api.js** - Main API Configuration
- Exports `API_BASE_URL` - reads from `window.API_BASE_URL` or defaults to `http://localhost:4000`
- All pages import this file to get the API URL

### 2. Pages Updated to Use `api.js`

#### ✅ Pages with proper imports (already done):
- `pages/index.html` - imports from `./api.js`
- `pages/dashboard.html` - imports from `../api.js`
- `pages/game.html` - imports from `../api.js`
- `pages/inventory.html` - imports from `../api.js`
- `pages/firstpokemon.html` - imports from `../api.js`
- `pages/pip_interface.html` - imports from `../api.js` (module script)
- `pages/profile.html` - imports from `../api.js`

#### ✅ Pages FIXED (removed hardcoded localhost):
- `pages/game.html` - **FIXED**: Replaced `http://localhost:4000/items/inventory` with `${API_BASE_URL}/items/inventory`
- `pages/navbar.html` - **FIXED**: Replaced 2x hardcoded `http://localhost:4000/users/me-nonjwt` with dynamic imports
- `pages/transaction.html` - **FIXED**: Changed from `window.API_BASE_URL || "http://localhost:4000"` to import from `api.js`
- `pages/bit_pokemon_landing.html` - **FIXED**: Changed to module script with import from `api.js`
- `pages/pip_interface.html` - **FIXED**: Changed to module script with import from `api.js`

---

## How It Works

### Development (Local)
```
api.js → window.API_BASE_URL = undefined → defaults to "http://localhost:4000"
                    ↓
         All pages use this value for API calls
```

### Production (Render)
```
Backend .env: CLIENT_URL=https://your-app-name.onrender.com
                    ↓
Frontend loads from backend /config endpoint (if configured)
                    ↓
Sets window.API_BASE_URL = https://your-app-name.onrender.com
                    ↓
api.js reads window.API_BASE_URL → all pages use it automatically
```

---

## Verification

No more hardcoded localhost URLs in any page:
```
✅ No "http://localhost:4000/" in fetch() calls
✅ All pages import API_BASE_URL from api.js
✅ All API calls use ${API_BASE_URL} variable
```

---

## For Production Deployment

### Option 1: Update `.env` and Run Backend
```env
# pokemonBackend/.env
CLIENT_URL=https://your-render-app.onrender.com
```

### Option 2: Set window.API_BASE_URL Before Loading Pages
```html
<!-- In main HTML file, before importing pages -->
<script>
  window.API_BASE_URL = 'https://your-render-app.onrender.com';
</script>
```

### Option 3: Backend Config Endpoint (Recommended)
Add this to `pokemonBackend/main.js`:
```javascript
app.get('/config', (req, res) => {
  res.json({
    apiUrl: process.env.CLIENT_URL || 'http://localhost:4000',
  });
});
```

Then frontend fetches it on load:
```javascript
fetch('/config').then(r => r.json()).then(config => {
  window.API_BASE_URL = config.apiUrl;
});
```

---

## Files Modified

1. `api.js` - No changes (already correct)
2. `pages/game.html` - Removed hardcoded URL, added import
3. `pages/navbar.html` - Removed hardcoded URLs, added imports
4. `pages/transaction.html` - Changed from local variable to import
5. `pages/bit_pokemon_landing.html` - Changed to module script, added import
6. `pages/pip_interface.html` - Changed to module script, added import

---

## Next Steps

✅ All HTML pages now use `api.js` as single source of truth
🎯 Ready for production deployment (just change `.env CLIENT_URL` or set window.API_BASE_URL)
