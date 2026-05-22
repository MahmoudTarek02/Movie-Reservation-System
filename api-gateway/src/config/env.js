const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  movieServiceUrl: process.env.MOVIE_SERVICE_URL || 'http://localhost:3002',
  bookingServiceUrl: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003'
};
