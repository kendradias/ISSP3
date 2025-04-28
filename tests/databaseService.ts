//import envelopeFormData from '../models/formData';
import envelopeFormData from './formData';

import { Document } from 'mongoose';

// Define the shape of the data
interface EnvelopeData {
  envelopeId: string;
  signerEmail: string;
  pdfPath: string;
  status: string;
  formData: Map<string, string>;
  completedAt: Date;
}

const saveFormDataToDB = async ({
  envelopeId,
  signerEmail,
  pdfPath,
  status,
  formData,
  completedAt
}: EnvelopeData): Promise<void> => {
  const newRecord = new envelopeFormData({
    envelopeId,
    signerEmail,
    pdfPath,
    status,
    formData: Object.fromEntries(formData),
    completedAt
  });

  await newRecord.save();
  console.log('Data saved to MongoDB');
};

const getLatestCompletedAt = async (): Promise<Date | null> => {
  try {
    const latestEnvelope = await envelopeFormData.findOne().sort({ completedAt: -1 });

    if (!latestEnvelope) {
      console.log("No completed envelope found.");
      return null;
    }

    console.log("Latest completedAt:", latestEnvelope.completedAt);
    return latestEnvelope.completedAt;
  } catch (error) {
    console.error("Error fetching latest completedAt date:", error);
    throw error;
  }
};

export { saveFormDataToDB, getLatestCompletedAt };
