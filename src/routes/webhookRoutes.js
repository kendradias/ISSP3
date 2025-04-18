const express = require('express');
const { handleWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.post('/docusign-webhook', handleWebhook);

module.exports = router;
