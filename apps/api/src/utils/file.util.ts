import path from 'path';

// Allowed file types for educational materials
export const ALLOWED_MATERIAL_TYPES = ['.pdf', '.docx', '.pptx', '.xlsx', '.zip', '.jpg', '.png'];

// Allowed file types for assignment submissions
export const ALLOWED_SUBMISSION_TYPES = ['.pdf', '.docx', '.zip'];

/**
 * Validate if a file type is allowed
 * @param filename - Name of the file to validate
 * @param allowedTypes - Array of allowed file extensions (e.g., ['.pdf', '.docx'])
 * @returns True if file type is allowed, false otherwise
 */
export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  const ext = getFileExtension(filename);
  return allowedTypes.includes(ext);
};

/**
 * Generate a unique filename using timestamp to prevent collisions
 * @param originalName - Original filename
 * @returns Unique filename with timestamp prefix
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const ext = getFileExtension(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  return `${timestamp}-${nameWithoutExt}${ext}`;
};

/**
 * Extract file extension from filename
 * @param filename - Name of the file
 * @returns File extension including the dot (e.g., '.pdf')
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};
