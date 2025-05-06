// tests/webhookController.test.js

// Mock dependencies before importing anything
// Mock axios
jest.mock('axios', () => ({
    get: jest.fn().mockImplementation((url) => {
      if (url.includes('form_data')) {
        return Promise.resolve({
          data: {
            formData: [
              { name: 'field1', value: 'value1' },
              { name: 'email', value: 'test@example.com' }
            ]
          }
        });
      } else if (url.includes('documents')) {
        return Promise.resolve({
          data: {
            pipe: jest.fn()
          }
        });
      }
      return Promise.resolve({ data: {} });
    })
  }));
  
  // Mock fs
  jest.mock('fs', () => {
    const originalFs = jest.requireActual('fs');
    return {
      ...originalFs,
      existsSync: jest.fn().mockReturnValue(true),
      mkdirSync: jest.fn(),
      createWriteStream: jest.fn().mockImplementation(() => ({
        on: jest.fn().mockImplementation(function(event, callback) {
          if (event === 'finish') {
            // Immediately call the finish callback
            callback();
          }
          return this;
        }),
        pipe: jest.fn()
      }))
    };
  });
  
  // Mock the token service in the same location where the controller imports it from
  jest.mock('../src/controllers/docusignTokenService', () => ({
    getAccessToken: jest.fn().mockResolvedValue('mock-access-token')
  }));
  
  // Mock form data model
  jest.mock('../src/controllers/formData', () => {
    return function() {
      return {
        save: jest.fn().mockResolvedValue({ _id: 'mock-id-123' })
      };
    };
  });
  
  jest.mock('../src/models/statusHistory', () => ({
    findOne: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(null)
      })
    }),
    create: jest.fn().mockResolvedValue({
      envelopeId: 'test-envelope-123',
      status: 'completed'
    }),
    updateOne: jest.fn().mockResolvedValue(true)
  }));
  
  jest.mock('../src/services/notificationService', () => ({
    NotificationService: jest.fn().mockImplementation(() => ({
      sendStatusNotification: jest.fn().mockResolvedValue(true)
    }))
  }));
  
  // Now import the webhook controller
  const { handleWebhook } = require('../src/controllers/webhookController');
  
  describe('Webhook Controller Tests', () => {
    test('Should correctly handle envelope ID from DocuSign webhook', async () => {
      // Create a mock envelope ID
      const testEnvelopeId = 'test-envelope-123';
      
      // Create a mock request with a completed envelope
      const mockReq = {
        body: {
          data: {
            accountId: 'test-account-456',
            envelopeSummary: {
              status: 'completed',
              envelopeId: testEnvelopeId,
              signerEmail: 'test@example.com',
              completedDateTime: '2023-05-01T12:00:00Z'
            }
          }
        }
      };
      
      // Create a mock response
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      // Call the webhook handler
      await handleWebhook(mockReq, mockRes);
      
      // Verify successful response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith('Webhook handled successfully');
    });
    
    test('Should ignore non-completed envelope webhooks', async () => {
      // Create a mock request with non-completed envelope
      const mockReq = {
        body: {
          data: {
            accountId: 'test-account-789',
            envelopeSummary: {
              status: 'sent', // Not completed
              envelopeId: 'test-envelope-456'
            }
          }
        }
      };
      
      // Create a mock response
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      // Call the webhook handler
      await handleWebhook(mockReq, mockRes);
      
      // Verify ignored response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith('Ignored event');
    });
  });