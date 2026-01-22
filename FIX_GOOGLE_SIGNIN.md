# Fix Google Sign-In "unregistered_origin" Error

## Quick Checklist

### ✅ Step 1: Verify Google Cloud Console Configuration

1. **Go to OAuth Client Settings:**
   - https://console.cloud.google.com/apis/credentials?project=quiz-app-482818
   - Click on your OAuth client: `299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7`

2. **Check "Authorized JavaScript origins":**
   - Must have exactly: `http://localhost:3000`
   - ❌ No trailing slash: `http://localhost:3000/`
   - ❌ No https: `https://localhost:3000`
   - ❌ No 127.0.0.1: `http://127.0.0.1:3000`

3. **Click "SAVE"** (even if nothing changed)

### ✅ Step 2: Verify OAuth Consent Screen

1. **Go to:** https://console.cloud.google.com/apis/credentials/consent?project=quiz-app-482818

2. **Check:**
   - Publishing status: **"Testing"** (not "In production")
   - Test users: Your email must be listed

3. **Click "SAVE"**

### ✅ Step 3: Verify Frontend .env

Open `quiz-app/frontend/.env` and verify:

```env
REACT_APP_GOOGLE_CLIENT_ID=299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7.apps.googleusercontent.com
```

**Important:**
- No spaces around `=`
- No quotes
- Exact Client ID match

### ✅ Step 4: Restart Frontend Server

```bash
cd quiz-app/frontend
# Stop server (Ctrl+C)
npm start
```

### ✅ Step 5: Clear Browser Cache

1. **Hard refresh:** Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Or use Incognito:** Open a new Incognito/Private window
3. Go to: `http://localhost:3000/login`

### ✅ Step 6: Wait for Propagation

Google Cloud changes can take **5-10 minutes** to propagate. If you just made changes, wait a few minutes and try again.

## Still Not Working?

### Force Refresh Configuration

1. In Google Cloud Console, **remove** `http://localhost:3000` from Authorized JavaScript origins
2. Click **"SAVE"**
3. Wait 10 seconds
4. **Add** `http://localhost:3000` back
5. Click **"SAVE"**
6. Wait 5-10 minutes
7. Test again

### Check Browser Console

1. Open browser console (F12)
2. Go to Console tab
3. Try Google Sign-In
4. Look for error messages
5. Share the exact error if it persists

### Verify Client ID Match

Make sure the Client ID in:
- Google Cloud Console
- Frontend `.env` file
- Browser console logs

All three should match exactly: `299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7.apps.googleusercontent.com`

## Common Issues

**Error: "unregistered_origin"**
- Origin not added or format is wrong
- Changes haven't propagated yet (wait 5-10 minutes)

**Error: "403 Forbidden"**
- OAuth consent screen not in Testing mode
- Your email not in Test users list

**Error: "Access blocked"**
- OAuth consent screen in Production mode (should be Testing)
- Email not in Test users

## Test Steps

1. Open: `http://localhost:3000/login`
2. Click "Continue with Google"
3. Check browser console (F12) for any errors
4. If error persists, share the exact error message

