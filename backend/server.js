const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool } = require('./config/db');
const apiRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend integration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint (useful for QA API smoke testing)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Library Management System Backend API',
  });
});

// Mount Core Application REST APIs
app.use('/api', apiRoutes);

// Handle 404 for undefined endpoints
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server and verify Database connection
const startServer = async () => {
  try {
    // Test PostgreSQL database connection
    const res = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log('----------------------------------------------------');
    console.log(`[Database Connected]: Successfully connected to '${res.rows[0].db_name}'`);
    console.log(`[Database Timestamp]: ${res.rows[0].current_time}`);
    console.log('----------------------------------------------------');

    app.listen(PORT, () => {
      console.log(`[Server Status]: Backend server is running on http://localhost:${PORT}`);
      console.log(`[Health Check]: http://localhost:${PORT}/api/health`);
      console.log(`[Allowed CORS Origin]: ${allowedOrigin}`);
      console.log('----------------------------------------------------');
    });
  } catch (err) {
    console.error('----------------------------------------------------');
    console.error('[Database Connection Error]: Failed to connect to PostgreSQL.');
    console.error('Please verify your .env database settings (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).');
    console.error('Detailed Error:', err.message);
    console.error('----------------------------------------------------');
    
    // Start server even if DB connection fails temporarily so healthcheck and error reporting are visible
    app.listen(PORT, () => {
      console.log(`[Server Status]: Backend server running on http://localhost:${PORT} (Database Offline)`);
    });
  }
};

startServer();

module.exports = app;
