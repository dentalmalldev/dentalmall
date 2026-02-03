import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let app: App;
let adminAuth: Auth;

function getFirebaseAdmin() {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials are not configured');
    }

    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
  } else {
    app = getApps()[0];
  }

  adminAuth = getAuth(app);
  return { app, adminAuth };
}

export async function verifyIdToken(token: string) {
  const { adminAuth } = getFirebaseAdmin();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Upload a buffer to Firebase Storage (server-side)
 */
export async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  contentType: string = 'application/pdf'
): Promise<string> {
  const { app } = getFirebaseAdmin();
  const bucket = getStorage(app).bucket();

  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: {
      contentType,
    },
  });

  // Make the file publicly accessible
  await file.makePublic();

  // Return the public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  return publicUrl;
}

export { getFirebaseAdmin };
