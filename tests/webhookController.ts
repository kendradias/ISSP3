import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
//import { getAccessToken } from '../services/docusignTokenService';
//import envelopeFormData from '../models/formData';
import { StatusHistory } from '../src/models/statusHistory';
import { NotificationService } from '../src/services/notificationService'; 
import { getAccessToken } from './docusignTokenService';
import envelopeFormData from './formData';

dotenv.config();

const notificationService = new NotificationService();

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const envelopeData = req.body?.data;

    if (!envelopeData || envelopeData.envelopeSummary?.status !== 'completed') {
      console.log("Incomplete or invalid envelope event");
      res.status(200).send("Ignored event");
      return;
    }

    const envelopeId: string = envelopeData.envelopeSummary.envelopeId;
    let signerEmail: string = envelopeData.envelopeSummary.signerEmail || 'unknown@unknown.com';
    const accountId: string = envelopeData.accountId;

    // Get JWT Access Token
    const accessToken: string = await getAccessToken({
      clientId: process.env.CLIENT_ID!,
      userId: process.env.DOCUSIGN_USER_ID!,
    });

    // Fetch form data from DocuSign
    const formUrl = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/form_data`;
    const formResponse = await axios.get(formUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const formData: { [key: string]: string } = {};
    if (Array.isArray(formResponse.data.formData)) {
      formResponse.data.formData.forEach((field: { name: string; value: string }) => {
        if (field.name.toLowerCase() === 'email' || field.name.toLowerCase() === 'signeremail') {
          signerEmail = field.value;
        }
        formData[field.name] = field.value;
      });
    }

    // Download the combined PDF
    const pdfUrl = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`;
    const pdfResponse = await axios.get(pdfUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'stream'
    });

    const pdfDir = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir);
    }

    // Track status change
    const previousStatus = await getLatestStatus(envelopeId);
    const newStatus = envelopeData.envelopeSummary.status;
    
    // Only record if status has changed
    if (previousStatus !== newStatus) {
      const statusHistory = await StatusHistory.create({
        envelopeId,
        signerEmail,
        status: newStatus,
        previousStatus
      });
    // Send notification for status change
    await notificationService.sendStatusNotification(statusHistory);
      console.log(`Status notification sent for envelope ${envelopeId}`);
    }

    const filePath = path.join(pdfDir, `${envelopeId}.pdf`);
    const writer = fs.createWriteStream(filePath);

    pdfResponse.data.pipe(writer);

    writer.on('finish', async () => {
      const newData = new envelopeFormData({
        envelopeId,
        signerEmail,
        pdfPath: filePath,
        status: envelopeData.envelopeSummary.status,
        formData,
      });
      await newData.save();
      // Update status history to link to the saved document 
      if (newData._id) {
        await StatusHistory.updateOne(
          { envelopeId, status: envelopeData.envelopeSummary.status },
          { $set: { documentId: newData._id } }
        );
      }

      console.log('Data saved to MongoDB');
      res.status(200).send('Webhook handled successfully');
    });

    writer.on('error', (err: Error) => {
      console.error('Error saving PDF:', err);
      res.status(500).send('PDF save error');
    });

  } catch (error: any) {
    console.error('Webhook error:', error.message);
    res.status(500).send('Internal server error');
  }
};

// Helper function to get the latest status
async function getLatestStatus(envelopeId: string): Promise<string | null> {
  const latestStatus = await StatusHistory.findOne({ envelopeId })
    .sort({ timestamp: -1 })
    .limit(1);
  
  return latestStatus ? latestStatus.status : null;
}