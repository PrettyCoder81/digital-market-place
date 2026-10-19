/**
 * IPFS Upload Route
 * Handles PUBLIC file uploads to IPFS via Pinata.
 *
 * Files are pinned with cidVersion 1 and made publicly accessible through
 * the configured Pinata gateway (no gateway key required for reads).
 */
require('dotenv').config(); // Ensure .env variables are loaded at startup

const express = require('express');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk'); // <-- Note the different package name
const { fileTypeFromBuffer } = require('file-type');
const crypto = require('crypto');
const { Readable } = require('stream');

const router = express.Router();
const config = require('../config');

// Configure multer for memory storage (files go straight to IPFS, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileSizeBytes },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${config.upload.allowedMimeTypes.join(', ')} are allowed.`));
    }
  },
});

// Initialize Pinata SDK (JWT auth)
const pinata = new PinataSDK({
  pinataJwt: config.pinata.jwt,
  pinataGateway: config.pinata.gateway,
});

/**
 * Build a public gateway URL for a CID
 */
function publicUrl(cid) {
  return `https://${config.pinata.gateway}/ipfs/${cid}`;
}

/**
 * POST /api/ipfs/upload
 * Publicly upload an image file to IPFS via Pinata.
 *
 * Request: multipart/form-data with 'file' field
 * Response: { success, ipfsHash (CIDv1), ipfsUrl (public gateway URL), fileName, fileSize, mimeType }
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const uploadedFile = getUploadedFile(req);

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!config.pinata.jwt) {
      return res.status(500).json({ error: 'IPFS upload not configured (missing PINATA_JWT)' });
    }

    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    // Pin publicly on IPFS (uploads are public by default — readable via the gateway)
    const result = await pinata.upload.file(file);
    const cid = result.cid || result.IpfsHash;
    const ipfsUrl = publicUrl(cid);

    console.log(`✅ Public IPFS upload: ${cid} (${req.file.originalname})`);

    res.json({
      success: true,
      ipfsHash: cid,
      ipfsUrl,
      fileName: safeFileName,
      fileSize: uploadedFile.size,
      mimeType: fileType.mime,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ipfs/upload-json
 * Publicly upload JSON metadata to IPFS via Pinata.
 *
 * Request body: { data: <any JSON object> }
 * Response: { success, ipfsHash, ipfsUrl }
 */
router.post('/upload-json', async (req, res, next) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }
    if (!config.pinata.jwt) {
      return res.status(500).json({ error: 'IPFS upload not configured (missing PINATA_JWT)' });
    }

    const result = await pinata.upload.json(data);
    const cid = result.cid || result.IpfsHash;

    console.log(`✅ Public IPFS JSON upload: ${cid}`);

    res.json({
      success: true,
      ipfsHash: cid,
      ipfsUrl: publicUrl(cid),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;