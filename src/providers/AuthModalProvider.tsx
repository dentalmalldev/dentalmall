'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import AuthModal from '@/components/sections/auth/auth-modal';

interface AuthModalContextType {
  openAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openAuthModal = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      {children}
      <AuthModal open={open} onClose={() => setOpen(false)} />
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
