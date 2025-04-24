const envelopeFormData = require('../models/formData');

const saveFormDataToDB = async ({ envelopeId, signerEmail, pdfPath, status, formData, completedAt}) => {
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

//function to fetch the latest 'envelopeCompletedDateTime'
const getLatestCompletedAt = async() => {
    try {
        // Find the document with the latest completedAt
        const latestEnvelope = await envelopeFormData.findOne().sort({ completedAt: -1 });
    
        if (!latestEnvelope) {
          console.log("No completed envelope found.");
          return null;
        }
    
        // Return the latest completedAt date
        console.log("Latest completedAt:", latestEnvelope.completedAt);
        return latestEnvelope.completedAt;
      } catch (error) {
        console.error("Error fetching latest completedAt date:", error);
        throw error;
      }
    }




module.exports = { saveFormDataToDB, getLatestCompletedAt };
