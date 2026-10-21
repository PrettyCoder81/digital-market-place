import { Router, Request, Response, NextFunction } from 'express';
import { Transaction, TRANSACTION_TYPES, TransactionType } from '../models';
import { Pagination } from '../types';

const router: Router = Router();

interface ByTypeStat {
  _id: string;
  count: number;
  totalAmount: number;
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const { type, productId, from, to, status } = req.query;

    const filter: Record<string, unknown> = {};
    if (type) filter.type = String(type).toUpperCase();
    if (productId !== undefined && productId !== '') filter.productId = parseInt(String(productId), 10);
    if (from) filter.from = String(from).toLowerCase();
    if (to) filter.to = String(to).toLowerCase();
    if (status) filter.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    const pagination: Pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    res.json({ success: true, transactions, pagination });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [byType, totalTransactions, todayCount] = await Promise.all([
      Transaction.aggregate<ByTypeStat>([
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
      Transaction.countDocuments({ timestamp: { $gte: todayStart } }),
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

router.get('/:txHash', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await Transaction.findOne({ txHash: req.params.txHash });
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { txHash, type, productId, from, to, amount, blockNumber, gasUsed, status } = req.body;

    if (!txHash || !type || !from) {
      res.status(400).json({ error: 'Missing required fields: txHash, type, from' });
      return;
    }
    if (!TRANSACTION_TYPES.includes(String(type).toUpperCase() as TransactionType)) {
      res.status(400).json({
        error: `Invalid transaction type "${type}". Valid types: ${TRANSACTION_TYPES.join(', ')}`,
      });
      return;
    }

    const existing = await Transaction.findOne({ txHash });
    if (existing) {
      res.json({ success: true, transaction: existing, message: 'Transaction already logged' });
      return;
    }

    const transaction = await Transaction.create({
      txHash,
      type: String(type).toUpperCase(),
      productId: productId !== undefined && productId !== null ? parseInt(productId, 10) : undefined,
      from: String(from).toLowerCase(),
      to: to ? String(to).toLowerCase() : undefined,
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

router.patch('/:txHash', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, blockNumber, gasUsed } = req.body;
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (blockNumber !== undefined) updateData.blockNumber = Number(blockNumber);
    if (gasUsed !== undefined) updateData.gasUsed = String(gasUsed);

    const transaction = await Transaction.findOneAndUpdate(
      { txHash: req.params.txHash },
      updateData,
      { new: true }
    );

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

export default router;
