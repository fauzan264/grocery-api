import cron from "node-cron";
import { expiryTransactionJobs } from "./expiry.transaction.job";

export const expiryTransactionSchedule = () => {
  console.log("[CRON] Scheduler initialized ✅ (running every 5 minutes, Asia/Jakarta)");

  cron.schedule(
    "*/5 * * * *",
    async () => {
      const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      console.log(`[CRON] Checking for unpaid orders older than 1 hour... at ${now}`);
      await expiryTransactionJobs();
      console.log(`[CRON] Job finished at ${now}`);
    },
    {
      timezone: "Asia/Jakarta",
    }
  );
};
