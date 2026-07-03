import multer from "multer";
import type { FileFilterCallback } from "multer";
import type { Request } from "express";
import { config } from "../config/env";
import {
  generateUniqueFilename,
  validateFileType,
  ALLOWED_MATERIAL_TYPES,
  ALLOWED_SUBMISSION_TYPES,
} from "../utils/file.util";

// Configure disk storage for uploaded files
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Determine destination based on the route
    // console.log("req.path", req.baseUrl);

    const isMaterial = req.baseUrl.includes("/materials");
    const folder = isMaterial ? "uploads/materials" : "uploads/submissions";
    cb(null, folder);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename to prevent collisions
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  },
});

/**
 * File filter for educational materials
 * Validates file types against ALLOWED_MATERIAL_TYPES
 */
const materialFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (validateFileType(file.originalname, ALLOWED_MATERIAL_TYPES)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_MATERIAL_TYPES.join(", ")}`,
      ),
    );
  }
};

/**
 * File filter for assignment submissions
 * Validates file types against ALLOWED_SUBMISSION_TYPES
 */
const submissionFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (validateFileType(file.originalname, ALLOWED_SUBMISSION_TYPES)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_SUBMISSION_TYPES.join(", ")}`,
      ),
    );
  }
};

/**
 * Multer instance for material uploads
 * - Max file size: 10MB
 * - Allowed types: pdf, docx, pptx, xlsx, zip, jpg, png
 */
export const uploadMaterial = multer({
  storage,
  fileFilter: materialFileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB
  },
  dest: "material",
});

/**
 * Multer instance for submission uploads
 * - Max file size: 10MB
 * - Allowed types: pdf, docx, zip
 */
export const uploadSubmission = multer({
  storage,
  fileFilter: submissionFileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB
  },
});
