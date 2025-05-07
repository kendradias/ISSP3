import cron from 'node-cron';
import { recoverMissedEnvelopes } from '../services/docuSignService.ts';

let isRunning = false;

export function startCronJobs(): void {
  cron.schedule('*/1 * * * *', async () => {
    if (isRunning) {
      console.log('Previous recovery job still running, skipping this round.');
      return;
    }

    console.log('Starting recovery cron job...');
    isRunning = true;

    try {
      await recoverMissedEnvelopes();
    } catch (error) {
      console.error('Error during recovery:', error);
    } finally {
      isRunning = false;
      console.log('Recovery cron job completed.');
    }
  });
}

