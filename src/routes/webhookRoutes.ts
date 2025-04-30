import express, { Router } from 'express';
import { handleWebhook } from '../controllers/webhookController.ts';


const router: Router = express.Router();

router.post('/docusign-webhook', handleWebhook);

export default router;
