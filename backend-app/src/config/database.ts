import mongoose from "mongoose";
import dotenv from 'dotenv';
import { startCronJobs } from "../utils/cron.ts";

dotenv.config();

// Get connection string from environment variables
const mongoURI = process.env.MONGODB_URI;
const mongoUser = process.env.MONGODB_USER;
const mongoPassword = process.env.MONGODB_PASSWORD;

if (!mongoURI){
  throw new Error('MONGODB_URI is not defined in environment variables');
}

// Construct the connection string if user and password are provided separately
const connectionString = mongoUser && mongoPassword
  ? mongoURI.replace('mongodb://', `mongodb://${mongoUser}:${mongoPassword}@`)
  : mongoURI;

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds instead of 30
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(connectionString, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    startCronJobs();
    return conn;
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Gracefully close the connection when the app is terminated
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

export default connectDB;