'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService, LoginData, RegisterData, DbUser } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userData = await authService.getUserInfo(firebaseUser);
          setDbUser(userData);
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          setDbUser(null);
        }
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
    const user = await authService.register(data);
    return user;
  };

  const logout = async () => {
    await authService.logout();
  };

  const loginWithGoogle = async () => {
    const user = await authService.loginWithGoogle();
    return user;
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const refreshDbUser = async () => {
    if (user) {
      try {
        const userData = await authService.getUserInfo(user);
        setDbUser(userData);
      } catch (error) {
        console.error('Failed to refresh user info:', error);
      }
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
