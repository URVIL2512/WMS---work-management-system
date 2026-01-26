# Quick Fix: Email Service Error

## The Error
You're seeing: **"Email service is not configured. Please contact administrator."**

This happens because Brevo email credentials are missing from your `.env` file.

---

## Quick Solution (3 Steps)

### Step 1: Check Your Current Configuration
Run this command in your `backend` folder:
```bash
npm run check:email
```

This will show you exactly what's missing.

### Step 2: Add Brevo Credentials to `.env`

1. **Open** `backend/.env` file

2. **Add these lines** (replace with your actual Brevo credentials):
   ```env
   BREVO_SMTP_HOST=smtp-relay.brevo.com
   BREVO_SMTP_PORT=587
   BREVO_SMTP_USER=your-brevo-email@example.com
   BREVO_SMTP_PASS=your-smtp-key-here
   ```

3. **Get Brevo Credentials** (if you don't have them):
   - Go to https://www.brevo.com and sign up (free)
   - Go to **Settings** → **SMTP & API** → **SMTP**
   - Copy your SMTP login (email) and generate/copy your SMTP key
   - See `BREVO_SETUP_GUIDE.md` for detailed steps

### Step 3: Restart Your Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
# or
npm run dev
```

---

## Verify It's Working

1. Run the check command again:
   ```bash
   npm run check:email
   ```
   You should see ✅ for all items.

2. Test the forgot password feature:
   - Go to the forgot password page
   - Enter an email
   - You should see a success message (not an error)

---

## Still Having Issues?

1. **Make sure `.env` file is in the `backend` folder** (not root folder)
2. **No extra spaces or quotes** around values in `.env`
3. **Restart server** after changing `.env`
4. **Check server console** for warning messages

For detailed setup instructions, see `BREVO_SETUP_GUIDE.md`
