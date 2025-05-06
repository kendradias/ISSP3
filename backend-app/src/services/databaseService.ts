import EnvelopeFormData, { IEnvelopeFormData } from "../models/formData.ts";

interface SaveFormDataParams {
  envelopeId: string;
  signerEmail: string;
  pdfPath: string;
  status: string;
  formData: Map<string, string>;
  completedAt: Date;
}

export const saveFormDataToDB = async ({envelopeId, signerEmail, pdfPath, status, formData, completedAt }:SaveFormDataParams): Promise<void> => {
  const newRecord = new EnvelopeFormData({
    envelopeId,
    signerEmail,
    pdfPath,
    status,
    formData,
    completedAt
  });

  await newRecord.save();
  console.log('Data saved to MongoDB');
};

// Function to fetch the latest 'envelopeCompletedDateTime'
export const getLatestCompletedAt = async (): Promise<Date> => {
  try {
    const latestEnvelope:IEnvelopeFormData | null = await EnvelopeFormData.findOne()
    .sort({ completedAt: -1 });

    //  2000-01-01 as the minimum allowed date by DocuSign
    const fallbackDate = new Date("2000-01-01T00:00:00.000Z");
    const completedAt: Date = latestEnvelope?.completedAt || fallbackDate;

    if (!latestEnvelope || !latestEnvelope.completedAt) {
      console.log("No valid completedAt found. Defaulting to:", completedAt.toISOString());
    } else {
      console.log("Latest completedAt found:", completedAt.toISOString());
    }

    return completedAt;
  } catch (error) {
    console.error("Error fetching latest completedAt date:", error);
    throw error;
  }
};

