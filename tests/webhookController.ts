import { Request, Response } from 'express';
//import { saveFormDataToDB } from '../services/databaseService';
//import { downloadEnvelopePDF, getFormData } from '../services/docuSignService';
//import { getAccessToken } from '../services/docusignTokenService';

import { saveFormDataToDB } from './databaseService';
import { downloadEnvelopePDF, getFormData } from './docuSignService';
import { getAccessToken } from './docusignTokenService';


export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const envelopeData = req.body?.data;

    if (!envelopeData || envelopeData.envelopeSummary?.status !== 'completed') {
      console.log("Ignored: Incomplete or invalid envelope");
      res.status(200).send("Ignored event");
      return;
    }

    const envelopeId: string = envelopeData.envelopeId;
    const accountId: string = envelopeData.accountId;

    const accessToken = await getAccessToken({
      clientId: process.env.CLIENT_ID!,
      userId: process.env.DOCUSIGN_USER_ID!
    });

    const { formData, signerEmail } = await getFormData(accessToken, accountId, envelopeId);

    if (!signerEmail) {
      console.error("Signer email is missing in the form data");
      res.status(400).send("Missing signer email");
      return;
    }

    const pdfPath = await downloadEnvelopePDF(accessToken, accountId, envelopeId);

    await saveFormDataToDB({
      envelopeId,
      signerEmail,
      status: envelopeData.envelopeSummary.status,
      pdfPath,
      formData: new Map(Object.entries(formData)),
      completedAt: new Date(envelopeData.envelopeSummary.completedDateTime)
    });

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
};
