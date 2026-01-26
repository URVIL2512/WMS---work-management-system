# Brevo Email Setup Guide

This guide will walk you through setting up Brevo (formerly Sendinblue) for sending password reset emails in your WMS application.

## What is Brevo?

Brevo is an email service provider that offers SMTP services for sending transactional emails. It's free for up to 300 emails per day, making it perfect for development and small applications.

---

## Step 1: Create a Brevo Account

1. **Visit Brevo Website**
   - Go to [https://www.brevo.com](https://www.brevo.com)
   - Click on **"Sign up free"** or **"Get started"**

2. **Sign Up**
   - Enter your email address
   - Create a password
   - Verify your email address through the confirmation email

3. **Complete Your Profile**
   - Fill in your company information (optional but recommended)
   - Verify your account if required

---

## Step 2: Verify Your Sender Email

1. **Go to Senders & IP**
   - Log in to your Brevo account
   - Navigate to **Settings** → **Senders & IP** (or **SMTP & API** → **Senders**)

2. **Add a Sender**
   - Click **"Add a sender"** or **"Create a new sender"**
   - Enter your email address (e.g., `noreply@yourdomain.com` or your personal email)
   - Enter your name (e.g., "WMS System")
   - Click **"Save"**

3. **Verify Your Email**
   - Brevo will send a verification email to the address you provided
   - Open your email inbox
   - Click the verification link in the email from Brevo
   - Your sender email is now verified ✅

**Note:** For production, use a professional email address like `noreply@yourdomain.com`. For development/testing, you can use your personal email.

---

## Step 3: Get Your SMTP Credentials

1. **Navigate to SMTP Settings**
   - In your Brevo dashboard, go to **Settings** → **SMTP & API**
   - Or go to **Settings** → **SMTP & API** → **SMTP**

2. **Find Your SMTP Server Details**
   - **SMTP Server:** `smtp-relay.brevo.com`
   - **Port:** `587` (TLS) or `465` (SSL)
   - **Login:** This is your Brevo account email address
   - **Password:** This is your SMTP key (NOT your account password)

3. **Generate SMTP Key (if needed)**
   - If you don't see an SMTP key, click **"Generate a new key"** or **"Create SMTP key"**
   - Give it a name (e.g., "WMS Application")
   - Copy the generated SMTP key immediately (you won't be able to see it again!)
   - **Important:** Save this key securely - you'll need it for your `.env` file

---

## Step 4: Configure Your .env File

1. **Locate Your .env File**
   - Navigate to the `backend` folder in your project
   - Open or create the `.env` file

2. **Add Brevo Configuration**
   Add the following lines to your `.env` file:

   ```env
   # Brevo SMTP Configuration
   BREVO_SMTP_HOST=smtp-relay.brevo.com
   BREVO_SMTP_PORT=587
   BREVO_SMTP_USER=your-brevo-email@example.com
   BREVO_SMTP_PASS=your-smtp-key-here
   ```

3. **Replace the Placeholders**
   - `BREVO_SMTP_USER`: Replace with your Brevo account email (the one you used to sign up)
   - `BREVO_SMTP_PASS`: Replace with the SMTP key you generated in Step 3
   - Keep `BREVO_SMTP_HOST` and `BREVO_SMTP_PORT` as shown (these are correct)

   **Example:**
   ```env
   BREVO_SMTP_HOST=smtp-relay.brevo.com
   BREVO_SMTP_PORT=587
   BREVO_SMTP_USER=john.doe@example.com
   BREVO_SMTP_PASS=xsmtpib-1234567890abcdefghijklmnopqrstuvwxyz
   ```

---

## Step 5: Restart Your Backend Server

1. **Stop the Server**
   - If your backend server is running, stop it (Ctrl+C in terminal)

2. **Restart the Server**
   ```bash
   cd backend
   npm start
   # or for development
   npm run dev
   ```

3. **Verify Configuration**
   - Check the console output
   - You should NOT see the warning: `⚠️ Email configuration missing...`
   - If you see the warning, double-check your `.env` file

---

## Step 6: Test the Forgot Password Feature

1. **Start Your Application**
   - Make sure both frontend and backend are running
   - Frontend: Usually `http://localhost:5173`
   - Backend: Usually `http://localhost:5000`

2. **Test the Feature**
   - Navigate to the "Forgot Password" page
   - Enter a valid email address (one that exists in your database)
   - Click "Send Reset Link"
   - You should see a success message

3. **Check Your Email**
   - Check the inbox of the email address you entered
   - You should receive a password reset email from Brevo
   - The email should contain a reset link

---

## Troubleshooting

### Issue: "Email service is not configured" Error

**Solution:**
- Check that your `.env` file is in the `backend` folder
- Verify that `BREVO_SMTP_USER` and `BREVO_SMTP_PASS` are set correctly
- Make sure there are no extra spaces or quotes around the values
- Restart your backend server after making changes

### Issue: "Authentication failed" Error

**Solution:**
- Verify your `BREVO_SMTP_USER` is your Brevo account email
- Verify your `BREVO_SMTP_PASS` is the SMTP key (not your account password)
- Make sure you copied the entire SMTP key (they're usually long)

### Issue: "Sender email not verified"

**Solution:**
- Go back to Brevo dashboard → Settings → Senders & IP
- Make sure your sender email is verified (green checkmark)
- If not verified, check your email inbox for the verification link

### Issue: Emails going to Spam

**Solution:**
- Use a professional email address (not a free email like Gmail)
- Verify your sender domain in Brevo
- For production, set up SPF and DKIM records (advanced)

### Issue: "Connection timeout" or "Connection refused"

**Solution:**
- Check your internet connection
- Verify the SMTP host: `smtp-relay.brevo.com`
- Try port `465` instead of `587` (change `secure: false` to `secure: true` in brevoMailer.js if using 465)
- Check if your firewall is blocking the connection

---

## Free Tier Limits

- **300 emails per day** (free tier)
- **Unlimited emails** on paid plans
- Perfect for development and small applications

---

## Security Best Practices

1. **Never commit `.env` file to Git**
   - Your `.env` file should already be in `.gitignore`
   - Never share your SMTP credentials publicly

2. **Use Environment Variables in Production**
   - Use your hosting platform's environment variable settings
   - Never hardcode credentials in your code

3. **Rotate SMTP Keys Regularly**
   - Generate new SMTP keys periodically
   - Revoke old keys that are no longer in use

---

## Additional Resources

- **Brevo Documentation:** [https://developers.brevo.com/docs](https://developers.brevo.com/docs)
- **Brevo SMTP Guide:** [https://help.brevo.com/hc/en-us/articles/209467485](https://help.brevo.com/hc/en-us/articles/209467485)
- **Brevo Support:** Available in your Brevo dashboard

---

## Quick Reference

**Required Environment Variables:**
```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@example.com
BREVO_SMTP_PASS=your-smtp-key
```

**Where to Find SMTP Credentials:**
- Brevo Dashboard → Settings → SMTP & API → SMTP

**Test Email Endpoint:**
- `POST /api/auth/forgot-password`
- Body: `{ "email": "user@example.com" }`

---

## Summary Checklist

- [ ] Created Brevo account
- [ ] Verified sender email address
- [ ] Generated SMTP key
- [ ] Added credentials to `.env` file
- [ ] Restarted backend server
- [ ] Tested forgot password feature
- [ ] Received test email successfully

---

**Need Help?** If you encounter any issues, check the troubleshooting section above or refer to Brevo's official documentation.
