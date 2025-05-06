// tests/webhookController.test.js

// Import the controller
const { handleWebhook } = require('../controllers/webhookController');

// Define mock modules before mocking them
const databaseServiceMock = {
  saveFormDataToDB: jest.fn()
};

const docuSignServiceMock = {
  downloadEnvelopePDF: jest.fn(),
  getFormData: jest.fn()
};

// Mock the modules
jest.mock('../services/databaseService', () => databaseServiceMock, { virtual: true });
jest.mock('../services/docuSignService', () => docuSignServiceMock, { virtual: true });

// Mock the getAccessToken function
global.getAccessToken = jest.fn();

describe('WebhookController Tests', () => {
  let req, res;
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {
      body: {
        data: {
          envelopeId: 'test-envelope-123',
          accountId: process.env.ACCOUNT_ID,
          envelopeSummary: {
            status: 'completed',
            completedDateTime: '2025-05-06T12:00:00Z'
          }
        }
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    
    // Mock successful responses from services
    global.getAccessToken.mockResolvedValue('mock-access-token');
    
    docuSignServiceMock.getFormData.mockResolvedValue({
      formData: { field1: 'value1', field2: 'value2' },
      signerEmail: 'bcitissp3@outlook.com'
    });
    
    docuSignServiceMock.downloadEnvelopePDF.mockResolvedValue('/path/to/document.pdf');
    
    databaseServiceMock.saveFormDataToDB.mockResolvedValue(true);
  });
  
  afterEach(() => {
    // Restore process.env to avoid affecting other tests
    process.env = originalEnv;
  });
  
  test('should successfully process a completed envelope', async () => {
    // Execute the controller
    await handleWebhook(req, res);
    
    // Verify access token was requested with env values
    expect(global.getAccessToken).toHaveBeenCalledWith({
      clientId: process.env.CLIENT_ID,
      userId: process.env.DOCUSIGN_USER_ID,
    });
    
    // Verify form data was retrieved
    expect(docuSignServiceMock.getFormData).toHaveBeenCalledWith(
      'mock-access-token',
      process.env.ACCOUNT_ID,
      'test-envelope-123'
    );
    
    // Verify PDF was downloaded
    expect(docuSignServiceMock.downloadEnvelopePDF).toHaveBeenCalledWith(
      'mock-access-token',
      process.env.ACCOUNT_ID,
      'test-envelope-123'
    );
    
    // Verify data was saved to DB with correct params
    expect(databaseServiceMock.saveFormDataToDB).toHaveBeenCalledWith({
      envelopeId: 'test-envelope-123',
      signerEmail: 'bcitissp3@outlook.com',
      status: 'completed',
      pdfPath: '/path/to/document.pdf',
      formData: { field1: 'value1', field2: 'value2' },
      completedAt: '2025-05-06T12:00:00Z'
    });
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Webhook processed successfully');
  });
  
  test('should ignore incomplete envelopes', async () => {
    // Change envelope status to 'sent' (not completed)
    req.body.data.envelopeSummary.status = 'sent';
    
    // Execute the controller
    await handleWebhook(req, res);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Ignored event');
  });
  
  test('should handle missing envelope data', async () => {
    // Remove envelope data
    req.body.data = null;
    
    // Execute the controller
    await handleWebhook(req, res);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Ignored event');
  });
  
  test('should handle errors in service calls', async () => {
    // Force an error in getFormData service
    docuSignServiceMock.getFormData.mockRejectedValue(new Error('API Error'));
    
    // Execute the controller
    await handleWebhook(req, res);
    
    // Verify error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Internal server error');
  });
});