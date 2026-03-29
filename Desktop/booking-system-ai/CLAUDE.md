# Nail Salon WhatsApp Booking System

## What this project is
A WhatsApp-based booking system for a nail salon. Clients message on WhatsApp, an AI assistant (powered by Claude API) handles the conversation naturally, extracts booking details, and confirms bookings after deposit payment via Paystack. The salon owner views bookings on a web dashboard.

## Tech stack
- Runtime: Node.js with Express
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- WhatsApp: Twilio WhatsApp API
- Database: Supabase (PostgreSQL)
- Payments: Paystack
- Frontend (later): React

## Project structure
This is a monorepo with the backend in /server and frontend (later) in /client.
- /server/src/index.js — Express app entry point
- /server/src/routes/ — Route handlers
- /server/src/services/ — Business logic (ai.js, whatsapp.js, booking.js, payment.js)
- /server/src/config/ — Config and environment setup
- /server/src/prompts/ — AI system prompts
- /server/src/db/ — Supabase client and queries

## Coding rules
- Use ES modules (import/export), not CommonJS (require)
- Use async/await, never raw promises or callbacks
- Every service file should export named functions, not classes
- Keep route handlers thin — all logic goes in services
- Store all secrets in .env, never hardcode
- Add error handling on every external API call (Twilio, Claude, Supabase, Paystack)
- Log errors with context (which service, what input caused it)

## AI conversation rules
- The AI system prompt is stored in /server/src/prompts/salon-assistant.js
- The AI must respond in a warm, friendly, professional tone — like a real salon receptionist
- The AI must support English and common South African informal English
- The AI uses Claude tool_use/function calling to extract booking details — it does NOT try to parse them from text with regex
- Conversation history per client is stored in Supabase and sent with each API call for context

## What NOT to do
- Do not build any frontend yet
- Do not add authentication yet
- Do not add analytics or reporting yet
- Do not use Socket.IO or WebSockets
- Do not use TypeScript — plain JavaScript only
- Do not create test files unless explicitly asked
- Do not add features I haven't asked for

## Current phase
Phase 1: WhatsApp webhook → Claude AI conversation → booking extraction → Paystack payment link → booking saved to database
