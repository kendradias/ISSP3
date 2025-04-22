const mongoose = require('mongoose');
const express = require('express');
const connectDB = require('./config/database');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Define a basic route
app.get('/', (req, res) => {
  res.json({ message: 'DocuSign Data Transfer API is running' });
});

// Example route to test database connection
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    service: 'DocuSign Data Transfer',
    timestamp: new Date(),
    database: dbStatus
  });
});

// Export the app
module.exports = app;