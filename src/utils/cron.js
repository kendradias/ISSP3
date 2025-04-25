const cron = require('node-cron');
const { recoverMissedEnvelopes } = require('../services/docuSignService');

function startCronJobs() {
  cron.schedule('*/1 * * * *', () => {
    console.log(' Running recovery cron job...');
    recoverMissedEnvelopes();
  });
}

module.exports = { startCronJobs };
