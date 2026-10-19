/**
 * Transactions Route
 * Logs blockchain transactions
 */

const express = require('express');
const router = express.Router();
const { Transaction } = require('../models');

/**
 * GET /api/transactions
 * Fetch all transactions
 * Query params: type, productId, from, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const { type, productId, from, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (productId) filter.productId = parseInt(productId);
    if (from) filter.from = from.toLowerCase();

    const transactions = await Transaction.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * POST /api/transactions
 * Log a new transaction
 */
router.post('/', async (req, res) => {
  try {
    const { txHash, type, productId, from, to, amount, blockNumber, gasUsed } = req.body;

    // Validate required fields
    if (!txHash || !type || !from) {
      return res.status(400).json({ error: 'Missing required fields: txHash, type, from' });
    }

    // Check if transaction already exists
    const existing = await Transaction.findOne({ txHash });
    if (existing) {
      return res.json({ success: true, transaction: existing, message: 'Transaction already logged' });
    }

    const transaction = await Transaction.create({
      txHash,
      type,
      productId: productId || undefined,
      from: from.toLowerCase(),
      to: to ? to.toLowerCase() : undefined,
      amount,
      blockNumber,
      gasUsed,
      status: 'confirmed',
    });

    res.json({ success: true, transaction });
  } catch (error) {
    console.error('Log transaction error:', error);
    res.status(500).json({ error: 'Failed to log transaction' });
  }
});

/**
 * GET /api/transactions/stats
 * Get transaction statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: {
            $sum: { $toDouble: { $ifNull: ['$amount', '0'] } }
          },
        },
      },
    ]);

    const totalTransactions = await Transaction.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await Transaction.countDocuments({ timestamp: { $gte: todayStart } });

    res.json({
      success: true,
      stats: {
        total: totalTransactions,
        today: todayCount,
        byType: stats,
      },
    });
  } catch (error) {
    console.error('Transaction stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
