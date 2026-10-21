import { Request } from 'express';

export interface ServerConfig {
  port: number;
  mongoUri: string;
  corsOrigin: string;
  pinata: {
    jwt: string;
    gateway: string;
  };
  upload: {
    maxFileSizeBytes: number;
    allowedMimeTypes: string[];
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiError extends Error {
  status?: number;
}

export type MulterRequest = Request;

export function getMulterFile(req: MulterRequest): Express.Multer.File | null {
  if (req.file) return req.file;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  if (files && !Array.isArray(files)) {
    if (files.file?.[0]) return files.file[0];
    if (files.image?.[0]) return files.image[0];
  }
  return null;
}

export interface PinataPinResponse {
  IpfsHash?: string;
  cid?: string;
}
