# Production Deployment Checklist

## ✅ What's Working Now (Testing Complete)

- [x] WhatsApp conversation via Twilio sandbox
- [x] Claude AI assistant handles bookings naturally
- [x] Availability checking (8 AM - 5 PM, Mon-Sat)
- [x] 15-minute payment timeout for slots
- [x] 24-hour conversation expiry
- [x] Manual restart keywords (restart, cancel, start over)
- [x] Paystack test payment integration
- [x] Professional tone (no emojis)
- [x] Automatic expired booking cleanup
- [x] Payment confirmation webhooks

---

## 🚀 Before Going to Production

### 1. Twilio Setup (Required for Production)
Currently using **Twilio Sandbox** which has limitations:
- ❌ Can only reply within 24 hours of user message
- ❌ Cannot send proactive messages
- ✅ **Solution**: Apply for Twilio WhatsApp Business Account

**Steps:**
1. Go to [Twilio WhatsApp Business](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Apply for a WhatsApp Business Profile
3. Follow verification process (2-3 days)
4. Update `TWILIO_WHATSAPP_NUMBER` in `.env`

---

### 2. Paystack Production Keys
Currently using **test keys**:
- Switch from `sk_test_...` to `sk_live_...`
- Switch from `pk_test_...` to `pk_live_...`

**Steps:**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com/settings/developer)
2. Switch to "Live Mode"
3. Copy Live Secret Key → Update `.env`
4. Copy Live Public Key → Update `.env`

---

### 3. Re-enable Webhook Signature Validation
Currently **disabled for testing** in [paystack.js](server/src/routes/paystack.js#L97):

```javascript
// TEMPORARY: Skip signature validation for testing
// TODO: Re-enable this in production after confirming webhook setup
/*
const isValid = validatePaystackWebhook(rawBody, signature);
if (!isValid) {
  ...
}
*/
```

**Action**: Uncomment this block to enable security in production.

---

### 4. Deploy to Production Server
Currently running on **localhost + ngrok** (not suitable for production).

**Options:**

#### Option A: Heroku (Easy, Free tier available)
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
cd server
heroku create your-salon-booking

# Add environment variables
heroku config:set ANTHROPIC_API_KEY=sk-ant-...
heroku config:set TWILIO_ACCOUNT_SID=AC...
heroku config:set TWILIO_AUTH_TOKEN=...
heroku config:set TWILIO_WHATSAPP_NUMBER=whatsapp:+...
heroku config:set SUPABASE_URL=https://...
heroku config:set SUPABASE_ANON_KEY=eyJh...
heroku config:set PAYSTACK_SECRET_KEY=sk_live_...
heroku config:set PAYSTACK_PUBLIC_KEY=pk_live_...
heroku config:set SERVER_URL=https://your-salon-booking.herokuapp.com

# Deploy
git push heroku main
```

#### Option B: Railway.app (Modern, Easy)
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Add environment variables
4. Deploy automatically

#### Option C: DigitalOcean / AWS / Azure
- More control, requires server management
- Set up PM2 for process management
- Configure nginx as reverse proxy
- Set up SSL certificates

---

### 5. Update Webhook URLs
Once deployed, update webhooks in:

**Paystack Dashboard:**
- Webhook URL: `https://your-domain.com/webhook/paystack-webhook`

**Twilio Console:**
- WhatsApp Webhook: `https://your-domain.com/webhook/whatsapp`

---

### 6. Database Backup Strategy
Currently using Supabase free tier:
- ✅ Automatic backups included
- ✅ Point-in-time recovery (7 days on free tier)
- Consider upgrading to Pro for 30-day backups

---

### 7. Monitoring & Logging (Optional but Recommended)

Add monitoring service:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Uptime Robot** for uptime monitoring

---

## 📋 Environment Variables Checklist

Ensure all `.env` variables are set in production:

```bash
# Required for production
ANTHROPIC_API_KEY=sk-ant-api03-...  # Claude AI
TWILIO_ACCOUNT_SID=AC...            # Twilio
TWILIO_AUTH_TOKEN=...               # Twilio
TWILIO_WHATSAPP_NUMBER=whatsapp:+... # Your approved WhatsApp number
SUPABASE_URL=https://...            # Supabase project URL
SUPABASE_ANON_KEY=eyJh...           # Supabase public key
PAYSTACK_SECRET_KEY=sk_live_...     # Paystack LIVE key (not test)
PAYSTACK_PUBLIC_KEY=pk_live_...     # Paystack LIVE key (not test)
SERVER_URL=https://your-domain.com  # Your production URL
PORT=3000                           # Server port
```

---

## 🧪 Final Testing Steps

Before going live:

1. **Test with real phone number** (not sandbox)
2. **Make a real R10 booking** (use live Paystack keys)
3. **Verify WhatsApp confirmation** arrives after payment
4. **Test restart/cancel** keywords
5. **Test 15-minute timeout** (book, don't pay, wait 15 mins, try to book same slot)
6. **Test multiple concurrent users**

---

## 🛡️ Security Recommendations

1. **Never commit `.env` file** (already in `.gitignore` ✅)
2. **Rotate API keys quarterly**
3. **Enable Paystack webhook signature validation** (currently disabled)
4. **Add rate limiting** (optional, but recommended)
5. **Monitor for suspicious activity**

---

## 📱 Salon Owner Dashboard (Future)

Currently there's no web dashboard. Consider building:
- View all bookings by date
- Cancel/reschedule bookings
- View client history
- Download reports

Tech stack suggestion: React + Supabase Auth

---

## 💰 Cost Breakdown (Monthly Estimates)

**Free Tier (Testing):**
- Supabase: Free (up to 500 MB database)
- Twilio Sandbox: Free
- Paystack: Free (just transaction fees)
- Anthropic Claude: Pay per use (~R50-200/month for low volume)

**Production (Small Salon):**
- Supabase: Free or $25/month (Pro)
- Twilio WhatsApp Business: $0.005/message (~R100-500/month)
- Paystack: 1.5% + R2 per transaction
- Anthropic Claude: ~R200-500/month
- Hosting (Heroku/Railway): Free or $7-10/month

**Total**: ~R300-1500/month depending on volume

---

## ✅ Ready for Production When:

- [ ] Twilio WhatsApp Business Account approved
- [ ] Paystack live keys configured
- [ ] Webhook signature validation enabled
- [ ] Deployed to production server (not ngrok)
- [ ] Webhook URLs updated in Paystack & Twilio
- [ ] End-to-end test with real payment completed
- [ ] Monitoring/error tracking set up

---

## 🆘 Support & Maintenance

**Common Issues:**

1. **"Invalid signature" errors** → Check webhook secret key matches
2. **No WhatsApp confirmation** → Check Twilio Business Account status
3. **Bookings not updating** → Check Paystack webhook URL
4. **AI not responding** → Check Claude API key and credits

**Logs to monitor:**
- Server logs: Check for errors in booking flow
- Supabase logs: Database connection issues
- Paystack dashboard: Failed payments
- Twilio console: Message delivery failures

---

## 📞 Next Steps

**Right now you can:**
1. Test more bookings to ensure stability
2. Invite friends to test as real users
3. Monitor logs for any errors

**When ready for production:**
1. Apply for Twilio WhatsApp Business
2. Switch to Paystack live keys
3. Deploy to production server
4. Update all webhook URLs
5. Go live! 🎉
