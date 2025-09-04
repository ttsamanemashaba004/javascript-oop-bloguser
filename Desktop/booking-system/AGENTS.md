# Repository Guidelines

## Project Structure & Module Organization
- `client/`: React + Vite frontend. Key paths: `src/pages/` (views), `src/components/` (UI), `src/services/api.js` (API layer), `public/` (static).
- `server/`: Express backend. Key paths: `routes/` (`/api`, `/public`, `/webhooks`), `services/` (`database`, `booking`, `payment`, `whatsapp`, `ai`), `server.js` (app entry).
- Data storage uses Supabase; environment is configured via `.env` in `server/`.

## Build, Test, and Development Commands
Frontend (from `client/`):
- `npm run dev` — start Vite dev server.
- `npm run build` — production build to `dist/`.
- `npm run preview` — preview built assets.
- `npm run lint` — run ESLint.

Backend (from `server/`):
- `npm start` — start Express server.
- `npm run server` — start with `nodemon` for hot reload.

Example local URLs: API `http://localhost:3000/api`, Client `http://localhost:5173`.

## Coding Style & Naming Conventions
- JavaScript/TypeScript style: 2‑space indentation, prefer const/let, arrow functions for callbacks, trailing commas where valid.
- Components: PascalCase files (e.g., `BookingTable.jsx`); hooks/utilities camelCase.
- API routes: kebab or lowercase paths; service modules named by domain (`booking.js`).
- Linting: ESLint configured in `client/`; align server code with same conventions.

## Testing Guidelines
- No formal test suite is configured yet. Recommended next steps:
  - Client: Vitest + React Testing Library.
  - Server: Jest + Supertest for route/service tests.
- Place tests alongside code (`*.test.jsx/js`) or under `__tests__/` mirroring structure.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat: add Paystack verification`, `fix(api): correct rate limiter skip`).
- One logical change per commit; keep messages imperative and scoped.
- PRs must include: concise description, screenshots (UI), reproduction steps (for bugs), and notes on env/config changes.
- Link related issues and outline any follow‑up tasks.

## Security & Configuration Tips
- Required server env: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `DEFAULT_SALON_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `FRONTEND_URL`, `NODE_ENV`, `PORT`.
- Webhooks: expose `/webhooks/whatsapp` and `/webhooks/payments`; verify signatures in production.
- CORS and rate limiting are environment‑aware; set `NODE_ENV=development` for local work.

## Architecture Overview
- Flow: WhatsApp → intent parsing (`ai`) → availability (`booking`) → hold → Paystack link (`payment`) → `/webhooks/payments` → confirm booking → WhatsApp confirmation.
- Frontend dashboard consumes `/api` for availability and bookings; `/public` supports signup/onboarding and payment verification.

