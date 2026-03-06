/**
 * FileName: uploadPdf.middleware.ts
 * Description: Multer interceptor for handling reservation file uploads. Accepts
 *              only PDF files up to 5MB, stores them in the uploads/reservations
 *              directory with a unique UUID-based filename.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

export const UploadPdfInterceptor = () => {
  const uploadPath = join(process.cwd(), 'uploads', 'reservations');

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return FileFieldsInterceptor(
    [
      { name: 'file', maxCount: 1 },
    ],
    {
      storage: diskStorage({
        destination: uploadPath,
        filename: (_, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (_, file, cb) => {
        // allow only pdf or xml
        if (!file.mimetype.match(/\/pdf$/) ) {
          return cb(new Error('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    },
  );
};
