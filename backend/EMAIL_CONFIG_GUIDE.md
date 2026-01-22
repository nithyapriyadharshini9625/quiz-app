# Email Configuration - Quick Fix

## The Problem
You're seeing: "Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in backend/.env file"

## ⚠️ Important: Understanding Email Configuration

**Common Confusion:**
- ❌ "Why do I need to give my Gmail password? I just want to send OTP to users!"

**The Answer:**
- The `EMAIL_USER` and `EMAIL_PASSWORD` in `.env` are **NOT** for user accounts
- They are for the **EMAIL SERVICE** that sends emails on behalf of your app
- Think of it as: Your app needs an email account to **SEND** emails FROM
- User emails are the **RECIPIENTS** (who receives the OTP)

**Example:**
- `EMAIL_USER=quizapp.sender@gmail.com` → This is the account that SENDS emails
- User enters `user@gmail.com` → This is who RECEIVES the OTP email
- The backend uses the sender account to send OTP to the user's email

## Solution: Configure Gmail App Password

### Step 1: Get Gmail App Password

1. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)"
   - Name: "Quiz App"
   - Click "Generate"
   - **Copy the 16-character password** (remove spaces if any)

### Step 2: Update backend/.env

Open `quiz-app/backend/.env` and add these lines:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

**Example:**
```env
EMAIL_USER=nithyapriyadharshini9625@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Important:**
- Use your **actual Gmail address**
- Use the **App Password** (not your regular password)
- Remove all spaces from the App Password
- The password should be exactly 16 characters

### Step 3: Restart Backend Server

1. Stop the backend server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   cd quiz-app/backend
   npm start
   ```

### Step 4: Test

Try the "Forgot Password" feature again. You should receive an OTP email.

## Troubleshooting

**Still not working?**
- Check backend console for error messages
- Verify App Password is correct (16 characters, no spaces)
- Make sure 2FA is enabled on Google Account
- Check spam folder for OTP email

**Error: "Authentication failed"**
- You're using regular password instead of App Password
- 2FA is not enabled on your Google Account

**Error: "Connection failed"**
- Check internet connection
- Check firewall settings

