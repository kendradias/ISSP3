import express, { Request, Response} from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NotificationService } from './src/services/notificationService.ts';
import connectDB from './src/config/database.ts';
import router from './src/routes/webhookRoutes.ts';
import { handleError } from './src/utils/errorHandler.ts';
import applicationRouter from './src/routes/applicationsRoutes.ts';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const notificationService = new NotificationService();

// Middleware
app.use(cors());
app.use(bodyParser.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true}));

// Connect to MongoDB
connectDB();

// Define routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'DocuSign Data Transfer API is running' });
});

// Health check route to test database connection
app.get('/api/health', async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    service: 'DocuSign Data Transfer',
    timestamp: new Date(),
    database: dbStatus
  });
});

// Test route to simulate an error for testing the error handler
app.get('/test-error', (req, res) => {
  throw new Error('Test error for handleError');
});
// Test Route to simiulate envelope errors
app.get('/test-envelope-error', (req, res) => {
  req.body = { envelopeId: '12345' }; // Simulate an envelope ID in the request body
  throw new Error('Test error for envelope processing');
});

// Use webhook routes
app.use("/webhook", router);

app.use("/api", applicationRouter)
// Register the error-handling middleware
app.use(handleError);


app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await notificationService.sendErrorNotification(error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await notificationService.sendErrorNotification(reason);
});

// Export the app for testing purposes
export default app;

