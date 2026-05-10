const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const connectDB = async () => {
  const dbUri = process.env.DATABASE;

  if (!dbUri || dbUri === 'PASTE_YOUR_MONGODB_CONNECTION_STRING_HERE') {
    throw new Error('DATABASE connection string is not configured');
  }

  const connection = await mongoose.connect(dbUri);

  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;

};

module.exports = connectDB;
