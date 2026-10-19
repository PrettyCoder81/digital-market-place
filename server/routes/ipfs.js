/**
 * IPFS Upload Route
 * Handles file and JSON uploads to Pinata/IPFS securely
 * Uses the stable @pinata/sdk for optimal Node.js + Multer compatibility
 */
require('dotenv').config(); // Ensure .env variables are loaded at startup

const express = require('express');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk'); // <-- Note the different package name
const { fileTypeFromBuffer } = require('file-type');
const crypto = require('crypto');
const { Readable } = require('stream');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// 🔒 Initialize Legacy Pinata SDK (Accepts JWT directly)
if (!process.env.PINATA_JWT) {
  throw new Error('CRITICAL: PINATA_JWT is not defined in environment variables.');
}
const pinata = pinataSDK(process.env.PINATA_JWT);

const getUploadedFile = (req) => {
  if (req.files?.file?.[0]) return req.files.file[0];
  if (req.files?.image?.[0]) return req.files.image[0];
  return null;
};

/**
 * POST /api/ipfs/upload
 * Upload a file to IPFS via Pinata
 */
router.post('/upload', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]), async (req, res) => {
  try {
    const uploadedFile = getUploadedFile(req);

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 🔒 SECURITY: Verify actual file content via magic numbers
    const fileType = await fileTypeFromBuffer(uploadedFile.buffer);
    if (!fileType || !fileType.mime.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid file content. Only genuine images are allowed.' });
    }

    // 🔒 SECURITY: Generate safe filename (fixed: added dot before extension)
    const safeFileName = `${crypto.randomUUID()}.${fileType.ext}`;

    // Convert multer buffer to a Readable stream for the legacy SDK
    const bufferStream = new Readable();
    bufferStream.push(uploadedFile.buffer);
    bufferStream.push(null); // Signal end of stream

    // Upload to Pinata
    const response = await pinata.pinFileToIPFS(bufferStream, {
      pinataMetadata: {
        name: safeFileName,
      },
    });

    const ipfsHash = response.IpfsHash;
    const gateway = (process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud').replace(/\/$/, '');
    const ipfsUrl = `${gateway}/ipfs/${ipfsHash}`;

    console.log(`✅ File uploaded to IPFS: ${ipfsHash}`);

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl,
      fileName: safeFileName,
      fileSize: uploadedFile.size,
      mimeType: fileType.mime,
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file to IPFS',
      message: 'An internal server error occurred.' // 🔒 Prevents leaking internal error details
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
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Valid JSON data object is required' });
    }

    const response = await pinata.pinJSONToIPFS(data);
    const ipfsHash = response.IpfsHash;
    
    const gateway = (process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud').replace(/\/$/, '');
    const ipfsUrl = `${gateway}/ipfs/${ipfsHash}`;

    console.log(`✅ JSON uploaded to IPFS: ${ipfsHash}`);

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl,
    });
  } catch (error) {
    console.error('JSON upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload JSON to IPFS',
      message: 'An internal server error occurred.'
    });
  }
});

module.exports = router;