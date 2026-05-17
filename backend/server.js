// ============================================================
// server.js
// Entry point — connects to MongoDB and starts HTTP server
// Run: npm run dev (uses nodemon) OR npm start (uses node)
// ============================================================

require('dotenv').config(); // Load .env FIRST before anything else
const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the Express server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║      ShopEase Backend Server Started     ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  🚀 Server:   http://localhost:${PORT}       ║`);
    console.log(`║  📦 DB:       ShopEaseDB                 ║`);
    console.log(`║  🌍 Mode:     ${(process.env.NODE_ENV || 'development').padEnd(28)}║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
  });

  // Handle unhandled promise rejections (e.g. DB query errors)
  process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err.message);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown on SIGTERM (Docker/Heroku sends this on shutdown)
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
};

startServer();
