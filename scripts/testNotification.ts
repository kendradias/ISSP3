// testNotification.ts
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
      timestamp: new Date()
    });
    
    await statusHistory.save();
    console.log('Test status history created');

    // Initialize the notification service
    const notificationService = new NotificationService();
    
    // Send a test notification
    const result = await notificationService.sendStatusNotification(statusHistory);
    
    if (result) {
      console.log('Test notification sent successfully!');
    } else {
      console.error('Failed to send test notification');
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

// Run the test
testEmailNotification();