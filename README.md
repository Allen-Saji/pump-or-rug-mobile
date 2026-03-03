# Pump or Rug

A degen prediction game on Solana — bet whether a token will pump or rug within the hour. Mobile-first, on-chain escrow, real stakes.

## Monorepo Structure

| Directory | Description |
|-----------|-------------|
| `app/` | Expo Router screens & navigation (React Native) |
| `components/` | Shared UI components |
| `lib/` | Client-side state, API client, types, hooks |
| `server/` | Hono API server (Bun + Drizzle + SQLite) |
| `shared/` | Shared types/schemas between client and server |
| `programs/` | Anchor on-chain program (`pump_or_rug_escrow`) |
| `litepaper/` | Litepaper static site |
| `docs/` | Design docs, game rules, security audit, analysis scripts |

## Quick Start

### Mobile App

```bash
yarn install
yarn start          # Expo dev server
```

### Server

```bash
cp server/.env.example server/.env
# Fill in your API keys

cd server
bun run db:migrate  # Set up SQLite database
bun run dev         # Start dev server on :3000
```

### On-Chain Program

```bash
anchor build
anchor test         # Runs localnet + TS e2e tests
```

## Tech Stack

- **Mobile**: Expo 54, React Native, NativeWind (Tailwind), Zustand, Expo Router
- **Auth**: Privy (Google + X OAuth, embedded wallets)
- **Server**: Bun, Hono, Drizzle ORM, SQLite
- **On-Chain**: Anchor 0.32, Solana (escrow PDA vaults)
- **Shared**: Zod schemas between client/server

## Environment Variables

### Mobile (`.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_PRIVY_APP_ID` | Privy application ID |
| `EXPO_PUBLIC_PRIVY_CLIENT_ID` | Privy client ID |
| `EXPO_PUBLIC_API_URL` | Server URL (default `http://localhost:3000`) |

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3000`) |
| `DATABASE_URL` | SQLite path (default `./data/pump-or-rug.db`) |
| `BAGS_API_KEY` | Bags.fm API key for token data |
| `PRIVY_APP_ID` | Privy app ID for auth verification |
| `PRIVY_VERIFICATION_KEY` | Privy JWT verification key |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Mobile App  │────▶│  Hono API   │────▶│  Solana Program  │
│  (Expo/RN)   │     │  (Bun)      │     │  (Anchor)        │
└─────────────┘     └──────┬──────┘     └──────────────────┘
       │                   │
       │ Privy Auth        │ SQLite
       ▼                   ▼
 ┌───────────┐      ┌───────────┐
 │  Privy    │      │  Drizzle  │
 │  (OAuth)  │      │  (ORM)    │
 └───────────┘      └───────────┘
```

## On-Chain Program

`pump_or_rug_escrow` manages the full betting lifecycle:

- **initialize_config** — set up protocol admin, resolver, treasury, fee BPS
- **create_round** — open a new betting round for a token
- **place_bet** — escrow SOL into a PDA vault (pump or rug side)
- **resolve_round** — resolver settles outcome after the window closes
- **claim** — winners get pro-rata payout minus fees; losers/void get refunds
- **sweep_fees** — admin withdraws accumulated protocol fees
- **cancel_round** — void a round for full refunds
- **close_round / force_close_round** — finalize round after all claims (or after grace period)
- **Admin controls** — `set_resolver`, `set_treasury`, `set_fee_bps`, `set_paused`

Security review: [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md)
