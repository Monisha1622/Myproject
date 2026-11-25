const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool Configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'library_management_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Max concurrent connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  // Debug log for QA observability
  // console.log('Connected to PostgreSQL Database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

// Helper wrapper for executing parameterized queries
const query = (text, params) => pool.query(text, params);

// Helper for acquiring a transaction client
const getClient = () => pool.connect();

module.exports = {
  pool,
  query,
  getClient,
};
