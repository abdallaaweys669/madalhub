import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/** Absolute path to `kulan-nest-backend/uploads` (same folder served at GET /uploads). */
export function getUploadsDir(): string {
  const uploadsDir = join(__dirname, '..', '..', 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}
