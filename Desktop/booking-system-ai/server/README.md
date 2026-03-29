# Nail Salon WhatsApp Booking System - Server

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env` (see `.env.example` for template)

3. Set up your Supabase database:
   - Run `src/db/schema.sql` in Supabase SQL editor
   - Run `src/db/seed.sql` to add sample services

4. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on port 3000 (or the PORT specified in `.env`)

## Testing

Test the server is running:
```bash
curl http://localhost:3000/
```

Expected response: `{"message":"Nail Booking System Running"}`

## Webhooks

The server exposes these webhook endpoints:

- `POST /webhook/whatsapp` - Receives WhatsApp messages from Twilio
- `GET /webhook/whatsapp` - Twilio webhook verification
- `POST /webhook/payfast-itn` - Receives payment notifications from PayFast

## Environment Variables

Required variables (all must be set):

- `ANTHROPIC_API_KEY` - Your Claude API key
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_WHATSAPP_NUMBER` - Your Twilio WhatsApp number (format: +1234567890)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `PAYFAST_MERCHANT_ID` - PayFast merchant ID
- `PAYFAST_MERCHANT_KEY` - PayFast merchant key
- `PAYFAST_PASSPHRASE` - PayFast passphrase
- `PAYFAST_SANDBOX` - Set to `true` for testing, `false` for production
- `SERVER_URL` - Your public server URL (for webhooks, set this when using ngrok)
- `PORT` - Server port (default: 3000)

## Deployment with ngrok

To test webhooks locally:

1. Start the server: `npm start`
2. In another terminal, run: `ngrok http 3000`
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Set `SERVER_URL` in `.env` to your ngrok URL
5. Configure Twilio webhook: `https://abc123.ngrok.io/webhook/whatsapp`
6. Configure PayFast ITN: `https://abc123.ngrok.io/webhook/payfast-itn`
7. Restart the server to pick up the new SERVER_URL

## Project Structure

- `src/index.js` - Express server entry point
- `src/db/` - Database client and queries
- `src/services/` - Business logic (AI, WhatsApp, payments, booking flow)
- `src/routes/` - HTTP route handlers
- `src/prompts/` - AI system prompts
