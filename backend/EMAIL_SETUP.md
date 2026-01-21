# Email Setup for Forgot Password Feature

## Gmail Setup (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Quiz App" as the name
4. Click "Generate"
5. Copy the 16-character password (you'll use this in .env)

### Step 3: Update .env File
Add these lines to your `backend/.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

## Alternative: Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

### Custom SMTP
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

## Testing Email

After setup, restart your backend server and test the forgot password feature.

## Troubleshooting

**Error: Invalid login credentials**
- Make sure you're using an App Password, not your regular password
- For Gmail, 2FA must be enabled

**Error: Connection timeout**
- Check your firewall settings
- Verify SMTP host and port are correct

**Email not received**
- Check spam folder
- Verify email address is correct
- Check email service logs









