import cron from 'node-cron';
import { expiryTransactionJobs } from './expiry.transaction.schedule';


export const expiryTransactionSchedule = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[CRON] Checking for unpaid orders older than 1 hour...');
      await expiryTransactionJobs();
    } catch (err) {
      console.error('[CRON] Failed to run expiry transaction job:', err);
    }
  });
};
