# Quick Email Setup Guide

## Problem: OTP emails are not being sent

The `.env` file is missing email configuration. Follow these steps:

## Step 1: Set up Gmail App Password

1. **Enable 2-Factor Authentication** on your Google Account:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Quiz App" as the name
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

## Step 2: Update .env File

Open `quiz-app/backend/.env` and replace these lines:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Example:**
```env
EMAIL_USER=nithyapriyadharshini9625@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

**Important Notes:**
- Use your **actual Gmail address** for `EMAIL_USER`
- Use the **16-character App Password** (not your regular Gmail password)
- Remove spaces from the App Password if it has any
- The App Password should be 16 characters without spaces

## Step 3: Restart Backend Server

After updating `.env`:
1. Stop your backend server (Ctrl+C)
2. Start it again: `npm start`

## Step 4: Test

Try the "Forgot Password" feature again. The OTP should now be sent to your email.

## Troubleshooting

**Still not working?**
1. Check the backend console for error messages
2. Verify the App Password is correct (no spaces, 16 characters)
3. Make sure 2FA is enabled on your Google Account
4. Check your spam folder for the OTP email

**Error: "Authentication failed"**
- Make sure you're using an App Password, not your regular password
- Verify 2FA is enabled on your Google Account

**Error: "Connection failed"**
- Check your internet connection
- Verify firewall isn't blocking the connection









