# 7-Day Implementation Guide

## Day 1 — Product lock + litepaper
- Finalize rules/docs in this repo
- Publish litepaper website copy
- Define UI wireflow (Home, Live Rounds, Pick, Leaderboard, Profile)

## Day 2 — Backend skeleton
- Fastify API + Postgres schema
- Core tables: rounds, picks, settlements, users, streaks
- Cron scheduler for hourly round creation

## Day 3 — Data adapters
- pump.fun adapter
- Birdeye price adapter
- token eligibility + ranking logic

## Day 4 — Settlement engine
- P0/P1 price computation (Birdeye)
- VOID/RUG/PUMP logic
- points + streak updates

## Day 5 — Mobile app core
- React Native app
- Wallet connection (Solana Mobile + MWA)
- Live rounds + pick flow + result feed

## Day 6 — Polish + growth hooks
- Push notifications
- Share card generation
- Daily/weekly leaderboards

## Day 7 — Submission hardening
- APK build + smoke tests
- Demo video recording
- Pitch deck finalization
- Submit package (APK + repo + video + deck)

---

## Definition of done (MVP)
- 4 hourly token slots live (2 per platform)
- pick window works
- auto settlement works
- leaderboard updates correctly
- app runs as functional Android APK
