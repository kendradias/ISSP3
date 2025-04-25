const axios = require('axios');
const { getLatestCompletedAt, saveFormDataToDB } = require('./databaseService');
const envelopeFormData = require('../models/formData');
const { getAccessToken } = require('./docusignTokenService');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { savePDF } = require('../utils/pdfUtils');

const getFormData = async (accessToken, accountId, envelopeId) => {
    try {
        const url = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/form_data`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const formData = {};
        let signerEmail;
        if (Array.isArray(response.data.formData)) {
            response.data.formData.forEach(field => {
                if (field.name.toLowerCase() === 'email' || field.name.toLowerCase() === 'signeremail') {
                    signerEmail = field.value;
                }
                formData[field.name] = field.value;
            });
        }

        return { formData, signerEmail };
    }
    catch (error) {
        console.log(error);
    }
};

const downloadEnvelopePDF = async (accessToken, accountId, envelopeId) => {
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
};

const recoverMissedEnvelopes = async () => {
    try {
        const lastSaved = await getLatestCompletedAt();
        const fromDate = lastSaved?.toISOString() || new Date(Date.now() - 86400000).toISOString(); // fallback to 24hrs ago
        const accessToken = await getAccessToken({
            clientId: process.env.CLIENT_ID,
            userId: process.env.DOCUSIGN_USER_ID,
        });

        const url = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${process.env.ACCOUNT_ID}/envelopes?from_date=${fromDate}&status=completed`;

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const envelopes = response.data.envelopes || [];
        let processedCount = 0;

        for (const envelope of envelopes) {
            const exists = await envelopeFormData.findOne({ envelopeId: envelope.envelopeId });
            if (exists && exists.formData && exists.pdfPath) continue; // Already saved

            console.log(`Recovering missed envelope: ${envelope.envelopeId}`);
            await processEnvelope(envelope.envelopeId, accessToken, envelope.completedDateTime);
            processedCount++;
        }

        if (processedCount === 0) {
            console.log('No new envelopes to save.');
        } else {
            console.log(`${processedCount} envelope(s) processed and saved.`);
        }

    } catch (error) {
        console.error('Recovery error:', error);
    }
}

const processEnvelope = async (envelopeId, accessToken, completedDateTime) => {
    const accountId = process.env.ACCOUNT_ID;
    const { formData, signerEmail } = await getFormData(accessToken, accountId, envelopeId);
    const pdfPath = await downloadEnvelopePDF(accessToken, accountId, envelopeId);
    await saveFormDataToDB({
        envelopeId,
        signerEmail,
        status: 'completed',
        pdfPath,
        formData,
        completedAt: completedDateTime
    });
}

module.exports = { getFormData, downloadEnvelopePDF, recoverMissedEnvelopes }