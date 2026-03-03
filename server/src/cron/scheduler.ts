import { Cron } from "croner";
import { tokenService } from "../services/token.service";
import { roundService } from "../services/round.service";

let jobs: Cron[] = [];

export function startScheduler() {
  console.log("[cron] Starting scheduler...");

  // Token cache refresh — every 10 minutes
  jobs.push(
    new Cron("*/10 * * * *", async () => {
      console.log("[cron] Refreshing token cache...");
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
    })
  );

  // Round generation — at :00 of every hour
  jobs.push(
    new Cron("0 * * * *", () => {
      console.log("[cron] Generating new round...");
      try {
        roundService.generateRound();
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

  console.log("[cron] Scheduler started with 3 jobs");
}

export function stopScheduler() {
  for (const job of jobs) {
    job.stop();
  }
  jobs = [];
  console.log("[cron] Scheduler stopped");
}
