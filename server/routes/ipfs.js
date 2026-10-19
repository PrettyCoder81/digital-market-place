/**
 * IPFS Upload Route
 * Handles PUBLIC file uploads to IPFS via Pinata.
 *
 * Uses plain HTTPS calls to the Pinata REST API (pin_file / pin_json) so it
 * works on ANY Node.js version (>= 18) with ZERO extra npm dependencies.
 *
 * NOTE: The old `@pinata/sdk` package is deprecated/unmaintained and causes
 * "Cannot find module '@pinata/sdk'" crashes — do NOT install it. If your
 * local copy of this file still has `require('@pinata/sdk')`, replace it
 * with this version.
 *
 * Auth: a single Pinata JWT (env var PINATA_JWT) is used as a Bearer token.
 * Uploaded files are public by default and readable through the configured
 * gateway (PINATA_GATEWAY).
 */
require('dotenv').config(); // Ensure .env variables are loaded at startup

const express = require('express');
const multer = require('multer');
<<<<<<< HEAD
const pinataSDK = require('@pinata/sdk'); // <-- Note the different package name
const { fileTypeFromBuffer } = require('file-type');
const crypto = require('crypto');
const { Readable } = require('stream');

=======
>>>>>>> 625d6bccd59fac6b5801cecb26e1c9c08ed8f1f7
const router = express.Router();
const config = require('../config');

// ---------- Pinata REST helpers ----------
const PINATA_API_BASE = 'https://api.pinata.cloud';

async function pinataPost(path, jwt, bodyAsJson) {
  const res = await fetch(`${PINATA_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...(bodyAsJson ? { 'Content-Type': 'application/json' } : {}),
    },
    body: bodyAsJson ? JSON.stringify(bodyAsJson) : undefined,
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch (_) {
      /* ignore */
    }
    const err = new Error(`Pinata API error (${res.status}): ${detail || res.statusText}`);
    err.status = res.status === 401 || res.status === 403 ? 502 : 502;
    throw err;
  }
  return res.json();
}

/** Pin raw file bytes publicly via the Pinata API (multipart form-data). */
async function pinFile(jwt, buffer, fileName, mimeType) {
  const form = new FormData();
  form.append(
    'file',
    new Blob([buffer], { type: mimeType || 'application/octet-stream' }),
    fileName || 'file'
  );

  const res = await fetch(`${PINATA_API_BASE}/pin_file`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch (_) {
      /* ignore */
    }
    const err = new Error(`Pinata pinFile error (${res.status}): ${detail || res.statusText}`);
    err.status = 502;
    throw err;
  }
  return res.json(); // { IpfsHash, PinSize, Timestamp }
}

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

    // Pin publicly on IPFS (uploads are public by default — readable via the gateway)
    const result = await pinFile(config.pinata.jwt, req.file.buffer, req.file.originalname, req.file.mimetype);
    const cid = result.IpfsHash || result.cid;
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

    const result = await pinataPost('/pin_json', config.pinata.jwt, { pinataContent: data });
    const cid = result.IpfsHash || result.cid;

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