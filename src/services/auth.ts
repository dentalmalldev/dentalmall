import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  User,
  UserCredential,
  EmailAuthProvider,
  getAdditionalUserInfo,
  linkWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type BackOfficeRole = 'ADMIN' | 'ACCOUNTANT' | 'STORAGE';

/** This Google account has no access to the back-office area it tried to enter. */
export class BackOfficeAccessDeniedError extends Error {}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  personal_id: string;
  phone_number?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface DbUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  personal_id: string | null;
  phone_number?: string | null;
  auth_provider: 'EMAIL' | 'GOOGLE';
  role: 'USER' | 'ADMIN' | 'CLINIC' | 'VENDOR' | 'ACCOUNTANT' | 'STORAGE';
  created_at: string;
}

const googleProvider = new GoogleAuthProvider();

/**
 * Undoes a Google sign-in we are refusing. If this attempt is what created the
 * Firebase account, that goes too: left behind, it would stop the person from
 * ever registering with this email and a password.
 */
async function refuseGoogleSignIn(credential: UserCredential): Promise<void> {
  if (getAdditionalUserInfo(credential)?.isNewUser) {
    try {
      await credential.user.delete();
      return;
    } catch (error) {
      console.error('Failed to remove refused Firebase account:', error);
    }
  }
  await signOut(auth);
}

export const authService = {
  register: async (data: RegisterData): Promise<{ user: User; dbUser: DbUser }> => {
    const { email, password, first_name, last_name, personal_id, phone_number } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCredential.user, {
      displayName: `${first_name} ${last_name}`,
    });

    // Save user to database
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebase_uid: userCredential.user.uid,
        email,
        first_name,
        last_name,
        personal_id,
        phone_number,
        auth_provider: 'EMAIL',
      }),
    });

    if (!response.ok) {
      // If database save fails, delete the Firebase user
      const errorData = await response.json().catch(() => ({}));
      await userCredential.user.delete();
      throw new Error(errorData.error || 'Failed to save user to database');
    }

    // Return the freshly-created DB row so the caller can populate `dbUser`
    // directly — avoids a racy round-trip to /api/auth/me right after signup.
    const dbUser: DbUser = await response.json();
    return { user: userCredential.user, dbUser };
  },

  login: async (data: LoginData): Promise<User> => {
    const { email, password } = data;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  loginWithGoogle: async (): Promise<{ user: User; dbUser: DbUser | null }> => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Extract name parts from displayName
    const nameParts = user.displayName?.split(' ') || ['', ''];
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    // Save or get user from database
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebase_uid: user.uid,
        email: user.email,
        first_name,
        last_name,
        auth_provider: 'GOOGLE',
      }),
    });

    if (!response.ok && response.status !== 200) {
      console.error('Failed to save Google user to database');
      return { user, dbUser: null };
    }

    const dbUser: DbUser = await response.json();

    // The register route needs no token, so for an existing account it leaves the
    // phone number out. Read the full record through the authenticated route.
    const fullUser = await authService.getUserInfo(user).catch(() => null);
    return { user, dbUser: fullUser ?? dbUser };
  },

  /**
   * Google sign-in for the back-office login pages. Unlike loginWithGoogle it
   * never calls /api/auth/register, so it can't create a DB user: only an
   * existing user with this role gets in.
   */
  loginWithGoogleForRole: async (role: BackOfficeRole): Promise<{ user: User; dbUser: DbUser }> => {
    // Always ask which account. Otherwise someone who was refused would be
    // signed straight back in with that same account on every retry.
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(auth, provider);

    try {
      const dbUser = await authService.getUserInfo(credential.user);
      if (dbUser?.role === role) {
        return { user: credential.user, dbUser };
      }
    } catch (error) {
      await refuseGoogleSignIn(credential);
      throw error;
    }

    await refuseGoogleSignIn(credential);
    throw new BackOfficeAccessDeniedError();
  },

  /** Whether this account has a password, as opposed to Google sign-in only. */
  hasPassword: (user: User): boolean =>
    user.providerData.some((provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID),

  /**
   * Adds a password to a Google-only account, which can then log in either way.
   * Firebase requires a recent sign-in for this, so the user confirms with Google first.
   */
  addPassword: async (user: User, password: string): Promise<void> => {
    const email = user.email ?? '';
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ login_hint: email });

    await reauthenticateWithPopup(user, provider);
    await linkWithCredential(user, EmailAuthProvider.credential(email, password));
  },

  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  updateProfile: async (
    user: User,
    data: { first_name: string; last_name: string; personal_id?: string }
  ): Promise<DbUser> => {
    const token = await user.getIdToken();

    const response = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    return response.json();
  },

  getUserInfo: async (user: User): Promise<DbUser | null> => {
    const token = await user.getIdToken();

    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  },
};
