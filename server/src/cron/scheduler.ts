import { Cron } from "croner";
import { tokenService } from "../services/token.service";
import { roundService } from "../services/round.service";
import { reconciliationService } from "../services/reconciliation.service";

let jobs: Cron[] = [];

export function startScheduler() {
  console.log("[cron] Starting scheduler...");

  // Round generation — at :00 of every hour
  // Refreshes token cache first, then picks tokens for the new round
  jobs.push(
    new Cron("0 * * * *", async () => {
      console.log("[cron] Refreshing token cache before round generation...");
      try {
        await tokenService.refreshCache("pump.fun");
      } catch (err) {
        console.error("[cron] pump.fun refresh failed:", err);
      }
      try {
        await tokenService.refreshCache("bags.fm");
      } catch (err) {
        console.error("[cron] bags.fm refresh failed:", err);
      }

      console.log("[cron] Generating new round...");
      try {
        await roundService.generateRound();
      } catch (err) {
        console.error("[cron] Round generation failed:", err);
      }
    })
  );

  // Round settlement — at :05 of every hour
  jobs.push(
    new Cron("5 * * * *", async () => {
      console.log("[cron] Settling rounds...");
      try {
        const count = await roundService.settleUnsettledRounds();
        console.log(`[cron] Settled ${count} rounds`);
      } catch (err) {
        console.error("[cron] Settlement failed:", err);
      }
    })
  );

  // Stale bet cleanup — every 10 minutes
  jobs.push(
    new Cron("*/10 * * * *", async () => {
      try {
        const cleaned = reconciliationService.cleanStaleBets();
        if (cleaned > 0) console.log(`[cron] Cleaned ${cleaned} stale bets`);
      } catch (err) {
        console.error("[cron] Stale bet cleanup failed:", err);
      }
    })
  );

  // Fee sweep — at :30 of every hour (after settlement + claims)
  jobs.push(
    new Cron("30 * * * *", async () => {
      try {
        await reconciliationService.sweepFees();
      } catch (err) {
        console.error("[cron] Fee sweep failed:", err);
      }
    })
  );

  console.log("[cron] Scheduler started with 4 jobs");
}

export function stopScheduler() {
  for (const job of jobs) {
    job.stop();
  }
  jobs = [];
  console.log("[cron] Scheduler stopped");
}
