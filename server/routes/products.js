/**
 * Products Route
 * Stores and serves product info (synced from the blockchain) via MongoDB.
 * The frontend reads products through these GET endpoints.
 */

const express = require('express');
const router = express.Router();
const { ProductMetadata, User } = require('../models');

/**
 * GET /api/products
 * Fetch all products (newest first).
 * Query params: page, limit, isListed, owner, search
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const { isListed, owner, search } = req.query;

    const filter = {};
    if (isListed !== undefined && isListed !== '') filter.isListed = String(isListed) === 'true';
    if (owner) filter.ownerAddress = owner.toLowerCase();
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const [products, total] = await Promise.all([
      ProductMetadata.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ProductMetadata.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
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
 * GET /api/products/:id
 * Fetch a single product by its blockchain productId.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const product = await ProductMetadata.findOne({ productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products
 * Create or update product metadata in MongoDB (called after on-chain createProduct).
 * Body: { productId, name, description, ipfsHash, ipfsUrl, ownerAddress, price, txHash, imageURI? }
 */
router.post('/', async (req, res, next) => {
  try {
    const { productId, name, description, ipfsHash, ipfsUrl, ownerAddress, price, txHash, imageURI } = req.body;

    if (productId === undefined || !name || !ownerAddress || !price || !txHash) {
      return res.status(400).json({
        error: 'Missing required fields: productId, name, ownerAddress, price, txHash',
      });
    }

    // Ensure the owning user record exists
    let user = await User.findOne({ walletAddress: ownerAddress.toLowerCase() });
    if (!user) {
      user = await User.create({ walletAddress: ownerAddress.toLowerCase() });
    }

    // Upsert product metadata
    const product = await ProductMetadata.findOneAndUpdate(
      { productId: parseInt(productId, 10) },
      {
        productId: parseInt(productId, 10),
        name,
        description: description || '',
        ipfsHash: ipfsHash || '',
        ipfsUrl: ipfsUrl || '',
        imageURI: imageURI || '',
        ownerAddress: ownerAddress.toLowerCase(),
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

/**
 * PATCH /api/products/:id
 * Update product fields (e.g., mark as sold / change owner after a buy or transfer).
 * Body (all optional): { isListed, ownerAddress, price, name, description }
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const { isListed, ownerAddress, price, name, description } = req.body;
    const updateData = {};
    if (isListed !== undefined) updateData.isListed = !!isListed;
    if (ownerAddress) updateData.ownerAddress = ownerAddress.toLowerCase();
    if (price !== undefined) updateData.price = String(price);
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const product = await ProductMetadata.findOneAndUpdate(
      { productId },
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
