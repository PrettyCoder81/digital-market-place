import { Router, Request, Response, NextFunction } from 'express';
import { ProductMetadata } from '../models';
import { Pagination } from '../types';

const router: Router = Router();

interface ProductListResponse {
  success: boolean;
  products: unknown[];
  pagination: Pagination;
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const { isListed, owner, search } = req.query;

    const filter: Record<string, unknown> = {};
    if (isListed !== undefined && isListed !== '') filter.isListed = String(isListed) === 'true';
    if (owner) filter.ownerAddress = String(owner).toLowerCase();
    if (search) {
      filter.name = { $regex: String(search), $options: 'i' };
    }

    const [products, total] = await Promise.all([
      ProductMetadata.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ProductMetadata.countDocuments(filter),
    ]);

    const body: ProductListResponse = {
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    res.json(body);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }

    const product = await ProductMetadata.findOne({ productId });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, name, description, ipfsHash, ipfsUrl, ownerAddress, price, txHash, imageURI } = req.body;

    if (productId === undefined || !name || !ownerAddress || !price || !txHash) {
      res.status(400).json({
        error: 'Missing required fields: productId, name, ownerAddress, price, txHash',
      });
      return;
    }

    const product = await ProductMetadata.findOneAndUpdate(
      { productId: parseInt(productId, 10) },
      {
        productId: parseInt(productId, 10),
        name,
        description: description || '',
        ipfsHash: ipfsHash || '',
        ipfsUrl: ipfsUrl || '',
        imageURI: imageURI || '',
        ownerAddress: String(ownerAddress).toLowerCase(),
        price: String(price),
        txHash,
        isListed: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }

    const { isListed, ownerAddress, price, name, description } = req.body;
    const updateData: Record<string, unknown> = {};
    if (isListed !== undefined) updateData.isListed = !!isListed;
    if (ownerAddress) updateData.ownerAddress = String(ownerAddress).toLowerCase();
    if (price !== undefined) updateData.price = String(price);
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const product = await ProductMetadata.findOneAndUpdate({ productId }, updateData, {
      new: true,
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

export default router;
