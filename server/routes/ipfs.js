require('dotenv').config();

const express = require('express');
const multer = require('multer');
const router = express.Router();
const config = require('../config');

const PINATA_API_BASE = 'https://api.pinata.cloud';

function normalizeGateway(gateway) {
  if (!gateway) {
    return 'https://gateway.pinata.cloud';
  }

  if (gateway.startsWith('http://') || gateway.startsWith('https://')) {
    return gateway.replace(/\/$/, '');
  }

  return `https://${gateway.replace(/^\/+/, '').replace(/\/$/, '')}`;
}

function getUploadedFile(req) {
  if (req.file) return req.file;
  if (req.files?.file?.[0]) return req.files.file[0];
  if (req.files?.image?.[0]) return req.files.image[0];
  return null;
}

async function pinataPost(path, jwt, bodyAsJson) {
  const response = await fetch(`${PINATA_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyAsJson),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error = new Error(`Pinata API error (${response.status}): ${text || response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function pinFileToIpfs(jwt, buffer, fileName, mimeType) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType || 'application/octet-stream' }), fileName || 'upload');

  const response = await fetch(`${PINATA_API_BASE}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error = new Error(`Pinata file upload error (${response.status}): ${text || response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error(`Invalid file type. Only ${config.upload.allowedMimeTypes.join(', ')} are allowed.`));
  },
});

function publicUrl(cid) {
  return `${normalizeGateway(config.pinata.gateway)}/ipfs/${cid}`;
}

router.post('/upload', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]), async (req, res) => {
  try {
    const uploadedFile = getUploadedFile(req);

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!config.pinata.jwt) {
      return res.status(500).json({ error: 'IPFS upload not configured (missing PINATA_JWT)' });
    }

    const result = await pinFileToIpfs(config.pinata.jwt, uploadedFile.buffer, uploadedFile.originalname, uploadedFile.mimetype);
    const ipfsHash = result.IpfsHash || result.cid;
    const ipfsUrl = publicUrl(ipfsHash);

    console.log(`✅ File uploaded to IPFS: ${ipfsHash}`);

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl,
      fileName: uploadedFile.originalname,
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.mimetype,
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file to IPFS',
      message: error.message,
    });
  }
});

router.post('/upload-json', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    if (!config.pinata.jwt) {
      return res.status(500).json({ error: 'IPFS upload not configured (missing PINATA_JWT)' });
    }

    const result = await pinataPost('/pinning/pinJSONToIPFS', config.pinata.jwt, { pinataContent: data });
    const ipfsHash = result.IpfsHash || result.cid;
    const ipfsUrl = publicUrl(ipfsHash);

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl,
    });
  } catch (error) {
    console.error('JSON upload error:', error);
    res.status(500).json({
      error: 'Failed to upload JSON to IPFS',
      message: error.message,
    });
  }
});

module.exports = router;