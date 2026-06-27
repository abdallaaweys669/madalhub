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

/** Store paths as `/uploads/filename` for static file serving. */
export function toPublicUploadPath(filename: string | null | undefined): string | null {
  const raw = String(filename ?? '').trim();
  if (!raw) return null;
  if (raw.startsWith('/uploads/')) return raw;
  if (raw.startsWith('uploads/')) return `/${raw}`;
  const base = raw.replace(/^\/+/, '');
  return `/uploads/${base}`;
}
