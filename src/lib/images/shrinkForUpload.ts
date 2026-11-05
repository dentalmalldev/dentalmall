/** Browser side only (the server resize lives in processImage.ts, which needs sharp). */

/**
 * Vercel rejects request bodies over 4.5 MB before our route ever runs, so a
 * large phone photo has to be made smaller in the browser. The server scales
 * everything to 1600px anyway, so nothing visible is lost at this size.
 */
const SAFE_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.9;

/** Returns the file unchanged when it already fits, or if the browser can't read it. */
export async function shrinkForUpload(file: File): Promise<Blob> {
  if (file.size <= SAFE_UPLOAD_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (!context) return file;

    // JPEG has no transparency, and a transparent PNG would otherwise turn black.
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
