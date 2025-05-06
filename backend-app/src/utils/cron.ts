import cron from 'node-cron';
import { recoverMissedEnvelopes } from '../services/docuSignService.ts';

export function startCronJobs(): void {
  cron.schedule('*/1 * * * *', () => {     //start job in every 60 seconds or 1 minute
    console.log('Running recovery cron job...');
    recoverMissedEnvelopes();
  });
}

