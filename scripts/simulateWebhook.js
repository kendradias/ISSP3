// scripts/simulateWebhook.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const EnvelopeFormData = require('../models/formData');
const { getAccessToken } = require('../services/docusignTokenService');

/**
 * This script simulates what a webhook handler would do:
 * 1. Receives envelope data from DocuSign
 * 2. Gets an access token
 * 3. Fetches form data from DocuSign API
 * 4. Downloads the PDF
 * 5. Saves everything to MongoDB
 */
async function simulateWebhookProcess() {
  try {
    console.log('Starting webhook simulation...');
    
    // Step 1: Load test data (simulating webhook payload)
    const testDataPath = path.join(__dirname, '../testData/testEnvelope.json');
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    
    const envelopeData = testData.data;
    
    if (!envelopeData || envelopeData.envelopeSummary.status !== 'completed') {
      console.log("Incompleted or invalid envelope event");
      return;
    }

    console.log('Received webhook data for envelope:', envelopeData.envelopeSummary.envelopeId);
    
    // Step 2: Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    const envelopeId = envelopeData.envelopeSummary.envelopeId;
    var signerEmail = envelopeData.envelopeSummary.signerEmail || 'unknown@unknown.com';
    const accountId = envelopeData.accountId;

    // Step 3: Get JWT Access Token
    console.log('Getting access token...');
    const accessToken = await getAccessToken({
      clientId: process.env.CLIENT_ID,
      userId: process.env.DOCUSIGN_USER_ID,
    });
    console.log('Access token obtained');

    // Step 4: Get form data
    console.log('Fetching form data...');
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
    console.log(`Received ${Object.keys(formData).length} form fields`);

    // Step 5: Download combined PDF
    console.log('Downloading PDF...');
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
    
    // Wait for PDF download to complete
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`PDF saved to ${filePath}`);

    // Step 6: Save data to MongoDB
    const newData = new EnvelopeFormData({
      envelopeId,
      signerEmail,
      pdfPath: filePath,
      status: envelopeData.envelopeSummary.status,
      formData,
    });
    
    await newData.save();
    console.log('Data saved to MongoDB');
    
    // Step 7: Retrieve and verify the data
    const savedData = await EnvelopeFormData.findOne({ envelopeId });
    console.log('Verification: Data was successfully saved to MongoDB');
    console.log('Envelope ID:', savedData.envelopeId);
    console.log('Signer Email:', savedData.signerEmail);
    console.log('Form Fields Count:', Object.keys(savedData.formData).length);
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    console.log('Simulation completed successfully!');
    
  } catch (error) {
    console.error('Error in webhook simulation:', error);
    
    // Attempt to close MongoDB connection if open
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
      }
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
  }
}

// Run the simulation
simulateWebhookProcess();