/** Trigger a browser download for a Blob with a given filename. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Format bytes into a human-readable string. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Read a File into an ArrayBuffer. */
export function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

/** Read a File into a text string. */
export function readText(file: File): Promise<string> {
  return file.text();
}

/** Replace the extension of a filename. */
export function withExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[^/.]+$/, "");
  return `${base}.${ext.replace(/^\./, "")}`;
}

/** Strip extension from a filename. */
export function withoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

/** A tiny unique-ish id for element keys. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
