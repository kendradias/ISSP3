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

    // Track status change and send notification
    try {
      const previousStatus = await getLatestStatus(envelopeId);
      const newStatus = 'completed';
      
      if (previousStatus !== newStatus) {
        console.log(`Status change detected for envelope ${envelopeId}: ${previousStatus} -> ${newStatus}`);
        
        const statusHistory = new StatusHistory({
          envelopeId,
          signerEmail: signerEmail || "",
          status: newStatus,
          previousStatus,
          timestamp: new Date()
        });
        
        await statusHistory.save();
        console.log(`Status history record created for envelope ${envelopeId}`);
        
        const notificationService = new NotificationService();
        const result = await notificationService.sendStatusNotification(statusHistory);
        
        if (result) {
          console.log(`Status notification sent for envelope ${envelopeId}`);
        } else {
          console.error(`Failed to send notification for envelope ${envelopeId}`);
        }
      } else {
        console.log(`No status change detected for envelope ${envelopeId}`);
      }
    } catch (notificationError) {
      console.error('Error in notification process:', notificationError);
      // Continue processing - don't fail the webhook if notification fails
    }


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

/**
 * Gets the latest recorded status for an envelope
 * @param envelopeId The DocuSign envelope ID
 * @returns The latest status or null if no status history exists
 */
async function getLatestStatus(envelopeId: string): Promise<string | null> {
  try {
    const latestStatus = await StatusHistory.findOne({ envelopeId })
      .sort({ timestamp: -1 })
      .limit(1);
    
    return latestStatus ? latestStatus.status : null;
  } catch (error) {
    console.error('Error getting latest status:', error);
    return null;
  }
}

export default handleWebhook;
