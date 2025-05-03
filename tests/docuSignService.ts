import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { getLatestCompletedAt, saveFormDataToDB } from './databaseService';
//import envelopeFormData from '../models/formData';

import envelopeFormData from './formData';

import { getAccessToken } from './docusignTokenService';
import dotenv from 'dotenv';

dotenv.config();

interface FormField {
  name: string;
  value: string;
}

interface FormDataResult {
  formData: Record<string, string>;
  signerEmail?: string;
}

const getFormData = async (
  accessToken: string,
  accountId: string,
  envelopeId: string
): Promise<FormDataResult> => {
  try {
    const url = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/form_data`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const formData: Record<string, string> = {};
    let signerEmail: string | undefined;

    if (Array.isArray(response.data.formData)) {
      response.data.formData.forEach((field: FormField) => {
        if (field.name.toLowerCase() === 'email' || field.name.toLowerCase() === 'signeremail') {
          signerEmail = field.value;
        }
        formData[field.name] = field.value;
      });
    }

    return { formData, signerEmail };
  } catch (error) {
    console.error('Error fetching form data:', error);
    throw error;
  }
};

const savePDF = (stream: NodeJS.ReadableStream, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);
    stream.on('end', resolve);
    stream.on('error', reject);
  });
};

const downloadEnvelopePDF = async (
  accessToken: string,
  accountId: string,
  envelopeId: string
): Promise<string> => {
  const pdfUrl = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`;
  const response = await axios.get(pdfUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: 'stream',
  });

  const pdfPath = path.join(__dirname, `../pdfs/${envelopeId}.pdf`);
  await savePDF(response.data, pdfPath);
  return pdfPath;
};

const processEnvelope = async (
  envelopeId: string,
  accessToken: string,
  completedDateTime: string
): Promise<void> => {
  const accountId = process.env.ACCOUNT_ID!;
  const { formData, signerEmail } = await getFormData(accessToken, accountId, envelopeId);
  const pdfPath = await downloadEnvelopePDF(accessToken, accountId, envelopeId);

  await saveFormDataToDB({
    envelopeId,
    signerEmail: signerEmail || 'unknown',
    status: 'completed',
    pdfPath,
    formData: new Map(Object.entries(formData)),
    completedAt: new Date(completedDateTime)
  });

  console.log('Pending envelope saved');
};

const recoverMissedEnvelopes = async (): Promise<void> => {
  try {
    const lastSaved = await getLatestCompletedAt();
    const fromDate = lastSaved?.toISOString() || new Date(Date.now() - 86400000).toISOString();

    const accessToken = await getAccessToken({
      clientId: process.env.CLIENT_ID!,
      userId: process.env.DOCUSIGN_USER_ID!
    });

    const url = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${process.env.ACCOUNT_ID}/envelopes?from_date=${fromDate}&status=completed`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    for (const envelope of response.data.envelopes) {
      const exists = await envelopeFormData.findOne({ envelopeId: envelope.envelopeId });
      if (exists && exists.formData && exists.pdfPath) continue;

      console.log(`Recovering missed envelope: ${envelope.envelopeId}`);
      await processEnvelope(envelope.envelopeId, accessToken, envelope.completedDateTime);
    }

    console.log('Envelope recovery process complete');
  } catch (error: any) {
    console.error('Recovery error:', error.message);
  }
};

export { getFormData, downloadEnvelopePDF, recoverMissedEnvelopes };
