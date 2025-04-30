import { Request, Response } from "express";
import { DocuSignWebhookRequest } from "../types/docusignWebhook.ts";
import EnvelopeFormData, { IEnvelopeFormData } from "../models/formData.ts";
import getAccessToken from "../services/docusignTokenService.ts";
import { downloadEnvelopePDF, getFormData } from "../services/docuSignService.ts";
import { saveFormDataToDB } from "../services/databaseService.ts";
import { StatusHistory } from "../models/statusHistory";
import { NotificationService } from "../services/notificationService";


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

    const { envelopeId, accountId, envelopeSummary } = envelopeData;


    // Check if envelope is already saved
    const existingRecord: IEnvelopeFormData | null = await EnvelopeFormData.findOne({ envelopeId });
    if (existingRecord && existingRecord.formData && existingRecord.pdfPath) {
      console.log("Envelope already saved.");
      res.status(200).send("Envelope already processed");
      return
    }

    const accessToken = await getAccessToken({
      clientId: process.env.CLIENT_ID!,
      userId: process.env.DOCUSIGN_USER_ID!,
    });

    const { formData, signerEmail } = await getFormData(accessToken, accountId, envelopeId);

    const pdfPath = await downloadEnvelopePDF(accessToken, accountId, envelopeId);

    await saveFormDataToDB({
      envelopeId,
      signerEmail: signerEmail || "",
      status: 'completed',
      pdfPath,
      formData: new Map(Object.entries(formData)),
      completedAt: new Date(envelopeSummary.completedDateTime),
    });

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
};

export default handleWebhook;
