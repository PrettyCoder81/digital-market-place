/**
 * Products Route
 * CRUD operations for product metadata
 */

const express = require('express');
const router = express.Router();
const { ProductMetadata, User } = require('../models');

/**
 * GET /api/products
 * Fetch all products
 * Query params: page, limit, isListed, owner
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, isListed, owner } = req.query;
    
    const filter = {};
    if (isListed !== undefined) filter.isListed = isListed === 'true';
    if (owner) filter.ownerAddress = owner.toLowerCase();

    const products = await ProductMetadata.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ProductMetadata.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/products/:id
 * Fetch a single product by productId (blockchain ID)
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await ProductMetadata.findOne({ productId: req.params.id });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Fetch product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

/**
 * POST /api/products
 * Create or update product metadata (called after blockchain tx)
 */
router.post('/', async (req, res) => {
  try {
    const { productId, name, description, ipfsHash, ipfsUrl, ownerAddress, price, txHash } = req.body;

    // Validate required fields
    if (!productId || !name || !ownerAddress || !price || !txHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure user exists
    let user = await User.findOne({ walletAddress: ownerAddress.toLowerCase() });
    if (!user) {
      user = await User.create({ walletAddress: ownerAddress.toLowerCase() });
    }

    // Upsert product
    const product = await ProductMetadata.findOneAndUpdate(
      { productId },
      {
        productId,
        name,
        description,
        ipfsHash: ipfsHash || '',
        ipfsUrl: ipfsUrl || '',
        ownerAddress: ownerAddress.toLowerCase(),
        price,
        txHash,
        isListed: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * PATCH /api/products/:id
 * Update product (e.g., mark as sold after purchase)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { isListed, ownerAddress } = req.body;
    
    const updateData = {};
    if (isListed !== undefined) updateData.isListed = isListed;
    if (ownerAddress) updateData.ownerAddress = ownerAddress.toLowerCase();

    const product = await ProductMetadata.findOneAndUpdate(
      { productId: req.params.id },
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

module.exports = router;
