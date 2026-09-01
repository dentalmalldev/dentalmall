import sharp from 'sharp';

/** Longest edge for product/media images. Anything larger is scaled down. */
export const MAX_IMAGE_DIMENSION = 1600;
/** Longest edge for store logos — they never render larger than ~200px. */
export const MAX_LOGO_DIMENSION = 512;
/** WebP quality. 90 is visually lossless for product photography. */
const WEBP_QUALITY = 90;

export interface ProcessedImage {
  buffer: Uint8Array;
  contentType: string;
  /** Name to store the file under — the extension follows the output format. */
  filename: string;
}

function withExtension(originalName: string, extension: string): string {
  return `${originalName.replace(/\.[^/.]+$/, '')}.${extension}`;
}

/**
 * Scale an uploaded image down to a sane size and re-encode it as WebP.
 *
 * Uploads used to be stored byte-for-byte, so a 4000px phone photo was served
 * as-is and every downstream resize (Next's optimizer, the browser, the card's
 * object-fit crop) worked from an over-large, over-compressed JPEG. Scaling once
 * here — with a good resampler and a high-quality encoder — keeps images sharp
 * and small.
 *
 * Never enlarges: a small source is stored at its own size, just re-encoded.
 * Animated GIFs and anything sharp can't read are passed through untouched, so
 * a failure here can never block an upload.
 */
export async function processImage(
  input: Uint8Array,
  originalName: string,
  contentType: string,
  maxDimension: number = MAX_IMAGE_DIMENSION
): Promise<ProcessedImage> {
  const passthrough: ProcessedImage = { buffer: input, contentType, filename: originalName };

  // Not an image (or an animated GIF, whose animation WebP conversion would drop).
  if (!contentType.startsWith('image/') || contentType === 'image/gif') {
    return passthrough;
  }

  try {
    const buffer = await sharp(input)
      // Honour EXIF orientation, then drop the metadata (it no longer applies).
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    return {
      buffer: new Uint8Array(buffer),
      contentType: 'image/webp',
      filename: withExtension(originalName, 'webp'),
    };
  } catch (error) {
    console.error('Image processing failed, storing the original file:', error);
    return passthrough;
  }
}
