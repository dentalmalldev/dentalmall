import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import app from './firebase';

const storage = getStorage(app);

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

/**
 * Generate a unique filename with timestamp
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

  return `${sanitizedName}_${timestamp}_${randomStr}.${extension}`;
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  file: File,
  folder: string = 'products'
): Promise<UploadResult> {
  const uniqueFilename = generateUniqueFilename(file.name);
  const filePath = `${folder}/${uniqueFilename}`;
  const storageRef = ref(storage, filePath);

  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);

  return {
    url,
    filename: uniqueFilename,
    originalName: file.name,
    size: file.size,
  };
}

/**
 * Upload a file from a buffer/Uint8Array (for server-side uploads)
 */
export async function uploadBuffer(
  buffer: Uint8Array,
  originalName: string,
  contentType: string,
  folder: string = 'products'
): Promise<UploadResult> {
  const uniqueFilename = generateUniqueFilename(originalName);
  const filePath = `${folder}/${uniqueFilename}`;
  const storageRef = ref(storage, filePath);

  const snapshot = await uploadBytes(storageRef, buffer, {
    contentType,
  });
  const url = await getDownloadURL(snapshot.ref);

  return {
    url,
    filename: uniqueFilename,
    originalName,
    size: buffer.length,
  };
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(filename: string, folder: string = 'products'): Promise<void> {
  const filePath = `${folder}/${filename}`;
  const storageRef = ref(storage, filePath);
  await deleteObject(storageRef);
}

export { storage };
