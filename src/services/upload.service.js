import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

export const uploadMiddleware = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

export const getFileUrl = (filename) => {
  // in dev we serve /uploads route
  return `${process.env.SERVER_URL || ''}/uploads/${filename}`;
};
