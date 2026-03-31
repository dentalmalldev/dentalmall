import { Suspense } from 'react';
import { StorageLayout } from '@/components/sections/storage';

export default function StorageRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <StorageLayout>{children}</StorageLayout>
    </Suspense>
  );
}
