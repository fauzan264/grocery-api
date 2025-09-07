import cron from "node-cron";
import { confirmTransactionJob } from "./confirm.transaction.job";

export const confirmTransactionSchedule = () => {

  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Checking delivered orders older than 2 days...");
    await confirmTransactionJob();
    console.log("[CRON] Confirm transaction job finished");
  }, {
    timezone: "Asia/Jakarta", 
  });
};
