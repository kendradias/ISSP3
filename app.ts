import express, { Request, Response} from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import connectDB from './src/config/database.ts';
import router from './src/routes/webhookRoutes.ts';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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

// Use webhook routes
app.use("/webhook", router);

// // Start the server
// if (require.main === module) {
//   app.listen(PORT, () => {
//     console.log(`Server is running on port http://localhost:${PORT}`);
//   });
// }


app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

// // Export the app for testing purposes
export default app;


// app.use(express.json());

// app.listen(3000, ()=>{
//   console.log('server is running');
// })