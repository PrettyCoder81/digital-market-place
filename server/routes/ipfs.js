/**
 * IPFS Upload Route
 * Handles file uploads to Pinata/IPFS
 */

const express = require('express');
const multer = require('multer');
const { PinataSDK } = require('pinata');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Initialize Pinata
const pinata = new PinataSDK({
  pinataJWTKey: process.env.PINATA_JWT,
});

/**
 * POST /api/ipfs/upload
 * Upload a file to IPFS via Pinata
 * 
 * Request: multipart/form-data with 'file' field
 * Response: { ipfsHash, ipfsUrl, fileName, fileSize }
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Pinata
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const uploadResult = await pinata.upload.file(file);
    
    const ipfsHash = uploadResult.IpfsHash || uploadResult.cid;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    // Log the upload
    console.log(`✅ File uploaded to IPFS: ${ipfsHash}`);

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file to IPFS',
      message: error.message 
    });
  }
});

/**
 * POST /api/ipfs/upload-json
 * Upload JSON metadata to IPFS
 */
router.post('/upload-json', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const uploadResult = await pinata.upload.json(data);
    const ipfsHash = uploadResult.IpfsHash || uploadResult.cid;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl,
    });
  } catch (error) {
    console.error('JSON upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload JSON to IPFS',
      message: error.message 
    });
  }
});

module.exports = router;
