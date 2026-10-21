import { Router } from 'express';
import multer from 'multer';
import config from '../config';
import { ApiError, MulterRequest, PinataPinResponse, getMulterFile } from '../types';

const router: Router = Router();

const PINATA_API_BASE = 'https://api.pinata.cloud';

function normalizeGateway(gateway: string): string {
  if (!gateway) {
    return 'https://gateway.pinata.cloud';
  }

  if (gateway.startsWith('http://') || gateway.startsWith('https://')) {
    return gateway.replace(/\/$/, '');
  }

  return `https://${gateway.replace(/^\/+/, '').replace(/\/$/, '')}`;
}

function getUploadedFile(req: MulterRequest): Express.Multer.File | null {
  return getMulterFile(req);
}

async function pinataPost(path: string, jwt: string, bodyAsJson: unknown): Promise<PinataPinResponse> {
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
    const error: ApiError = new Error(
      `Pinata API error (${response.status}): ${text || response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as PinataPinResponse;
}

async function pinFileToIpfs(
  jwt: string,
  buffer: Buffer,
  fileName?: string,
  mimeType?: string
): Promise<PinataPinResponse> {
  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(buffer)], { type: mimeType || 'application/octet-stream' }),
    fileName || 'upload'
  );

  const response = await fetch(`${PINATA_API_BASE}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error: ApiError = new Error(
      `Pinata file upload error (${response.status}): ${text || response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as PinataPinResponse;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error(`Invalid file type. Only ${config.upload.allowedMimeTypes.join(', ')} are allowed.`));
  },
});

function publicUrl(cid: string): string {
  return `${normalizeGateway(config.pinata.gateway)}/ipfs/${cid}`;
}

router.post('/upload', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]), async (req: MulterRequest, res) => {
  try {
    const uploadedFile = getUploadedFile(req);

    if (!uploadedFile) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (!config.pinata.jwt) {
      res.status(500).json({ error: 'IPFS upload not configured (missing PINATA_JWT)' });
      return;
    }

    const result = await pinFileToIpfs(
      config.pinata.jwt,
      uploadedFile.buffer,
      uploadedFile.originalname,
      uploadedFile.mimetype
    );
    const ipfsHash = result.IpfsHash || result.cid || '';
    const ipfsUrl = publicUrl(ipfsHash);

    console.log(`File uploaded to IPFS: ${ipfsHash}`);

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
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: 'Failed to upload file to IPFS',
      message,
    });
  }
});

router.post('/upload-json', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      res.status(400).json({ error: 'No data provided' });
      return;
    }

    if (!config.pinata.jwt) {
      res.status(500).json({ error: 'IPFS upload not configured (missing PINATA_JWT)' });
      return;
    }

    const result = await pinataPost('/pinning/pinJSONToIPFS', config.pinata.jwt, {
      pinataContent: data,
    });
    const ipfsHash = result.IpfsHash || result.cid || '';
    const ipfsUrl = publicUrl(ipfsHash);

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl,
    });
  } catch (error) {
    console.error('JSON upload error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: 'Failed to upload JSON to IPFS',
      message,
    });
  }
});

export default router;
