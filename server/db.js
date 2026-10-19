const mongoose = require('mongoose');
const config = require('./config');

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
}

module.exports = { connectDB };
