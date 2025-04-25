const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const router = require('./src/routes/webhookRoutes');

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true}));

// Connect to MongoDB
connectDB();

// Define routes
app.get('/', (req, res) => {
  res.json({ message: 'DocuSign Data Transfer API is running' });
});

// Health check route to test database connection
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    service: 'DocuSign Data Transfer',
    timestamp: new Date(),
    database: dbStatus
  });
});

// Use webhook routes
app.use("/", router);

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
}

// Export the app for testing purposes
module.exports = app;