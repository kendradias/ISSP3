import { Request, Response } from 'express';
import { DocuSignWebhookRequest } from '../types/docusignWebhook.ts';
import { processEnvelope } from '../services/docuSignService.ts';
import getAccessToken from '../services/docusignTokenService.ts';
import { handleError } from '../utils/errorHandler.ts';

export const handleWebhook = async (
  req: Request<{}, {}, DocuSignWebhookRequest>,
  res: Response
): Promise<void> => {
  try {
    const envelopeSummary = req.body?.data?.envelopeSummary;

    // Make sure that the envelopeSummary is present ...
    if (!envelopeSummary) {
      throw new Error('Invalid envelope data - envelopeSummary is missing');
    }
    
    // ... has the expected properties ...
    if (
      typeof envelopeSummary.envelopeId !== 'string' ||
      typeof envelopeSummary.status !== 'string' ||
      typeof envelopeSummary.completedDateTime !== 'string'
    ) {
      throw new Error('Invalid envelope data - missing properties or wrong types');
    }
    
    // ... and they are all filled in
    if (
      !envelopeSummary.completedDateTime ||
      !envelopeSummary.envelopeId ||
      !envelopeSummary.status
    ) {
      throw new Error('Invalid envelope data - empty properties');
    }

    const { envelopeId, status, completedDateTime } = envelopeSummary;

    if (status !== 'completed') {
      console.log(
        `Ignored: Incomplete envelope ${envelopeId} with status ${status}`
      );
      res.status(200).send('Ignored event');
      return;
    }

    const accessToken = await getAccessToken({
      clientId: process.env.CLIENT_ID!,
      userId: process.env.DOCUSIGN_USER_ID!,
    });

    // Delegate processing to the centralized function
    await processEnvelope(envelopeId, accessToken, new Date(completedDateTime));

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing webhook: envelopeId:', req.body?.data?.envelopeSummary?.envelopeId || 'Unknown Envelope ID');
    handleError(error as Error, req, res); // Use the error handler to send notifications and log the error
  }
};

export default handleWebhook;
