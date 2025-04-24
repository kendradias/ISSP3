// tests/api.test.js
require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

describe('DocuSign API Tests', () => {
  let accessToken;
  let accountId;
  
  // Test authentication and token retrieval
  test('Should authenticate with DocuSign and get an access token', async () => {
    try {
      // Load private key
      const privateKeyPath = process.env.DOCUSIGN_PRIVATE_KEY_PATH;
      console.log('Loading private key from:', privateKeyPath);
      const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      
      // Create JWT
      const clientId = process.env.DOCUSIGN_INTEGRATION_KEY;
      const userId = process.env.DOCUSIGN_USER_ID;
      const now = Math.floor(Date.now() / 1000);
      
      const jwtPayload = {
        iss: clientId,
        sub: userId,
        aud: 'account-d.docusign.com',
        iat: now,
        exp: now + 3600,
        scope: 'signature impersonation'
      };
      
      const jwtToken = jwt.sign(jwtPayload, privateKey, { algorithm: 'RS256' });
      
      // Get access token
      const tokenUrl = 'https://account-d.docusign.com/oauth/token';
      const params = new URLSearchParams();
      params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
      params.append('assertion', jwtToken);
      
      const tokenResponse = await axios.post(tokenUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      accessToken = tokenResponse.data.access_token;
      accountId = process.env.DOCUSIGN_ACCOUNT_ID;
      
      console.log('Access token obtained:', accessToken.substring(0, 10) + '...');
      
      // Jest assertions
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(20);
    } catch (error) {
      console.error('Authentication Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }, 15000); // Increase timeout for API call
  
  // Test webhook configuration endpoint
  test('Should verify DocuSign Connect webhook endpoint', async () => {
    // Skip if authentication failed
    if (!accessToken) {
      console.log('Skipping webhook test due to missing access token');
      return;
    }
    
    try {
      // Check if the Connect endpoint exists and is accessible
      const connectUrl = `${process.env.DOCUSIGN_BASE_URI}/v2.1/accounts/${accountId}/connect`;
      
      // Get existing Connect configurations to check access
      const connectResponse = await axios.get(connectUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Connect endpoint is accessible');
      expect(connectResponse.status).toBe(200);
      
      // Test if we can create a webhook configuration (optional - only run if you want to create a test webhook)
      if (process.env.CREATE_TEST_WEBHOOK === 'true' && process.env.DOCUSIGN_WEBHOOK_URL) {
        const webhookUrl = process.env.DOCUSIGN_WEBHOOK_URL;
        console.log('Using webhook URL:', webhookUrl);
        
        const webhookData = {
          name: 'Jest Test Webhook ' + new Date().toISOString(),
          url: webhookUrl,
          eventData: {
            format: 'json',
            includeData: 'true'
          },
          events: [
            { envelopeEventStatusCode: 'Completed' }
          ],
          configurationType: 'custom'
        };
        
        const webhookResponse = await axios.post(
          connectUrl,
          webhookData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        expect(webhookResponse.status).toBe(201);
        expect(webhookResponse.data).toHaveProperty('connectId');
        console.log(`Webhook created with ID: ${webhookResponse.data.connectId}`);
      }
    } catch (error) {
      console.error('Webhook Endpoint Test Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }, 10000);
  
  // Test if the /instances endpoint exists (per your sponsor's question)
  test('Should check if /instances endpoint exists', async () => {
    // Skip if authentication failed
    if (!accessToken) {
      console.log('Skipping instances test due to missing access token');
      return;
    }
    
    try {
      // Try to access the /instances endpoint
      // Note: This is exploratory - the exact path might need adjustment
      const instancesUrl = `${process.env.DOCUSIGN_BASE_URI}/v2.1/accounts/${accountId}/instances`;
      
      try {
        const instancesResponse = await axios.get(instancesUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Instances endpoint exists and is accessible');
        expect(instancesResponse.status).toBe(200);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('/instances endpoint does not exist or is not accessible');
          // This is important information for your research task
          console.log('Alternative endpoints to consider:');
          console.log('- /envelopes for envelope data');
          console.log('- /envelopes/{envelopeId}/form_data for form field data');
          console.log('- /envelopes/{envelopeId}/documents for document access');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Instances Endpoint Test Error:', error.message);
      if (error.response && error.response.status !== 404) {
        console.error('Response data:', error.response.data);
      }
    }
  }, 10000);
  
  // Test envelope endpoints
  test('Should verify envelope endpoints', async () => {
    // Skip if authentication failed
    if (!accessToken) {
      console.log('Skipping envelope test due to missing access token');
      return;
    }
    
    try {
      // Get a list of envelopes
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30); // Last 30 days
      const fromDateStr = fromDate.toISOString().split('T')[0];
      
      const envelopesUrl = `${process.env.DOCUSIGN_BASE_URI}/v2.1/accounts/${accountId}/envelopes?from_date=${fromDateStr}`;
      const response = await axios.get(envelopesUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Retrieved ${response.data.envelopes?.length || 0} envelopes`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('envelopes');
      
      // If we have envelopes, test form_data endpoint
      if (response.data.envelopes && response.data.envelopes.length > 0) {
        const testEnvelope = response.data.envelopes[0];
        console.log(`Testing endpoints with envelope: ${testEnvelope.envelopeId}`);
        
        // Test form_data endpoint
        try {
          const formDataUrl = `${process.env.DOCUSIGN_BASE_URI}/v2.1/accounts/${accountId}/envelopes/${testEnvelope.envelopeId}/form_data`;
          const formDataResponse = await axios.get(formDataUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Form data endpoint is accessible');
          expect(formDataResponse.status).toBe(200);
        } catch (error) {
          console.log('Form data endpoint error:', error.message);
          // This could be normal if the envelope doesn't have form data
        }
        
        // Test documents endpoint
        try {
          const documentsUrl = `${process.env.DOCUSIGN_BASE_URI}/v2.1/accounts/${accountId}/envelopes/${testEnvelope.envelopeId}/documents`;
          const documentsResponse = await axios.get(documentsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Documents endpoint is accessible');
          expect(documentsResponse.status).toBe(200);
        } catch (error) {
          console.log('Documents endpoint error:', error.message);
        }
      }
    } catch (error) {
      console.error('Envelope Endpoint Test Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }, 15000);
});