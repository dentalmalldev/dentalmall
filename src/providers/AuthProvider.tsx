'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService, BackOfficeRole, LoginData, RegisterData, DbUser } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  loginWithGoogleForRole: (role: BackOfficeRole) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Fetches the DB user, retrying while the record is momentarily missing.
 *
 * During registration, `createUserWithEmailAndPassword` signs the user in and
 * fires `onAuthStateChanged` *before* `POST /api/auth/register` has created the
 * database row. The first `GET /api/auth/me` therefore 404s (→ null). Without a
 * retry, `dbUser` would stay null for the whole session, and every
 * `AuthGuard requireDbUser` would bounce the user to the homepage until a manual
 * refresh. Retrying on null closes that window for both email and Google sign-up.
 */
async function loadDbUser(firebaseUser: User): Promise<DbUser | null> {
  const RETRIES = 6;
  const DELAY_MS = 500;

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    // Signed out meanwhile (a refused back-office sign-in does this): stop asking.
    if (auth.currentUser?.uid !== firebaseUser.uid) return null;

    try {
      const userData = await authService.getUserInfo(firebaseUser);
      if (userData) return userData;
    } catch (error) {
      // Network/5xx — retry too, unless this was the last attempt.
      if (attempt === RETRIES) {
        console.error('Failed to fetch user info:', error);
        return null;
      }
    }
    if (attempt < RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userData = await loadDbUser(firebaseUser);
        // Don't clobber a dbUser that register()/loginWithGoogle() already set
        // from their POST response: a transient null here (e.g. the /api/auth/me
        // route still compiling in dev, or a momentary read-after-write miss)
        // must not wipe a known-good record. Nor may a late answer bring back
        // the record of someone who has signed out while it was loading.
        if (userData && auth.currentUser?.uid === firebaseUser.uid) setDbUser(userData);
      } else {
        setDbUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (data: LoginData) => {
    const user = await authService.login(data);
    return user;
  };

  const register = async (data: RegisterData) => {
    const { user: newUser, dbUser: newDbUser } = await authService.register(data);
    // Populate dbUser straight from the register response — the row was just
    // created, so this is race-free (no /api/auth/me round-trip needed).
    setDbUser(newDbUser);
    return newUser;
  };

  const logout = async () => {
    await authService.logout();
  };

  const loginWithGoogle = async () => {
    const { user: newUser, dbUser: newDbUser } = await authService.loginWithGoogle();
    if (newDbUser) setDbUser(newDbUser);
    return newUser;
  };

  const loginWithGoogleForRole = async (role: BackOfficeRole) => {
    const { user: newUser, dbUser: newDbUser } = await authService.loginWithGoogleForRole(role);
    // Set both now: the guard on the page we redirect to bounces anyone it can't
    // see yet back to the login page.
    setUser(newUser);
    setDbUser(newDbUser);
    return newUser;
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const refreshDbUser = async () => {
    if (user) {
      setDbUser(await loadDbUser(user));
    }
  };

  const value = {
    user,
    dbUser,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithGoogleForRole,
    resetPassword,
    refreshDbUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
