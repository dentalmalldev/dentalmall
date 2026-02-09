import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  personal_id: string;
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
  auth_provider: 'EMAIL' | 'GOOGLE';
  role: 'USER' | 'ADMIN' | 'CLINIC' | 'VENDOR';
  created_at: string;
}

const googleProvider = new GoogleAuthProvider();

export const authService = {
  register: async (data: RegisterData): Promise<User> => {
    const { email, password, first_name, last_name, personal_id } = data;
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
        auth_provider: 'EMAIL',
      }),
    });

    if (!response.ok) {
      // If database save fails, delete the Firebase user
      await userCredential.user.delete();
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save user to database');
    }

    return userCredential.user;
  },

  login: async (data: LoginData): Promise<User> => {
    const { email, password } = data;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  loginWithGoogle: async (): Promise<User> => {
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
    }

    return user;
  },

  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  getCurrentUser: (): User | null => {
    return auth.currentUser;
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
