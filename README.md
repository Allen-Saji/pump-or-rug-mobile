<p align="center">
  <img src="assets/pumpruglogo.png" alt="Pump or Rug" width="200" />
</p>

<h1 align="center">Pump or Rug</h1>

A real-time prediction game built on Solana. Players bet whether newly launched pump.fun tokens will pump or rug within a 15-minute window. Every round features two live tokens with real price feeds, on-chain escrow for trustless payouts, and a competitive scoring system with streaks and leaderboards.

## How It Works

1. Every 15 minutes, a new round opens with two freshly launched pump.fun tokens
2. Players choose PUMP or RUG on each token and place a bet (0.01 to 1 SOL)
3. When the round closes, settlement pulls live prices from Birdeye to determine the outcome
4. Winners receive a 1.85x payout. Losers forfeit their bet. All funds flow through an on-chain escrow program

## Project Structure

```
pump-or-rug-mobile/
  app/              Expo Router screens and tab navigation
  components/       Reusable React Native UI components
  lib/              Client state (Zustand), API client, auth hooks, Solana signing
  server/           Hono API server running on Bun with Drizzle ORM and SQLite
  shared/           TypeScript types shared between client and server
  programs/         Anchor on-chain escrow program (pump_or_rug_escrow)
  litepaper/        Next.js litepaper site
  scripts/          Deployment and initialization scripts
  docs/             Design documents, game rules, and security audit
```

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| Mobile      | Expo 54, React Native, NativeWind, Zustand, Expo Router |
| Auth        | Privy (Google and X OAuth with embedded Solana wallets)  |
| Server      | Bun, Hono, Drizzle ORM, SQLite                          |
| On-Chain    | Anchor 0.32, Solana Devnet (PDA escrow vaults)           |
| Price Feeds | Birdeye API (primary), pump.fun API (fallback)           |

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (for the server)
- Yarn 4.x (package manager)
- Android device or emulator (for mobile)
- Solana CLI and Anchor 0.32 (for on-chain development)

### Mobile App

```bash
yarn install
npx expo start
```

For USB debugging on a physical device:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000
```

### Server

```bash
cp server/.env.example server/.env
# Configure your environment variables (see below)

cd server
bun run db:migrate
bun run dev
```

The server starts on port 3000 and handles round generation, settlement, and all game API endpoints.

### On-Chain Program

```bash
anchor build
anchor test
```

The escrow program is deployed to Solana Devnet at `8v3eum4thAGnRRYKK34xXvm9bPTaz5ydA3GzfTxSKjbD`.

## Environment Variables

### Mobile (.env)

| Variable                     | Description                              |
|------------------------------|------------------------------------------|
| `EXPO_PUBLIC_PRIVY_APP_ID`   | Privy application ID                     |
| `EXPO_PUBLIC_PRIVY_CLIENT_ID`| Privy client ID                          |
| `EXPO_PUBLIC_API_URL`        | Server URL (default: http://localhost:3000) |

### Server (server/.env)

| Variable              | Description                                    |
|-----------------------|------------------------------------------------|
| `PORT`                | Server port (default: 3000)                    |
| `DATABASE_URL`        | SQLite database path                           |
| `BIRDEYE_API_KEY`     | Birdeye API key for price feeds                |
| `PRIVY_APP_ID`        | Privy app ID for JWT verification              |
| `SOLANA_RPC_URL`      | Solana RPC endpoint (default: devnet)          |
| `PROGRAM_ID`          | On-chain program address                       |
| `RESOLVER_KEYPAIR_PATH` | Path to the resolver wallet keypair         |

## Game Mechanics

### Rounds

- New rounds open every 15 minutes (at :00, :15, :30, :45)
- Each round features 2 tokens sourced from pump.fun
- Tokens must be less than 24 hours old with a minimum of $2,000 liquidity
- A 4-hour cooldown prevents the same token from appearing in consecutive rounds
- Settlement occurs 1 minute after the round closes

### Betting

- Bet range: 0.01 to 1 SOL per token per round
- Winning payout: 1.85x
- Any positive price movement counts as a pump, any negative movement counts as a rug
- Bets are escrowed on-chain through PDA vaults managed by the Anchor program

### Scoring

| Event                | Points |
|----------------------|--------|
| Correct prediction   | +5     |
| Incorrect prediction | -3     |
| Win streak bonus     | +2 per consecutive win (stacks) |
| Perfect round        | 1.5x multiplier (both calls correct) |
| Rug sniper           | +3 bonus (correctly called a 25%+ drop) |

### Leaderboard

Rankings are available across four time periods: Daily, Weekly, Season, and All-Time. The leaderboard tracks cumulative points, win streaks, and overall prediction accuracy.

## On-Chain Program

The `pump_or_rug_escrow` program handles the full betting lifecycle with trustless fund management:

| Instruction          | Description                                        |
|----------------------|----------------------------------------------------|
| `initialize_config`  | Set up protocol admin, resolver, treasury, fee BPS |
| `create_round`       | Open a new betting round for a token               |
| `place_bet`          | Escrow SOL into a PDA vault (pump or rug side)     |
| `resolve_round`      | Resolver settles the outcome after the window closes |
| `claim`              | Winners receive pro-rata payout minus fees         |
| `sweep_fees`         | Admin withdraws accumulated protocol fees          |
| `cancel_round`       | Void a round and issue full refunds                |
| `close_round`        | Finalize a round after all claims are processed    |

The program includes admin controls for updating the resolver, treasury address, fee basis points, and a global pause switch.

For the full security review, see [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Architecture

```
Mobile App (Expo/RN)
    |
    |--- Privy Auth (OAuth + embedded wallets)
    |
    v
Hono API Server (Bun)
    |
    |--- SQLite (Drizzle ORM) --- rounds, bets, users, tokens
    |
    |--- Birdeye / pump.fun APIs --- live price feeds
    |
    v
Solana Program (Anchor)
    |
    |--- PDA Escrow Vaults --- trustless fund custody
    |
    |--- GlobalConfig PDA --- protocol settings
```

## License

All rights reserved.
