# URGENT: Google Sign-In Fix - Find JavaScript Origins

## ⚠️ CRITICAL: You're Looking at the WRONG Section!

You're currently viewing **"Authorized redirect URIs"** but you need **"Authorized JavaScript origins"**!

These are TWO DIFFERENT settings:
- ❌ **Authorized redirect URIs** = For OAuth redirect flow (not what you need)
- ✅ **Authorized JavaScript origins** = For Google Sign-In button (what you need!)

## Step-by-Step: Find JavaScript Origins

### Step 1: Go to the Correct Page

1. You're currently on: "Client ID for Web application" page
2. Look at the LEFT SIDEBAR - you should see "Clients" highlighted
3. Scroll UP on the same page to find **"Authorized JavaScript origins"** section
4. It should be ABOVE the "Authorized redirect URIs" section

### Step 2: If You Don't See It

The page might be scrolled down. Look for:

1. **Scroll UP** on the page - "Authorized JavaScript origins" is usually at the top
2. Look for a section that says: **"Authorized JavaScript origins"**
3. It should say: "For use with requests from a browser"

### Step 3: Add the Origin

1. In **"Authorized JavaScript origins"** section:
   - Click **"+ ADD URI"**
   - Type exactly: `http://localhost:3000`
   - Make sure:
     - `http://` (not `https://`)
     - No trailing slash
     - No spaces
     - `localhost` (not `127.0.0.1`)
2. Click **"SAVE"** at the bottom of the page

### Step 4: Verify Both Sections

You should have BOTH:

1. **Authorized JavaScript origins:**
   - `http://localhost:3000` ✅

2. **Authorized redirect URIs:**
   - `http://localhost:3000/auth/google/callback` ✅ (you already have this)

### Step 5: Wait and Test

1. Wait 10-15 minutes for changes to propagate
2. Close all browser tabs
3. Open Incognito window
4. Test Google Sign-In

## Visual Guide

The page structure should look like this:

```
Client ID for Web application
├── Name: Quiz App Web Client
├── Authorized JavaScript origins  ← YOU NEED THIS!
│   └── http://localhost:3000
└── Authorized redirect URIs       ← You already have this
    └── http://localhost:3000/auth/google/callback
```

## Still Can't Find It?

1. Make sure you're on the correct OAuth client page
2. The URL should be: `console.cloud.google.com/auth/clients/299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7...`
3. Scroll to the TOP of the page
4. Look for "Authorized JavaScript origins" - it's usually the FIRST section after the name

## Alternative: Check URL

If you can't find it, the page might be showing a different view. Try:

1. Go back to: https://console.cloud.google.com/apis/credentials?project=quiz-app-482818
2. Click on your OAuth client NAME (not edit icon)
3. You should see BOTH sections on the same page

