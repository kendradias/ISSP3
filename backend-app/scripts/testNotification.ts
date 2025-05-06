import dotenv from 'dotenv';
import { NotificationService } from '../src/services/notificationService';
import { StatusHistory } from '../src/models/statusHistory';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

async function testEmailNotification() {
  try {
    // Connect to MongoDB (needed since StatusHistory is a mongoose model)
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    // Create a test status history document
    const statusHistory = new StatusHistory({
      envelopeId: 'test-envelope-123',
      signerEmail: 'kendra.dias@hotmail.com',
      status: 'completed',
      previousStatus: 'sent',
      timestamp: new Date(),
    });

    await statusHistory.save();
    console.log('Test status history created');

    // Initialize the notification service
    const notificationService = new NotificationService();

    // Send a test status notification
    const result = await notificationService.sendStatusNotification(statusHistory);

    if (result) {
      console.log('Test status notification sent successfully!');
    } else {
      console.error('Failed to send test status notification');
    }

    // Clean up (optional - remove the test status history)
    await StatusHistory.findByIdAndDelete(statusHistory._id);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function testErrorNotification() {
  try {
    // Initialize the notification service
    const notificationService = new NotificationService();

    // Simulate an error
    const simulatedError = new Error('Simulated error for testing error notifications');

    // Simulate a request object (optional, for additional context)
    const simulatedRequest = {
      method: 'GET',
      originalUrl: '/test-error',
      query: { test: 'true' },
      body: { envelopeId: 'test-envelope-123' },
      headers: { 'user-agent': 'TestAgent' },
    } as any; // Cast as `any` to avoid strict type issues

    // Send a test error notification
    const result = await notificationService.sendErrorNotification(simulatedError, simulatedRequest, 'test-envelope-123');

    if (result) {
      console.log('Test error notification sent successfully!');
    } else {
      console.error('Failed to send test error notification');
    }
  } catch (error) {
    console.error('Error notification test failed:', error);
  }
}

// Run the tests
(async () => {
  console.log('Running status notification test...');
  await testEmailNotification();

  console.log('\nRunning error notification test...');
  await testErrorNotification();
})();