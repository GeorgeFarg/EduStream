// apps/api/src/config/multer.config.ts

import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import {
  generateUniqueFilename,
  validateFileType,
  ALLOWED_MATERIAL_TYPES,
  ALLOWED_SUBMISSION_TYPES,
} from '../utils/file.util';

// ─── تأكد إن المجلدات موجودة عند بدء السيرفر ────────────────────────────────

const submissionsDir = path.join(process.cwd(), 'uploads/submissions');
const materialsDir   = path.join(process.cwd(), 'uploads/materials');

if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const isMaterial = req.baseUrl.includes('/materials')
    const folder = isMaterial ? materialsDir : submissionsDir; // ← absolute path
    cb(null, folder);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  },
});

// ─── File Filters ─────────────────────────────────────────────────────────────

const materialFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (validateFileType(file.originalname, ALLOWED_MATERIAL_TYPES)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MATERIAL_TYPES.join(', ')}`));
  }
};

const submissionFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (validateFileType(file.originalname, ALLOWED_SUBMISSION_TYPES)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_SUBMISSION_TYPES.join(', ')}`));
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const uploadMaterial = multer({
  storage,
  fileFilter: materialFileFilter,
  limits: { fileSize: config.upload.maxFileSize },
});

export const uploadSubmission = multer({
  storage,
  fileFilter: submissionFileFilter,
  limits: { fileSize: config.upload.maxFileSize },
});