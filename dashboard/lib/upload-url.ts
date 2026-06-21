const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Build a correct URL for backend-served uploads (avoids `//uploads/...`). */
export function getUploadUrl(path: string): string {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export type UploadPreviewKind = "image" | "pdf" | "other";

export function getUploadPreviewKind(path: string): UploadPreviewKind {
  const ext = path.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}
