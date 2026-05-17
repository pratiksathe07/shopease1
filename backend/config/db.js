// ============================================================
// config/db.js
// MongoDB connection using Mongoose
// Called once at server startup from server.js
// ============================================================

const mongoose = require('mongoose');

/**
 * connectDB — connects to MongoDB using the MONGO_URI from .env
 * Exits the process if connection fails (fatal error)
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅  MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦  Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌  MongoDB Connection Error: ${error.message}`);
    // Exit process with failure code so the server doesn't start without a DB
    process.exit(1);
  }
};

module.exports = connectDB;
