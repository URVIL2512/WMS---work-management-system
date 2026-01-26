# Brevo Email Debugging Guide

## Issues Fixed

### 1. **Route Order Problem** ✅
**Problem:** Express was matching `/:id` before `/:id/send-email`, treating "send-email" as an ID.

**Fix:** Moved specific routes (`/send-email`, `/approve`) BEFORE parameterized route (`/:id`).

### 2. **Missing Logging** ✅
**Problem:** No console output to trace email sending flow.

**Fix:** Added comprehensive logging at every step:
- Route entry
- Quotation fetch
- Email configuration check
- PDF generation
- Email sending
- Success/error responses

### 3. **Transporter Initialization** ✅
**Problem:** Transporter created at module load time, before dotenv might load.

**Fix:** Created `getTransporter()` function that recreates transporter if needed.

### 4. **Error Handling** ✅
**Problem:** Errors were silently caught and passed to error handler.

**Fix:** Added detailed error logging with error codes, commands, and responses.

## Testing Steps

### Step 1: Verify Environment Variables
Check your `.env` file has:
```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@example.com
BREVO_SMTP_PASS=your-smtp-key
```

### Step 2: Check Server Startup Logs
When you start the server, you should see:
```
📧 [BREVO] Configuration check: { hasUser: true, hasPass: true }
📧 [BREVO] Creating transporter with config: { ... }
✅ [BREVO] Transporter verified successfully. Server is ready to send emails.
```

### Step 3: Test Email Configuration Endpoint
```bash
# Test if email is configured correctly
curl http://localhost:5000/api/test-email
```

Expected response if configured:
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "...",
  "response": "250 Message accepted"
}
```

### Step 4: Test Quotation Email Send
1. Create/edit a quotation with an email address
2. Check the "Do you want to send email" checkbox
3. Submit the form
4. Check backend console for logs:
   ```
   📧 [EMAIL] sendQuotationEmail called
   📧 [EMAIL] Request params: { id: '...' }
   📧 [EMAIL] Fetching quotation: ...
   📧 [EMAIL] Quotation found: QT00001/ABC
   📧 [EMAIL] Checking email configuration...
   📧 [EMAIL] Generating PDF...
   📧 [EMAIL] Sending email...
   ✅ [EMAIL] Email sent successfully!
   ```

### Step 5: Check Brevo Dashboard
- Go to Brevo Dashboard → Transactional → Emails
- You should see the sent email with status "Delivered" or "Opened"

## Common Issues & Solutions

### Issue: "Email not configured"
**Solution:** 
- Verify `.env` file is in `backend/` directory
- Check variable names match exactly (case-sensitive)
- Restart server after changing `.env`

### Issue: "Transporter verification failed"
**Solution:**
- Verify SMTP credentials in Brevo dashboard
- Check if SMTP is enabled for your account
- Ensure you're using SMTP key, not API key

### Issue: "Failed to send email" with error code
**Common codes:**
- `EAUTH`: Authentication failed - check username/password
- `ETIMEDOUT`: Connection timeout - check network/firewall
- `ECONNECTION`: Connection refused - check host/port

### Issue: No logs appearing
**Solution:**
- Check if request reaches backend (check Network tab in browser)
- Verify route is correct: `POST /api/quotations/:id/send-email`
- Check if authentication middleware is blocking request

## Route Structure (Fixed)

```javascript
// ✅ CORRECT ORDER (specific routes first)
router.route('/:id/send-email').post(sendQuotationEmail);
router.route('/:id/approve').put(approveQuotation);
router.route('/:id').get(getQuotation).put(updateQuotation).delete(deleteQuotation);

// ❌ WRONG ORDER (would match /:id first)
router.route('/:id').get(getQuotation);
router.route('/:id/send-email').post(sendQuotationEmail); // Never reached!
```

## Debugging Checklist

- [ ] Environment variables loaded (check server startup logs)
- [ ] Transporter verified successfully (check server startup logs)
- [ ] Route order correct (specific routes before `/:id`)
- [ ] Frontend API call reaches backend (check Network tab)
- [ ] Authentication token valid (check request headers)
- [ ] Quotation has email address
- [ ] PDF generation succeeds (check logs)
- [ ] SMTP credentials correct (test with `/api/test-email`)
- [ ] Brevo account has SMTP enabled
- [ ] No firewall blocking port 587

## Next Steps

1. Restart your backend server
2. Check startup logs for transporter verification
3. Test with `/api/test-email` endpoint
4. Try sending a quotation email
5. Check console logs for detailed error messages
6. Verify email appears in Brevo dashboard
