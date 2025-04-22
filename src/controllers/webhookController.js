const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { getAccessToken } = require('../services/docusignTokenService');
const envelopeFormData = require('../models/formData');

const handleWebhook = async (req, res) => {
  try {
    const envelopeData = req.body.data;

    if (!envelopeData || envelopeData.envelopeSummary.status !== 'completed') {
      console.log("Incompleted or invalid envelope event");
      return res.status(200).send("Ignored event");
    }

    const envelopeId = envelopeData.envelopeSummary.envelopeId;
    var signerEmail = envelopeData.envelopeSummary.signerEmail || 'unknown@unknown.com';
    const accountId = envelopeData.accountId;

    // Get JWT Access Token
    const accessToken = await getAccessToken({
      clientId: process.env.CLIENT_ID,
      userId: process.env.DOCUSIGN_USER_ID, 
    });

    // Get form data
    const formUrl = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/form_data`;
    const formResponse = await axios.get(formUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const formData = {};
    if (Array.isArray(formResponse.data.formData)) {
      formResponse.data.formData.forEach(field => {
        if (field.name.toLowerCase() === 'email' || field.name.toLowerCase() === 'signeremail') {
          signerEmail = field.value;
        }
        formData[field.name] = field.value;
      });
    }

    // Download combined PDF
    const pdfUrl = `${process.env.DOCUSIGN_API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`;
    const pdfResponse = await axios.get(pdfUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'stream'
    });

    const pdfDir = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

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
      console.log('Data saved to MongoDB');
      res.status(200).send('Webhook handled successfully');
    });

    writer.on('error', (err) => {
      console.error('Error saving PDF:', err);
      res.status(500).send('PDF save error');
    });

  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).send('Internal server error');
  }
};


module.exports = {handleWebhook}
