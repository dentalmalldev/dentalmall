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

/**
 * A reset link for this Firebase account. For a Google-only account, following
 * it adds a password. The email comes from Firebase because admins can edit
 * users.email on its own, and that value could belong to a different account.
 */
/** Firebase's batch lookup accepts at most this many users per call. */
const MAX_USERS_PER_LOOKUP = 100;

/**
 * Whether each user has a password, read from Firebase: users.auth_provider only
 * records how they first registered. A uid is missing from the result when
 * Firebase doesn't know it or the lookup failed, so a Firebase outage can't take
 * the admin pages down with it.
 */
export async function getPasswordStatus(uids: string[]): Promise<Map<string, boolean>> {
  const status = new Map<string, boolean>();

  try {
    const { adminAuth } = getFirebaseAdmin();
    for (let i = 0; i < uids.length; i += MAX_USERS_PER_LOOKUP) {
      const batch = uids.slice(i, i + MAX_USERS_PER_LOOKUP).map((uid) => ({ uid }));
      const { users } = await adminAuth.getUsers(batch);
      for (const user of users) {
        status.set(user.uid, user.providerData.some((p) => p.providerId === 'password'));
      }
    }
  } catch (error) {
    console.error('Error reading password status from Firebase:', error);
  }

  return status;
}

export async function generatePasswordResetLink(uid: string): Promise<string> {
  const { adminAuth } = getFirebaseAdmin();
  const { email } = await adminAuth.getUser(uid);
  if (!email) {
    throw new Error('Firebase user has no email');
  }
  return adminAuth.generatePasswordResetLink(email);
}

export async function revokeUserSessions(uid: string): Promise<void> {
  const { adminAuth } = getFirebaseAdmin();
  await adminAuth.revokeRefreshTokens(uid);
}

export { getFirebaseAdmin };
