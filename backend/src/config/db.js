const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  [MongoDB] MONGODB_URI is not set in backend/.env.');
    console.warn('⚠️  [MongoDB] Running in offline mode without database connection. Add your URI to enable persistence.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ [MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ [MongoDB] Connection error: ${error.message}`);
  }
};

module.exports = connectDB;
