'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/sections/auth/auth-modal';

type AuthModalMode = 'login' | 'register';

interface OpenAuthModalOptions {
  /** Where to go after a successful sign-in. Without it, the user stays on the page. */
  redirectTo?: string;
}

interface AuthModalContextType {
  openAuthModal: (mode?: AuthModalMode, options?: OpenAuthModalOptions) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>('login');
  const [redirectTo, setRedirectTo] = useState<string | undefined>();
  const router = useRouter();

  const openAuthModal = useCallback((nextMode: AuthModalMode = 'login', options?: OpenAuthModalOptions) => {
    setMode(nextMode);
    setRedirectTo(options?.redirectTo);
    setOpen(true);
  }, []);

  const handleSuccess = () => {
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
  };

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      {children}
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        initialTab={mode === 'register' ? 'register' : 'authorization'}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
