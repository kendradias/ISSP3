import axios from "axios";
import path from "path";
import fs from 'fs';
import dotenv from 'dotenv';
import { getLatestCompletedAt, saveFormDataToDB } from "./databaseService.ts";
import getAccessToken from "./docusignTokenService.ts";
import { EnvelopeSummary } from "../types/docusignWebhook.ts";
import EnvelopeFormData from "../models/formData.ts";
import { savePDF } from "../utils/pdfUtils.ts";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { NotificationService } from "./notificationService.ts";
import { StatusHistory } from "../models/statusHistory.ts";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

interface FormField {
    name: string;
    value: string;
}

interface FormDataResponse {
    formData: FormField[];
}


export const getFormData = async (
    accessToken: string,
    accountId: string,
    envelopeId: string
): Promise<{ formData: Record<string, string>; signerEmail?: string }> => {
    try {
        const url = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/form_data`;
        const response = await axios.get<FormDataResponse>(url, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const formData: Record<string, string> = {};
        let signerEmail: string | undefined;
        if (Array.isArray(response.data.formData)) {
            response.data.formData.forEach(field => {
                if (['email', 'signeremail'].includes(field.name.toLowerCase())) {
                    signerEmail = field.value;
                }
                formData[field.name] = field.value;
            });
        }

        return { formData, signerEmail };
    }
    catch (error: unknown) {
        console.log("Error fetching form data", error);
        throw error;
    }
};

export const downloadEnvelopePDF = async (
    accessToken: string,
    accountId: string,
    envelopeId: string,
): Promise<string> => {
    try {
        const pdfUrl = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`;
        const response = await axios.get(pdfUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
            responseType: 'stream',
        });

        const pdfDir = path.join(__dirname, '../pdfs');
        const pdfPath = path.join(pdfDir, `${envelopeId}.pdf`);

        // Ensure the directory exists
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        await savePDF(response.data, pdfPath);
        return pdfPath;
    } catch (error: unknown) {
        console.error("Error downloading PDF:", error);
        throw error;
    }
};

export const recoverMissedEnvelopes = async (): Promise<void> => {
    try {
        const lastSaved = await getLatestCompletedAt();
        const fromDate = lastSaved?.toISOString() || new Date(Date.now() - 86400000).toISOString(); // fallback to 24hrs ago
        const accessToken = await getAccessToken({
            clientId: process.env.CLIENT_ID!,
            userId: process.env.DOCUSIGN_USER_ID!,
        });

        const url = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${process.env.ACCOUNT_ID}/envelopes?from_date=${fromDate}&status=completed`;

        const response = await axios.get<{ envelopes: EnvelopeSummary[] }>(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const envelopes = response.data.envelopes || [];
        let processedCount = 0;

        for (const envelope of envelopes) {
            const exists = await EnvelopeFormData.findOne({ envelopeId: envelope.envelopeId });
            if (exists && exists.formData && exists.pdfPath) continue; // Already saved

            console.log(`Recovering missed envelope: ${envelope.envelopeId}`);
            await processEnvelope(envelope.envelopeId, accessToken, new Date(envelope.completedDateTime));
            processedCount++;
        }

        console.log(processedCount === 0 ? 'No new envelopes to save.' : `${processedCount} envelope(s) processed and saved.`);
    } catch (error: unknown) {
        console.error('Recovery error:', error);
    }
}

export const processEnvelope = async (
    envelopeId: string,
    accessToken: string,
    completedDateTime: Date
): Promise<void> => {
    try {
        const accountId = process.env.ACCOUNT_ID!;

        // Check if the envelope already exists in the EnvelopeFormData collection
        const existingEnvelope = await EnvelopeFormData.findOne({ envelopeId });
        if (existingEnvelope) {
            console.log(`Envelope ${envelopeId} already exists in EnvelopeFormData. Skipping.`);
            return; // Skip processing if the envelope already exists
        }

        const { formData, signerEmail } = await getFormData(accessToken, accountId, envelopeId);
        const pdfPath = await downloadEnvelopePDF(accessToken, accountId, envelopeId);

        // Save form data to the database
        try {
            await saveFormDataToDB({
                envelopeId,
                signerEmail: signerEmail || "",
                status: 'completed',
                pdfPath,
                formData: new Map(Object.entries(formData)),
                completedAt: completedDateTime
            });
        } catch (error: any) {
            if (error.code === 11000) {
                console.log(`Duplicate record detected for envelope ${envelopeId}. Skipping save.`);
                return; // Skip further processing if the record already exists
            } else {
                throw error; // Re-throw other errors
            }
        }

        // Check if a notification has already been sent
        const existingStatus = await StatusHistory.findOne({ envelopeId, status: 'completed' });
        if (existingStatus?.notificationSent) {
            console.log(`Notification already sent for envelope ${envelopeId}. Skipping.`);
            return;
        }

        // Create or update the status history
        const previousStatus = await StatusHistory.findOne({ envelopeId }).sort({ timestamp: -1 });
        const newStatus = 'completed';

        const statusHistory = new StatusHistory({
            envelopeId,
            signerEmail: signerEmail || "",
            status: newStatus,
            previousStatus: previousStatus?.status || null,
            timestamp: new Date(completedDateTime),
            notificationSent: false
        });

        await statusHistory.save();
        console.log(`Status history record created for envelope ${envelopeId}`);

        // Initialize NotificationService
        const notificationService = new NotificationService();

        // Send a notification to the support team (sender)
        const supportEmail = process.env.FORM_ISSUER_EMAIL || "bcitissp3@outlook.com";
        const senderNotificationResult = await notificationService.sendSupportNotification(
            supportEmail,
            envelopeId,
            newStatus
        );

        if (senderNotificationResult) {
            console.log(`Notification sent to support team for envelope ${envelopeId}`);
        } else {
            console.error(`Failed to send notification to support team for envelope ${envelopeId}`);
        }

        // Mark the notification as sent
        statusHistory.notificationSent = true;
        await statusHistory.save();
        console.log(`Notification status updated for envelope ${envelopeId}`);

    } catch (error: unknown) {
        console.error(`Error processing envelope ${envelopeId}:`, error);
    }
};
