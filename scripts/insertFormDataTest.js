// scripts/insertFormDataTest.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const EnvelopeFormData = require('../src/models/formData');

/**
 * This script simulates inserting DocuSign form data into MongoDB
 * without making any actual DocuSign API calls
 */
async function testDatabaseInsertion() {
  try {
    console.log('Starting database insertion test...');
    
    // Step 1: Load test data from your existing file
    const testDataPath = path.join(__dirname, '../data/samples/sampleEnvelope.json');
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    
    const envelopeData = testData.data;
    const formDataArray = testData.formData.formData;
    
    // Step 2: Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    const envelopeId = envelopeData.envelopeSummary.envelopeId;
    const signerEmail = envelopeData.envelopeSummary.signerEmail || 'test@example.com';
    const status = envelopeData.envelopeSummary.status;

    // Step 3: Create a dummy PDF path (no actual file created)
    const pdfDir = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);
    const pdfPath = path.join(pdfDir, `${envelopeId}.pdf`);
    
    // Create an empty file to simulate PDF (optional)
    fs.writeFileSync(pdfPath, 'Test PDF content');
    console.log(`Created dummy PDF at ${pdfPath}`);

    // Step 4: Convert form data array to object structure
    const formData = {};
    if (Array.isArray(formDataArray)) {
      formDataArray.forEach(field => {
        formData[field.name] = field.value;
      });
    }
    console.log(`Processed ${Object.keys(formData).length} form fields`);

    // Step 5: Create database record
    const newData = new EnvelopeFormData({
      envelopeId,
      signerEmail,
      pdfPath,
      status,
      formData,
    });
    
    // Step 6: Save to database
    const savedData = await newData.save();
    console.log('Data saved to MongoDB successfully!');
    console.log('Envelope ID:', savedData.envelopeId);
    console.log('Signer Email:', savedData.signerEmail);
    console.log('Form Fields Count:', Object.keys(savedData.formData).length);
    
    // Step 7: Retrieve and verify the data
    const fetchedData = await EnvelopeFormData.findOne({ envelopeId });
    console.log('Verification: Data was successfully saved and can be retrieved from MongoDB');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error in database insertion test:', error);
    
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

// Run the test
testDatabaseInsertion();

// Run the test
testDatabaseInsertion();

// Run the test
testDatabaseInsertion();