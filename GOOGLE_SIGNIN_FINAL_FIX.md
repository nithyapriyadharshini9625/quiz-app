# Google Sign-In Final Fix - Step by Step

## Current Error
- ❌ "The given origin is not allowed for the given client ID"
- ❌ "unregistered_origin"
- ✅ Client ID is correct: `299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7.apps.googleusercontent.com`
- ✅ Origin is correct: `http://localhost:3000`

## Solution: Force Re-register the Origin

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/apis/credentials?project=quiz-app-482818
2. Make sure you're signed in with the correct Google account

### Step 2: Find Your OAuth Client

1. Look for "OAuth 2.0 Client IDs" section
2. Find the client with ID: `299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7`
3. **Click on the NAME** (not the edit icon) to open it

### Step 3: Remove and Re-add Origin

1. In "Authorized JavaScript origins" section:
   - If `http://localhost:3000` exists, click the **X** to remove it
   - Click **"SAVE"** at the bottom
   - Wait 10 seconds

2. Add it back:
   - Click **"+ ADD URI"**
   - Type exactly: `http://localhost:3000` (manually type it, don't copy-paste)
   - Make sure:
     - Starts with `http://` (not `https://`)
     - No trailing slash
     - No spaces before or after
     - Uses `localhost` (not `127.0.0.1`)
   - Click **"SAVE"**

### Step 4: Verify OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=quiz-app-482818
2. Check:
   - Publishing status: **"Testing"**
   - Your email is in "Test users"
3. Click **"SAVE"** (even if nothing changed)

### Step 5: Wait and Test

1. **Wait 10-15 minutes** for changes to propagate
2. **Close all browser tabs** with `localhost:3000`
3. **Open a new Incognito/Private window**
4. Go to: `http://localhost:3000/login`
5. Try Google Sign-In

## Alternative: Check for Multiple OAuth Clients

If it still doesn't work, you might have multiple OAuth clients:

1. In Google Cloud Console → Credentials
2. Check ALL "OAuth 2.0 Client IDs"
3. Make sure you're editing the one with Client ID: `299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7`
4. If you have multiple, either:
   - Delete the unused ones, OR
   - Add `http://localhost:3000` to all of them

## Still Not Working?

### Check These:

1. **Verify you're in the correct Google Cloud project:**
   - Project name should be: "Quiz App"
   - Project ID: `quiz-app-482818`

2. **Verify the Client ID in frontend/.env matches exactly:**
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7.apps.googleusercontent.com
   ```

3. **Try a different browser:**
   - Test in Firefox or Edge
   - Sometimes Chrome cache is persistent

4. **Check if you're using a VPN:**
   - VPNs can sometimes interfere with Google services
   - Try disabling VPN temporarily

## Last Resort: Create New OAuth Client

If nothing works, create a fresh OAuth client:

1. Go to: https://console.cloud.google.com/apis/credentials?project=quiz-app-482818
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: "Quiz App Web Client 2"
5. Authorized JavaScript origins: `http://localhost:3000`
6. Click **"CREATE"**
7. Copy the NEW Client ID
8. Update `frontend/.env` with the new Client ID
9. Restart frontend server
10. Test again

