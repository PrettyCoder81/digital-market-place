const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const config = require('./config');
const { connectDB } = require('./db');

const ipfsRoutes = require('./routes/ipfs');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');

const app = express();

app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/ipfs', ipfsRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/transactions', transactionRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

async function start() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
