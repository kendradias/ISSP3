import { Request, Response } from "express";
import { DocuSignWebhookRequest } from "../types/docusignWebhook.ts";
import { processEnvelope } from "../services/docuSignService.ts";
import getAccessToken from "../services/docusignTokenService.ts";

export const handleWebhook = async (
  req: Request<{}, {}, DocuSignWebhookRequest>,
  res: Response
): Promise<void> => {
  try {
    const envelopeData = req.body?.data;

    if (!envelopeData || envelopeData.envelopeSummary.status !== 'completed') {
      console.log("Ignored: Incomplete or invalid envelope");
      res.status(200).send("Ignored event");
      return;
    }

    const { envelopeId, envelopeSummary } = envelopeData;

    console.log(`Processing envelope ${envelopeId} from webhook...`);

    const accessToken = await getAccessToken({
      clientId: process.env.CLIENT_ID!,
      userId: process.env.DOCUSIGN_USER_ID!,
    });

    // Delegate processing to the centralized function
    await processEnvelope(envelopeId, accessToken, new Date(envelopeSummary.completedDateTime));

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
};

export default handleWebhook;