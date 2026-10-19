/**
 * Transactions Route
 * Logs blockchain transactions in MongoDB and serves them to the frontend.
 */

const express = require('express');
const router = express.Router();
const { Transaction } = require('../models');

/**
 * GET /api/transactions
 * Fetch transactions (newest first) for frontend display.
 * Query params: type, productId, from, to, status, page, limit
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const { type, productId, from, to, status } = req.query;

    const filter = {};
    if (type) filter.type = type.toUpperCase();
    if (productId !== undefined && productId !== '') filter.productId = parseInt(productId, 10);
    if (from) filter.from = from.toLowerCase();
    if (to) filter.to = to.toLowerCase();
    if (status) filter.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transactions/stats
 * Aggregate statistics per transaction type + totals.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [byType, totalTransactions, todayCount] = await Promise.all([
      Transaction.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: {
              $sum: { $toDouble: { $ifNull: ['$amount', '0'] } },
            },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Transaction.countDocuments(),
      (() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return Transaction.countDocuments({ timestamp: { $gte: todayStart } });
      })(),
    ]);

    res.json({
      success: true,
      stats: {
        total: totalTransactions,
        today: todayCount,
        byType,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transactions/:txHash
 * Fetch a single transaction by hash.
 */
router.get('/:txHash', async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ txHash: req.params.txHash });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/transactions
 * Log a new blockchain transaction (idempotent by txHash).
 * Body: { txHash, type, from, to?, productId?, amount?, blockNumber?, gasUsed?, status? }
 */
router.post('/', async (req, res, next) => {
  try {
    const { txHash, type, productId, from, to, amount, blockNumber, gasUsed, status } = req.body;

    if (!txHash || !type || !from) {
      return res.status(400).json({ error: 'Missing required fields: txHash, type, from' });
    }

    // Idempotency: if already logged, return existing record
    const existing = await Transaction.findOne({ txHash });
    if (existing) {
      return res.json({ success: true, transaction: existing, message: 'Transaction already logged' });
    }

    const transaction = await Transaction.create({
      txHash,
      type: type.toUpperCase(),
      productId: productId !== undefined && productId !== null ? parseInt(productId, 10) : undefined,
      from: from.toLowerCase(),
      to: to ? to.toLowerCase() : undefined,
      amount: amount !== undefined ? String(amount) : '0',
      blockNumber: blockNumber !== undefined ? Number(blockNumber) : undefined,
      gasUsed: gasUsed !== undefined ? String(gasUsed) : undefined,
      status: status || 'confirmed',
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/transactions/:txHash
 * Update transaction status (e.g., pending -> confirmed / failed).
 */
router.patch('/:txHash', async (req, res, next) => {
  try {
    const { status, blockNumber, gasUsed } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (blockNumber !== undefined) updateData.blockNumber = Number(blockNumber);
    if (gasUsed !== undefined) updateData.gasUsed = String(gasUsed);

    const transaction = await Transaction.findOneAndUpdate(
      { txHash: req.params.txHash },
      updateData,
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
