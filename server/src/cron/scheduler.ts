import { Cron } from "croner";
import { tokenService } from "../services/token.service";
import { roundService } from "../services/round.service";
import { reconciliationService } from "../services/reconciliation.service";

let jobs: Cron[] = [];

export async function startScheduler() {
  console.log("[cron] Starting scheduler...");

  // Settle any rounds missed while server was down
  try {
    const count = await roundService.settleUnsettledRounds();
    if (count > 0) console.log(`[cron] Startup: settled ${count} missed rounds`);
  } catch (err) {
    console.error("[cron] Startup settlement failed:", err);
  }

  // Round generation — every 15 min at :00, :15, :30, :45
  // Refreshes token cache first, then picks tokens for the new round
  jobs.push(
    new Cron("0,15,30,45 * * * *", async () => {
      console.log("[cron] Refreshing token cache before round generation...");
      try {
        await tokenService.refreshCache("pump.fun");
      } catch (err) {
        console.error("[cron] pump.fun refresh failed:", err);
      }

      console.log("[cron] Generating new round...");
      try {
        await roundService.generateRound();
      } catch (err) {
        console.error("[cron] Round generation failed:", err);
      }
    })
  );

  // Round settlement — 1 min after each round close
  jobs.push(
    new Cron("1,16,31,46 * * * *", async () => {
      console.log("[cron] Settling rounds...");
      try {
        const count = await roundService.settleUnsettledRounds();
        console.log(`[cron] Settled ${count} rounds`);
      } catch (err) {
        console.error("[cron] Settlement failed:", err);
      }
    })
  );

  // Stale bet cleanup — every 5 minutes
  jobs.push(
    new Cron("*/5 * * * *", async () => {
      try {
        const cleaned = reconciliationService.cleanStaleBets();
        if (cleaned > 0) console.log(`[cron] Cleaned ${cleaned} stale bets`);
      } catch (err) {
        console.error("[cron] Stale bet cleanup failed:", err);
      }
    })
  );

  // Fee sweep — 4 min after each round close (after settlement + claims)
  jobs.push(
    new Cron("4,19,34,49 * * * *", async () => {
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
