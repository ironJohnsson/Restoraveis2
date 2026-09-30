require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'plataforma-topsis-segredo-super-seguro-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  dbPath: process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite'),
  env: process.env.NODE_ENV || 'development'
};
