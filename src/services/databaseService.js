const envelopeFormData = require('../models/formData');

const saveFormDataToDB = async ({ envelopeId, signerEmail, pdfPath, status, formData, completedAt }) => {
  const newRecord = new envelopeFormData({
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
const getLatestCompletedAt = async () => {
  try {
    const latestEnvelope = await envelopeFormData.findOne().sort({ completedAt: -1 });

    //  2000-01-01 as the minimum allowed date by DocuSign
    const fallbackDate = new Date("2000-01-01T00:00:00.000Z");
    const completedAt = latestEnvelope?.completedAt || fallbackDate;

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

module.exports = { saveFormDataToDB, getLatestCompletedAt };
